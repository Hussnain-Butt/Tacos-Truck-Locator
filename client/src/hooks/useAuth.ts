/**
 * useAuth Hook
 * Custom hook for authentication with Clerk + Backend sync
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { authService } from '../services/authService';

interface AuthUser {
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

interface UseAuthReturn {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  clerkUser: ReturnType<typeof useUser>['user'];
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | null;
  isVendor: boolean;
  isCustomer: boolean;
  syncUser: (role?: 'CUSTOMER' | 'VENDOR') => Promise<boolean>;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const { isLoaded, isSignedIn, getToken, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  
  const [backendUser, setBackendUser] = useState<AuthUser | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  /**
   * Sync user with backend
   */
  const syncUser = useCallback(async (role: 'CUSTOMER' | 'VENDOR' = 'CUSTOMER'): Promise<boolean> => {
    if (!isSignedIn || !clerkUser) {
      return false;
    }

    try {
      // Get Clerk token
      const token = await getToken();
      if (token) {
        authService.setToken(token);
      }

      // Sync with backend
      const result = await authService.syncUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        role,
        avatarUrl: clerkUser.imageUrl,
      });

      if (result.success && result.user) {
        setBackendUser(result.user);
        setIsSynced(true);
        return true;
      }

      console.error('Sync failed:', result.error);
      return false;
    } catch (error) {
      console.error('Error syncing user:', error);
      return false;
    }
  }, [isSignedIn, clerkUser, getToken]);

  /**
   * Get authentication token
   */
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getToken();
      if (token) {
        authService.setToken(token);
      }
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }, [getToken]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    authService.setToken(null);
    setBackendUser(null);
    setIsSynced(false);
    await clerkSignOut();
  }, [clerkSignOut]);

  // Auto-sync when signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser && !isSynced) {
      // Determine role from Clerk metadata or default to CUSTOMER
      const role = (clerkUser.publicMetadata?.role as 'CUSTOMER' | 'VENDOR') || 'CUSTOMER';
      syncUser(role);
    }
  }, [isLoaded, isSignedIn, clerkUser, isSynced, syncUser]);

  // Set token when signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      getAuthToken();
    }
  }, [isLoaded, isSignedIn, getAuthToken]);

  return {
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    user: backendUser,
    clerkUser: clerkUser ?? null,
    role: backendUser?.role || null,
    isVendor: backendUser?.role === 'VENDOR',
    isCustomer: backendUser?.role === 'CUSTOMER',
    syncUser,
    getToken: getAuthToken,
    signOut,
  };
};

export default useAuth;
