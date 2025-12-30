/**
 * Modern Favorites Screen
 * Premium list of favorite trucks with swipe actions
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { useAuth } from '@clerk/clerk-expo';
import { apiClient } from '../services/api';
import { TruckData } from '../types';
import { TruckCard } from '../components/TruckCard';
import { Icon, IconButton } from '../components/Icons';

const FavoritesScreen: React.FC = () => {
  const { getToken } = useAuth();
  const navigation = useNavigation<any>();
  const [favorites, setFavorites] = React.useState<TruckData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFavorites();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchFavorites = async () => {
    try {
      const token = await getToken();
      if (token) {
        apiClient.setAuthToken(token);
      }
      const res = await apiClient.get<TruckData[]>('/api/trucks/favorites');
      if (res.data) {
        setFavorites(res.data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton name="back" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>My Favorites</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.subtitle}>Your top taco spots! ❤️🌮</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {favorites.length > 0 ? (
          favorites.map((truck, index) => (
            <Animated.View 
              key={truck.id}
              entering={FadeInUp.delay(index * 100).springify()}
            >
               <TruckCard
                 truck={truck}
                 onPress={() => navigation.navigate('TruckDetails', { truck })}
                 onNavigate={() => {}}
                 index={index}
               />
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
             <Icon name="heart-outline" size={64} color={theme.colors.gray[300]} />
             <Text style={styles.emptyTitle}>No favorites yet</Text>
             <Text style={styles.emptyText}>Go find some delicious tacos and tap the heart icon!</Text>
          </View>
        )}
      </ScrollView>
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
    marginBottom: theme.spacing.sm,
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
  listContainer: {
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[800],
    marginTop: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[500],
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});

export default FavoritesScreen;
