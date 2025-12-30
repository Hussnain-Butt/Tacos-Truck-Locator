/**
 * Modern Customer Screen
 * Premium map interface with draggable bottom sheet
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Platform,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { theme } from '../theme/theme';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { TruckMarker } from '../components/TruckMarker';
import { TruckCardCompact } from '../components/TruckCard';
import { Icon, FloatingIconButton } from '../components/Icons';
import { truckService } from '../services/truckService';
import { socketService } from '../services/socketService';
import { calculateDistance } from '../utils/locationUtils';
import type { TruckData } from '../types';
import { Linking } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MIN_HEIGHT = 200;
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;

type CustomerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Customer'>;

const CustomerScreen: React.FC = () => {
  const navigation = useNavigation<CustomerScreenNavigationProp>();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trucks, setTrucks] = useState<TruckData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Bottom sheet animation
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(
        -(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT),
        Math.min(0, context.value.y + event.translationY)
      );
    })
    .onEnd((event) => {
      // Smooth animation config
      const config = { duration: 300, easing: Easing.out(Easing.cubic) };
      
      // Snap to positions based on velocity
      if (event.velocityY < -500) {
        // Swipe up fast - expand
        translateY.value = withTiming(-(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT), config);
      } else if (event.velocityY > 500) {
        // Swipe down fast - collapse
        translateY.value = withTiming(0, config);
      } else {
        // Snap to nearest position
        const midPoint = -(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT) / 2;
        if (translateY.value < midPoint) {
          translateY.value = withTiming(-(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT), config);
        } else {
          translateY.value = withTiming(0, config);
        }
      }
    });

  const bottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Fetch trucks from API
  const fetchTrucks = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const result = await truckService.getNearby({ latitude: lat, longitude: lng, radius: 20 });
      if (result.trucks) {
        // Map API response to TruckData format
        const mappedTrucks: TruckData[] = result.trucks.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          specialty: t.specialty || 'Tacos',
          rating: t.rating || 4.5,
          reviewCount: t.reviewCount || t._count?.reviews || 0,
          isOnline: t.isOnline || false,
          location: t.location ? {
            latitude: t.location.latitude,
            longitude: t.location.longitude,
            address: t.location.address,
          } : null,
          tags: t.tags || [t.specialty],
          photos: t.photos || [],
          distance: t.distance,
        }));
        setTrucks(mappedTrucks);
      }
    } catch (err) {
      console.error('Error fetching trucks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation);
      
      // Fetch real trucks from API
      await fetchTrucks(userLocation.coords.latitude, userLocation.coords.longitude);
      
      // Connect to socket for realtime updates
      socketService.connect();
      socketService.subscribeToArea(
        userLocation.coords.latitude, 
        userLocation.coords.longitude, 
        20
      );
    })();
    
    // Socket event listeners for realtime updates
    const unsubOnline = socketService.on('truckOnline', (data: any) => {
      console.log('🟢 Realtime: Truck came online:', data.truckId);
      setTrucks(prev => prev.map(t => 
        t.id === data.truckId 
          ? { ...t, isOnline: true, location: data.latitude ? { latitude: data.latitude, longitude: data.longitude, address: '' } : t.location }
          : t
      ));
    });
    
    const unsubOffline = socketService.on('truckOffline', (data: any) => {
      console.log('🔴 Realtime: Truck went offline:', data.truckId);
      setTrucks(prev => prev.map(t => 
        t.id === data.truckId ? { ...t, isOnline: false } : t
      ));
    });
    
    const unsubMoved = socketService.on('truckMoved', (data: any) => {
      console.log('📍 Realtime: Truck moved:', data.truckId);
      setTrucks(prev => prev.map(t => 
        t.id === data.truckId && data.latitude && data.longitude
          ? { ...t, location: { latitude: data.latitude, longitude: data.longitude, address: t.location?.address || '' } }
          : t
      ));
    });
    
    // Cleanup
    return () => {
      unsubOnline();
      unsubOffline();
      unsubMoved();
      socketService.unsubscribe();
    };
  }, []);

  const handleNavigate = (truck: TruckData) => {
    // Record navigation for analytics
    truckService.recordNavigation(truck.id);
    
    const latLng = `${truck.location.latitude},${truck.location.longitude}`;
    const fallback = Platform.OS === 'ios' 
      ? `maps://?daddr=${latLng}` 
      : `google.navigation:q=${latLng}`;
    Linking.openURL(fallback);
  };

  const handleRecenter = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  };

  const cuisineTypes = ['all', 'Mexican', 'Vegan', 'Seafood', 'Traditional'];

  const filteredTrucks = (trucks || [])
    .filter(truck => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = truck.name.toLowerCase().includes(query);
        const matchesDescription = truck.description.toLowerCase().includes(query);
        const matchesSpecialty = truck.specialty.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription && !matchesSpecialty) return false;
      }
      
      if (filter === 'online' && !truck.isOnline) return false;
      
      if (selectedCuisine !== 'all') {
        const matchesCuisine = truck.tags?.some(tag => 
          tag.toLowerCase().includes(selectedCuisine.toLowerCase())
        );
        if (!matchesCuisine) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        if (!location) return 0;
        const distA = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          a.location.latitude,
          a.location.longitude
        );
        const distB = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          b.location.latitude,
          b.location.longitude
        );
        return distA - distB;
      }
    });

  if (errorMsg) {
    return (
      <ErrorState 
        message={errorMsg}
        icon="location"
        title="Location Required"
        onRetry={async () => {
          setErrorMsg(null);
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            let userLocation = await Location.getCurrentPositionAsync({});
            setLocation(userLocation);
            // Fetch real trucks from API
            await fetchTrucks(userLocation.coords.latitude, userLocation.coords.longitude);
          }
        }}
      />
    );
  }

  if (!location) {
    return <LoadingState message="Finding your location..." />;
  }

  // Calculate online count from trucks array
  const onlineCount = trucks.filter(t => t.isOnline).length;

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {filteredTrucks.map((truck) => (
          <TruckMarker
            key={truck.id}
            truck={truck}
            onPress={() => {}}
          />
        ))}
      </MapView>

      {/* Search Bar */}
      <Animated.View 
        entering={FadeInDown.delay(200).springify()}
        style={styles.searchContainer}
      >
        <View style={[
          styles.searchBar,
          isSearchFocused && styles.searchBarFocused,
        ]}>
          <Icon 
            name="search" 
            size={20} 
            color={isSearchFocused ? theme.colors.primary.main : theme.colors.gray[400]} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trucks, tacos..."
            placeholderTextColor={theme.colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={18} color={theme.colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.filterToggle,
            showFilters && styles.filterToggleActive,
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon 
            name="filter" 
            size={20} 
            color={showFilters ? theme.colors.white : theme.colors.gray[600]} 
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Advanced Filters */}
      {showFilters && (
        <Animated.View 
          entering={FadeIn.duration(200)}
          style={styles.advancedFilters}
        >
          {/* Cuisine Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipContainer}
          >
            {cuisineTypes.map((cuisine, index) => (
              <Animated.View 
                key={cuisine}
                entering={SlideInRight.delay(index * 50)}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedCuisine === cuisine && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedCuisine(cuisine)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedCuisine === cuisine && styles.filterChipTextActive
                  ]}>
                    {cuisine === 'all' ? 'All Types' : cuisine}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            {(['distance', 'rating', 'name'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortButton, 
                  sortBy === option && styles.sortButtonActive
                ]}
                onPress={() => setSortBy(option)}
              >
                <Text style={[
                  styles.sortButtonText, 
                  sortBy === option && styles.sortButtonTextActive
                ]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Filter Buttons - Properly aligned */}
      {!showFilters && (
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            {filter === 'all' ? (
              <LinearGradient
                colors={theme.gradients.primary}
                style={styles.filterButtonGradient}
              >
                <Text style={styles.filterTextActive}>All ({trucks.length})</Text>
              </LinearGradient>
            ) : (
              <View style={styles.filterButtonInner}>
                <Text style={styles.filterText}>All ({trucks.length})</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'online' && styles.filterButtonActive]}
            onPress={() => setFilter('online')}
          >
            {filter === 'online' ? (
              <LinearGradient
                colors={theme.gradients.forest}
                style={styles.filterButtonGradient}
              >
                <View style={styles.onlineDot} />
                <Text style={styles.filterTextActive}>Open Now ({onlineCount})</Text>
              </LinearGradient>
            ) : (
              <View style={styles.filterButtonInner}>
                <View style={[styles.onlineDot, { backgroundColor: theme.colors.gray[400] }]} />
                <Text style={styles.filterText}>Open Now ({onlineCount})</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <FloatingIconButton
          name="location"
          onPress={handleRecenter}
          backgroundColor={theme.colors.white}
          color={theme.colors.primary.main}
          shadow
        />
        <FloatingIconButton
          name="user"
          onPress={() => navigation.navigate('Profile')}
          backgroundColor={theme.colors.primary.main}
          color={theme.colors.white}
          shadow
        />
      </View>

      {/* Draggable Bottom Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.bottomSheet, bottomSheetStyle]}>
          {/* Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          
          {/* Header */}
          <View style={styles.bottomSheetHeader}>
            <View>
              <Text style={styles.bottomSheetTitle}>Nearby Trucks</Text>
              <Text style={styles.bottomSheetSubtitle}>
                {onlineCount} {onlineCount === 1 ? 'truck' : 'trucks'} open now
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Favorites')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Icon name="forward" size={16} color={theme.colors.primary.main} />
            </TouchableOpacity>
          </View>

          {/* Quick Categories */}
          <View style={styles.quickCategoriesContainer}>
            <QuickCategoryButton icon="fire" label="Popular" color={theme.colors.error} />
            <QuickCategoryButton icon="star" label="Top Rated" color={theme.colors.warning} />
            <QuickCategoryButton icon="clock" label="Quick Bite" color={theme.colors.info} />
            <QuickCategoryButton icon="heart" label="Favorites" color="#E91E63" onPress={() => navigation.navigate('Favorites')} />
          </View>

          {/* Truck List */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.truckListContent}
            nestedScrollEnabled={true}
          >
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {filteredTrucks.map((truck, index) => (
                <TruckCardCompact
                  key={truck.id}
                  truck={truck}
                  userLocation={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  onPress={() => {
                    navigation.navigate('TruckDetails', {
                      truck,
                      userLocation: location?.coords,
                    });
                  }}
                  onNavigate={() => handleNavigate(truck)}
                  index={index}
                />
              ))}
            </ScrollView>

            {/* Promotional Banner */}
            <View style={styles.promoBanner}>
              <LinearGradient
                colors={theme.gradients.sunset}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.promoGradient}
              >
                <View style={styles.promoContent}>
                  <Text style={styles.promoTitle}>🌮 Taco Tuesday!</Text>
                  <Text style={styles.promoSubtitle}>Get 20% off at participating trucks</Text>
                </View>
                <Icon name="forward" size={24} color={theme.colors.white} />
              </LinearGradient>
            </View>

            {/* Recent Activity Section */}
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
              <View style={styles.recentGrid}>
                {filteredTrucks.slice(0, 4).map((truck) => (
                  <TouchableOpacity 
                    key={truck.id}
                    style={styles.recentItem}
                    onPress={() => navigation.navigate('TruckDetails', { truck, userLocation: location?.coords })}
                  >
                    <LinearGradient
                      colors={truck.isOnline ? theme.gradients.primary : [theme.colors.gray[300], theme.colors.gray[400]]}
                      style={styles.recentAvatar}
                    >
                      <Icon name="taco" size={20} color={theme.colors.white} />
                    </LinearGradient>
                    <Text style={styles.recentName} numberOfLines={1}>{truck.name.split(' ')[0]}</Text>
                    <View style={styles.recentRating}>
                      <Icon name="star" size={10} color={theme.colors.warning} />
                      <Text style={styles.recentRatingText}>{truck.rating}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

// Quick Category Button Component
const QuickCategoryButton = ({ 
  icon, 
  label, 
  color,
  onPress 
}: { 
  icon: 'fire' | 'star' | 'clock' | 'heart'; 
  label: string; 
  color: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.quickCategoryButton} onPress={onPress}>
    <View style={[styles.quickCategoryIcon, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={styles.quickCategoryLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: theme.borderRadius['2xl'],
    paddingHorizontal: theme.spacing.lg,
    height: 56,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  searchBarFocused: {
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.white,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[900],
    fontWeight: '500',
  },
  filterToggle: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius['2xl'],
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  filterToggleActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  advancedFilters: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 124 : 104,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.base,
    ...theme.shadows.lg,
    zIndex: 9,
  },
  filterChipContainer: {
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[100],
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary.main,
  },
  filterChipText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.gray[700],
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    paddingTop: theme.spacing.md,
  },
  sortLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.gray[600],
  },
  sortButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[100],
  },
  sortButtonActive: {
    backgroundColor: theme.colors.primary.main,
  },
  sortButtonText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.gray[700],
  },
  sortButtonTextActive: {
    color: theme.colors.white,
  },
  filterButtonsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    ...theme.shadows.md,
  },
  filterButtonActive: {
    backgroundColor: 'transparent',
  },
  filterButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  filterButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  filterText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.gray[700],
  },
  filterTextActive: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.white,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  fabContainer: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: Platform.OS === 'ios' ? 180 : 160,
    gap: theme.spacing.sm,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: -BOTTOM_SHEET_MAX_HEIGHT + BOTTOM_SHEET_MIN_HEIGHT,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_MAX_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: theme.colors.gray[300],
    borderRadius: 3,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  bottomSheetTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
  },
  bottomSheetSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  viewAllText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.primary.main,
  },
  truckListContent: {
    paddingBottom: theme.spacing.xl,
  },
  horizontalList: {
    paddingHorizontal: theme.spacing.md,
    paddingRight: theme.spacing.lg,
  },
  // Quick Categories
  quickCategoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  quickCategoryButton: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  quickCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCategoryLabel: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.gray[600],
  },
  // Promo Banner - Premium Style
  promoBanner: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FC466B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  promoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: theme.spacing.lg,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.white,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  promoSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  // Recent Section
  recentSection: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.md,
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  recentItem: {
    alignItems: 'center',
    width: 70,
  },
  recentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  recentName: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.gray[700],
    textAlign: 'center',
  },
  recentRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  recentRatingText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.gray[600],
  },
});

export default CustomerScreen;
