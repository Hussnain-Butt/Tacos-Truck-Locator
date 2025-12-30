/**
 * Modern Error State Component
 * Professional error display with retry animation
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import { Icon } from './Icons';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  retryText?: string;
  icon?: 'error' | 'warning' | 'info' | 'location';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong. Please try again.',
  title = 'Oops!',
  onRetry,
  retryText = 'Try Again',
  icon = 'error',
}) => {
  const iconConfig = {
    error: {
      colors: theme.gradients.sunset,
      iconName: 'error' as const,
    },
    warning: {
      colors: theme.gradients.gold,
      iconName: 'warning' as const,
    },
    info: {
      colors: theme.gradients.ocean,
      iconName: 'info' as const,
    },
    location: {
      colors: theme.gradients.primary,
      iconName: 'location' as const,
    },
  };

  const config = iconConfig[icon];

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(600)}
        style={styles.content}
      >
        {/* Icon */}
        <Animated.View entering={SlideInDown.delay(200).springify()}>
          <LinearGradient
            colors={config.colors}
            style={styles.iconContainer}
          >
            <Icon name={config.iconName} size={40} color={theme.colors.white} />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.Text 
          entering={FadeIn.delay(300)}
          style={styles.title}
        >
          {title}
        </Animated.Text>

        {/* Message */}
        <Animated.Text 
          entering={FadeIn.delay(400)}
          style={styles.message}
        >
          {message}
        </Animated.Text>

        {/* Retry Button */}
        {onRetry && (
          <Animated.View 
            entering={FadeIn.delay(500)}
            style={styles.buttonContainer}
          >
            <Button
              title={retryText}
              onPress={onRetry}
              variant="primary"
              size="medium"
              leftIcon="refresh"
            />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

// Empty State Component (for when data is empty)
interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: 'search' | 'heart' | 'taco' | 'list';
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nothing here yet',
  message = 'We couldn\'t find anything to show you.',
  icon = 'search',
  actionText,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(600)}
        style={styles.content}
      >
        {/* Icon */}
        <View style={styles.emptyIconContainer}>
          <Icon name={icon} size={48} color={theme.colors.gray[400]} />
        </View>

        {/* Title */}
        <Text style={styles.emptyTitle}>{title}</Text>

        {/* Message */}
        <Text style={styles.emptyMessage}>{message}</Text>

        {/* Action Button */}
        {actionText && onAction && (
          <View style={styles.buttonContainer}>
            <Button
              title={actionText}
              onPress={onAction}
              variant="outline"
              size="medium"
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  buttonContainer: {
    marginTop: theme.spacing.md,
  },
  
  // Empty State styles
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
});

export default ErrorState;
