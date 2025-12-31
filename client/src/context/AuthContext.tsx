/**
 * AuthContext - Centralized Authentication State Management
 * Handles user authentication, role tracking, and logout
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { authService } from '../services/authService';

// Types
export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN';

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  role: UserRole;
  profile: {
    id: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
  };
  hasTruck?: boolean;
}

interface AuthContextType {
  // State
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: UserRole | null;
  
  // Computed
  isVendor: boolean;
  isCustomer: boolean;
  
  // Actions
  syncUser: (role: UserRole) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  setAuthToken: (token: string | null) => void;
  
  // Track last role for logout navigation
  lastKnownRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [lastKnownRole, setLastKnownRole] = useState<UserRole | null>(null);

  /**
   * Set auth token for API calls
   */
  const setAuthToken = useCallback((token: string | null) => {
    authService.setToken(token);
  }, []);

  /**
   * Fetch current user from backend
   */
  const refreshUser = useCallback(async () => {
    if (!isSignedIn) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (token) {
        authService.setToken(token);
      }

      const result = await authService.getCurrentUser();
      
      if (result.user) {
        const authUser: AuthUser = {
          id: result.user.id,
          clerkId: result.user.clerkId,
          email: result.user.email,
          role: result.user.role,
          profile: result.user.profile,
          hasTruck: !!(result.user as any).profile?.truck,
        };
        setUser(authUser);
        setLastKnownRole(authUser.role);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  /**
   * Sync user with backend (used during signup)
   */
  const syncUser = useCallback(async (role: UserRole): Promise<boolean> => {
    if (!isSignedIn || !clerkUser) {
      console.log('Cannot sync: not signed in or no clerk user');
      return false;
    }

    try {
      setIsLoading(true);
      
      const token = await getToken();
      if (token) {
        authService.setToken(token);
      }

      const result = await authService.syncUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        role,
        avatarUrl: clerkUser.imageUrl,
      });

      if (result.success && result.user) {
        const authUser: AuthUser = {
          id: result.user.id,
          clerkId: result.user.clerkId,
          email: result.user.email,
          role: result.user.role,
          profile: result.user.profile,
          hasTruck: !!(result.user as any).profile?.truck,
        };
        setUser(authUser);
        setLastKnownRole(authUser.role);
        return true;
      }

      console.error('Sync failed:', result.error);
      return false;
    } catch (error) {
      console.error('Error syncing user:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, clerkUser, getToken]);

  /**
   * Sign out user
   */
  const signOut = useCallback(async () => {
    try {
      // Store role before clearing
      if (user?.role) {
        setLastKnownRole(user.role);
      }
      
      // Clear local state
      authService.setToken(null);
      setUser(null);
      
      // Sign out from Clerk
      await clerkSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [user, clerkSignOut]);

  // Auto-refresh user when auth state changes
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        refreshUser();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    }
  }, [isLoaded, isSignedIn, refreshUser]);

  // Set token when signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      getToken().then(token => {
        if (token) {
          authService.setToken(token);
        }
      });
    }
  }, [isLoaded, isSignedIn, getToken]);

  const value: AuthContextType = {
    isLoading: !isLoaded || isLoading,
    isAuthenticated: isSignedIn ?? false,
    user,
    role: user?.role || null,
    isVendor: user?.role === 'VENDOR',
    isCustomer: user?.role === 'CUSTOMER',
    syncUser,
    refreshUser,
    signOut,
    setAuthToken,
    lastKnownRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
