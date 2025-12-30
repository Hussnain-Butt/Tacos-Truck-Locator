/**
 * User Routes
 * Profile management for customers and vendors
 */

import { Router, Request, Response } from 'express';
import prisma from '../../config/database.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { verifyToken, requireVendor, requireCustomer } from '../../middleware/auth.js';
import { BadRequestError, NotFoundError } from '../../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get(
  '/me',
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        customer: {
          include: {
            favorites: {
              select: {
                id: true,
                name: true,
                specialty: true,
                rating: true,
                isOnline: true,
              },
            },
          },
        },
        vendor: {
          include: {
            truck: {
              include: {
                location: true,
                _count: {
                  select: {
                    reviews: true,
                    menu: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw NotFoundError('User not found');
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      profile: user.customer || user.vendor,
    });
  })
);

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put(
  '/me',
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, phone, avatarUrl } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { customer: true, vendor: true },
    });

    if (!user) {
      throw NotFoundError('User not found');
    }

    let updatedProfile;

    if (user.role === 'CUSTOMER' && user.customer) {
      updatedProfile = await prisma.customer.update({
        where: { userId: user.id },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(avatarUrl && { avatarUrl }),
        },
      });
    } else if (user.role === 'VENDOR' && user.vendor) {
      updatedProfile = await prisma.vendor.update({
        where: { userId: user.id },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(avatarUrl && { avatarUrl }),
        },
      });
    } else {
      throw BadRequestError('Profile not found');
    }

    res.json({
      success: true,
      profile: updatedProfile,
    });
  })
);

/**
 * GET /api/users/favorites
 * Get customer's favorite trucks
 */
router.get(
  '/favorites',
  verifyToken,
  requireCustomer,
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await prisma.customer.findFirst({
      where: { userId: req.userId },
      include: {
        favorites: {
          include: {
            location: true,
            _count: {
              select: { reviews: true },
            },
          },
        },
      },
    });

    if (!customer) {
      throw NotFoundError('Customer profile not found');
    }

    res.json({
      favorites: customer.favorites,
    });
  })
);

/**
 * POST /api/users/favorites/:truckId
 * Add truck to favorites
 */
router.post(
  '/favorites/:truckId',
  verifyToken,
  requireCustomer,
  asyncHandler(async (req: Request, res: Response) => {
    const { truckId } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { userId: req.userId },
    });

    if (!customer) {
      throw NotFoundError('Customer profile not found');
    }

    // Check if truck exists
    const truck = await prisma.truck.findUnique({
      where: { id: truckId },
    });

    if (!truck) {
      throw NotFoundError('Truck not found');
    }

    // Add to favorites
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        favorites: {
          connect: { id: truckId },
        },
      },
    });

    res.json({
      success: true,
      message: 'Truck added to favorites',
    });
  })
);

/**
 * DELETE /api/users/favorites/:truckId
 * Remove truck from favorites
 */
router.delete(
  '/favorites/:truckId',
  verifyToken,
  requireCustomer,
  asyncHandler(async (req: Request, res: Response) => {
    const { truckId } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { userId: req.userId },
    });

    if (!customer) {
      throw NotFoundError('Customer profile not found');
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        favorites: {
          disconnect: { id: truckId },
        },
      },
    });

    res.json({
      success: true,
      message: 'Truck removed from favorites',
    });
  })
);

export default router;
