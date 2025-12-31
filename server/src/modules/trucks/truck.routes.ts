/**
 * Truck Routes
 * Complete CRUD operations for truck management
 */

import { Router, Request, Response } from 'express';
import prisma from '../../config/database.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { verifyToken, requireVendor } from '../../middleware/auth.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../middleware/errorHandler.js';
import { upload, uploadToCloudinary, uploadMultipleToCloudinary, deleteFromCloudinary } from '../../config/cloudinary.js';

const router = Router();

// ==========================================
// PUBLIC ROUTES (No auth required)
// ==========================================

/**
 * GET /api/trucks
 * List all trucks with pagination
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [trucks, total] = await Promise.all([
      prisma.truck.findMany({
        skip,
        take: limit,
        include: {
          location: true,
          vendor: {
            select: { name: true, avatarUrl: true },
          },
          photos: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: { reviews: true, menu: true },
          },
        },
        orderBy: { rating: 'desc' },
      }),
      prisma.truck.count(),
    ]);

    res.json({
      trucks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

/**
 * GET /api/trucks/nearby
 * Find trucks near a location
 */
router.get(
  '/nearby',
  asyncHandler(async (req: Request, res: Response) => {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      throw BadRequestError('latitude and longitude are required');
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const radiusKm = parseFloat(radius as string);

    // Get all trucks with locations (including offline ones)
    const trucks = await prisma.truck.findMany({
      include: {
        location: true,
        vendor: {
          select: { name: true, avatarUrl: true },
        },
        photos: {
          orderBy: { isPrimary: 'desc' },
        },
        _count: {
          select: { reviews: true, menu: true },
        },
      },
    });

    // Filter by distance (Haversine formula)
    const nearbyTrucks = trucks.filter((truck) => {
      if (!truck.location) return false;
      
      const distance = calculateDistance(
        lat, lng,
        truck.location.latitude, truck.location.longitude
      );
      
      return distance <= radiusKm;
    }).map((truck) => ({
      ...truck,
      distance: truck.location 
        ? calculateDistance(lat, lng, truck.location.latitude, truck.location.longitude)
        : null,
    }));

    // Sort by distance
    nearbyTrucks.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    res.json({ trucks: nearbyTrucks });
  })
);

/**
 * GET /api/trucks/favorites
 * Get all trucks favorited by the current customer
 */
router.get(
  '/favorites',
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await prisma.customer.findFirst({
      where: { userId: req.userId },
    });

    if (!customer) {
      throw BadRequestError('Customer profile not found');
    }

    const favorites = await prisma.truck.findMany({
      where: {
        favoritedBy: {
          some: {
            id: customer.id,
          },
        },
      },
      include: {
        location: true,
        vendor: {
          select: { name: true, avatarUrl: true },
        },
        photos: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: { reviews: true, menu: true },
        },
      },
    });

    res.json(favorites);
  })
);

/**
 * GET /api/trucks/online
 * Get all online trucks (for map)
 */
router.get(
  '/online',
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

    res.json({ trucks });
  })
);

/**
 * GET /api/trucks/:id
 * Get truck details by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const truck = await prisma.truck.findUnique({
      where: { id },
      include: {
        location: true,
        vendor: {
          select: { id: true, name: true, avatarUrl: true, phone: true },
        },
        menu: {
          where: { isAvailable: true },
          orderBy: [{ isPopular: 'desc' }, { category: 'asc' }],
        },
        hours: true,
        photos: {
          orderBy: { isPrimary: 'desc' },
        },
        offers: {
          where: { isActive: true },
        },
        reviews: {
          include: {
            customer: {
              select: { name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!truck) {
      throw NotFoundError('Truck not found');
    }

    res.json(truck);
  })
);

/**
 * GET /api/trucks/:id/menu
 * Get truck menu
 */
router.get(
  '/:id/menu',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const menu = await prisma.menuItem.findMany({
      where: { truckId: id },
      orderBy: [{ category: 'asc' }, { isPopular: 'desc' }, { name: 'asc' }],
    });

    res.json({ menu });
  })
);

// ==========================================
// PROTECTED ROUTES (Vendor only)
// ==========================================

/**
 * POST /api/trucks
 * Create a new truck (vendor only)
 */
