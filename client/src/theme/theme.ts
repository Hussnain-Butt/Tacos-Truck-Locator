/**
 * Modern Design System Theme Configuration
 * Premium UI/UX with gradients, glassmorphism, and smooth animations
 */

export const theme = {
  // Premium Color Palette
  colors: {
    // Primary - Sunset Orange Gradient
    primary: {
      main: '#FF6B35',
      light: '#FF8F65',
      dark: '#E85A2A',
      lighter: '#FFB598',
      gradient: ['#FF6B35', '#F7931E'] as const,
    },
    
    // Secondary - Electric Blue
    secondary: {
      main: '#4F46E5',
      light: '#6366F1',
      dark: '#4338CA',
      gradient: ['#4F46E5', '#7C3AED'] as const,
    },

    // Accent - Coral Pink
    accent: {
      main: '#FC466B',
      light: '#FF6B8A',
      dark: '#E13A5C',
      gradient: ['#FC466B', '#3F5EFB'] as const,
    },
    
    // Status Colors with Gradients
    success: '#10B981',
    successLight: '#D1FAE5',
    successGradient: ['#10B981', '#059669'] as const,
    
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    warningGradient: ['#F59E0B', '#D97706'] as const,
    
    error: '#EF4444',
    errorLight: '#FEE2E2',
    errorGradient: ['#EF4444', '#DC2626'] as const,
    
    info: '#06B6D4',
    infoLight: '#CFFAFE',
    infoGradient: ['#06B6D4', '#0891B2'] as const,
    
    // Neutral Grays - Modern Slate
    gray: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },
    
    // Special
    white: '#FFFFFF',
    black: '#000000',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    
    // Truck Status
    online: '#10B981',
    onlineGlow: 'rgba(16, 185, 129, 0.4)',
    offline: '#94A3B8',

    // Glass Overlay Colors
    glass: {
      light: 'rgba(255, 255, 255, 0.85)',
      medium: 'rgba(255, 255, 255, 0.6)',
      dark: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.3)',
    },
  },

  // Premium Gradients
  gradients: {
    primary: ['#FF6B35', '#F7931E'] as const,
    sunset: ['#FC466B', '#3F5EFB'] as const,
    ocean: ['#667EEA', '#764BA2'] as const,
    forest: ['#10B981', '#059669'] as const,
    gold: ['#F7931E', '#FFD700'] as const,
    dark: ['#1A1A2E', '#16213E'] as const,
    mesh: ['#FF6B35', '#FC466B', '#4F46E5'] as const,
    // Elite Premium Gradients
    aurora: ['#FF6B6B', '#FF8E53', '#FFE66D', '#4ECDC4'] as const,
    auroraAlt: ['#667EEA', '#764BA2', '#F7931E'] as const,
    neon: ['#00F5FF', '#FF00FF', '#FF6B35'] as const,
    fire: ['#FF416C', '#FF4B2B'] as const,
    cosmic: ['#0F0C29', '#302B63', '#24243E'] as const,
    emerald: ['#11998E', '#38EF7D'] as const,
    royal: ['#141E30', '#243B55'] as const,
    candy: ['#D53369', '#DAAE51'] as const,
    glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as const,
  },
  
  // Typography
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    
    fontSizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    },
    
    fontWeights: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
    
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },

    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
      wider: 1,
    },
  },
  
  // Spacing (4px base unit)
  spacing: {
    '2xs': 2,
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
  },
  
  // Border Radius
  borderRadius: {
    none: 0,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  
  // Modern Shadows
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 10,
    },
    '2xl': {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.2,
      shadowRadius: 40,
      elevation: 15,
    },
    // Colored shadows for premium feel
    colored: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    }),
    glow: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 10,
    }),
  },
  
  // Animation Configuration (react-native-reanimated)
  animation: {
    // Duration in ms
    duration: {
      instant: 100,
      fast: 200,
      normal: 300,
      slow: 450,
      slower: 600,
    },
    
    // Spring configurations
    spring: {
      snappy: {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      },
      bouncy: {
        damping: 12,
        stiffness: 180,
        mass: 1,
      },
      gentle: {
        damping: 25,
        stiffness: 120,
        mass: 1,
      },
      stiff: {
        damping: 30,
        stiffness: 400,
        mass: 0.5,
      },
    },

    // Easing presets  
    easing: {
      easeOut: 'easeOut' as const,
      easeIn: 'easeIn' as const,
      easeInOut: 'easeInOut' as const,
      elastic: 'elastic' as const,
    },

    // Stagger delays
    stagger: {
      fast: 50,
      normal: 80,
      slow: 120,
    },
    
    // Elite micro-interactions
    elite: {
      float: {
        duration: 3000,
        amplitude: 12,
      },
      glow: {
        duration: 2000,
        intensity: 0.8,
      },
      shimmer: {
        duration: 1500,
        delay: 200,
      },
      pulse: {
        scale: 1.08,
        duration: 1200,
      },
    },
  },
  
  // Layout
  layout: {
    minTouchTarget: 44,
    screenPadding: 20,
    cardPadding: 20,
    inputHeight: 52,
    buttonHeight: 54,
    iconSize: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
    },
  },

  // Glass/Blur effects
  glass: {
    blur: 20,
    saturation: 180,
    background: 'rgba(255, 255, 255, 0.85)',
    backgroundDark: 'rgba(0, 0, 0, 0.6)',
    border: 'rgba(255, 255, 255, 0.3)',
  },
};

export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeGradients = typeof theme.gradients;
