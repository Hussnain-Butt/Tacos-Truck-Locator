/**
 * Modern Photo Gallery Screen
 * Premium grid layout for truck photos
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Icon, IconButton, FloatingIconButton } from '../components/Icons';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = theme.spacing.md;
const ITEM_WIDTH = (width - (theme.spacing.base * 2) - GAP) / COLUMN_COUNT;

const PhotoGalleryScreen: React.FC = () => {
  const navigation = useNavigation();

  // Mock photos
  const photos = Array(8).fill(null).map((_, i) => ({ id: i }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton name="back" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Photo Gallery</Text>
          <View style={{ width: 40 }} /> 
        </View>
        <Text style={styles.subtitle}>Showcase your delicious food and truck! 📸</Text>
      </View>

      {/* Grid */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        <View style={styles.grid}>
          {photos.map((_, index) => (
            <Animated.View 
              key={index}
              entering={FadeInUp.delay(index * 50).springify()}
              style={styles.gridItem}
            >
              <View style={styles.placeholder}>
                <Image 
                  source={{ uri: `https://source.unsplash.com/random/300x300?tacos,food&sig=${index}` }} 
                  style={styles.image} 
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.5)']}
                  style={styles.gradientOverlay}
                />
                <TouchableOpacity style={styles.deleteButton}>
                  <Icon name="close" size={16} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
          
           {/* Add Photo Button (Placeholder Style) */}
           <TouchableOpacity style={[styles.gridItem, styles.addItem]}>
              <Icon name="camera" size={32} color={theme.colors.primary.main} />
              <Text style={styles.addText}>Add Photo</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer}>
        <FloatingIconButton 
          name="camera" 
          onPress={() => {}} 
          backgroundColor={theme.colors.primary.main}
          color={theme.colors.white}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
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
});

export default PhotoGalleryScreen;