router.post(
  '/',
  verifyToken,
  requireVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, specialty, phone, email, website } = req.body;

    console.log(`🚚 Creating truck for userId: ${req.userId}`);
    console.log(`📝 Truck data:`, { name, description, specialty, phone });

    // Get vendor
    const vendor = await prisma.vendor.findFirst({
      where: { userId: req.userId },
      include: { truck: true },
    });

    if (!vendor) {
      console.log(`❌ Vendor profile not found for userId: ${req.userId}`);
      
      // Try to get user info for debugging
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { customer: true, vendor: true },
      });
      console.log(`📋 User info:`, user);
      
      throw BadRequestError('Vendor profile not found. Please make sure you signed up as a vendor.');
    }

    console.log(`✅ Found vendor: ${vendor.id}`);

    if (vendor.truck) {
      console.log(`⚠️ Vendor already has a truck: ${vendor.truck.id}`);
      throw BadRequestError('You already have a truck registered');
    }

    // Create truck
    const truck = await prisma.truck.create({
      data: {
        vendorId: vendor.id,
        name,
        description,
        specialty,
        phone,
        email,
        website,
      },
      include: {
        location: true,
        vendor: {
          select: { name: true, avatarUrl: true },
        },
      },
    });

    console.log(`✅ Truck created: ${truck.id}`);

    res.status(201).json(truck);
  })
);

/**
 * PUT /api/trucks/:id
 * Update truck details (owner only)
 */
router.put(
  '/:id',
  verifyToken,
  requireVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, specialty, phone, email, website } = req.body;

    // Verify ownership
    const truck = await prisma.truck.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!truck) {
      throw NotFoundError('Truck not found');
    }

    if (truck.vendor.userId !== req.userId) {
      throw ForbiddenError('You can only update your own truck');
    }

    const updatedTruck = await prisma.truck.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(specialty && { specialty }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(req.body.isOnline !== undefined && { isOnline: req.body.isOnline }),
        ...(req.body.location && {
          location: {
            upsert: {
              create: {
                latitude: req.body.location.latitude,
                longitude: req.body.location.longitude,
                address: req.body.location.address,
              },
              update: {
                latitude: req.body.location.latitude,
                longitude: req.body.location.longitude,
                address: req.body.location.address,
              },
            },
          },
        }),
      },
      include: { location: true },
    });

    res.json(updatedTruck);
  })
);

/**
 * DELETE /api/trucks/:id
 * Delete truck (owner only)
 */
router.delete(
  '/:id',
  verifyToken,
  requireVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Verify ownership
    const truck = await prisma.truck.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!truck) {
      throw NotFoundError('Truck not found');
    }

    if (truck.vendor.userId !== req.userId) {
      throw ForbiddenError('You can only delete your own truck');
    }

    await prisma.truck.delete({ where: { id } });

    res.json({ success: true, message: 'Truck deleted' });
  })
);

// ==========================================
// MENU MANAGEMENT
// ==========================================

/**
 * POST /api/trucks/:id/menu
 * Add menu item
 */
router.post(
  '/:id/menu',
  verifyToken,
  requireVendor,
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, price, category, isAvailable, isPopular } = req.body;

    // Verify ownership
    const truck = await prisma.truck.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!truck || truck.vendor.userId !== req.userId) {
      throw ForbiddenError('You can only add menu items to your own truck');
    }

    let imageUrl: string | undefined;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'taco-truck/menu');
      imageUrl = result.url;
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        truckId: id,
        name,
        description,
        price: parseFloat(price),
        category: category || 'TACOS',
        isAvailable: isAvailable === 'true' || isAvailable === true,
        isPopular: isPopular === 'true' || isPopular === true,
        imageUrl,
      },
    });

    res.status(201).json(menuItem);
  })
);

/**
 * PUT /api/trucks/:truckId/menu/:itemId
 * Update menu item
 */
router.put(
  '/:truckId/menu/:itemId',
  verifyToken,
  requireVendor,
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const { truckId, itemId } = req.params;
    const { name, description, price, category, isAvailable, isPopular } = req.body;

    // Verify ownership
    const truck = await prisma.truck.findUnique({
      where: { id: truckId },
      include: { vendor: true },
    });

    if (!truck || truck.vendor.userId !== req.userId) {
      throw ForbiddenError('You can only update menu items of your own truck');
    }

    let imageUrl: string | undefined;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'taco-truck/menu');
      imageUrl = result.url;
    }

    const menuItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(category && { category }),
        ...(isAvailable !== undefined && { isAvailable: isAvailable === 'true' || isAvailable === true }),
        ...(isPopular !== undefined && { isPopular: isPopular === 'true' || isPopular === true }),
        ...(imageUrl && { imageUrl }),
      },
    });

    res.json(menuItem);
  })
);

/**
 * DELETE /api/trucks/:truckId/menu/:itemId
 * Delete menu item
 */
