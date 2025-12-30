/**
 * Zod Validation Schemas
 * Request validation for API endpoints
 */

import { z } from 'zod';

// ==========================================
// AUTH SCHEMAS
// ==========================================

export const syncUserSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['CUSTOMER', 'VENDOR']).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

// ==========================================
// USER SCHEMAS
// ==========================================

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

// ==========================================
// TRUCK SCHEMAS
// ==========================================

export const createTruckSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  specialty: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});

export const updateTruckSchema = createTruckSchema.partial();

// ==========================================
// LOCATION SCHEMAS
// ==========================================

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
});

export const toggleStatusSchema = z.object({
  isOnline: z.boolean(),
});

// ==========================================
// MENU SCHEMAS
// ==========================================

export const menuCategoryEnum = z.enum([
  'TACOS',
  'BURRITOS',
  'QUESADILLAS',
  'SIDES',
  'DRINKS',
  'DESSERTS',
  'SPECIALS',
]);

export const createMenuItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  price: z.number().positive(),
  category: menuCategoryEnum.optional().default('TACOS'),
  isAvailable: z.boolean().optional().default(true),
  isPopular: z.boolean().optional().default(false),
  imageUrl: z.string().url().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

// ==========================================
// OPERATING HOURS SCHEMAS
// ==========================================

export const dayOfWeekEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

export const operatingHoursSchema = z.object({
  dayOfWeek: dayOfWeekEnum,
  openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isClosed: z.boolean().optional().default(false),
});

// ==========================================
// REVIEW SCHEMAS
// ==========================================

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(500).optional(),
});

// ==========================================
// OFFER SCHEMAS
// ==========================================

export const createOfferSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  discount: z.string().max(50).optional(),
  code: z.string().max(20).optional(),
  isActive: z.boolean().optional().default(true),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const nearbyQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(100).optional().default(10), // km
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// Validation middleware helper
import { Request, Response, NextFunction } from 'express';

export const validate = <T extends z.ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          status: 'fail',
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = <T extends z.ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          status: 'fail',
          message: 'Query validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
};
