import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import HomeScreen from './src/screens/HomeScreen';
import VendorScreen from './src/screens/VendorScreen';
import CustomerScreen from './src/screens/CustomerScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import TruckSetupScreen from './src/screens/TruckSetupScreen';
import MenuManagementScreen from './src/screens/MenuManagementScreen';
import TruckDetailsScreen from './src/screens/TruckDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import PhotoGalleryScreen from './src/screens/PhotoGalleryScreen';
import OperatingHoursScreen from './src/screens/OperatingHoursScreen';
import SpecialOffersScreen from './src/screens/SpecialOffersScreen';
import VendorProfileScreen from './src/screens/VendorProfileScreen';
import type { TruckData } from './src/types';

// Clerk Publishable Key - Replace with your actual key from Clerk Dashboard
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

export type RootStackParamList = {
  Home: undefined;
  Vendor: undefined;
  Customer: undefined;
  Login: { userType?: 'customer' | 'vendor' };
  Signup: { userType?: 'customer' | 'vendor' };
  TruckSetup: undefined;
  MenuManagement: undefined;
  TruckDetails: { truck: TruckData; userLocation?: { latitude: number; longitude: number } };
  Profile: undefined;
  Favorites: undefined;
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
        <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ 
            title: 'Login',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen} 
          options={{ 
            title: 'Sign Up',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="TruckSetup" 
          component={TruckSetupScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Vendor" 
          component={VendorScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Customer" 
          component={CustomerScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MenuManagement" 
          component={MenuManagementScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="TruckDetails" 
          component={TruckDetailsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Favorites" 
          component={FavoritesScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="PhotoGallery" 
          component={PhotoGalleryScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="OperatingHours" 
          component={OperatingHoursScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="SpecialOffers" 
          component={SpecialOffersScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="VendorProfile" 
          component={VendorProfileScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
        </NavigationContainer>
      </ClerkLoaded>
    </ClerkProvider>
  );
}


