/**
 * Customer Signup Screen
 * Clean signup UI for customer users
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
import { useSignUp, useOAuth, useAuth } from '@clerk/clerk-expo';
import { useAuthContext } from '../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CustomerSignupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { getToken } = useAuth();
  const { syncUser } = useAuthContext();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleSignup = async () => {
    if (!isLoaded) return;
    
    Keyboard.dismiss();
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create Clerk account
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      setPendingVerification(true);
      Alert.alert('Verification Sent', 'Please check your email for verification code.');
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.errors?.[0]?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    
    setLoading(true);
    
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        
        // Sync with backend as CUSTOMER
        console.log('📝 Syncing user as CUSTOMER...');
        const syncResult = await syncUser('CUSTOMER');
        console.log('✅ Sync result:', syncResult);
        
        // Navigate to customer dashboard
        navigation.reset({
          index: 0,
          routes: [{ name: 'Customer' }],
        });
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('Verification Failed', error.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const { createdSessionId, setActive: setActiveSession } = await startOAuthFlow();
      
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        
        // Sync as CUSTOMER
        console.log('📝 Google Signup: Syncing as CUSTOMER...');
        const syncResult = await syncUser('CUSTOMER');
        console.log('✅ Google Sync result:', syncResult);
        
        // Navigate to customer dashboard
        navigation.reset({
          index: 0,
          routes: [{ name: 'Customer' }],
        });
      }
    } catch (error: any) {
      console.error('Google signup error:', error);
      Alert.alert('Google Sign Up Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (password.length === 0) return { level: 0, text: '', color: theme.colors.gray[300] };
    if (password.length < 6) return { level: 1, text: 'Weak', color: theme.colors.error };
    if (password.length < 10) return { level: 2, text: 'Medium', color: theme.colors.warning };
    return { level: 3, text: 'Strong', color: theme.colors.success };
  };

  const passwordStrength = getPasswordStrength();

  // Verification Screen
  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFF7ED', '#FFEDD5', theme.colors.background]}
          style={styles.backgroundGradient}
        />
        <View style={styles.verificationContainer}>
          <Animated.View entering={FadeInDown.springify()} style={styles.header}>
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.iconContainer}
            >
              <Icon name="email" size={40} color={theme.colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code we sent to {email}
            </Text>
          </Animated.View>
          
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.codeContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor={theme.colors.gray[400]}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />
          </Animated.View>
          
          <Animated.View entering={FadeInUp.delay(300).springify()}>
            <Button
              title="Verify Email"
              onPress={handleVerify}
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
            />
          </Animated.View>
        </View>
      </View>
    );
  }

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

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the taco community</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View 
            entering={FadeIn.delay(200)}
            style={styles.form}
          >
            {/* Name Input */}
            <Animated.View 
              entering={FadeInUp.delay(250).springify()}
              style={styles.inputContainer}
            >
              <Text style={styles.label}>Full Name</Text>
              <View style={[
                styles.inputWrapper,
                nameFocused && styles.inputFocused,
              ]}>
                <Icon 
                  name="user" 
                  size={20} 
                  color={nameFocused ? theme.colors.primary.main : theme.colors.gray[400]} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={theme.colors.gray[400]}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
            </Animated.View>

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
                  ref={emailRef}
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
              entering={FadeInUp.delay(350).springify()}
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
                  autoComplete="password-new"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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
              
              {/* Password Strength */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              level <= passwordStrength.level
                                ? passwordStrength.color
                                : theme.colors.gray[200],
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.text}
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Confirm Password Input */}
            <Animated.View 
              entering={FadeInUp.delay(400).springify()}
              style={styles.inputContainer}
            >
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[
                styles.inputWrapper,
                confirmPasswordFocused && styles.inputFocused,
                confirmPassword.length > 0 && password !== confirmPassword && styles.inputError,
              ]}>
                <Icon 
                  name="lock" 
                  size={20} 
                  color={confirmPasswordFocused ? theme.colors.primary.main : theme.colors.gray[400]} 
                />
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.gray[400]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <Icon name="check" size={20} color={theme.colors.success} />
                )}
              </View>
            </Animated.View>

            {/* Signup Button */}
            <Animated.View entering={FadeInUp.delay(450).springify()}>
              <Button
                title="Create Account"
                onPress={handleSignup}
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
                rightIcon="forward"
              />
            </Animated.View>
          </Animated.View>

          {/* Login Link */}
          <Animated.View 
            entering={FadeIn.delay(500)}
            style={styles.loginContainer}
          >
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('CustomerLogin')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <Animated.View 
            entering={FadeIn.delay(550)}
            style={styles.divider}
          >
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Social Signup */}
          <Animated.View entering={FadeInUp.delay(600).springify()}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleSignup}
              activeOpacity={0.8}
            >
              <View style={styles.socialIconContainer}>
                <Text style={styles.socialIcon}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>Sign up with Google</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Terms */}
          <Animated.Text 
            entering={FadeIn.delay(650)}
            style={styles.terms}
          >
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Animated.Text>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing['2xl'],
  },
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.xl,
  },
  title: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[600],
    textAlign: 'center',
  },
  codeContainer: {
    marginBottom: theme.spacing.xl,
  },
  codeInput: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    fontSize: 32,
    letterSpacing: 12,
    fontWeight: 'bold',
    color: theme.colors.gray[900],
  },
  form: {
    marginBottom: theme.spacing.base,
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
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[900],
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.base,
  },
  loginText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[600],
  },
  loginLink: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.base,
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
  terms: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.gray[500],
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeights.medium,
  },
});

export default CustomerSignupScreen;
