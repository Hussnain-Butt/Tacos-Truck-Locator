/**
 * Modern Toast Component
 * Premium animated toast notifications with beautiful design
 */

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import { Icon } from './Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const toastConfig: Record<ToastType, {
  icon: 'check' | 'close' | 'warning' | 'info';
  gradient: readonly [string, string, ...string[]];
  iconColor: string;
}> = {
  success: {
    icon: 'check',
    gradient: ['#10B981', '#059669'] as const,
    iconColor: '#FFFFFF',
  },
  error: {
    icon: 'close',
    gradient: ['#EF4444', '#DC2626'] as const,
    iconColor: '#FFFFFF',
  },
  warning: {
    icon: 'warning',
    gradient: ['#F59E0B', '#D97706'] as const,
    iconColor: '#FFFFFF',
  },
  info: {
    icon: 'info',
    gradient: ['#3B82F6', '#2563EB'] as const,
    iconColor: '#FFFFFF',
  },
};

const Toast: React.FC<{
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  onHide: () => void;
}> = ({ visible, type, title, message, onHide }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12 });
    } else {
      translateY.value = withTiming(-100, { duration: 300, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  const config = toastConfig[type];

  return (
    <Animated.View style={[styles.toastContainer, animatedStyle]}>
      <View style={styles.toastWrapper}>
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.iconContainer}
        >
          <Icon name={config.icon} size={20} color={config.iconColor} />
        </LinearGradient>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toastQueue, setToastQueue] = useState<(ToastConfig & { id: number })[]>([]);
  const [currentToast, setCurrentToast] = useState<(ToastConfig & { id: number }) | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((config: ToastConfig) => {
    const id = Date.now();
    setToastQueue(prev => [...prev, { ...config, id }]);
  }, []);

  useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      const [next, ...rest] = toastQueue;
      setCurrentToast(next);
      setToastQueue(rest);
      setVisible(true);

      const duration = next.duration || 3000;
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setCurrentToast(null);
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [currentToast, toastQueue]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {currentToast && (
        <Toast
          visible={visible}
          type={currentToast.type}
          title={currentToast.title}
          message={currentToast.message}
          onHide={() => setCurrentToast(null)}
        />
      )}
    </ToastContext.Provider>
  );
};

// Standalone toast function for use without context
let globalShowToast: ((config: ToastConfig) => void) | null = null;

export const setGlobalToast = (fn: (config: ToastConfig) => void) => {
  globalShowToast = fn;
};

export const showToast = (config: ToastConfig) => {
  if (globalShowToast) {
    globalShowToast(config);
  }
};

// Simple inline toast for quick use
export const InlineToast: React.FC<{
  type: ToastType;
  title: string;
  message?: string;
  visible: boolean;
}> = ({ type, title, message, visible }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(-100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const config = toastConfig[type];

  return (
    <Animated.View style={[styles.toastContainer, animatedStyle]} pointerEvents="none">
      <View style={styles.toastWrapper}>
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.iconContainer}
        >
          <Icon name={config.icon} size={20} color={config.iconColor} />
        </LinearGradient>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 9999,
  },
  toastWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
    marginBottom: 2,
  },
  message: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[600],
  },
});

export default Toast;
