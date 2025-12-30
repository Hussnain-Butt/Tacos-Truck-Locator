/**
 * Truck Setup Screen
 * Vendor onboarding - add truck information after signup
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon } from '../components/Icons';
import { truckService } from '../services/truckService';
import { authService } from '../services/authService';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';

type TruckSetupNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TruckSetup'>;

const SPECIALTIES = [
  'Mexican',
  'Tacos',
  'Burritos',
  'Seafood',
  'Fusion',
  'Vegan',
  'Traditional',
  'Street Food',
];

const TruckSetupScreen: React.FC = () => {
  const navigation = useNavigation<TruckSetupNavigationProp>();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  
  const [truckName, setTruckName] = useState('');
  const [description, setDescription] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [truckImage, setTruckImage] = useState<string | null>(null);
  
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  // Set auth token on mount
  useEffect(() => {
    const setToken = async () => {
      const token = await getToken();
      if (token) {
        authService.setToken(token);
      }
    };
    setToken();
  }, [getToken]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTruckImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!truckName.trim()) {
      Alert.alert('Required', 'Please enter your truck name');
      return;
    }
    if (!specialty) {
      Alert.alert('Required', 'Please select a specialty');
      return;
    }

    setLoading(true);
    

    try {
      // Ensure auth token is set
      const token = await getToken();
      if (token) {
        authService.setToken(token);
      }
      
      // Check current user - if not found, sync as VENDOR
      const currentUser = await authService.getCurrentUser();
      console.log('Current user check:', currentUser);
      
      // If user not found (404), we need to sync them first
      if (!currentUser.user) {
        console.log('📝 User not found in DB, syncing as VENDOR...');
        
        // Get clerkId from token
        let clerkId = '';
        if (token) {
          try {
            const tokenParts = token.split('.');
            const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
            const decoded = decodeURIComponent(escape(atob(base64Payload)));
            const payload = JSON.parse(decoded);
            clerkId = payload.sub || '';
          } catch (e) {
            console.error('Token decode error:', e);
          }
        }
        
        // Get email from Clerk user object
        const email = clerkUser?.primaryEmailAddress?.emailAddress || 
                      clerkUser?.emailAddresses?.[0]?.emailAddress || '';
        const userName = clerkUser?.fullName || clerkUser?.firstName || 'Vendor';
        
        console.log(`📝 Syncing: clerkId=${clerkId}, email=${email}, name=${userName}`);
        
        if (!clerkId || !email) {
          Alert.alert('Error', 'Could not get user info. Please try again.');
          return;
        }
        
        // Sync user as VENDOR
        const syncResult = await authService.syncUser({
          clerkId,
          email,
          name: userName,
          role: 'VENDOR'
        });
        
        console.log('✅ Sync result:', syncResult);
        
        if (!syncResult.success) {
          throw new Error('Failed to create vendor account');
        }
      } else if (currentUser.user.role !== 'VENDOR') {
        // User exists but is not VENDOR - upgrade role
        console.log('⚠️ User is not VENDOR, upgrading role...');
        
        const syncResult = await authService.syncUser({
          clerkId: currentUser.user.clerkId,
          email: currentUser.user.email,
          name: currentUser.user.profile?.name || 'Vendor',
          role: 'VENDOR'
        });
        
        console.log('Role upgrade result:', syncResult);
        
        if (!syncResult.success) {
           throw new Error('Failed to upgrade user to Vendor role');
        }
      }
      
      console.log('Creating truck with:', { name: truckName, specialty, phone });
      
      const result = await truckService.create({
        name: truckName.trim(),
        description: description.trim(),
        specialty,
        phone: phone.trim(),
      });

      console.log('Truck creation result:', result);

      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        // Success - navigate to vendor dashboard
        navigation.reset({
          index: 0,
          routes: [{ name: 'Vendor' }],
        });
      }
    } catch (error: any) {
      console.error('Truck creation error:', error);
      Alert.alert('Error', 'Failed to create truck. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow vendor to skip and go to dashboard
    navigation.reset({
      index: 0,
      routes: [{ name: 'Vendor' }],
    });
  };

  return (
    <View style={styles.container}>
      {/* Background */}
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

            <Text style={styles.title}>Setup Your Truck</Text>
            <Text style={styles.subtitle}>
              Add your food truck details to get started
            </Text>
          </Animated.View>

          {/* Truck Photo */}
          <Animated.View entering={FadeInUp.delay(200).springify()}>
            <TouchableOpacity 
              style={styles.imagePickerContainer}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              {truckImage ? (
                <Image source={{ uri: truckImage }} style={styles.truckImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="camera" size={32} color={theme.colors.gray[400]} />
                  <Text style={styles.imagePlaceholderText}>Add Truck Photo</Text>
                  <Text style={styles.imagePlaceholderHint}>Tap to upload</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Form */}
          <Animated.View 
            entering={FadeIn.delay(300)}
            style={styles.form}
          >
            {/* Truck Name */}
            <Animated.View 
              entering={FadeInUp.delay(300).springify()}
              style={styles.inputContainer}
            >
              <Text style={styles.label}>Truck Name *</Text>
              <View style={[
                styles.inputWrapper,
                nameFocused && styles.inputFocused,
              ]}>
                <Icon 
                  name="truck" 
                  size={20} 
                  color={nameFocused ? theme.colors.primary.main : theme.colors.gray[400]} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Taco Express"
                  placeholderTextColor={theme.colors.gray[500]}
                  value={truckName}
                  onChangeText={setTruckName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
              </View>
            </Animated.View>

            {/* Description */}
            <Animated.View 
              entering={FadeInUp.delay(350).springify()}
              style={styles.inputContainer}
            >
              <Text style={styles.label}>Description</Text>
              <View style={[
                styles.textAreaWrapper,
                descFocused && styles.inputFocused,
              ]}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Tell customers about your amazing food..."
                  placeholderTextColor={theme.colors.gray[500]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  onFocus={() => setDescFocused(true)}
                  onBlur={() => setDescFocused(false)}
                />
              </View>
            </Animated.View>

            {/* Specialty */}
            <Animated.View 
              entering={FadeInUp.delay(400).springify()}
              style={styles.inputContainer}
            >
              <Text style={styles.label}>Specialty *</Text>
              <View style={styles.specialtyContainer}>
                {SPECIALTIES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.specialtyChip,
                      specialty === item && styles.specialtyChipActive,
                    ]}
                    onPress={() => setSpecialty(item)}
                  >
                    <Text style={[
                      styles.specialtyText,
                      specialty === item && styles.specialtyTextActive,
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Phone */}
            <Animated.View 
              entering={FadeInUp.delay(450).springify()}
              style={styles.inputContainer}
            >
              <Text style={styles.label}>Phone Number</Text>
              <View style={[
                styles.inputWrapper,
                phoneFocused && styles.inputFocused,
              ]}>
                <Icon 
                  name="phone" 
                  size={20} 
                  color={phoneFocused ? theme.colors.primary.main : theme.colors.gray[400]} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={theme.colors.gray[500]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                />
              </View>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={FadeInUp.delay(500).springify()}>
              <Button
                title="Create My Truck"
                onPress={handleSubmit}
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
                rightIcon="forward"
              />
            </Animated.View>

            {/* Skip Button */}
            <Animated.View entering={FadeIn.delay(550)}>
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </Animated.View>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing['2xl'],
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
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[400],
    textAlign: 'center',
  },
  imagePickerContainer: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  truckImage: {
    width: '100%',
    height: 180,
    borderRadius: theme.borderRadius.xl,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.sm,
  },
  imagePlaceholderHint: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.gray[500],
    marginTop: theme.spacing.xs,
  },
  form: {
    gap: theme.spacing.base,
  },
  inputContainer: {
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.gray[300],
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
    borderColor: theme.colors.primary.main,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.white,
  },
  textAreaWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.base,
    minHeight: 100,
  },
  textArea: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.white,
    textAlignVertical: 'top',
  },
  specialtyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  specialtyChip: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  specialtyChipActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  specialtyText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[400],
    fontWeight: theme.typography.fontWeights.medium,
  },
  specialtyTextActive: {
    color: theme.colors.white,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  skipText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[500],
  },
});

export default TruckSetupScreen;
