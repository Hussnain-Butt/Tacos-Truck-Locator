/**
 * Auth Service
 * Handles authentication-related API calls
 */

import { apiClient } from './api';

interface User {
  id: string;
  clerkId: string;
  email: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  profile: {
    id: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
  };
}

interface SyncUserParams {
  clerkId: string;
  email: string;
  name?: string;
  role?: 'CUSTOMER' | 'VENDOR';
  avatarUrl?: string;
}

interface AuthResponse {
  success: boolean;
  user: User;
}

/**
 * Auth Service
 */
export const authService = {
  /**
   * Sync user with backend after Clerk login
   * Call this after successful Clerk authentication
   */
  async syncUser(params: SyncUserParams): Promise<{ success: boolean; user?: User; error?: string }> {
    const response = await apiClient.post<AuthResponse>('/api/auth/sync', params);
    
    if (response.error) {
      return { success: false, error: response.error };
    }

    return { 
      success: true, 
      user: response.data?.user 
    };
  },

  /**
   * Get current user from backend
   */
  async getCurrentUser(): Promise<{ user?: User; error?: string }> {
    const response = await apiClient.get<User>('/api/auth/me');
    
    if (response.error) {
      return { error: response.error };
    }

    return { user: response.data };
  },

  /**
   * Update user profile
   */
  async updateProfile(data: { name: string; phone: string }): Promise<{ success: boolean; profile?: any; error?: string }> {
    const response = await apiClient.put<{ success: boolean; profile: any }>('/api/auth/profile', data);
    
    if (response.error) {
      return { success: false, error: response.error };
    }

    return response.data || { success: false, error: 'Unknown error' };
  },

  /**
   * Set auth token from Clerk
   */
  setToken(token: string | null) {
    apiClient.setAuthToken(token);
  },
};

export default authService;
