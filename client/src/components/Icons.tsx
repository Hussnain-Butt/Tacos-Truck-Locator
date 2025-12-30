/**
 * Centralized Icon Component System
 * Professional icons replacing emojis throughout the app
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export type IconName = 
  | 'taco'
  | 'truck'
  | 'location'
  | 'location-outline'
  | 'star'
  | 'star-outline'
  | 'star-half'
  | 'search'
  | 'heart'
  | 'heart-outline'
  | 'phone'
  | 'navigate'
  | 'share'
  | 'settings'
  | 'filter'
  | 'close'
  | 'back'
  | 'forward'
  | 'menu'
  | 'user'
  | 'user-outline'
  | 'clock'
  | 'calendar'
  | 'camera'
  | 'image'
  | 'edit'
  | 'check'
  | 'plus'
  | 'minus'
  | 'fire'
  | 'leaf'
  | 'gift'
  | 'money'
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'notification'
  | 'email'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'logout'
  | 'home'
  | 'map'
  | 'list'
  | 'grid'
  | 'refresh'
  | 'food'
  | 'drink'
  | 'flame'
  | 'live'
  | 'offline';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const iconMap: Record<IconName, { lib: 'ionicons' | 'feather' | 'material'; name: string }> = {
  taco: { lib: 'material', name: 'taco' },
  truck: { lib: 'ionicons', name: 'car-sport' },
  location: { lib: 'ionicons', name: 'location-sharp' },
  'location-outline': { lib: 'ionicons', name: 'location-outline' },
  star: { lib: 'ionicons', name: 'star' },
  'star-outline': { lib: 'ionicons', name: 'star-outline' },
  'star-half': { lib: 'ionicons', name: 'star-half' },
  search: { lib: 'ionicons', name: 'search' },
  heart: { lib: 'ionicons', name: 'heart' },
  'heart-outline': { lib: 'ionicons', name: 'heart-outline' },
  phone: { lib: 'ionicons', name: 'call' },
  navigate: { lib: 'ionicons', name: 'navigate' },
  share: { lib: 'ionicons', name: 'share-outline' },
  settings: { lib: 'ionicons', name: 'settings-outline' },
  filter: { lib: 'ionicons', name: 'options-outline' },
  close: { lib: 'ionicons', name: 'close' },
  back: { lib: 'ionicons', name: 'chevron-back' },
  forward: { lib: 'ionicons', name: 'chevron-forward' },
  menu: { lib: 'ionicons', name: 'menu' },
  user: { lib: 'ionicons', name: 'person' },
  'user-outline': { lib: 'ionicons', name: 'person-outline' },
  clock: { lib: 'ionicons', name: 'time-outline' },
  calendar: { lib: 'ionicons', name: 'calendar-outline' },
  camera: { lib: 'ionicons', name: 'camera-outline' },
  image: { lib: 'ionicons', name: 'image-outline' },
  edit: { lib: 'feather', name: 'edit-2' },
  check: { lib: 'ionicons', name: 'checkmark' },
  plus: { lib: 'ionicons', name: 'add' },
  minus: { lib: 'ionicons', name: 'remove' },
  fire: { lib: 'ionicons', name: 'flame' },
  leaf: { lib: 'ionicons', name: 'leaf' },
  gift: { lib: 'ionicons', name: 'gift-outline' },
  money: { lib: 'ionicons', name: 'cash-outline' },
  info: { lib: 'ionicons', name: 'information-circle-outline' },
  warning: { lib: 'ionicons', name: 'warning-outline' },
  error: { lib: 'ionicons', name: 'close-circle-outline' },
  success: { lib: 'ionicons', name: 'checkmark-circle-outline' },
  notification: { lib: 'ionicons', name: 'notifications-outline' },
  email: { lib: 'ionicons', name: 'mail-outline' },
  lock: { lib: 'ionicons', name: 'lock-closed-outline' },
  eye: { lib: 'ionicons', name: 'eye-outline' },
  'eye-off': { lib: 'ionicons', name: 'eye-off-outline' },
  logout: { lib: 'ionicons', name: 'log-out-outline' },
  home: { lib: 'ionicons', name: 'home' },
  map: { lib: 'ionicons', name: 'map' },
  list: { lib: 'ionicons', name: 'list' },
  grid: { lib: 'ionicons', name: 'grid' },
  refresh: { lib: 'ionicons', name: 'refresh' },
  food: { lib: 'ionicons', name: 'restaurant' },
  drink: { lib: 'ionicons', name: 'cafe' },
  flame: { lib: 'ionicons', name: 'flame' },
  live: { lib: 'ionicons', name: 'radio' },
  offline: { lib: 'ionicons', name: 'radio-button-off' },
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = theme.layout.iconSize.md,
  color = theme.colors.gray[700],
  style,
}) => {
  const iconConfig = iconMap[name];
  
  if (!iconConfig) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const IconComponent = () => {
    switch (iconConfig.lib) {
      case 'feather':
        return <Feather name={iconConfig.name as any} size={size} color={color} />;
      case 'material':
        return <MaterialCommunityIcons name={iconConfig.name as any} size={size} color={color} />;
      case 'ionicons':
      default:
        return <Ionicons name={iconConfig.name as any} size={size} color={color} />;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <IconComponent />
    </View>
  );
};

// Animated Icon wrapper for press effects
interface AnimatedIconButtonProps extends IconProps {
  onPress?: () => void;
  hitSlop?: number;
  activeColor?: string;
  backgroundColor?: string;
  containerStyle?: ViewStyle;
}

import { TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const IconButton: React.FC<AnimatedIconButtonProps> = ({
  name,
  size = theme.layout.iconSize.md,
  color = theme.colors.gray[700],
  onPress,
  hitSlop = 10,
  activeColor,
  backgroundColor,
  containerStyle,
  style,
}) => {
  const scale = useSharedValue(1);
  const isActive = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85, theme.animation.spring.snappy);
    if (activeColor) {
      isActive.value = true;
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.animation.spring.bouncy);
    isActive.value = false;
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={{ top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }}
      style={[
        styles.iconButton,
        backgroundColor && { backgroundColor },
        containerStyle,
        animatedStyle,
      ]}
      activeOpacity={1}
    >
      <Icon name={name} size={size} color={color} style={style} />
    </AnimatedTouchable>
  );
};

// Floating Action Button style icon
export const FloatingIconButton: React.FC<AnimatedIconButtonProps & { 
  gradient?: boolean;
  shadow?: boolean;
}> = ({
  name,
  size = theme.layout.iconSize.lg,
  color = theme.colors.white,
  onPress,
  backgroundColor = theme.colors.primary.main,
  gradient = false,
  shadow = true,
  containerStyle,
  ...props
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, theme.animation.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.animation.spring.bouncy);
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.floatingButton,
        { backgroundColor },
        shadow && theme.shadows.lg,
        containerStyle,
        animatedStyle,
      ]}
      activeOpacity={1}
    >
      <Icon name={name} size={size} color={color} />
    </AnimatedTouchable>
  );
};

// Status indicator with icon
interface StatusIconProps {
  status: 'online' | 'offline' | 'busy';
  size?: number;
  showPulse?: boolean;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ 
  status, 
  size = 12,
  showPulse = true,
}) => {
  const statusColors = {
    online: theme.colors.success,
    offline: theme.colors.gray[400],
    busy: theme.colors.warning,
  };

  return (
    <View style={[styles.statusContainer, { width: size, height: size }]}>
      <View 
        style={[
          styles.statusDot, 
          { 
            backgroundColor: statusColors[status],
            width: size,
            height: size,
            borderRadius: size / 2,
          }
        ]} 
      />
      {showPulse && status === 'online' && (
        <Animated.View 
          style={[
            styles.statusPulse,
            {
              backgroundColor: statusColors[status],
              width: size,
              height: size,
              borderRadius: size / 2,
            }
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
  },
  statusPulse: {
    position: 'absolute',
    opacity: 0.4,
  },
});

export default Icon;
