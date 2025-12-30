/**
 * Elite Home Screen
 * Premium landing page with animated aurora background and floating elements
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon } from '../components/Icons';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Floating Taco Component with 3D parallax effect
const FloatingTaco = ({ 
  emoji, 
  size, 
  initialX, 
  initialY, 
  delay,
  floatAmplitude = 15,
  rotateRange = 10,
}: { 
  emoji: string; 
  size: number; 
  initialX: number; 
  initialY: number; 
  delay: number;
  floatAmplitude?: number;
  rotateRange?: number;
}) => {
  const floatY = useSharedValue(0);
  const floatX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    scale.value = withDelay(delay, withSpring(1, theme.animation.spring.bouncy));
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    
    // Floating animation - Y axis
    floatY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(floatAmplitude, { duration: 2500 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-floatAmplitude, { duration: 2500 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    
    // Floating animation - X axis (slower)
    floatX.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(floatAmplitude * 0.5, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-floatAmplitude * 0.5, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    
    // Subtle rotation
    rotate.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(rotateRange, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-rotateRange, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { translateX: floatX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ] as any,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: initialX,
          top: initialY,
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: size, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 }}>
        {emoji}
      </Text>
    </Animated.View>
  );
};

// Animated Gradient Orb for aurora effect
const GradientOrb = ({ 
  colors, 
  size, 
  x, 
  y, 
  delay,
  blur = 60,
}: { 
  colors: string[]; 
  size: number; 
  x: number; 
  y: number; 
  delay: number;
  blur?: number;
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.4, { duration: 1000 }));
    
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration: 5000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ] as any,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={colors as any}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: size / 2,
        }}
      />
    </Animated.View>
  );
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  // Animations
  const logoScale = useSharedValue(0);
  const logoPulse = useSharedValue(1);
  const logoGlow = useSharedValue(0);
  const floatingY = useSharedValue(0);

  useEffect(() => {
    // Logo entrance with bounce
    logoScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    
    // Glow animation
    logoGlow.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      )
    );
    
    // Floating animation
    floatingY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Pulse animation
    logoPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value * logoPulse.value },
      { translateY: floatingY.value },
    ] as any,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(logoGlow.value, [0, 1], [0.2, 0.6]),
    transform: [{ scale: interpolate(logoGlow.value, [0, 1], [1, 1.3]) }],
  }));

  return (
    <View style={styles.container}>
      {/* Aurora Background */}
      <LinearGradient
        colors={['#0F0F23', '#1A1A3E', '#0F0F23']}
        style={styles.backgroundGradient}
      />
      
      {/* Animated Gradient Orbs for Aurora Effect */}
      <GradientOrb 
        colors={['#FF6B35', '#FF8E53']} 
        size={300} 
        x={SCREEN_WIDTH * 0.8} 
        y={SCREEN_HEIGHT * 0.15} 
        delay={200}
      />
      <GradientOrb 
        colors={['#4ECDC4', '#44A08D']} 
        size={250} 
        x={SCREEN_WIDTH * 0.2} 
        y={SCREEN_HEIGHT * 0.3} 
        delay={400}
      />
      <GradientOrb 
        colors={['#FC466B', '#3F5EFB']} 
        size={350} 
        x={SCREEN_WIDTH * 0.5} 
        y={SCREEN_HEIGHT * 0.7} 
        delay={600}
      />
      <GradientOrb 
        colors={['#F7931E', '#FFD700']} 
        size={200} 
        x={SCREEN_WIDTH * 0.1} 
        y={SCREEN_HEIGHT * 0.85} 
        delay={800}
      />

      {/* Floating Tacos with 3D Parallax */}
      <FloatingTaco emoji="🌮" size={40} initialX={SCREEN_WIDTH * 0.1} initialY={SCREEN_HEIGHT * 0.12} delay={800} />
      <FloatingTaco emoji="🌯" size={32} initialX={SCREEN_WIDTH * 0.85} initialY={SCREEN_HEIGHT * 0.18} delay={1000} />
      <FloatingTaco emoji="🌶️" size={28} initialX={SCREEN_WIDTH * 0.15} initialY={SCREEN_HEIGHT * 0.35} delay={1200} floatAmplitude={12} />
      <FloatingTaco emoji="🥑" size={36} initialX={SCREEN_WIDTH * 0.82} initialY={SCREEN_HEIGHT * 0.4} delay={1400} />
      <FloatingTaco emoji="🌮" size={24} initialX={SCREEN_WIDTH * 0.7} initialY={SCREEN_HEIGHT * 0.55} delay={1600} floatAmplitude={18} />
      <FloatingTaco emoji="🧀" size={30} initialX={SCREEN_WIDTH * 0.05} initialY={SCREEN_HEIGHT * 0.6} delay={1800} />

      {/* Content */}
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Animated Logo with Glow */}
          <View style={styles.logoWrapper}>
            {/* Glow Effect */}
            <Animated.View style={[styles.logoGlow, glowAnimatedStyle]}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={styles.glowGradient}
              />
            </Animated.View>
            
            {/* Main Logo */}
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <LinearGradient
                colors={theme.gradients.primary}
                style={styles.logoGradient}
              >
                <Icon name="taco" size={60} color={theme.colors.white} />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Title with Gradient Effect */}
          <Animated.View 
            entering={FadeInDown.delay(500).springify()}
            style={styles.titleContainer}
          >
            <Text style={styles.title}>Taco Truck</Text>
            <LinearGradient
              colors={['#FF6B35', '#FFD700']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleAccent}
            >
              <Text style={styles.titleGradient}>Locator</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.Text 
            entering={FadeInDown.delay(600).springify()}
            style={styles.subtitle}
          >
            Find the best street tacos near you
          </Animated.Text>

          {/* Feature Pills with Shimmer */}
          <Animated.View 
            entering={FadeInUp.delay(700).springify()}
            style={styles.featuresContainer}
          >
            <FeaturePill icon="location" text="Real-time" delay={0} />
            <FeaturePill icon="navigate" text="Navigate" delay={100} />
            <FeaturePill icon="star" text="Top Rated" delay={200} />
          </Animated.View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {/* Customer Button - Primary CTA */}
          <Animated.View entering={FadeInUp.delay(800).springify()}>
            <Button
              title="Find Tacos Near Me"
              onPress={() => navigation.navigate('Signup' as any, { userType: 'customer' })}
              variant="primary"
              size="large"
              fullWidth
              leftIcon="taco"
            />
            <Text 
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login' as any, { userType: 'customer' })}
            >
              Already a member? <Text style={styles.loginLinkBold}>Sign In</Text>
            </Text>
          </Animated.View>

          {/* Vendor Button - Secondary CTA */}
          <Animated.View 
            entering={FadeInUp.delay(900).springify()}
            style={styles.vendorSection}
          >
            <Button
              title="I'm a Food Truck Owner"
              onPress={() => navigation.navigate('Signup' as any, { userType: 'vendor' })}
              variant="outline"
              size="large"
              fullWidth
              leftIcon="truck"
            />
            <Text 
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login' as any, { userType: 'vendor' })}
            >
              Vendor login? <Text style={styles.loginLinkBold}>Sign In</Text>
            </Text>
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.Text 
          entering={FadeIn.delay(1100)}
          style={styles.footer}
        >
          Your favorite tacos, just a tap away 🌮
        </Animated.Text>
      </View>
    </View>
  );
};

// Feature Pill Component with glass effect
interface FeaturePillProps {
  icon: 'location' | 'navigate' | 'star';
  text: string;
  delay: number;
}

const FeaturePill: React.FC<FeaturePillProps> = ({ icon, text, delay }) => {
  return (
    <Animated.View 
      entering={FadeInUp.delay(delay).springify()}
      style={styles.featurePill}
    >
      <Icon name={icon} size={16} color="#FF6B35" />
      <Text style={styles.featureText}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: theme.spacing['2xl'],
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: theme.spacing['3xl'],
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: theme.spacing['2xl'],
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    left: -20,
    top: -20,
    borderRadius: 80,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  logoContainer: {
    zIndex: 1,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows['2xl'],
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginRight: 8,
  },
  titleAccent: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  titleGradient: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F0F23',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.base,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  featureText: {
    fontSize: theme.typography.fontSizes.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: theme.typography.fontWeights.medium,
  },
  actionsSection: {
    gap: theme.spacing.sm,
  },
  vendorSection: {
    marginTop: theme.spacing.md,
  },
  loginLink: {
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  loginLinkBold: {
    color: '#FF6B35',
    fontWeight: theme.typography.fontWeights.semibold,
  },
  footer: {
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});

export default HomeScreen;
