import { Request, Response, NextFunction } from 'express';
import { ADMIN_LEVELS } from "./admin/admin-manager";

// Middleware to check if user is authenticated and email is verified
export function requireEmailVerification(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Check if email is verified
  if (!req.user.emailVerified) {
    return res.status(403).json({
      message: "Email verification required",
      requiresEmailVerification: true,
      email: req.user.email
    });
  }

  next();
}

// Middleware to check if user is authenticated (without email verification requirement)
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Middleware to check admin privileges (requires verified email)
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // First check email verification
  requireEmailVerification(req, res, (err) => {
    if (err) return next(err);
    
    // Then check admin role
    if (req.user && (req.user.role === "admin" || req.user.role === "superadmin")) {
      return next();
    }
    
    return res.status(403).json({ message: "Admin access required" });
  });
}

// Middleware to check staff privileges (level 1 or higher)
export function requireStaff(req: Request, res: Response, next: NextFunction) {
  // First check email verification
  requireEmailVerification(req, res, (err) => {
    if (err) return next(err);
    
    // Check if user has staff level or higher
    const userLevel = req.user?.adminLevel || 0;
    if (userLevel >= ADMIN_LEVELS.STAFF) {
      return next();
    }
    
    return res.status(403).json({ message: "Staff access required" });
  });
}

// Middleware to check content admin privileges (level 2 or higher)
export function requireContentAdmin(req: Request, res: Response, next: NextFunction) {
  // First check email verification
  requireEmailVerification(req, res, (err) => {
    if (err) return next(err);
    
    // Check if user has content admin level or higher
    const userLevel = req.user?.adminLevel || 0;
    if (userLevel >= ADMIN_LEVELS.CONTENT_ADMIN) {
      return next();
    }
    
    return res.status(403).json({ message: "Content admin access required" });
  });
}

// Middleware to check client admin privileges (level 3 or higher)
export function requireClientAdmin(req: Request, res: Response, next: NextFunction) {
  // First check email verification
  requireEmailVerification(req, res, (err) => {
    if (err) return next(err);
    
    // Check if user has client admin level or higher
    const userLevel = req.user?.adminLevel || 0;
    if (userLevel >= ADMIN_LEVELS.CLIENT_ADMIN) {
      return next();
    }
    
    return res.status(403).json({ message: "Client admin access required" });
  });
}

// Middleware to check finance admin privileges (level 4 or higher)
export function requireFinanceAdmin(req: Request, res: Response, next: NextFunction) {
  // First check email verification
  requireEmailVerification(req, res, (err) => {
    if (err) return next(err);
    
    // Check if user has finance admin level or higher
    const userLevel = req.user?.adminLevel || 0;
    if (userLevel >= ADMIN_LEVELS.FINANCE_ADMIN) {
      return next();
    }
    
    return res.status(403).json({ message: "Finance admin access required" });
  });
}

// Middleware to check service admin privileges (level 5 or higher)
export function requireServiceAdmin(req: Request, res: Response, next: NextFunction) {
  // First check email verification
  requireEmailVerification(req, res, (err) => {
    if (err) return next(err);
    
    // Check if user has service admin level or higher
    const userLevel = req.user?.adminLevel || 0;
    if (userLevel >= ADMIN_LEVELS.SERVICE_ADMIN) {
      return next();
    }
    
    return res.status(403).json({ message: "Service admin access required" });
  });
}

// Middleware to check superadmin privileges (level 6)
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  // First check email verification
  requireEmailVerification(req, res, (err) => {
    if (err) return next(err);
    
    // Check if user has superadmin level
    const userLevel = req.user?.adminLevel || 0;
    if (userLevel >= ADMIN_LEVELS.SUPERADMIN || req.user?.role === "superadmin") {
      return next();
    }
    
    return res.status(403).json({ message: "Superadmin access required" });
  });
}