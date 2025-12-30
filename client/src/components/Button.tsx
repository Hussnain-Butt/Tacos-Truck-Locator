/**
 * Modern Animated Button Component
 * Premium button with gradient support, press animations, and loading states
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '../theme/theme';
import { Icon, IconName } from './Icons';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  gradient?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  gradient = true,
  leftIcon,
  rightIcon,
  style,
  textStyle,
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

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...styles[`button_${size}`],
      ...(fullWidth && styles.fullWidth),
    };

    if (disabled) {
      return { ...baseStyle, ...styles.disabled };
    }

    switch (variant) {
      case 'secondary':
        return { ...baseStyle, ...styles.secondary };
      case 'outline':
        return { ...baseStyle, ...styles.outline };
      case 'ghost':
        return { ...baseStyle, ...styles.ghost };
      default:
        return { ...baseStyle, ...styles.primary };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return theme.colors.gray[400];
    switch (variant) {
      case 'outline':
      case 'ghost':
        return theme.colors.primary.main;
      default:
        return theme.colors.white;
    }
  };

  const getTextStyle = (): TextStyle => {
    return {
      ...styles.text,
      ...styles[`text_${size}`],
      color: getTextColor(),
      ...textStyle,
    };
  };

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (disabled) return [theme.colors.gray[300], theme.colors.gray[400]];
    switch (variant) {
      case 'secondary':
        return theme.colors.secondary.gradient;
      default:
        return theme.colors.primary.gradient;
    }
  };

  const getIconColor = (): string => {
    if (disabled) return theme.colors.gray[400];
    switch (variant) {
      case 'outline':
      case 'ghost':
        return theme.colors.primary.main;
      default:
        return theme.colors.white;
    }
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 22 : 18;

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator 
          color={getIconColor()} 
          size={size === 'small' ? 'small' : 'small'} 
        />
      ) : (
        <>
          {leftIcon && (
            <View style={styles.leftIcon}>
              <Icon name={leftIcon} size={iconSize} color={getIconColor()} />
            </View>
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {rightIcon && (
            <View style={styles.rightIcon}>
              <Icon name={rightIcon} size={iconSize} color={getIconColor()} />
            </View>
          )}
        </>
      )}
    </View>
  );

  // For gradient buttons (primary/secondary without outline)
  if (gradient && variant !== 'outline' && variant !== 'ghost') {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          animatedStyle,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            getButtonStyle(),
            disabled && styles.disabled,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      style={[getButtonStyle(), animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
};

// Compact Icon Button
interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export const CompactIconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'medium',
  variant = 'ghost',
  disabled = false,
  style,
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

  const sizeMap = {
    small: { container: 36, icon: 18 },
    medium: { container: 44, icon: 22 },
    large: { container: 52, icon: 26 },
  };

  const getColor = () => {
    if (disabled) return theme.colors.gray[400];
    switch (variant) {
      case 'primary':
        return theme.colors.white;
      case 'secondary':
        return theme.colors.white;
      default:
        return theme.colors.gray[700];
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.gray[200];
    switch (variant) {
      case 'primary':
        return theme.colors.primary.main;
      case 'secondary':
        return theme.colors.secondary.main;
      case 'outline':
        return 'transparent';
      default:
        return theme.colors.gray[100];
    }
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      style={[
        styles.iconButton,
        {
          width: sizeMap[size].container,
          height: sizeMap[size].container,
          borderRadius: sizeMap[size].container / 2,
          backgroundColor: getBackgroundColor(),
        },
        variant === 'outline' && styles.iconButtonOutline,
        animatedStyle,
        style,
      ]}
    >
      <Icon name={icon} size={sizeMap[size].icon} color={getColor()} />
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...theme.shadows.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  rightIcon: {
    marginLeft: theme.spacing.sm,
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.primary.main,
  },
  secondary: {
    backgroundColor: theme.colors.secondary.main,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    ...theme.shadows.none,
  },
  ghost: {
    backgroundColor: 'transparent',
    ...theme.shadows.none,
  },
  
  // Sizes
  button_small: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    minHeight: 40,
  },
  button_medium: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: theme.layout.buttonHeight,
  },
  button_large: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.base,
    minHeight: 60,
  },
  
  // States
  disabled: {
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },
  
  // Text
  text: {
    fontWeight: theme.typography.fontWeights.semibold,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  text_small: {
    fontSize: theme.typography.fontSizes.sm,
  },
  text_medium: {
    fontSize: theme.typography.fontSizes.base,
  },
  text_large: {
    fontSize: theme.typography.fontSizes.lg,
  },

  // Icon Button
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonOutline: {
    borderWidth: 1.5,
    borderColor: theme.colors.gray[300],
  },
});

export default Button;
