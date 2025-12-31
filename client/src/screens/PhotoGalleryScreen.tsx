/**
 * Modern Photo Gallery Screen
 * Premium grid layout for truck photos with Cloudinary integration
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Platform, 
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme/theme';
import { Icon, IconButton, FloatingIconButton } from '../components/Icons';
import { apiClient } from '../services/api';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = theme.spacing.md;
const ITEM_WIDTH = (width - (theme.spacing.base * 2) - GAP) / COLUMN_COUNT;

interface Photo {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  createdAt: string;
}

const PhotoGalleryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { getToken } = useAuth();
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [truckId, setTruckId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await getToken();
      if (token) authService.setToken(token);

      // Get truck ID and photos from user profile
      const userRes = await authService.getCurrentUser();
      const user = userRes.user as any;
      
      // Backend returns truck at root level
      const truckData = user?.truck || user?.profile?.truck;
      
      if (truckData?.id) {
        console.log('✅ PhotoGallery: Found truck:', truckData.id);
        setTruckId(truckData.id);
        
        // Set photos from truck data
        if (truckData.photos) {
          setPhotos(truckData.photos);
        }
      } else {
        console.log('⚠️ PhotoGallery: No truck found');
        Alert.alert('Error', 'No truck found. Please set up your truck first.');
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadPhoto = async () => {
    if (!truckId) {
      Alert.alert('Error', 'No truck found');
      return;
    }

    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploading(true);
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

      // Upload to Cloudinary via API
      const response = await fetch(
        `${apiClient.getBaseUrl()}/api/trucks/${truckId}/photos`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.photos) {
          setPhotos(prev => [...prev, ...data.photos]);
          Alert.alert('Success', 'Photo uploaded successfully!');
        }
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
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
            try {
              const token = await getToken();
              
              const response = await fetch(
                `${apiClient.getBaseUrl()}/api/trucks/${truckId}/photos/${photoId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                setPhotos(prev => prev.filter(p => p.id !== photoId));
                Alert.alert('Success', 'Photo deleted');
              } else {
                Alert.alert('Error', 'Failed to delete photo');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton name="back" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Photo Gallery</Text>
          <View style={{ width: 40 }} /> 
        </View>
        <Text style={styles.subtitle}>
          {photos.length > 0 
            ? `${photos.length} photo${photos.length > 1 ? 's' : ''} in your gallery`
            : 'Showcase your delicious food and truck! 📸'
          }
        </Text>
      </View>

      {/* Grid */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="camera" size={64} color={theme.colors.gray[300]} />
            <Text style={styles.emptyTitle}>No Photos Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add photos of your food truck and delicious menu items to attract more customers!
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={pickAndUploadPhoto}
              disabled={uploading}
            >
              <Icon name="camera" size={20} color={theme.colors.white} />
              <Text style={styles.emptyButtonText}>Add Your First Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {photos.map((photo, index) => (
              <Animated.View 
                key={photo.id}
                entering={FadeInUp.delay(index * 50).springify()}
                style={styles.gridItem}
              >
                <View style={styles.placeholder}>
                  <Image 
                    source={{ uri: photo.url }} 
                    style={styles.image} 
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)']}
                    style={styles.gradientOverlay}
                  />
                  {photo.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Icon name="star" size={10} color={theme.colors.white} />
                      <Text style={styles.primaryText}>Primary</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deletePhoto(photo.id)}
                  >
                    <Icon name="close" size={16} color={theme.colors.white} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
            
            {/* Add Photo Button */}
            <TouchableOpacity 
              style={[styles.gridItem, styles.addItem]}
              onPress={pickAndUploadPhoto}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={theme.colors.primary.main} />
              ) : (
                <>
                  <Icon name="camera" size={32} color={theme.colors.primary.main} />
                  <Text style={styles.addText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      {photos.length > 0 && (
        <View style={styles.fabContainer}>
          <FloatingIconButton 
            name="camera" 
            onPress={pickAndUploadPhoto} 
            backgroundColor={theme.colors.primary.main}
            color={theme.colors.white}
          />
        </View>
      )}

      {/* Upload overlay */}
      {uploading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadModal}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.uploadText}>Uploading photo...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.gray[600],
    fontSize: theme.typography.fontSizes.base,
  },
  header: {
    backgroundColor: theme.colors.white,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.base,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    ...theme.shadows.sm,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[500],
    textAlign: 'center',
  },
  gridContainer: {
    padding: theme.spacing.base,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.sm,
    backgroundColor: theme.colors.white,
  },
  placeholder: {
    flex: 1,
    backgroundColor: theme.colors.gray[200],
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary.lighter,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.gray[50],
  },
  addText: {
    marginTop: 8,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary.main,
  },
  fabContainer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[700],
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[500],
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.sm,
    ...theme.shadows.md,
  },
  emptyButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.white,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModal: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  uploadText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[700],
    fontWeight: theme.typography.fontWeights.medium,
  },
});

export default PhotoGalleryScreen;
