/**
 * Auth Routes - Clerk Webhook Handler
 * Syncs users from Clerk to local database
 */

import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import prisma from '../../config/database.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError } from '../../middleware/errorHandler.js';

const router = Router();

// Clerk Webhook Event Types
interface ClerkUserWebhookEvent {
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    public_metadata: {
      role?: 'CUSTOMER' | 'VENDOR';
    };
  };
  object: string;
  type: string;
}

/**
 * POST /api/auth/webhook
 * Clerk webhook endpoint for user sync
 */
router.post(
  '/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    // Skip verification if webhook secret is not set or is a placeholder
    const isValidSecret = WEBHOOK_SECRET && 
      WEBHOOK_SECRET.startsWith('whsec_') && 
      WEBHOOK_SECRET.length > 20 &&
      !WEBHOOK_SECRET.includes('your');

    if (!isValidSecret) {
      console.warn('⚠️ CLERK_WEBHOOK_SECRET not configured - processing without verification (dev mode)');
      // For development, process without verification
      await processWebhookEvent(req.body);
      return res.status(200).json({ success: true });
    }

    // Verify webhook signature
    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw BadRequestError('Missing webhook headers');
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: ClerkUserWebhookEvent;

    try {
      evt = wh.verify(JSON.stringify(req.body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkUserWebhookEvent;
    } catch (err) {
      console.error('❌ Webhook verification failed:', err);
      throw BadRequestError('Invalid webhook signature');
    }

    await processWebhookEvent(evt);
    res.status(200).json({ success: true });
  })
);

/**
 * Process Clerk webhook event
 */
async function processWebhookEvent(evt: ClerkUserWebhookEvent) {
  const eventType = evt.type;
  const { id: clerkId, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;

  const email = email_addresses?.[0]?.email_address;
  const name = [first_name, last_name].filter(Boolean).join(' ') || 'User';
  const role = public_metadata?.role || 'CUSTOMER';

  console.log(`📨 Webhook event: ${eventType} for user ${clerkId}`);

  switch (eventType) {
    case 'user.created':
      await handleUserCreated(clerkId, email, name, role, image_url);
      break;

    case 'user.updated':
      await handleUserUpdated(clerkId, email, name, role, image_url);
      break;

    case 'user.deleted':
      await handleUserDeleted(clerkId);
      break;

    default:
      console.log(`⏭️ Ignoring event type: ${eventType}`);
  }
}

/**
 * Handle user.created event
 */
async function handleUserCreated(
  clerkId: string,
  email: string,
  name: string,
  role: 'CUSTOMER' | 'VENDOR',
  avatarUrl: string | null
) {
  console.log(`👤 Creating user: ${email} (${role})`);

  // Check if user already exists with this email (different clerkId)
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Update existing user with new clerkId
    console.log(`🔄 User exists, updating clerkId for: ${email}`);
    await prisma.user.update({
      where: { email },
      data: { clerkId, role },
    });
    console.log(`✅ User updated with new clerkId: ${existingUser.id}`);
    return;
  }

  // Check if user exists with this clerkId
  const existingByClerkId = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (existingByClerkId) {
    console.log(`⚠️ User already exists with clerkId: ${clerkId}`);
    return;
  }

  // Create new user with role-specific profile
  const user = await prisma.user.create({
    data: {
      clerkId,
      email,
      role,
      ...(role === 'CUSTOMER'
        ? {
            customer: {
              create: {
                name,
                avatarUrl,
              },
            },
          }
        : {
            vendor: {
              create: {
                name,
                phone: '',
                avatarUrl,
              },
            },
          }),
    },
    include: {
      customer: true,
      vendor: true,
    },
  });

  console.log(`✅ User created: ${user.id}`);
}

/**
 * Handle user.updated event
 */
