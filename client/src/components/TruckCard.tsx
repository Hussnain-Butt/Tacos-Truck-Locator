/**
 * Modern Animated TruckCard Component
 * Premium card with glassmorphism, entrance animations, and professional styling
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
  FadeInUp,
  FadeInRight,
} from 'react-native-reanimated';
import { theme } from '../theme/theme';
import { Icon } from './Icons';
import type { TruckData } from '../types';
import { calculateDistance, formatDistance } from '../utils/locationUtils';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface TruckCardProps {
  truck: TruckData;
  userLocation?: { latitude: number; longitude: number };
  onPress: () => void;
  onNavigate: () => void;
  index?: number; // For staggered animation
}

export const TruckCard: React.FC<TruckCardProps> = ({
  truck,
  userLocation,
  onPress,
  onNavigate,
  index = 0,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    const delay = index * theme.animation.stagger.normal;
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, theme.animation.spring.gentle));
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ] as any,
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, theme.animation.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.animation.spring.bouncy);
  };

  const distance = userLocation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        truck.location.latitude,
        truck.location.longitude
      )
    : 0;

  return (
    <AnimatedTouchable
      style={[styles.card, animatedCardStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      {/* Card Header with Gradient Accent */}
      <View style={styles.cardHeader}>
        {/* Truck Icon/Avatar */}
        <LinearGradient
          colors={truck.isOnline ? theme.gradients.primary : [theme.colors.gray[300], theme.colors.gray[400]]}
          style={styles.truckAvatar}
        >
          <Icon 
            name="taco" 
            size={28} 
            color={theme.colors.white} 
          />
        </LinearGradient>

        {/* Truck Info */}
        <View style={styles.truckInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.truckName} numberOfLines={1}>
              {truck.name}
            </Text>
            {/* Status Badge */}
            <View style={[
              styles.statusBadge,
              truck.isOnline ? styles.statusOnline : styles.statusOffline
            ]}>
              <View style={[
                styles.statusDot,
                { backgroundColor: truck.isOnline ? theme.colors.success : theme.colors.gray[400] }
              ]} />
              <Text style={[
                styles.statusText,
                { color: truck.isOnline ? theme.colors.success : theme.colors.gray[500] }
              ]}>
                {truck.isOnline ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Specialty & Distance */}
          <View style={styles.metaRow}>
            <View style={styles.specialtyBadge}>
              <Icon name="food" size={12} color={theme.colors.gray[500]} />
              <Text style={styles.specialtyText}>{truck.specialty}</Text>
            </View>
            <View style={styles.distanceContainer}>
              <Icon name="location" size={14} color={theme.colors.primary.main} />
              <Text style={styles.distanceText}>{formatDistance(distance)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {truck.description}
      </Text>

      {/* Footer with Rating and Navigate */}
      <View style={styles.footer}>
        {/* Rating */}
        <View style={styles.ratingContainer}>
          <LinearGradient
            colors={theme.gradients.gold}
            style={styles.ratingBadge}
          >
            <Icon name="star" size={14} color={theme.colors.white} />
            <Text style={styles.ratingValue}>{truck.rating.toFixed(1)}</Text>
          </LinearGradient>
          <Text style={styles.reviewCount}>({truck.reviewCount} reviews)</Text>
        </View>

        {/* Navigate Button */}
        {truck.isOnline && (
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.navigateGradient}
            >
              <Icon name="navigate" size={16} color={theme.colors.white} />
              <Text style={styles.navigateText}>Navigate</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Tags */}
      {truck.tags && truck.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {truck.tags.slice(0, 3).map((tag, idx) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </AnimatedTouchable>
  );
};

// Compact version for horizontal scroll - ELITE DESIGN
export const TruckCardCompact: React.FC<TruckCardProps> = ({
  truck,
  userLocation,
  onPress,
  onNavigate,
  index = 0,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, theme.animation.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.animation.spring.bouncy);
  };

  const distance = userLocation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        truck.location.latitude,
        truck.location.longitude
      )
    : 0;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 80).springify()}
    >
      <AnimatedTouchable
        style={[styles.compactCard, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Left: Gradient Avatar */}
        <LinearGradient
          colors={truck.isOnline ? ['#FF6B35', '#F7931E'] : ['#9CA3AF', '#6B7280']}
          style={styles.compactAvatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="taco" size={24} color="#FFFFFF" />
          {truck.isOnline && (
            <View style={styles.onlineIndicator} />
          )}
        </LinearGradient>

        {/* Center: Info */}
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{truck.name}</Text>
          
          <View style={styles.compactMeta}>
            <View style={styles.compactRating}>
              <Icon name="star" size={12} color="#F59E0B" />
              <Text style={styles.compactRatingText}>{truck.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.compactDot}>•</Text>
            <Text style={styles.compactDistance}>{formatDistance(distance)}</Text>
          </View>

          <Text style={styles.compactSpecialty} numberOfLines={1}>{truck.specialty}</Text>
        </View>

        {/* Right: Navigate Button */}
        {truck.isOnline && (
          <TouchableOpacity
            style={styles.compactNavigate}
            onPress={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.navigateGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="navigate" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </AnimatedTouchable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.base,
    marginHorizontal: theme.spacing.base,
    marginVertical: theme.spacing.sm,
    ...theme.shadows.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  truckAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  truckInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  truckName: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusOnline: {
    backgroundColor: theme.colors.successLight,
  },
  statusOffline: {
    backgroundColor: theme.colors.gray[100],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  specialtyText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[600],
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  distanceText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.primary.main,
  },
  description: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[600],
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  ratingValue: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.white,
  },
  reviewCount: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.gray[500],
  },
  navigateButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  navigateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  navigateText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.white,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  tagText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.gray[600],
  },

  // Compact Card Styles - PREMIUM LIGHT THEME
  compactCard: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  compactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  compactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 3,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  compactRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  compactDot: {
    marginHorizontal: 6,
    color: '#D1D5DB',
    fontSize: 10,
  },
  compactDistance: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  compactSpecialty: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  compactNavigate: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  navigateGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TruckCard;
