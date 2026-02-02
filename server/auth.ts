import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { generateOTP, sendVerificationEmail } from "./auth-email";

// Email normalization function
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error('[Auth] SESSION_SECRET environment variable is required');
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Check if input is an email
        const isEmail = username.includes('@');
        let user;
        
        if (isEmail) {
          // Sanitize email for consistent lookup
          const sanitizedEmail = sanitizeEmail(username);
          user = await storage.getUserByEmail(sanitizedEmail);
        } else {
          user = await storage.getUserByUsername(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else if (!user.isActive) {
          return done(null, false, { message: "Account is deactivated" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user || !user.isActive) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName, language } = req.body;
      
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Username, email, password, first name and last name are required" });
      }
      
      // Username validation
      if (username.length < 7) {
        return res.status(400).json({ message: "Username must be at least 7 characters" });
      }
      
      // Enhanced email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }
      
      // Sanitize email for consistent storage
      const sanitizedEmail = sanitizeEmail(email);
      
      // Enhanced password validation
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      // Check for uppercase and lowercase letters, numbers, and special characters
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChars) {
        return res.status(400).json({ 
          message: "Password must include uppercase and lowercase letters, numbers, and special characters" 
        });
      }
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(sanitizedEmail);
      if (existingEmail) {
        return res.status(409).json({ message: "Registration unsuccessful. Please try again." });
      }
      
      // Generate verification token
      const verificationToken = generateOTP();
      const verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create the user with hashed password and verification token
      const user = await storage.createUser({
        username,
        email: sanitizedEmail,
        password: await hashPassword(password),
        firstName,
        lastName,
        language: language || "en",
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry
      });

      // Send verification email
      try {
        await sendVerificationEmail(sanitizedEmail, verificationToken, `${firstName} ${lastName}`);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue with registration even if email fails
      }

      // DO NOT log the user in - they must verify email first
      // Return success but require email verification
      res.status(201).json({
        message: "Registration successful. Please check your email for verification code.",
        requiresEmailVerification: true,
        email: sanitizedEmail
      });
    } catch (error) {
      next(error);
    }
  });

  // Email verification endpoint - accessible without authentication
  app.post("/api/verify-email", async (req, res, next) => {
    try {
      const { code, email } = req.body;
      
      if (!code || !email) {
        return res.status(400).json({ message: "Verification code and email are required" });
      }

      // Find user by email for verification
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.json({ message: "Email already verified", verified: true });
      }

      // Check if token exists and hasn't expired
      if (!user.verificationToken || !user.verificationTokenExpiry) {
        return res.status(400).json({ message: "No verification token found. Please request a new one." });
      }

      if (user.verificationTokenExpiry < new Date()) {
        return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
      }

      // Verify the code (simple comparison for OTP)
      if (user.verificationToken !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Mark email as verified
      const updatedUser = await storage.updateUser(user.id, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      });

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to verify email" });
      }

      res.json({ message: "Email verified successfully", verified: true });
    } catch (error) {
      console.error('Email verification error:', error);
      next(error);
    }
  });

  // Resend verification email endpoint - accessible without authentication
  app.post("/api/resend-verification", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.json({ message: "Email already verified", verified: true });
      }

      const { generateOTP, sendVerificationEmail } = require('./auth-email');
      const verificationToken = generateOTP();
      const verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update user with new verification token
      const updatedUser = await storage.updateUser(user.id, {
        verificationToken,
        verificationTokenExpiry
      });

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to generate new verification code" });
      }

      // Send verification email
      try {
        await sendVerificationEmail(user.email, verificationToken, `${user.firstName} ${user.lastName}`);
        res.json({ message: "Verification email sent successfully" });
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError);
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      // Check email verification BEFORE creating session
      if (!user.emailVerified) {
        return res.status(403).json({
          requiresEmailVerification: true,
          email: user.email,
          message: "Please verify your email before accessing your account"
        });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        // Return user without sensitive data
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user without sensitive data
    const { password, ...userWithoutPassword } = req.user;
    res.json({
      ...userWithoutPassword,
      needsEmailVerification: !req.user.emailVerified
    });
  });
  
  // Get basic user info by ID (nombres públicos para mostrar en facturas)
  app.get("/api/users/:id", async (req, res, next) => {
    try {
      // Este endpoint es público ya que solo devuelve información básica
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Solo devolver información pública
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email
      });
    } catch (error) {
      console.error("Error al obtener información de usuario:", error);
      next(error);
    }
  });
  
  // Admin-only routes middleware
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Admin access required" });
  };
  
  // Make the middleware available
  app.use((req: any, _res: any, next: any) => {
    req.isAdmin = isAdmin;
    next();
  });
}
