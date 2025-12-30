/**
 * Location Routes
 * Real-time location management for trucks
 */

import { Router, Request, Response } from 'express';
import prisma from '../../config/database.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { verifyToken, requireVendor } from '../../middleware/auth.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../middleware/errorHandler.js';
import { io } from '../../index.js';

const router = Router();

/**
 * PUT /api/locations/:truckId
 * Update truck location (vendor only)
 */
router.put(
  '/:truckId',
  verifyToken,
  requireVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { truckId } = req.params;
    const { latitude, longitude, address, city, state } = req.body;

    if (!latitude || !longitude) {
      throw BadRequestError('latitude and longitude are required');
    }

    // Verify ownership
    const truck = await prisma.truck.findUnique({
      where: { id: truckId },
      include: { vendor: true, location: true },
    });

    if (!truck) {
      throw NotFoundError('Truck not found');
    }

    if (truck.vendor.userId !== req.userId) {
      throw ForbiddenError('You can only update your own truck location');
    }

    // Upsert location
    const location = await prisma.location.upsert({
      where: { truckId },
      create: {
        truckId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        city,
        state,
      },
      update: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
      },
    });

    // Broadcast location update via Socket.IO
    if (truck.isOnline) {
      io.emit('truck:moved', {
        truckId,
        latitude: location.latitude,
        longitude: location.longitude,
        name: truck.name,
      });
    }

    res.json({
      success: true,
      location,
    });
  })
);

/**
 * PUT /api/locations/:truckId/status
 * Toggle online/offline status (vendor only)
 */
router.put(
  '/:truckId/status',
  verifyToken,
  requireVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { truckId } = req.params;
    const { isOnline } = req.body;

    if (typeof isOnline !== 'boolean') {
      throw BadRequestError('isOnline must be a boolean');
    }

    // Verify ownership
    const truck = await prisma.truck.findUnique({
      where: { id: truckId },
      include: { vendor: true, location: true },
    });

    if (!truck) {
      throw NotFoundError('Truck not found');
    }

    if (truck.vendor.userId !== req.userId) {
      throw ForbiddenError('You can only update your own truck status');
    }

    // Update status
    const updatedTruck = await prisma.truck.update({
      where: { id: truckId },
      data: { isOnline },
      include: { location: true },
    });

    // Broadcast status change via Socket.IO
    if (isOnline && truck.location) {
      io.emit('truck:online', {
        truckId,
        latitude: truck.location.latitude,
        longitude: truck.location.longitude,
        name: truck.name,
        specialty: truck.specialty,
        rating: truck.rating,
      });
    } else {
      io.emit('truck:offline', { truckId });
    }

    res.json({
      success: true,
      isOnline: updatedTruck.isOnline,
      message: isOnline ? 'Truck is now online' : 'Truck is now offline',
    });
  })
);

/**
 * GET /api/locations/:truckId
 * Get truck location
 */
router.get(
  '/:truckId',
  asyncHandler(async (req: Request, res: Response) => {
    const { truckId } = req.params;

    const location = await prisma.location.findUnique({
      where: { truckId },
    });

    if (!location) {
      throw NotFoundError('Location not found');
    }

    res.json(location);
  })
);

/**
 * GET /api/locations/all/online
 * Get all online truck locations
 */
router.get(
  '/all/online',
  asyncHandler(async (req: Request, res: Response) => {
    const trucks = await prisma.truck.findMany({
      where: { isOnline: true },
      include: {
        location: true,
        photos: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    const onlineTrucks = trucks.filter(t => t.location).map(truck => ({
      truckId: truck.id,
      name: truck.name,
      specialty: truck.specialty,
      rating: truck.rating,
      latitude: truck.location!.latitude,
      longitude: truck.location!.longitude,
      address: truck.location!.address,
      photoUrl: truck.photos[0]?.url,
    }));

    res.json({ trucks: onlineTrucks });
  })
);

export default router;
