/**
 * Modern Profile Screen
 * Premium profile UI with animated sections and gradient header
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { theme } from '../theme/theme';
import { Icon, IconButton } from '../components/Icons';
import { Button } from '../components/Button';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { apiClient } from '../services/api';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Customer'>;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  
  // Dynamic User Data
  const [profileData, setProfileData] = useState({
    name: user?.fullName || 'Taco Lover',
    email: user?.primaryEmailAddress?.emailAddress || '',
    phone: '',
    joinedDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently',
    avatar: user?.firstName ? user.firstName[0] : 'T',
    favoriteTrucks: 0,
    reviewsCount: 0,
    ordersCount: 0, // Mock for now
  });
  
  const [name, setName] = useState(profileData.name);
  const [phone, setPhone] = useState(profileData.phone);
  const [loading, setLoading] = useState(true);

  // Fetch full profile stats on focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProfileStats();
    }, [])
  );

  const fetchProfileStats = async () => {
    try {
      const token = await getToken();
      if (token) apiClient.setAuthToken(token);
      
      const res = await apiClient.get<{ profile: any }>('/api/auth/me'); // Using any to avoid strict type check on profile structure for now
      if (res.data) {
        const p = res.data.profile;
        const counts = p._count || {};
        
        setProfileData(prev => ({
          ...prev,
          phone: p.phone || '',
          favoriteTrucks: counts.favorites || 0,
          reviewsCount: counts.reviews || 0,
        }));
        setPhone(p.phone || '');
        setName(p.name || user?.fullName || '');
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      
      await apiClient.put('/api/auth/profile', {
        name,
        phone
      });
      
      setProfileData(prev => ({ ...prev, name, phone }));
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
       Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            await signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'CustomerLogin' as any }],
            });
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <Animated.View entering={FadeIn.duration(600)}>
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Edit Button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            <Icon 
              name={isEditing ? 'check' : 'edit'} 
              size={20} 
              color={theme.colors.white} 
            />
          </TouchableOpacity>

          {/* Avatar */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>{profileData.avatar}</Text>
              </LinearGradient>
            </View>
          </Animated.View>
          
          {/* User Info */}
          {!isEditing ? (
            <Animated.View entering={FadeIn.delay(300)} style={styles.headerInfo}>
              <Text style={styles.headerName}>{profileData.name}</Text>
              <Text style={styles.headerEmail}>{profileData.email}</Text>
              <View style={styles.memberBadge}>
                <Icon name="star" size={12} color={theme.colors.warning} />
                <Text style={styles.headerJoined}>Member since {profileData.joinedDate}</Text>
              </View>
            </Animated.View>
          ) : (
            <View style={styles.headerInfo}>
              <TextInput
                style={styles.editInput}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="rgba(255,255,255,0.7)"
              />
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Stats Cards */}
      <Animated.View 
        entering={FadeInUp.delay(200).springify()}
        style={styles.statsContainer}
      >
        <StatCard 
          value={profileData.favoriteTrucks} 
          label="Favorites" 
          icon="heart" 
          gradient={theme.gradients.sunset}
          delay={0}
        />
        <StatCard 
          value={profileData.ordersCount} 
          label="Orders" 
          icon="taco" 
          gradient={theme.gradients.primary}
          delay={100}
        />
        <StatCard 
          value={profileData.reviewsCount} 
          label="Reviews" 
          icon="star" 
          gradient={theme.gradients.gold}
          delay={200}
        />
      </Animated.View>

      {/* Account Settings */}
      <Animated.View 
        entering={FadeInUp.delay(300).springify()}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <SettingItem
          icon="heart"
          label="My Favorites"
          value={`${profileData.favoriteTrucks} trucks`}
          onPress={() => navigation.navigate('Favorites' as any)}
          delay={0}
        />
        <SettingItem
          icon="email"
          label="Email"
          value={profileData.email}
          delay={50}
        />
        <SettingItem
          icon="phone"
          label="Phone"
          value={isEditing ? undefined : phone}
          isEditing={isEditing}
          editValue={phone}
          onEditChange={setPhone}
          delay={100}
        />
        <SettingItem
          icon="notification"
          label="Notifications"
          value="Enabled"
          hasToggle
          delay={150}
        />
        <SettingItem
          icon="location"
          label="Location"
          value="Always Allow"
          delay={200}
          isLast
        />
      </Animated.View>

      {/* Preferences */}
      <Animated.View 
        entering={FadeInUp.delay(400).springify()}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <SettingItem
          icon="settings"
          label="Dark Mode"
          value="Off"
          hasToggle
          delay={0}
        />
        <SettingItem
          icon="settings"
          label="Language"
          value="English"
          delay={50}
        />
        <SettingItem
          icon="money"
          label="Payment Methods"
          value="2 cards"
          delay={100}
          isLast
        />
      </Animated.View>

      {/* Support */}
      <Animated.View 
        entering={FadeInUp.delay(500).springify()}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Support</Text>
        
        <SettingItem icon="info" label="Help Center" delay={0} />
        <SettingItem icon="info" label="Terms & Conditions" delay={50} />
        <SettingItem icon="lock" label="Privacy Policy" delay={100} isLast />
      </Animated.View>

      {/* Logout Button */}
      <Animated.View 
        entering={FadeInUp.delay(600).springify()}
        style={styles.logoutContainer}
      >
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          size="large"
          fullWidth
          leftIcon="logout"
        />
      </Animated.View>

      {/* Version */}
      <Text style={styles.version}>Version 1.0.0</Text>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// Stat Card Component
interface StatCardProps {
  value: number;
  label: string;
  icon: 'heart' | 'taco' | 'star';
  gradient: readonly [string, string, ...string[]];
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon, gradient, delay }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={SlideInRight.delay(delay).springify()}>
      <AnimatedTouchable
        style={[styles.statCard, animatedStyle]}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        activeOpacity={1}
      >
        <LinearGradient colors={gradient} style={styles.statGradient}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
          <Icon name={icon} size={24} color="rgba(255,255,255,0.5)" style={styles.statIcon} />
        </LinearGradient>
      </AnimatedTouchable>
    </Animated.View>
  );
};

