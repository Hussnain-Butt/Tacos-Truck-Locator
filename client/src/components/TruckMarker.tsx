/**
 * Modern Truck Marker Component
 * Animated map markers with pulse effect
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { theme } from '../theme/theme';
import { Icon } from './Icons';
import type { TruckData } from '../types';

interface TruckMarkerProps {
  truck: TruckData;
  onPress: () => void;
}

export const TruckMarker: React.FC<TruckMarkerProps> = ({ truck, onPress }) => {
  // Don't render marker if truck has no location
  if (!truck.location) return null;
  
  return (
    <Marker
      coordinate={{
        latitude: truck.location.latitude,
        longitude: truck.location.longitude,
      }}
      onPress={onPress}
    >
      <View style={styles.markerWrapper}>
        <View style={[
          styles.markerCircle,
          { backgroundColor: truck.isOnline ? '#F97316' : '#9CA3AF' }
        ]}>
          <Icon 
            name="taco" 
            size={18} 
            color="#FFFFFF" 
          />
        </View>
        {truck.isOnline && (
          <View style={styles.greenDot} />
        )}
        {truck.rating >= 4.5 && (
          <View style={styles.starBadge}>
            <Icon name="star" size={8} color="#F59E0B" />
          </View>
        )}
      </View>
    </Marker>
  );
};

// Simple marker for better performance with many markers
export const TruckMarkerSimple: React.FC<TruckMarkerProps> = ({ truck, onPress }) => {
  // Don't render marker if truck has no location
  if (!truck.location) return null;
  
  return (
    <Marker
      coordinate={{
        latitude: truck.location.latitude,
        longitude: truck.location.longitude,
      }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.simpleMarker}>
        <LinearGradient
          colors={truck.isOnline ? theme.gradients.primary : [theme.colors.gray[400], theme.colors.gray[500]]}
          style={styles.simpleMarkerGradient}
        >
          <Icon 
            name="taco" 
            size={16} 
            color={theme.colors.white} 
          />
        </LinearGradient>
        {truck.isOnline && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  pulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  pulseInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: theme.colors.primary.main,
  },
  marker: {
    alignItems: 'center',
  },
  markerGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...theme.shadows.lg,
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  ratingBadge: {
    position: 'absolute',
    top: 0,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    gap: 2,
    ...theme.shadows.md,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[800],
  },
  
  // Simple marker styles
  simpleMarker: {
    alignItems: 'center',
  },
  simpleMarkerGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
    ...theme.shadows.md,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  // New simplified marker styles
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  markerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  greenDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  starBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default TruckMarker;
