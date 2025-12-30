/**
 * Elite Vendor Screen
 * Premium dashboard with animated stats and glow effects
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { theme } from '../theme/theme';
import { LoadingState } from '../components/LoadingState';
import { Icon, IconButton } from '../components/Icons';
import { apiClient } from '../services/api';
import { socketService } from '../services/socketService';
import { authService } from '../services/authService';
import { useAuth } from '@clerk/clerk-expo';

type VendorScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Vendor'>;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const VendorScreen: React.FC = () => {
  const navigation = useNavigation<VendorScreenNavigationProp>();
  const { getToken } = useAuth();
  const [isLive, setIsLive] = useState<boolean>(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('Fetching address...');
  const [truckId, setTruckId] = useState<string | null>(null);
  const [truckName, setTruckName] = useState<string>('My Taco Truck');

  // Performance Stats
  const [hoursOnline, setHoursOnline] = useState<number>(0);
  const [profileViews, setProfileViews] = useState<number>(0);
  const [navigations, setNavigations] = useState<number>(0);
  const onlineStartTime = React.useRef<number | null>(null);
  const timerInterval = React.useRef<NodeJS.Timeout | null>(null);

  // Animations
  const pulseScale = useSharedValue(1);
  const statusGlow = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          setAddress(`${addr.street || ''} ${addr.city || ''}, ${addr.region || ''}`);
        }
      } catch (error) {
        setAddress('Address unavailable');
      }
    })();
    
    // Fetch truck info and connect socket
    (async () => {
      try {
        const token = await getToken();
        if (token) authService.setToken(token);
        
        const response = await authService.getCurrentUser();
        const user = response.user as any;
        
        if (user?.profile?.truck) {
          setTruckId(user.profile.truck.id);
          setTruckName(user.profile.truck.name || 'My Taco Truck');
          setIsLive(user.profile.truck.isOnline || false);
          
          // Set performance stats from truck data
          setProfileViews(user.profile.truck.viewCount || 0);
          setNavigations(user.profile.truck.navigationCount || 0);
          
          // Load saved location from backend if available
          if (user.profile.truck.location) {
            const savedLoc = user.profile.truck.location;
            if (savedLoc.address) {
              setAddress(savedLoc.address);
            }
            // Update map location to saved location
            if (savedLoc.latitude && savedLoc.longitude) {
              setLocation({
                coords: {
                  latitude: savedLoc.latitude,
                  longitude: savedLoc.longitude,
                  altitude: 0,
                  accuracy: 0,
                  altitudeAccuracy: 0,
                  heading: 0,
                  speed: 0,
                },
                timestamp: Date.now(),
              });
            }
          }
          
          // If truck is already online, start tracking time
          if (user.profile.truck.isOnline) {
            onlineStartTime.current = Date.now();
            startOnlineTimer();
          }
        }
        
        // Connect to socket
        socketService.connect();
      } catch (error) {
        console.error('Error fetching truck info:', error);
      }
    })();
    
    // Cleanup on unmount
    return () => {
      if (truckId && isLive) {
        socketService.goOffline(truckId);
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  // Timer function to track hours online
  const startOnlineTimer = () => {
    timerInterval.current = setInterval(() => {
      if (onlineStartTime.current) {
        const elapsed = (Date.now() - onlineStartTime.current) / 1000 / 60 / 60; // hours
        setHoursOnline(prev => prev + elapsed);
        onlineStartTime.current = Date.now(); // Reset for next interval
      }
    }, 60000); // Update every minute
  };

  const stopOnlineTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    // Add final elapsed time
    if (onlineStartTime.current) {
      const elapsed = (Date.now() - onlineStartTime.current) / 1000 / 60 / 60;
      setHoursOnline(prev => prev + elapsed);
      onlineStartTime.current = null;
    }
  };

  useEffect(() => {
    if (isLive) {
      // Pulse animation when live
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        true
      );
      statusGlow.value = withTiming(1, { duration: 500 });
      
      // Ring pulse effect
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(2, { duration: 1500, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 0 }),
          withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withSpring(1);
      statusGlow.value = withTiming(0, { duration: 500 });
      ringOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isLive]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(statusGlow.value, [0, 1], [0, 0.4]),
    transform: [{ scale: interpolate(statusGlow.value, [0, 1], [0.9, 1.1]) }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const toggleSwitch = async () => {
    const newStatus = !isLive;
    
    // 1. Optimistic Update
    setIsLive(newStatus);

    if (!truckId) return;

    try {
      if (newStatus) {
        // Going ONLINE
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        
        let addrString = address;
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          addrString = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''}`;
          setAddress(addrString);
        }

        // Persist to Backend
        await apiClient.put(`/api/trucks/${truckId}`, {
          isOnline: true,
          location: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            address: addrString,
          },
        });
        
        // Emit Socket
        socketService.goOnline(
          truckId, 
          currentLocation.coords.latitude, 
          currentLocation.coords.longitude
        );
        console.log('🟢 Truck is now ONLINE (DB + Socket)');

        // Start Timer
        onlineStartTime.current = Date.now();
        startOnlineTimer();
        
        Alert.alert("🚀 You're Live!", "Customers can now see your truck on the map.");
      } else {
        // Going OFFLINE
        stopOnlineTimer();
        
        // Persist to Backend
        await apiClient.put(`/api/trucks/${truckId}`, {
          isOnline: false,
        });

        // Emit Socket
        socketService.goOffline(truckId);
        console.log('🔴 Truck is now OFFLINE (DB + Socket)');

        Alert.alert("📴 You're Offline", "Your truck is now hidden from the map.");
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setIsLive(!newStatus); // Revert on error
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  if (!location && !errorMsg) {
    return <LoadingState message="Setting up your dashboard..." />;
  }

  return (
    <View style={styles.container}>
      {/* Dark Aurora Background */}
      <LinearGradient
        colors={isLive ? ['#0B3D2E', '#1A4D3E', '#0F3D2D'] : ['#1A1A2E', '#16213E', '#0F0F23']}
        style={styles.backgroundGradient}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.springify()}
          style={styles.header}
        >
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.headerTitle}>Truck Dashboard</Text>
          </View>
          <IconButton
            name="settings"
            size={24}
            color="rgba(255,255,255,0.8)"
            onPress={() => navigation.navigate('VendorProfile')}
          />
        </Animated.View>

        {/* Premium Status Card */}
        <Animated.View 
          entering={FadeInUp.delay(100).springify()}
          style={styles.statusCardWrapper}
        >
          {/* Glow Effect Behind Card */}
          {isLive && (
            <Animated.View style={[styles.cardGlow, glowAnimatedStyle]}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.glowGradient}
              />
            </Animated.View>
          )}
          
          <Animated.View style={[styles.statusCard, pulseAnimatedStyle]}>
            <View style={styles.statusContent}>
              <View style={styles.statusLeft}>
                {/* Status Indicator with Ring Effect */}
                <View style={styles.statusIndicatorWrapper}>
                  {isLive && (
                    <Animated.View style={[styles.statusRing, ringAnimatedStyle]} />
                  )}
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: isLive ? theme.colors.success : theme.colors.gray[500] }
                  ]}>
                    <Icon 
                      name={isLive ? 'live' : 'offline'} 
                      size={24} 
                      color={theme.colors.white} 
                    />
                  </View>
                </View>
                
                <View>
                  <Text style={styles.statusLabel}>Current Status</Text>
                  <Text style={[
                    styles.statusText,
                    { color: isLive ? theme.colors.success : theme.colors.gray[400] }
                  ]}>
                    {isLive ? 'BROADCASTING LIVE' : 'OFFLINE'}
                  </Text>
                  {isLive && (
                    <Text style={styles.liveSubtext}>Visible to customers nearby</Text>
                  )}
                </View>
              </View>
              
              <Switch
                trackColor={{ false: theme.colors.gray[600], true: theme.colors.success }}
                thumbColor={theme.colors.white}
                ios_backgroundColor={theme.colors.gray[600]}
                onValueChange={toggleSwitch}
                value={isLive}
                style={styles.switch}
              />
            </View>
          </Animated.View>
        </Animated.View>

        {/* Today's Earnings Card */}
        <Animated.View 
          entering={FadeInUp.delay(200).springify()}
          style={styles.earningsCard}
        >
          <View style={styles.earningsLeft}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.earningsIconBg}
            >
              <Icon name="star" size={24} color={theme.colors.white} />
            </LinearGradient>
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsLabel}>Today's Earnings</Text>
              <Text style={styles.earningsValue}>$0.00</Text>
            </View>
          </View>
          <View style={styles.earningsRight}>
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatValue}>0</Text>
              <Text style={styles.earningsStatLabel}>Orders</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsStat}>
              <Text style={styles.earningsStatValue}>0</Text>
              <Text style={styles.earningsStatLabel}>Pending</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats Grid - Premium Design */}
        <Animated.View 
          entering={FadeInUp.delay(300).springify()}
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>Today's Performance</Text>
        </Animated.View>
        
        <View style={styles.statsGrid}>
          <StatCard 
            value={hoursOnline.toFixed(1)} 
            label="Hours Online" 
            icon="clock" 
            gradient={['#FF6B35', '#FF8E53']} 
            delay={0} 
          />
          <StatCard 
            value={profileViews.toString()} 
            label="Profile Views" 
            icon="eye" 
            gradient={['#667EEA', '#764BA2']} 
            delay={100} 
          />
          <StatCard 
            value={navigations.toString()} 
            label="Navigations" 
            icon="navigate" 
            gradient={['#10B981', '#059669']} 
            delay={200} 
          />
        </View>

        {/* Location Card */}
        {location && (
          <Animated.View 
            entering={FadeInUp.delay(400).springify()}
            style={styles.locationCard}
          >
            <View style={styles.cardHeader}>
              <Icon name="location" size={20} color={theme.colors.primary.main} />
              <Text style={styles.cardTitle}>Current Location</Text>
            </View>
            
            {/* Mini Map */}
            <View style={styles.miniMapContainer}>
              <MapView
                style={styles.miniMap}
                provider={PROVIDER_GOOGLE}
                region={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                >
                  <LinearGradient
                    colors={theme.gradients.primary}
                    style={styles.customMarker}
                  >
                    <Icon name="truck" size={18} color={theme.colors.white} />
                  </LinearGradient>
                </Marker>
              </MapView>
            </View>

            {/* Address */}
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Address</Text>
              <Text style={styles.addressText}>{address}</Text>
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View 
          entering={FadeInUp.delay(500).springify()}
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </Animated.View>
        
        <View style={styles.actionsGrid}>
          <ActionButton 
            icon="food" 
            label="Menu" 
            onPress={() => navigation.navigate('MenuManagement')}
            delay={0}
            gradient={['#FF6B35', '#F7931E']}
          />
          <ActionButton 
            icon="camera" 
            label="Photos" 
            onPress={() => navigation.navigate('PhotoGallery')}
            delay={50}
            gradient={['#FC466B', '#3F5EFB']}
          />
          <ActionButton 
            icon="clock" 
            label="Hours" 
            onPress={() => navigation.navigate('OperatingHours')}
            delay={100}
            gradient={['#4ECDC4', '#44A08D']}
          />
          <ActionButton 
            icon="gift" 
            label="Offers" 
            onPress={() => navigation.navigate('SpecialOffers')}
            delay={150}
            gradient={['#F7931E', '#FFD700']}
          />
        </View>

        {/* Error Display */}
        {errorMsg && (
          <Animated.View entering={FadeIn} style={styles.errorCard}>
            <Icon name="warning" size={20} color={theme.colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// Premium Stat Card Component
interface StatCardProps {
  value: string;
  label: string;
  icon: 'clock' | 'eye' | 'navigate';
  gradient: readonly [string, string];
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon, gradient, delay }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View 
      entering={SlideInRight.delay(delay).springify()} 
      style={styles.statCardWrapper}
    >
      <AnimatedTouchable
        style={[styles.statCard, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        activeOpacity={1}
      >
        <LinearGradient 
          colors={gradient} 
          style={styles.statGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statIconContainer}>
            <Icon name={icon} size={22} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </LinearGradient>
      </AnimatedTouchable>
    </Animated.View>
  );
};

// Action Button Component
interface ActionButtonProps {
  icon: 'food' | 'camera' | 'clock' | 'gift';
  label: string;
  onPress: () => void;
  delay: number;
  gradient: readonly [string, string];
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, delay, gradient }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()}>
      <AnimatedTouchable
        style={[styles.actionButton, animatedStyle]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.92); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        activeOpacity={1}
      >
        <LinearGradient
          colors={gradient}
          style={styles.actionIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name={icon} size={24} color={theme.colors.white} />
        </LinearGradient>
        <Text style={styles.actionLabel}>{label}</Text>
      </AnimatedTouchable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.white,
  },
  statusCardWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
  },
  cardGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: theme.borderRadius['2xl'] + 10,
    overflow: 'hidden',
  },
  glowGradient: {
    width: '100%',
    height: '100%',
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  statusIndicatorWrapper: {
    position: 'relative',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  statusText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
  },
  liveSubtext: {
    fontSize: theme.typography.fontSizes.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.base,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.white,
    marginBottom: 2,
  },
  profileDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  statGradient: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  statIconContainer: {
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  locationCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.white,
  },
  miniMapContainer: {
    height: 160,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.base,
  },
  miniMap: {
    flex: 1,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  addressContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  addressLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  addressText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeights.medium,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: theme.typography.fontWeights.medium,
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    flex: 1,
  },
  // Earnings Card Styles
  earningsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  earningsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  earningsIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsInfo: {
    gap: 2,
  },
  earningsLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  earningsValue: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.success,
  },
  earningsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  earningsStat: {
    alignItems: 'center',
  },
  earningsStatValue: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.white,
  },
  earningsStatLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  earningsDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

export default VendorScreen;