router.delete(
  '/:truckId/menu/:itemId',
  verifyToken,
  requireVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { truckId, itemId } = req.params;

    // Verify ownership
    const truck = await prisma.truck.findUnique({
      where: { id: truckId },
      include: { vendor: true },
    });

    if (!truck || truck.vendor.userId !== req.userId) {
      throw ForbiddenError('You can only delete menu items of your own truck');
    }

    await prisma.menuItem.delete({ where: { id: itemId } });

    res.json({ success: true, message: 'Menu item deleted' });
  })
);

// ==========================================
// OPERATING HOURS
// ==========================================

/**
 * GET /api/trucks/:id/hours
 * Get truck operating hours
 */
router.get(
  '/:id/hours',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const hours = await prisma.operatingHours.findMany({
      where: { truckId: id },
    });

    res.json({ hours });
  })
);

/**
 * PUT /api/trucks/:id/hours
 * Update operating hours (batch)
 */
router.put(
  '/:id/hours',
  verifyToken,
  requireVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { hours } = req.body; // Array of { dayOfWeek, openTime, closeTime, isClosed }

    if (!Array.isArray(hours)) {
      throw BadRequestError('Hours must be an array');
    }

    // Verify ownership
    const truck = await prisma.truck.findUnique({
      where: { id },
    });

    if (!truck || truck.vendorId !== (req as any).user!.vendor!.id) {
      throw ForbiddenError('Not authorized to update this truck');
    }

    // Transaction to update all hours
    await prisma.$transaction(
      hours.map((hour) =>
        prisma.operatingHours.upsert({
          where: {
            truckId_dayOfWeek: {
              truckId: id,
              dayOfWeek: hour.dayOfWeek,
            },
          },
          update: {
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isClosed: hour.isClosed,
          },
          create: {
            truckId: id,
            dayOfWeek: hour.dayOfWeek,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isClosed: hour.isClosed,
          },
        })
      )
    );

    const updatedHours = await prisma.operatingHours.findMany({
      where: { truckId: id },
    });

    res.json({ hours: updatedHours });
  })
);

// ==========================================
// OFFERS MANAGEMENT
// ==========================================

/**
 * GET /api/trucks/:id/offers
 * Get truck offers
 */
router.get(
  '/:id/offers',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const offers = await prisma.offer.findMany({
      where: { truckId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ offers });
  })
);

/**
 * POST /api/trucks/:id/offers
 * Create offer
 */
router.post(
  '/:id/offers',
  verifyToken,
  requireVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, discount, code, expiryDate } = req.body;

    // Verify ownership
    const truck = await prisma.truck.findUnique({ where: { id } });
    if (!truck || truck.vendorId !== (req as any).user!.vendor!.id) {
      throw ForbiddenError('Not authorized');
    }

    const offer = await prisma.offer.create({
      data: {
        truckId: id,
        title,
        description,
        discount,
        code,
        endDate: expiryDate ? new Date(expiryDate) : null,
        isActive: true,
      },
    });

    res.status(201).json(offer);
  })
);

/**
 * PUT /api/trucks/:truckId/offers/:offerId
 * Update offer
 */
router.put(
  '/:truckId/offers/:offerId',
  verifyToken,
  requireVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { truckId, offerId } = req.params;
    const { title, description, discount, code, isActive, expiryDate } = req.body;

    // Verify ownership
    const truck = await prisma.truck.findUnique({ where: { id: truckId } });
    if (!truck || truck.vendorId !== (req as any).user!.vendor!.id) {
      throw ForbiddenError('Not authorized');
    }

    const offer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        title,
        description,
        discount,
        code,
        isActive,
        endDate: expiryDate ? new Date(expiryDate) : undefined,
      },
    });

    res.json(offer);
  })
);

/**
 * DELETE /api/trucks/:truckId/offers/:offerId
 * Delete offer
 */
router.delete(
  '/:truckId/offers/:offerId',
  verifyToken,
  requireVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { truckId, offerId } = req.params;

    // Verify ownership
    const truck = await prisma.truck.findUnique({ where: { id: truckId } });
    if (!truck || truck.vendorId !== (req as any).user!.vendor!.id) {
      throw ForbiddenError('Not authorized');
    }

    await prisma.offer.delete({
      where: { id: offerId },
    });

    res.json({ success: true });
  })
);

// ==========================================
// PHOTO MANAGEMENT
// ==========================================

/**
 * POST /api/trucks/:id/photos
 * Upload truck photos
 */
