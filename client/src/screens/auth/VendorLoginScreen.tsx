/**
 * Vendor Login Screen
 * Premium login UI for food truck vendors
 */

import React, { useState, useRef } from 'react';
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
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { useAuthContext } from '../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const VendorLoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { refreshUser, user } = useAuthContext();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRef = useRef<TextInput>(null);

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
        
        // Check if vendor has a truck
        const hasTruck = user?.hasTruck;
        
        // Navigate to vendor dashboard or truck setup
        if (hasTruck) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Vendor' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'TruckSetup' }],
          });
        }
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
        
        // Refresh user data
        await refreshUser();
        
        // Navigate based on truck status
        navigation.reset({
          index: 0,
          routes: [{ name: 'Vendor' }],
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
      {/* Dark Professional Background */}
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
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
              colors={theme.gradients.ocean}
              style={styles.iconContainer}
            >
              <Icon name="truck" size={40} color={theme.colors.white} />
            </LinearGradient>

            <Text style={styles.title}>Vendor Login</Text>
            <Text style={styles.subtitle}>Sign in to manage your food truck</Text>
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
                  color={emailFocused ? '#4ECDC4' : 'rgba(255,255,255,0.4)'} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
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
                  color={passwordFocused ? '#4ECDC4' : 'rgba(255,255,255,0.4)'} 
                />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.4)"
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
                    color="rgba(255,255,255,0.4)" 
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Login Button */}
            <Animated.View entering={FadeInUp.delay(500).springify()}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <Text style={styles.loginButtonText}>Signing In...</Text>
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <Icon name="forward" size={20} color={theme.colors.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Sign Up Link */}
          <Animated.View 
            entering={FadeIn.delay(600)}
            style={styles.signupContainer}
          >
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('VendorSignup')}>
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
          
          {/* Switch to Customer */}
          <Animated.View entering={FadeIn.delay(900)}>
            <TouchableOpacity 
              style={styles.switchRole}
              onPress={() => navigation.navigate('CustomerLogin')}
            >
              <Text style={styles.switchRoleText}>
                Looking for tacos? <Text style={styles.switchRoleLink}>Customer Login</Text>
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
    backgroundColor: '#1A1A2E',
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
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.base,
    color: 'rgba(255,255,255,0.6)',
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
    color: 'rgba(255,255,255,0.7)',
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.base,
    height: theme.layout.inputHeight,
    gap: theme.spacing.sm,
  },
  inputFocused: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.white,
  },
  loginButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md + 4,
    gap: theme.spacing.sm,
  },
  loginButtonText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.white,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  signupText: {
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  signupLink: {
    fontSize: theme.typography.fontSizes.sm,
    color: '#4ECDC4',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    marginHorizontal: theme.spacing.base,
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: theme.typography.fontWeights.medium,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
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
    color: 'rgba(255,255,255,0.8)',
  },
  switchRole: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  switchRoleText: {
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.5)',
  },
  switchRoleLink: {
    color: '#4ECDC4',
    fontWeight: theme.typography.fontWeights.semibold,
  },
});

export default VendorLoginScreen;