async function handleUserUpdated(
  clerkId: string,
  email: string,
  name: string,
  role: 'CUSTOMER' | 'VENDOR',
  avatarUrl: string | null
) {
  console.log(`🔄 Updating user: ${email} to role: ${role}`);

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { customer: true, vendor: true },
  });

  if (!user) {
    // User doesn't exist, create them
    await handleUserCreated(clerkId, email, name, role, avatarUrl);
    return;
  }

  // Update user role
  await prisma.user.update({
    where: { clerkId },
    data: { email, role },
  });

  // Handle role-specific profile updates or creation
  if (role === 'CUSTOMER') {
    if (user.customer) {
      // Update existing customer profile
      await prisma.customer.update({
        where: { userId: user.id },
        data: { name, avatarUrl },
      });
    } else {
      // Create customer profile (role changed from VENDOR to CUSTOMER)
      await prisma.customer.create({
        data: {
          userId: user.id,
          name,
          avatarUrl,
        },
      });
      console.log(`✅ Created customer profile for user: ${user.id}`);
    }
  } else if (role === 'VENDOR') {
    if (user.vendor) {
      // Update existing vendor profile
      await prisma.vendor.update({
        where: { userId: user.id },
        data: { name, avatarUrl },
      });
    } else {
      // Create vendor profile (role changed from CUSTOMER to VENDOR)
      await prisma.vendor.create({
        data: {
          userId: user.id,
          name,
          phone: '',
          avatarUrl,
        },
      });
      console.log(`✅ Created vendor profile for user: ${user.id}`);
    }
  }

  console.log(`✅ User updated: ${user.id}`);
}

/**
 * Handle user.deleted event
 */
async function handleUserDeleted(clerkId: string) {
  console.log(`🗑️ Deleting user: ${clerkId}`);

  try {
    await prisma.user.delete({
      where: { clerkId },
    });
    console.log(`✅ User deleted`);
  } catch (error) {
    console.log(`⚠️ User not found for deletion: ${clerkId}`);
  }
}

/**
 * POST /api/auth/sync
 * Manual sync endpoint for development
 * Creates user from Clerk data sent by frontend
 */
router.post(
  '/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const { clerkId, email, name, role, avatarUrl } = req.body;

    if (!clerkId || !email) {
      throw BadRequestError('clerkId and email are required');
    }

    const userRole = role === 'VENDOR' ? 'VENDOR' : 'CUSTOMER';

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { customer: true, vendor: true },
    });

    if (user) {
      // Update existing user
      await handleUserUpdated(clerkId, email, name || 'User', userRole, avatarUrl);
      user = await prisma.user.findUnique({
        where: { clerkId },
        include: { customer: true, vendor: true },
      });
    } else {
      // Create new user
      await handleUserCreated(clerkId, email, name || 'User', userRole, avatarUrl);
      user = await prisma.user.findUnique({
        where: { clerkId },
        include: { customer: true, vendor: true },
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user?.id,
        clerkId: user?.clerkId,
        email: user?.email,
        role: user?.role,
        profile: user?.customer || user?.vendor,
      },
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user from token
 */
router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Decode token payload
      const tokenParts = token.split('.');
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString('utf-8')
      );

      const clerkId = payload.sub;
      
      let user = await prisma.user.findUnique({
        where: { clerkId },
        include: {
          customer: {
            include: {
              _count: {
                select: {
                  favorites: true,
                  reviews: true,
                },
              },
            },
          },
          vendor: {
            include: {
              truck: {
                include: {
                  location: true,
                  photos: true,
                },
              },
            },
          },
        },
      });

      // If user not found, return 404 - frontend should call /sync first during signup
      if (!user) {
        console.log(`ℹ️ /api/auth/me: User not found for clerkId: ${clerkId}. Needs to sync first.`);
        return res.status(404).json({ error: 'User not found. Please complete signup.' });
      }

      res.json({
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
        profile: user.customer || user.vendor,
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  })
);

/**
 * PUT /api/auth/profile
 * Update current user profile (Vendor or Customer)
 */
router.put(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { name, phone } = req.body;
    
    try {
      // Decode token payload
      const tokenParts = token.split('.');
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString('utf-8')
      );

      const clerkId = payload.sub;
      
      const user = await prisma.user.findUnique({
        where: { clerkId },
        include: {
          customer: true,
          vendor: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let updatedProfile;

      if (user.role === 'VENDOR' && user.vendor) {
        updatedProfile = await prisma.vendor.update({
          where: { id: user.vendor.id },
          data: {
            name: name || user.vendor.name,
            phone: phone || user.vendor.phone,
          },
        });
      } else if (user.role === 'CUSTOMER' && user.customer) {
        updatedProfile = await prisma.customer.update({
          where: { id: user.customer.id },
          data: {
            name: name || user.customer.name,
            phone: phone || user.customer.phone,
          },
        });
      } else {
         // Create profile if missing? Or error?
         // For now, assume profile exists due to sync logic
         return res.status(400).json({ error: 'Profile not found' });
      }

      res.json({
        success: true,
        profile: updatedProfile,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  })
);

export default router;
