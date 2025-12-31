import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

// Context
import { AuthProvider } from './src/context/AuthContext';

// Auth Screens
import HomeScreen from './src/screens/HomeScreen';
import CustomerLoginScreen from './src/screens/auth/CustomerLoginScreen';
import CustomerSignupScreen from './src/screens/auth/CustomerSignupScreen';
import VendorLoginScreen from './src/screens/auth/VendorLoginScreen';
import VendorSignupScreen from './src/screens/auth/VendorSignupScreen';

// Customer Screens
import CustomerScreen from './src/screens/CustomerScreen';
import TruckDetailsScreen from './src/screens/TruckDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';

// Vendor Screens
import VendorScreen from './src/screens/VendorScreen';
import TruckSetupScreen from './src/screens/TruckSetupScreen';
import MenuManagementScreen from './src/screens/MenuManagementScreen';
import PhotoGalleryScreen from './src/screens/PhotoGalleryScreen';
import OperatingHoursScreen from './src/screens/OperatingHoursScreen';
import SpecialOffersScreen from './src/screens/SpecialOffersScreen';
import VendorProfileScreen from './src/screens/VendorProfileScreen';

import type { TruckData } from './src/types';

// Clerk Publishable Key
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_your_key_here';

// Token cache for Secure Storage
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Navigation Types
export type RootStackParamList = {
  // Auth Screens
  Home: undefined;
  CustomerLogin: undefined;
  CustomerSignup: undefined;
  VendorLogin: undefined;
  VendorSignup: undefined;
  
  // Legacy (for backwards compatibility during transition)
  Login: { userType?: 'customer' | 'vendor' };
  Signup: { userType?: 'customer' | 'vendor' };
  
  // Customer Screens
  Customer: undefined;
  TruckDetails: { truck: TruckData; userLocation?: { latitude: number; longitude: number } };
  Profile: undefined;
  Favorites: undefined;
  
  // Vendor Screens
  Vendor: undefined;
  TruckSetup: undefined;
  MenuManagement: undefined;
  PhotoGallery: undefined;
  OperatingHours: undefined;
  SpecialOffers: undefined;
  VendorProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator 
              initialRouteName="Home"
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
              {/* ===== AUTH SCREENS ===== */}
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
              />
              
              {/* Customer Auth */}
              <Stack.Screen 
                name="CustomerLogin" 
                component={CustomerLoginScreen}
                options={{
                  headerShown: true,
                  title: 'Customer Login',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen 
                name="CustomerSignup" 
                component={CustomerSignupScreen}
                options={{
                  headerShown: true,
                  title: 'Create Account',
                  headerBackTitle: 'Back',
                }}
              />
              
              {/* Vendor Auth */}
              <Stack.Screen 
                name="VendorLogin" 
                component={VendorLoginScreen}
                options={{
                  headerShown: true,
                  title: 'Vendor Login',
                  headerBackTitle: 'Back',
                  headerStyle: { backgroundColor: '#1A1A2E' },
                  headerTintColor: '#fff',
                }}
              />
              <Stack.Screen 
                name="VendorSignup" 
                component={VendorSignupScreen}
                options={{
                  headerShown: true,
                  title: 'Become a Vendor',
                  headerBackTitle: 'Back',
                  headerStyle: { backgroundColor: '#1A1A2E' },
                  headerTintColor: '#fff',
                }}
              />
              
              {/* ===== CUSTOMER SCREENS ===== */}
              <Stack.Screen 
                name="Customer" 
                component={CustomerScreen} 
              />
              <Stack.Screen 
                name="TruckDetails" 
                component={TruckDetailsScreen} 
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
              />
              <Stack.Screen 
                name="Favorites" 
                component={FavoritesScreen} 
              />
              
              {/* ===== VENDOR SCREENS ===== */}
              <Stack.Screen 
                name="TruckSetup" 
                component={TruckSetupScreen} 
              />
              <Stack.Screen 
                name="Vendor" 
                component={VendorScreen} 
              />
              <Stack.Screen 
                name="MenuManagement" 
                component={MenuManagementScreen} 
              />
              <Stack.Screen 
                name="PhotoGallery" 
                component={PhotoGalleryScreen} 
              />
              <Stack.Screen 
                name="OperatingHours" 
                component={OperatingHoursScreen} 
              />
              <Stack.Screen 
                name="SpecialOffers" 
                component={SpecialOffersScreen} 
              />
              <Stack.Screen 
                name="VendorProfile" 
                component={VendorProfileScreen} 
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