// Setting Item Component
interface SettingItemProps {
  icon: any;
  label: string;
  value?: string; // Optional because we might be editing
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (text: string) => void;
  hasToggle?: boolean;
  delay: number;
  onPress?: () => void;
  isLast?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ 
  icon, 
  label, 
  value, 
  isEditing,
  editValue,
  onEditChange,
  hasToggle, 
  delay, 
  onPress,
  isLast 
}) => {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).springify()}
      style={[styles.settingItem, isLast && styles.settingItemLast]}
    >
      <TouchableOpacity 
        style={styles.settingContent}
        onPress={onPress}
        disabled={!onPress && !hasToggle}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Icon name={icon} size={20} color={theme.colors.primary.main} />
          </View>
          <Text style={styles.settingLabel}>{label}</Text>
        </View>
        
        <View style={styles.settingRight}>
          {isEditing && onEditChange ? (
             <TextInput 
                value={editValue} 
                onChangeText={onEditChange}
                style={styles.inlineInput}
                placeholder={label}
             />
          ) : (
             <Text style={styles.settingValue}>{value}</Text>
          )}
          
          {hasToggle && (
            <View style={styles.toggle}>
              <View style={styles.toggleKnob} />
            </View>
          )}
          
          {!hasToggle && onPress && (
            <Icon name="forward" size={16} color={theme.colors.gray[400]} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
    ...theme.shadows.lg,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerJoined: {
    color: theme.colors.warning,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  editButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  editInput: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 8,
      padding: 8,
      color: theme.colors.white,
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      minWidth: 200,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginTop: -40,
    marginBottom: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    height: 100,
    marginHorizontal: 4,
    borderRadius: 20,
    ...theme.shadows.md,
  },
  statGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  statIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    opacity: 0.3,
    transform: [{ scale: 2.5 }, { rotate: '-15deg' }],
  },

  // Sections
  section: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: 24,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.lg,
  },
  settingItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  settingItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.gray[800],
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginRight: 8,
  },
  inlineInput: {
      fontSize: 14,
      color: theme.colors.gray[800],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.primary.main,
      minWidth: 120,
      textAlign: 'right',
  },
  toggle: {
    width: 44,
    height: 24,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 12,
    padding: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    ...theme.shadows.sm,
  },
  logoutContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  version: {
    textAlign: 'center',
    color: theme.colors.gray[400],
    fontSize: 12,
    marginBottom: theme.spacing.xl,
  },
});

export default ProfileScreen;
