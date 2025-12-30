/**
 * Truck Service
 * Handles all truck-related API calls
 */

import { apiClient } from './api';

// Types
export interface TruckLocation {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
}

export interface Truck {
  id: string;
  name: string;
  description?: string;
  specialty: string;
  phone?: string;
  email?: string;
  website?: string;
  isOnline: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  location?: TruckLocation;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isAvailable: boolean;
  isPopular: boolean;
  imageUrl?: string;
}

interface TruckListResponse {
  trucks: Truck[];
  total: number;
  page: number;
  limit: number;
}

interface NearbyParams {
  latitude: number;
  longitude: number;
  radius?: number; // km
}

/**
 * Truck Service
 */
export const truckService = {
  /**
   * Get all trucks
   */
  async getAll(page = 1, limit = 20): Promise<{ trucks?: Truck[]; error?: string }> {
    const response = await apiClient.get<TruckListResponse>(
      `/api/trucks?page=${page}&limit=${limit}`
    );
    
    if (response.error) {
      return { error: response.error };
    }

    return { trucks: response.data?.trucks };
  },

  /**
   * Get nearby trucks
   */
  async getNearby(params: NearbyParams): Promise<{ trucks?: Truck[]; error?: string }> {
    const { latitude, longitude, radius = 10 } = params;
    const response = await apiClient.get<{ trucks: Truck[] }>(
      `/api/trucks/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
    );
    
    if (response.error) {
      return { error: response.error };
    }

    return { trucks: response.data?.trucks };
  },

  /**
   * Get truck by ID
   */
  async getById(id: string): Promise<{ truck?: Truck; error?: string }> {
    const response = await apiClient.get<Truck>(`/api/trucks/${id}`);
    
    if (response.error) {
      return { error: response.error };
    }

    return { truck: response.data };
  },

  /**
   * Get truck menu
   */
  async getMenu(truckId: string): Promise<{ menu?: MenuItem[]; error?: string }> {
    const response = await apiClient.get<{ menu: MenuItem[] }>(`/api/trucks/${truckId}/menu`);
    
    if (response.error) {
      return { error: response.error };
    }

    return { menu: response.data?.menu };
  },

  /**
   * Create truck (vendor only)
   */
  async create(data: Partial<Truck>): Promise<{ truck?: Truck; error?: string }> {
    const response = await apiClient.post<Truck>('/api/trucks', data);
    
    if (response.error) {
      return { error: response.error };
    }

    return { truck: response.data };
  },

  /**
   * Update truck (vendor only)
   */
  async update(id: string, data: Partial<Truck>): Promise<{ truck?: Truck; error?: string }> {
    const response = await apiClient.put<Truck>(`/api/trucks/${id}`, data);
    
    if (response.error) {
      return { error: response.error };
    }

    return { truck: response.data };
  },

  /**
   * Update truck location (vendor only)
   */
  async updateLocation(
    truckId: string,
    location: { latitude: number; longitude: number; address?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.put<{ success: boolean }>(
      `/api/locations/${truckId}`,
      location
    );
    
    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  },

  /**
   * Toggle truck online status (vendor only)
   */
  async toggleStatus(truckId: string, isOnline: boolean): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.put<{ success: boolean }>(
      `/api/locations/${truckId}/status`,
      { isOnline }
    );
    
    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  },

  /**
   * Record a view when customer views truck details
   */
  async recordView(truckId: string): Promise<void> {
    try {
      await apiClient.post(`/api/trucks/${truckId}/view`, {});
    } catch (error) {
      console.log('Failed to record view:', error);
    }
  },

  /**
   * Record navigation when customer navigates to truck
   */
  async recordNavigation(truckId: string): Promise<void> {
    try {
      await apiClient.post(`/api/trucks/${truckId}/navigate`, {});
    } catch (error) {
      console.log('Failed to record navigation:', error);
    }
  },
};

export default truckService;
