import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Generate a secure API token - in production, this should be stored in environment variables
export const API_TOKEN = process.env.API_TOKEN || "mbm_" + crypto.randomBytes(32).toString('hex');

// Extended Request interface to include token info
export interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
  tokenType?: 'api' | 'admin';
}

// Middleware to validate API tokens
export function validateApiToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: "Authorization header required. Use 'Authorization: Bearer <token>'" 
    });
  }

  const [scheme, token] = authHeader.split(' ');
  
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ 
      error: "Invalid authorization format. Use 'Authorization: Bearer <token>'" 
    });
  }

  // Validate the API token
  if (token === API_TOKEN) {
    req.isAuthenticated = true;
    req.tokenType = 'api';
    next();
  } else {
    res.status(403).json({ 
      error: "Invalid API token" 
    });
  }
}

// Optional authentication middleware - allows both authenticated and unauthenticated access
export function optionalApiToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    
    if (scheme === 'Bearer' && token === API_TOKEN) {
      req.isAuthenticated = true;
      req.tokenType = 'api';
    }
  }
  
  next();
}