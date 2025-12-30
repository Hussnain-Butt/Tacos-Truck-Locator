/**
 * useUserRole Hook
 * Fetches user role from backend and provides navigation helper
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { authService } from '../services/authService';

interface UserProfile {
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

interface UseUserRoleReturn {
  user: UserProfile | null;
  role: 'CUSTOMER' | 'VENDOR' | null;
  isVendor: boolean;
  isCustomer: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasTruck: boolean;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { isSignedIn, getToken } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTruck, setHasTruck] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get token from Clerk
      const token = await getToken();
      if (token) {
        authService.setToken(token);
      }

      const result = await authService.getCurrentUser();
      
      if (result.error) {
        setError(result.error);
        setUser(null);
      } else if (result.user) {
        setUser(result.user);
        // Check if vendor has truck (profile exists)
        setHasTruck(result.user.role === 'VENDOR' && !!result.user.profile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    role: user?.role || null,
    isVendor: user?.role === 'VENDOR',
    isCustomer: user?.role === 'CUSTOMER',
    loading,
    error,
    refetch: fetchUser,
    hasTruck,
  };
};

export default useUserRole;
