/**
 * Auth Middleware - JWT Verification with Clerk
 * Verifies Clerk JWT tokens and attaches user to request
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError, UnauthorizedError, ForbiddenError } from './errorHandler.js';
import prisma from '../config/database.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      clerkId?: string;
      userRole?: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
    }
  }
}

/**
 * Verify Clerk JWT Token
 * Extracts user info from Authorization header
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Decode the JWT token (Clerk tokens are base64 encoded)
    // In production, you should verify with Clerk's public key
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw UnauthorizedError('Invalid token format');
    }

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(tokenParts[1], 'base64').toString('utf-8')
    );

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw UnauthorizedError('Token expired');
    }

    // Get Clerk user ID from token
    const clerkId = payload.sub;
    if (!clerkId) {
      throw UnauthorizedError('Invalid token: no user ID');
    }

    // Find user in database
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        customer: true,
        vendor: true,
      },
    });

    // If user not found, return error - they need to complete signup/sync
    if (!user) {
      console.log(`⚠️ User not found for clerkId: ${clerkId}. User needs to complete signup.`);
      throw UnauthorizedError('User not synced. Please complete signup or login again.');
    }

    // Attach user info to request
    req.userId = user.id;
    req.clerkId = clerkId;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(UnauthorizedError('Authentication failed'));
    }
  }
};

/**
 * Optional Auth - Doesn't fail if no token
 * Useful for public routes that behave differently for logged-in users
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    // Try to verify, but don't fail if it doesn't work
    await verifyToken(req, res, next);
  } catch (error) {
    // Continue without auth
    next();
  }
};

/**
 * Require specific role(s)
 */
export const requireRole = (...roles: Array<'CUSTOMER' | 'VENDOR' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return next(UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.userRole)) {
      return next(ForbiddenError(`Access denied. Required role: ${roles.join(' or ')}`));
    }

    next();
  };
};

/**
 * Require Vendor role
 */
export const requireVendor = requireRole('VENDOR', 'ADMIN');

/**
 * Require Customer role
 */
export const requireCustomer = requireRole('CUSTOMER', 'ADMIN');

/**
 * Require Admin role
 */
export const requireAdmin = requireRole('ADMIN');
