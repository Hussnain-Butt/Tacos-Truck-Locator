/**
 * Vendor Profile Screen
 * Update vendor profile and truck details
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@clerk/clerk-expo';

import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon } from '../components/Icons';
import { authService } from '../services/authService';
import { truckService } from '../services/truckService';

const VendorProfileScreen = () => {
  const navigation = useNavigation();
  const { getToken, signOut } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Vendor Details
  const [vendorName, setVendorName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  
  // Truck Details
  const [truckId, setTruckId] = useState<string | null>(null);
  const [truckName, setTruckName] = useState('');
  const [truckDescription, setTruckDescription] = useState('');
  const [specialty, setSpecialty] = useState('');
  
  // Truck Photos (up to 3)
  interface TruckPhoto {
    id: string;
    url: string;
    isPrimary: boolean;
  }
  const [truckPhotos, setTruckPhotos] = useState<TruckPhoto[]>([]);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'truck'>('profile');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      if (token) authService.setToken(token);

      const response = await authService.getCurrentUser();
      // Cast user to any to access dynamic properties not in interface
      const anyUser = response.user as any;
      console.log('Profile User Data:', JSON.stringify(anyUser, null, 2));
      
      if (anyUser?.profile) {
        setVendorName(anyUser.profile.name);
        setPhone(anyUser.profile.phone || '');
        setAvatar(anyUser.profile.avatarUrl);
      }
      
      // Backend now returns truck at root level for vendors
      if (anyUser?.truck) {
        console.log('✅ Found truck at root level:', anyUser.truck.id);
        setTruckId(anyUser.truck.id);
        setTruckName(anyUser.truck.name);
        setTruckDescription(anyUser.truck.description || '');
        setSpecialty(anyUser.truck.specialty);
        if (anyUser.truck.photos) {
          setTruckPhotos(anyUser.truck.photos);
        }
      } else if (anyUser?.profile?.truck) {
        // Fallback: Check nested in profile
        console.log('✅ Found truck in profile:', anyUser.profile.truck.id);
        setTruckId(anyUser.profile.truck.id);
        setTruckName(anyUser.profile.truck.name);
        setTruckDescription(anyUser.profile.truck.description || '');
        setSpecialty(anyUser.profile.truck.specialty);
        if (anyUser.profile.truck.photos) {
          setTruckPhotos(anyUser.profile.truck.photos);
        }
      } else {
        console.log('⚠️ No truck found in response');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setFetching(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!vendorName.trim()) {
       Alert.alert('Error', 'Name is required');
       return;
    }
    
    setLoading(true);
    try {
      const result = await authService.updateProfile({
        name: vendorName,
        phone: phone,
      });

      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
       Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTruck = async () => {
    if (!truckId) return;
    
    setLoading(true);
    try {
      const result = await truckService.update(truckId, {
        name: truckName,
        description: truckDescription,
        specialty,
      });
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert('Success', 'Truck details updated');
      }
    } catch (error: any) {
       Alert.alert('Error', 'Failed to update truck');
    } finally {
      setLoading(false);
    }
  };

  // Pick and upload truck photo
  const pickTruckPhoto = async () => {
    if (!truckId) {
      Alert.alert('Error', 'Please save truck details first');
      return;
    }
    if (truckPhotos.length >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 photos');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      try {
        const token = await getToken();
        if (token) authService.setToken(token);

        // Create form data for upload
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('photos', {
          uri,
          name: filename,
          type,
        } as any);
        formData.append('isPrimary', truckPhotos.length === 0 ? 'true' : 'false');

        // Upload via API
        const response = await fetch(`http://192.168.1.10:3000/api/trucks/${truckId}/photos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setTruckPhotos(prev => [...prev, ...data.photos]);
          Alert.alert('Success', 'Photo added successfully');
        } else {
          const errorData = await response.json();
          Alert.alert('Error', errorData.error || 'Failed to upload photo');
        }
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert('Error', 'Failed to upload photo');
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete truck photo
  const deleteTruckPhoto = async (photoId: string) => {
    if (!truckId) return;
    
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const token = await getToken();
              
              const response = await fetch(
                `http://192.168.1.10:3000/api/trucks/${truckId}/photos/${photoId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                setTruckPhotos(prev => prev.filter(p => p.id !== photoId));
                Alert.alert('Success', 'Photo deleted');
              } else {
                Alert.alert('Error', 'Failed to delete photo');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (fetching) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.gray[950], '#1a1a2e']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSignOut}>
             <Icon name="logout" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Vendor</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'truck' && styles.activeTab]}
          onPress={() => setActiveTab('truck')}
        >
          <Text style={[styles.tabText, activeTab === 'truck' && styles.activeTabText]}>Truck</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === 'profile' ? (
            <Animated.View entering={FadeInDown.delay(100)}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatarImage} />
                  ) : (
                    <Icon name="user" size={40} color={theme.colors.gray[400]} />
                  )}
                </View>
                <TouchableOpacity style={styles.editBadge}>
                  <Icon name="edit" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={vendorName}
                onChangeText={setVendorName}
                placeholderTextColor={theme.colors.gray[500]}
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Required for customers"
                placeholderTextColor={theme.colors.gray[500]}
                keyboardType="phone-pad"
              />

              <Button
                title="Save Profile"
                onPress={handleUpdateProfile}
                loading={loading}
                variant="primary"
                style={styles.saveButton}
              />
              
              {/* Logout Button */}
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleSignOut}
              >
                <Icon name="logout" size={20} color={theme.colors.error} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
             <Animated.View entering={FadeInDown.delay(100)}>
                <Text style={styles.label}>Truck Name</Text>
                <TextInput
                  style={styles.input}
                  value={truckName}
                  onChangeText={setTruckName}
                  placeholderTextColor={theme.colors.gray[500]}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={truckDescription}
                  onChangeText={setTruckDescription}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={theme.colors.gray[500]}
                />

                <Text style={styles.label}>Specialty</Text>
                <TextInput
                  style={styles.input}
                  value={specialty}
                  onChangeText={setSpecialty}
                  placeholderTextColor={theme.colors.gray[500]}
                />

                {/* Truck Photos Section */}
                <Text style={styles.label}>Truck Photos ({truckPhotos.length}/3)</Text>
                <View style={styles.photosContainer}>
                  {truckPhotos.map((photo, index) => (
                    <View key={photo.id} style={styles.photoWrapper}>
                      <Image source={{ uri: photo.url }} style={styles.truckPhoto} />
                      <TouchableOpacity 
                        style={styles.deletePhotoBtn}
                        onPress={() => deleteTruckPhoto(photo.id)}
                      >
                        <Icon name="close" size={16} color={theme.colors.white} />
                      </TouchableOpacity>
                      {photo.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>
                  ))}
                  
                  {truckPhotos.length < 3 && (
                    <TouchableOpacity 
                      style={styles.addPhotoBtn}
                      onPress={pickTruckPhoto}
                    >
                      <Icon name="camera" size={32} color={theme.colors.gray[400]} />
                      <Text style={styles.addPhotoText}>Add Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Button
                  title="Update Truck Info"
                  onPress={handleUpdateTruck}
                  loading={loading}
                  variant="primary"
                  style={styles.saveButton}
                />
             </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[950],
  },
  text: {
    color: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary.main,
  },
  tabText: {
    color: theme.colors.gray[400],
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
  },
  content: {
    padding: 20,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary.main,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gray[950],
  },
  label: {
    color: theme.colors.gray[400],
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 14,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    color: theme.colors.white,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 10,
  },
  logoutText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  // Photo Gallery Styles
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  photoWrapper: {
    position: 'relative',
    width: 100,
    height: 75,
    borderRadius: 12,
    overflow: 'hidden',
  },
  truckPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  primaryBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  addPhotoBtn: {
    width: 100,
    height: 75,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.gray[700],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  addPhotoText: {
    color: theme.colors.gray[400],
    fontSize: 11,
    marginTop: 4,
  },
});

export default VendorProfileScreen;
