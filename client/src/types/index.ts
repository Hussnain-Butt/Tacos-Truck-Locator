/**
 * Shared Types
 * Common type definitions used across the app
 */

// Truck data structure from API
export interface TruckData {
  id: string;
  name: string;
  description: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  isOnline: boolean;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
  } | null;
  tags?: string[];
  photos?: Array<{ id?: string; url: string; isPrimary?: boolean; caption?: string }>;
  distance?: number;
  phone?: string;
  email?: string;
  website?: string;
  priceRange?: string;
  coverPhoto?: string;
  menu?: MenuItem[];
  hours?: OperatingHours[];
  offers?: Offer[];
  vendor?: {
    id: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
  };
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  isPopular?: boolean;
}

export interface OperatingHours {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'BOGO';
  discountValue: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  customer: {
    name: string;
    avatarUrl?: string;
  };
}
