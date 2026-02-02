import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupEmailService } from "./email";
// import { setupSecurityHeaders } from "./helmet-config"; // Desactivado temporalmente para desarrollo

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurar headers de seguridad con Helmet - DESACTIVADO EN DESARROLLO
// setupSecurityHeaders(app);

// Add middleware to enable CORS and help with domain access
app.use((req, res, next) => {
  // Set CORS headers to allow access from any origin - very permissive for troubleshooting
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Add security-related headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Allow any domain to work, including custom domains
  const host = req.headers.host || 'unknown';
  const xForwardedProto = req.headers['x-forwarded-proto'] || 'unknown';
  const xForwardedHost = req.headers['x-forwarded-host'] || 'unknown';
  const cfVisitor = req.headers['cf-visitor'] || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  log(`Debug Domain Request: host=${host}, protocol=${xForwardedProto}, forwarded_host=${xForwardedHost}, cf_visitor=${cfVisitor}, user_agent=${userAgent}`);
  
  // Super permissive handling for any domain to avoid 403 errors
  if (host.includes('tobais.com') || host.includes('replit') || true) {
    log(`Processing permissive request for: ${host}`);
    
    // Enable HTTPS redirect for production - but allow HTTP for localhost in development
    const isDevelopment = app.get("env") === "development" || process.env.NODE_ENV === "development";
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    
    if (xForwardedProto !== 'https' && !(isDevelopment && isLocalhost)) {
      log(`Redirecting ${host} to HTTPS`);
      res.header('Cache-Control', 'no-store, max-age=0');
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      return res.redirect(301, `https://${host}${req.url}`);
    }
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  return next();
});

// Import the scalable email tracking service
import { EmailTrackingService } from './email-tracking';

// Critical: Add tracking endpoints BEFORE other routes to prevent Vite from intercepting them
app.get("/api/staff/track-open", async (req, res) => {
  try {
    const submissionId = req.query.submissionId as string;
    
    if (submissionId) {
      await EmailTrackingService.trackOpen(submissionId, {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        method: 'pixel'
      });
    }
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    return res.send(pixel);
  } catch (error) {
    console.error('Email open tracking error:', error);
    // Still return pixel even on error
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    res.set({ 'Content-Type': 'image/png' });
    return res.send(pixel);
  }
});

app.get("/api/staff/track-click", async (req, res) => {
  try {
    const submissionId = req.query.submissionId as string;
    const linkType = req.query.type as string || 'unknown';
    const redirectTo = req.query.redirectTo as string;
    
    if (submissionId) {
      console.log(`🔗 Link clicked - submissionId: ${submissionId}, type: ${linkType}`);
      
      // Find the brief by unique_brief_id to get the actual submission_id for FK constraint
      console.log(`🔍 Looking for brief with unique_brief_id: ${submissionId}`);
      const brief = await storage.getAIBriefSubmissionByUniqueId(submissionId);
      console.log(`🔍 Brief lookup result:`, brief ? { id: brief.id, submissionId: brief.submissionId } : 'NOT FOUND');
      
      if (brief) {
        // Use the brief's submission_id for database FK constraint
        const actualSubmissionId = brief.submissionId;
        console.log(`Found brief: ${submissionId} -> actualSubmissionId: ${actualSubmissionId}`);
        
        // Track both open and click events
        await storage.createStaffEmailTracking({
          submissionId: actualSubmissionId,
          eventType: 'opened',
          eventData: {
            openedAt: new Date(),
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            method: 'link-click',
            originalId: submissionId // Keep original for reference
          }
        });
        
        await storage.createStaffEmailTracking({
          submissionId: actualSubmissionId,
          eventType: 'clicked',
          eventData: {
            clickedAt: new Date(),
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            link: redirectTo,
            linkType,
            originalId: submissionId // Keep original for reference
          }
        });
        
        // If this is a consultation button click, mark email as effective
        if (linkType === 'contact') {
          await storage.updateEmailEffectiveness(submissionId, 1);
          console.log(`📧 Email marked as effective - consultation button clicked for ${submissionId}`);
        }
      } else {
        console.log(`⚠️  Brief not found for tracking ID: ${submissionId}`);
      }
    }
    
    // Redirect to target URL
    if (redirectTo) {
      return res.redirect(302, decodeURIComponent(redirectTo));
    } else {
      return res.redirect(302, 'https://tobais.com');
    }
  } catch (error) {
    console.error('Link click tracking error:', error);
    // Still redirect even on error
    if (req.query.redirectTo) {
      return res.redirect(302, decodeURIComponent(req.query.redirectTo as string));
    } else {
      return res.redirect(302, 'https://tobais.com');
    }
  }
});

// New endpoint for email view online functionality
app.get("/email-view", async (req, res) => {
  try {
    const submissionId = req.query.id as string;
    
    if (submissionId) {
      await EmailTrackingService.trackOpen(submissionId, {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        method: 'view-online'
      });
      
      // Redirect to main website with tracking
      const trackingParams = `?ref=${submissionId}&utm_source=email_view&utm_medium=online`;
      return res.redirect(302, `https://tobais.com${trackingParams}`);
    }
    
    return res.redirect(302, 'https://tobais.com');
  } catch (error) {
    console.error('Email view tracking error:', error);
    return res.redirect(302, 'https://tobais.com');
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database if needed
  if (storage.initializeDatabase) {
    try {
      await storage.initializeDatabase();
      log("Database initialized successfully");
    } catch (error) {
      log(`Error initializing database: ${error}`);
    }
  }

  // Initialize SendGrid for authentication emails
  try {
    const authEmail = await import('./auth-email');
    authEmail.initializeSendGrid();
    log("SendGrid auth email service initialized");
  } catch (error) {
    console.error("SendGrid initialization failed:", error);
    // Continue without SendGrid - email verification won't work but app will still function
  }
  
  // Initialize email service
  try {
    log("Starting email service initialization...");
    
    // Set a timeout for email service initialization to provide more detailed logs
    const emailServicePromise = setupEmailService();
    
    // Add a timeout to show more detailed error if it's taking too long
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Email service initialization timeout after 20 seconds"));
      }, 20000);
    });
    
    // Race the email initialization against the timeout
    const emailInitialized = await Promise.race([
      emailServicePromise,
      timeoutPromise
    ]);
    
    if (emailInitialized) {
      log("Email service initialized successfully");
    } else {
      log("Email service initialization failed - check environment variables and connectivity");
    }
  } catch (error) {
    log(`Error initializing email service: ${error}`);
    // Continue server startup even if email fails
    log("Continuing server startup despite email service failure");
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
