/**
 * Animation Utilities
 * Centralized animation helpers using react-native-reanimated
 */

import { 
  withSpring, 
  withTiming, 
  withDelay, 
  withSequence,
  withRepeat,
  Easing,
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../theme/theme';

// ============= Spring Configurations =============

export const springConfigs = {
  snappy: theme.animation.spring.snappy,
  bouncy: theme.animation.spring.bouncy,
  gentle: theme.animation.spring.gentle,
  stiff: theme.animation.spring.stiff,
};

// ============= Animation Presets =============

/**
 * Fade in animation
 */
export const fadeIn = (
  opacity: SharedValue<number>,
  duration = theme.animation.duration.normal,
  delay = 0
) => {
  'worklet';
  opacity.value = withDelay(delay, withTiming(1, { duration }));
};

/**
 * Fade out animation
 */
export const fadeOut = (
  opacity: SharedValue<number>,
  duration = theme.animation.duration.normal,
  delay = 0
) => {
  'worklet';
  opacity.value = withDelay(delay, withTiming(0, { duration }));
};

/**
 * Scale press animation (scale down, then back up)
 */
export const scalePress = (
  scale: SharedValue<number>,
  config = springConfigs.snappy
) => {
  return {
    onPressIn: () => {
      'worklet';
      scale.value = withSpring(0.92, config);
    },
    onPressOut: () => {
      'worklet';
      scale.value = withSpring(1, springConfigs.bouncy);
    },
  };
};

/**
 * Slide in from direction
 */
export const slideIn = (
  translateValue: SharedValue<number>,
  direction: 'left' | 'right' | 'up' | 'down' = 'up',
  distance = 50,
  delay = 0
) => {
  'worklet';
  const initialValue = direction === 'left' || direction === 'up' ? -distance : distance;
  translateValue.value = initialValue;
  translateValue.value = withDelay(
    delay,
    withSpring(0, springConfigs.gentle)
  );
};

/**
 * Bounce animation
 */
export const bounce = (
  scale: SharedValue<number>,
  intensity = 1.2,
  config = springConfigs.bouncy
) => {
  'worklet';
  scale.value = withSequence(
    withSpring(intensity, config),
    withSpring(1, config)
  );
};

/**
 * Shake animation for errors
 */
export const shake = (
  translateX: SharedValue<number>,
  intensity = 10,
  duration = 80
) => {
  'worklet';
  translateX.value = withSequence(
    withTiming(-intensity, { duration }),
    withTiming(intensity, { duration }),
    withTiming(-intensity, { duration }),
    withTiming(intensity, { duration }),
    withTiming(0, { duration })
  );
};

/**
 * Pulse animation for attention
 */
export const pulse = (
  scale: SharedValue<number>,
  minScale = 0.95,
  maxScale = 1.05,
  duration = 800
) => {
  'worklet';
  scale.value = withRepeat(
    withSequence(
      withTiming(maxScale, { duration: duration / 2 }),
      withTiming(minScale, { duration: duration / 2 })
    ),
    -1,
    true
  );
};

/**
 * Shimmer/loading animation
 */
export const shimmer = (
  translateX: SharedValue<number>,
  width: number,
  duration = 1500
) => {
  'worklet';
  translateX.value = withRepeat(
    withTiming(width, { duration, easing: Easing.linear }),
    -1,
    false
  );
};

/**
 * Staggered animation helper
 * Returns delay for item at given index
 */
export const getStaggerDelay = (
  index: number,
  baseDelay = theme.animation.stagger.normal
): number => {
  return index * baseDelay;
};

// ============= Animated Style Hooks =============

/**
 * Hook for fade-in-up entrance animation
 */
export const useFadeInUp = (delay = 0, translateDistance = 20) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(translateDistance);

  const animate = () => {
    opacity.value = withDelay(delay, withTiming(1, { duration: theme.animation.duration.normal }));
    translateY.value = withDelay(delay, withSpring(0, springConfigs.gentle));
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { animate, animatedStyle, opacity, translateY };
};

/**
 * Hook for press scale animation
 */
export const usePressAnimation = (config = springConfigs.snappy) => {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(0.92, config);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, springConfigs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { onPressIn, onPressOut, animatedStyle, scale };
};

/**
 * Hook for scroll-based header opacity
 */
export const useScrollHeaderAnimation = (threshold = 100) => {
  const scrollY = useSharedValue(0);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, threshold],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, threshold],
      [1, 0],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, threshold],
          [0, -30],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [0, threshold],
          [1, 0.95],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return { scrollY, headerAnimatedStyle, heroAnimatedStyle };
};

/**
 * Entering/exiting animation configs for FlatList items
 */
export const listItemAnimationConfig = {
  entering: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
  },
  exiting: {
    opacity: 0,
    transform: [{ translateY: 10 }, { scale: 0.95 }],
  },
};

export default {
  springConfigs,
  fadeIn,
  fadeOut,
  scalePress,
  slideIn,
  bounce,
  shake,
  pulse,
  shimmer,
  getStaggerDelay,
  useFadeInUp,
  usePressAnimation,
  useScrollHeaderAnimation,
};
