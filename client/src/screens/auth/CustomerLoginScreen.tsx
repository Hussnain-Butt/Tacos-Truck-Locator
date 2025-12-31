/**
 * Customer Login Screen
 * Clean login UI for customer users
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../App';
import { theme } from '../../theme/theme';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icons';
import { useSignIn, useOAuth, useAuth } from '@clerk/clerk-expo';
import { useAuthContext } from '../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CustomerLoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { isSignedIn } = useAuth();
  const { syncUser, refreshUser, user, isLoading } = useAuthContext();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  // If already signed in, redirect to dashboard
  useEffect(() => {
    if (isSignedIn && !isLoading) {
      console.log('👤 Already signed in, redirecting to Customer dashboard');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Customer' }],
      });
    }
  }, [isSignedIn, isLoading, navigation]);

  const handleLogin = async () => {
    if (!isLoaded) return;
    
    Keyboard.dismiss();
    setLoading(true);
    
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        
        // Refresh user data from backend
        await refreshUser();
        
        // Navigate to customer dashboard
        navigation.reset({
          index: 0,
          routes: [{ name: 'Customer' }],
        });
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.errors?.[0]?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { createdSessionId, setActive: setActiveSession } = await startOAuthFlow();
      
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        
        // Sync as customer (in case new user via Google)
        await syncUser('CUSTOMER');
        
        // Navigate to customer dashboard
        navigation.reset({
          index: 0,
          routes: [{ name: 'Customer' }],
        });
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('Google Login Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF7ED', '#FFEDD5', theme.colors.background]}
        style={styles.backgroundGradient}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.iconContainer}
            >
              <Icon name="taco" size={40} color={theme.colors.white} />
            </LinearGradient>

            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to find delicious tacos</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View 
            entering={FadeIn.delay(200)}
            style={styles.form}
          >
            {/* Email Input */}
            <Animated.View 
              entering={FadeInUp.delay(300).springify()}
              style={styles.inputContainer}
            >
              <Text style={styles.label}>Email</Text>
              <View style={[
                styles.inputWrapper,
                emailFocused && styles.inputFocused,
              ]}>
                <Icon 
                  name="email" 
                  size={20} 
                  color={emailFocused ? theme.colors.primary.main : theme.colors.gray[400]} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={theme.colors.gray[400]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View 
              entering={FadeInUp.delay(400).springify()}
              style={styles.inputContainer}
            >
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputWrapper,
                passwordFocused && styles.inputFocused,
              ]}>
                <Icon 
                  name="lock" 
                  size={20} 
                  color={passwordFocused ? theme.colors.primary.main : theme.colors.gray[400]} 
                />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.gray[400]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon 
                    name={showPassword ? 'eye' : 'eye-off'} 
                    size={20} 
                    color={theme.colors.gray[400]} 
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Login Button */}
            <Animated.View entering={FadeInUp.delay(500).springify()}>
              <Button
                title="Sign In"
                onPress={handleLogin}
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
                rightIcon="forward"
              />
            </Animated.View>
          </Animated.View>

          {/* Sign Up Link */}
          <Animated.View 
            entering={FadeIn.delay(600)}
            style={styles.signupContainer}
          >
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('CustomerSignup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <Animated.View 
            entering={FadeIn.delay(700)}
            style={styles.divider}
          >
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Social Login */}
          <Animated.View entering={FadeInUp.delay(800).springify()}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
            >
              <View style={styles.socialIconContainer}>
                <Text style={styles.socialIcon}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Switch to Vendor */}
          <Animated.View entering={FadeIn.delay(900)}>
            <TouchableOpacity 
              style={styles.switchRole}
              onPress={() => navigation.navigate('VendorLogin')}
            >
              <Text style={styles.switchRoleText}>
                Are you a food truck owner? <Text style={styles.switchRoleLink}>Vendor Login</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: theme.spacing['2xl'],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: theme.borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.xl,
  },
  title: {
    fontSize: theme.typography.fontSizes['3xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[600],
    textAlign: 'center',
  },
  form: {
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.base,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.base,
    height: theme.layout.inputHeight,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  inputFocused: {
    borderColor: theme.colors.primary.main,
    ...theme.shadows.colored(theme.colors.primary.main),
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[900],
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  signupText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[600],
  },
  signupLink: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray[200],
  },
  dividerText: {
    marginHorizontal: theme.spacing.base,
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[400],
    fontWeight: theme.typography.fontWeights.medium,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  socialIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  socialButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.gray[700],
  },
  switchRole: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  switchRoleText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[500],
  },
  switchRoleLink: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeights.semibold,
  },
});

export default CustomerLoginScreen;
