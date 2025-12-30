/**
 * Modern Loading State Component
 * Premium loading indicator with pulse animation
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import { Icon } from './Icons';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'overlay' | 'inline';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'medium',
  variant = 'default',
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Pulse animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );

    // Opacity pulse
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.6, { duration: 600 })
      ),
      -1,
      true
    );

    // Rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1,
      false
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const sizeMap = {
    small: { container: 60, icon: 24, text: theme.typography.fontSizes.sm },
    medium: { container: 80, icon: 36, text: theme.typography.fontSizes.base },
    large: { container: 100, icon: 48, text: theme.typography.fontSizes.lg },
  };

  const content = (
    <View style={styles.content}>
      <Animated.View style={animatedIconStyle}>
        <LinearGradient
          colors={theme.gradients.primary}
          style={[
            styles.iconContainer,
            {
              width: sizeMap[size].container,
              height: sizeMap[size].container,
              borderRadius: sizeMap[size].container / 2,
            },
          ]}
        >
          <Icon 
            name="taco" 
            size={sizeMap[size].icon} 
            color={theme.colors.white} 
          />
        </LinearGradient>
      </Animated.View>
      {message && (
        <Text style={[styles.message, { fontSize: sizeMap[size].text }]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (variant === 'overlay') {
    return (
      <View style={styles.overlay}>
        {content}
      </View>
    );
  }

  if (variant === 'inline') {
    return (
      <View style={styles.inline}>
        {content}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {content}
    </View>
  );
};

// Skeleton Loader Component
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = theme.borderRadius.md,
  style,
}) => {
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + shimmerPosition.value * 0.3,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
};

// Card Skeleton for loading truck cards
export const TruckCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.cardSkeletonHeader}>
        <Skeleton width={56} height={56} borderRadius={theme.borderRadius.xl} />
        <View style={styles.cardSkeletonInfo}>
          <Skeleton width="70%" height={20} />
          <Skeleton width="50%" height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="90%" height={16} style={{ marginTop: 12 }} />
      <Skeleton width="60%" height={16} style={{ marginTop: 8 }} />
      <View style={styles.cardSkeletonFooter}>
        <Skeleton width={80} height={28} borderRadius={theme.borderRadius.md} />
        <Skeleton width={100} height={36} borderRadius={theme.borderRadius.lg} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  inline: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  message: {
    marginTop: theme.spacing.lg,
    color: theme.colors.gray[600],
    fontWeight: theme.typography.fontWeights.medium,
  },
  
  // Skeleton styles
  skeleton: {
    backgroundColor: theme.colors.gray[200],
  },
  cardSkeleton: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.base,
    marginHorizontal: theme.spacing.base,
    marginVertical: theme.spacing.sm,
    ...theme.shadows.md,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSkeletonInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  cardSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.base,
  },
});

export default LoadingState;