router.post(
  '/:id/photos',
  verifyToken,
  requireVendor,
  upload.array('photos', 10),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { caption, isPrimary } = req.body;

    // Verify ownership
    const truck = await prisma.truck.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!truck || truck.vendor.userId !== req.userId) {
      throw ForbiddenError('You can only add photos to your own truck');
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw BadRequestError('No photos provided');
    }

    const uploadedPhotos = await uploadMultipleToCloudinary(files, 'taco-truck/photos');

    // If setting as primary, unset existing primary
    if (isPrimary === 'true') {
      await prisma.photo.updateMany({
        where: { truckId: id },
        data: { isPrimary: false },
      });
    }

    const photos = await Promise.all(
      uploadedPhotos.map((photo, index) =>
        prisma.photo.create({
          data: {
            truckId: id,
            url: photo.url,
            caption,
            isPrimary: isPrimary === 'true' && index === 0,
          },
        })
      )
    );

    res.status(201).json({ photos });
  })
);

/**
 * DELETE /api/trucks/:truckId/photos/:photoId
 * Delete a photo
 */
router.delete(
  '/:truckId/photos/:photoId',
  verifyToken,
  requireVendor,
  asyncHandler(async (req: Request, res: Response) => {
    const { truckId, photoId } = req.params;

    // Verify ownership
    const truck = await prisma.truck.findUnique({
      where: { id: truckId },
      include: { vendor: true },
    });

    if (!truck || truck.vendor.userId !== req.userId) {
      throw ForbiddenError('You can only delete photos from your own truck');
    }

    await prisma.photo.delete({ where: { id: photoId } });

    res.json({ success: true, message: 'Photo deleted' });
  })
);

// ==========================================
// REVIEWS
// ==========================================

/**
 * POST /api/trucks/:id/reviews
 * Add a review (customer only)
 */
router.post(
  '/:id/reviews',
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    // Get customer
    const customer = await prisma.customer.findFirst({
      where: { userId: req.userId },
    });

    if (!customer) {
      throw BadRequestError('Customer profile not found');
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        truckId_customerId: {
          truckId: id,
          customerId: customer.id,
        },
      },
    });

    if (existingReview) {
      throw BadRequestError('You have already reviewed this truck');
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        truckId: id,
        customerId: customer.id,
        rating: parseInt(rating),
        title,
        comment,
      },
      include: {
        customer: {
          select: { name: true, avatarUrl: true },
        },
      },
    });

    // Update truck rating
    const reviews = await prisma.review.findMany({
      where: { truckId: id },
    });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.truck.update({
      where: { id },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
      },
    });

    res.status(201).json(review);
  })
);

/**
 * GET /api/trucks/:id/reviews
 * Get all reviews for a truck
 */
router.get(
  '/:id/reviews',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const reviews = await prisma.review.findMany({
      where: { truckId: id },
      include: {
        customer: {
          select: { name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reviews);
  })
);

/**
 * POST /api/trucks/:id/favorite
 * Toggle favorite status for a truck
 */
router.post(
  '/:id/favorite',
  verifyToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Get customer
    const customer = await prisma.customer.findFirst({
      where: { userId: req.userId },
    });

    if (!customer) {
      throw BadRequestError('Customer profile not found');
    }

    // Check if already favorited (using the implicit many-to-many relation)
    const truck = await prisma.truck.findFirst({
      where: {
        id,
        favoritedBy: {
          some: { id: customer.id },
        },
      },
    });

    if (truck) {
      // Unfavorite
      await prisma.truck.update({
        where: { id },
        data: {
          favoritedBy: {
            disconnect: { id: customer.id },
          },
        },
      });
      res.json({ isFavorite: false });
    } else {
      // Favorite
      await prisma.truck.update({
        where: { id },
        data: {
          favoritedBy: {
            connect: { id: customer.id },
          },
        },
      });
      res.json({ isFavorite: true });
    }
  })
);

// ==========================================
// ANALYTICS ENDPOINTS
// ==========================================

/**
 * POST /api/trucks/:id/view
 * Increment view count when customer views truck profile
 */
router.post(
  '/:id/view',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const truck = await prisma.truck.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
      select: { viewCount: true },
    });

    res.json({ success: true, viewCount: truck.viewCount });
  })
);

/**
 * POST /api/trucks/:id/navigate
 * Increment navigation count when customer navigates to truck
 */
router.post(
  '/:id/navigate',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const truck = await prisma.truck.update({
      where: { id },
      data: {
        navigationCount: { increment: 1 },
      },
      select: { navigationCount: true },
    });

    res.json({ success: true, navigationCount: truck.navigationCount });
  })
);

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default router;
