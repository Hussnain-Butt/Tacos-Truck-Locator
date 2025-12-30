/**
 * Modern Truck Details Screen
 * Premium UI with parallax header, sticky tabs, and animated content
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Linking,
  Share,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import type { RootStackParamList } from '../../App';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon, IconButton, FloatingIconButton } from '../components/Icons';
import { calculateDistance, formatDistance } from '../utils/locationUtils';
import { truckService } from '../services/truckService';
import { apiClient } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 300;
const TAB_BAR_HEIGHT = 48;

type TruckDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TruckDetails'>;
type TruckDetailsScreenRouteProp = RouteProp<RootStackParamList, 'TruckDetails'>;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Interfaces matching backend response
interface TruckDetails {
  id: string;
  name: string;
  description: string;
  specialty: string;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
  isOnline: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  vendor: {
    avatarUrl: string;
    phone: string;
  };
  menu: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    isPopular: boolean;
    imageUrl: string;
  }[];
  hours: {
    dayOfWeek: string;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[];
  photos: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
  offers: {
    id: string;
    title: string;
    description: string;
    discount: string;
    code: string;
    endDate: string;
    isActive: boolean;
  }[];
  reviews: any[];
  favoritedBy?: { id: string }[];
}

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  customer: {
    name: string;
    avatarUrl: string;
  };
}

const TruckDetailsScreen: React.FC = () => {
  const navigation = useNavigation<TruckDetailsScreenNavigationProp>();
  const route = useRoute<TruckDetailsScreenRouteProp>();
  const { truck: initialTruck, userLocation } = route.params;
  const { getToken, userId } = useAuth();

  const [activeTab, setActiveTab] = useState<'menu' | 'about' | 'reviews'>('menu');
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Real data state
  const [truckDetails, setTruckDetails] = useState<TruckDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Record view and fetch details
  useEffect(() => {
    truckService.recordView(initialTruck.id);
    fetchTruckDetails();
  }, [initialTruck.id]);

  const fetchTruckDetails = async () => {
    try {
      const token = await getToken();
      if (token) {
         apiClient.setAuthToken(token);
      }
      
      const res = await apiClient.get<TruckDetails>(`/api/trucks/${initialTruck.id}`);
      if (res.data) {
        setTruckDetails(res.data);
      }
      
      fetchReviews();
      checkFavorite();
      
    } catch (error) {
      console.error('Error fetching truck details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const checkFavorite = async () => {
      // Placeholder. Assuming false for now.
  }

  const fetchReviews = async () => {
    setReviewLoading(true);
    try {
      const res = await apiClient.get<Review[]>(`/api/trucks/${initialTruck.id}/reviews`);
      if (res.data) {
        setReviews(res.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const token = await getToken();
      if (!token) {
          Alert.alert('Sign In Required', 'Please sign in to favorite trucks');
          return;
      }
      
      const previousState = isFavorite;
      setIsFavorite(!previousState); // Optimistic update
      
      const res = await apiClient.post<{ isFavorite: boolean }>(`/api/trucks/${initialTruck.id}/favorite`, {});
      if (res.data) {
        setIsFavorite(res.data.isFavorite);
      }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        setIsFavorite(isFavorite); // Revert
    }
  };
  
  const handleSubmitReview = async () => {
      if (!rating) {
          Alert.alert('Error', 'Please select a rating');
          return;
      }
      
      setSubmittingReview(true);
      try {
          await apiClient.post(`/api/trucks/${initialTruck.id}/reviews`, {
              rating,
              title: reviewTitle,
              comment: reviewComment
          });
          
          setShowReviewModal(false);
          setReviewTitle('');
          setReviewComment('');
          setRating(5);
          Alert.alert('Success', 'Review submitted successfully!');
          fetchReviews();
          
          // Refresh truck details to update rating
          const res = await apiClient.get<TruckDetails>(`/api/trucks/${initialTruck.id}`);
          if (res.data) setTruckDetails(res.data);
          
      } catch (error: any) {
          const msg = error?.response?.data?.message || 'Failed to submit review';
          Alert.alert('Error', msg);
      } finally {
          setSubmittingReview(false);
      }
  };
  
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Display data (prefer fetched, fallback to initial)
  const displayTruck = truckDetails || initialTruck;
  // Use fetched photos, then initial photos, then fallback
  const validPhotos = truckDetails?.photos?.length ? truckDetails.photos : (initialTruck?.photos || []);
  const coverPhoto = validPhotos.find(p => p.isPrimary)?.url 
    || validPhotos[0]?.url
    || 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=1000&q=80';

  // Animated Header Styles
  const headerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0],
      [1.5, 1],
      Extrapolation.CLAMP
    );
    
    const translateY = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
      [0, 0, HEADER_HEIGHT * 0.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { scale: scale },
        { translateY: translateY }
      ] as any,
    };
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HEADER_HEIGHT - 100, HEADER_HEIGHT - 50],
      [0, 1],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  const handleCall = () => {
    if (displayTruck.phone || displayTruck.vendor?.phone) {
      Linking.openURL(`tel:${displayTruck.phone || displayTruck.vendor?.phone}`);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${displayTruck.name} on Taco Truck Locator! 🌮`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleNavigate = () => {
    if (displayTruck.location) {
        truckService.recordNavigation(displayTruck.id);
        const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
        const url = Platform.select({
        ios: `${scheme}?q=${displayTruck.location.address}&ll=${displayTruck.location.latitude},${displayTruck.location.longitude}`,
        android: `${scheme}${displayTruck.location.latitude},${displayTruck.location.longitude}(${displayTruck.name})`
        });
        if (url) Linking.openURL(url);
    }
  };

  // Group menu items by category
  const menuCategories = truckDetails?.menu 
    ? [...new Set(truckDetails.menu.map(item => item.category))]
    : [];

  const renderContent = () => {
    if (loading) {
       return (
           <View style={{padding: 40, alignItems: 'center'}}>
               <ActivityIndicator size="large" color={theme.colors.primary.main} />
           </View>
       );
    }

    switch (activeTab) {
      case 'menu':
        return (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
            {/* Special Offers Section */}
            {truckDetails?.offers && truckDetails.offers.length > 0 && (
              <View style={styles.offersSection}>
                <Text style={styles.sectionTitle}>Special Offers 🎉</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal: -theme.spacing.base, paddingHorizontal: theme.spacing.base}}>
                  {truckDetails.offers.map((offer, index) => (
                    <LinearGradient
                      key={offer.id}
                      colors={theme.gradients.primary}
                      style={styles.offerCard}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                    >
                      <View style={styles.offerBadge}>
                        <Icon name="gift" size={12} color={theme.colors.primary.main} />
                        <Text style={styles.offerBadgeText}>{offer.discount || 'Special'}</Text>
                      </View>
                      <Text style={styles.offerTitle}>{offer.title}</Text>
                      <Text style={styles.offerDesc}>{offer.description}</Text>
                      {offer.code && (
                        <View style={styles.promoCode}>
                           <Text style={styles.promoText}>{offer.code}</Text>
                        </View>
                      )}
                    </LinearGradient>
                  ))}
                </ScrollView>
              </View>
            )}

            {menuCategories.length === 0 ? (
               <View style={styles.emptyState}>
                 <Icon name="food" size={40} color={theme.colors.gray[300]} />
                 <Text style={styles.emptyText}>No menu items yet</Text>
               </View>
            ) : (
                menuCategories.map(category => (
                <View key={category} style={styles.menuCategory}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    {truckDetails?.menu
                    .filter(item => item.category === category)
                    .map((item, index) => (
                        <View key={item.id} style={styles.menuItem}>
                        <View style={styles.menuItemContent}>
                            <View style={styles.menuItemHeader}>
                                <Text style={styles.menuItemName}>{item.name}</Text>
                                <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                            </View>
                            <Text style={styles.menuItemDesc}>{item.description}</Text>
                            {item.isPopular && (
                                <View style={styles.popularBadge}>
                                <Icon name="star" size={10} color={theme.colors.warning} />
                                <Text style={styles.popularText}>Popular</Text>
                                </View>
                            )}
                        </View>
                        {item.imageUrl && (
                            <Image source={{ uri: item.imageUrl }} style={styles.menuItemImage} />
                        )}
                        </View>
                    ))}
                </View>
                ))
            )}
          </Animated.View>
        );

      case 'about':
        return (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
             <Text style={styles.aboutText}>{displayTruck.description || 'No description available.'}</Text>
             
             {/* Operating Hours */}
             {truckDetails?.hours && truckDetails.hours.length > 0 && (
                <View style={styles.hoursContainer}>
                    <Text style={styles.sectionTitle}>Operating Hours 🕒</Text>
                    {truckDetails.hours.map(day => (
                        <View key={day.dayOfWeek} style={styles.hourRow}>
                            <Text style={styles.dayText}>{day.dayOfWeek.charAt(0) + day.dayOfWeek.slice(1).toLowerCase()}</Text>
                            <Text style={[styles.timeText, day.isClosed && styles.closedText]}>
                                {day.isClosed ? 'Closed' : `${day.openTime} - ${day.closeTime}`}
                            </Text>
                        </View>
                    ))}
                </View>
             )}

             {/* Photo Gallery */}
             {truckDetails?.photos && truckDetails.photos.length > 0 && (
                 <View style={styles.galleryContainer}>
                    <Text style={styles.sectionTitle}>Gallery 📸</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {truckDetails.photos.map(photo => (
                            <Image key={photo.id} source={{ uri: photo.url }} style={styles.galleryImage} />
                        ))}
                    </ScrollView>
                 </View>
             )}
          </Animated.View>
        );

      case 'reviews':
        return (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
             <Button 
                title="Write a Review" 
                variant="outline" 
                onPress={() => setShowReviewModal(true)}
                style={{marginBottom: theme.spacing.lg}}
             />
             
             {reviewLoading ? (
                 <ActivityIndicator color={theme.colors.primary.main} />
             ) : reviews.length === 0 ? (
                 <View style={styles.emptyState}>
                     <Icon name="star" size={40} color={theme.colors.gray[300]} />
                     <Text style={styles.emptyText}>No reviews yet. Be the first!</Text>
                 </View>
             ) : (
                 reviews.map(review => (
                     <View key={review.id} style={styles.reviewCard}>
                         <View style={styles.reviewHeader}>
                             <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                 <Image 
                                    source={{ uri: review.customer?.avatarUrl || 'https://via.placeholder.com/40' }} 
                                    style={styles.reviewerAvatar} 
                                 />
                                 <View>
                                     <Text style={styles.reviewerName}>{review.customer?.name || 'Anonymous'}</Text>
                                     <View style={{flexDirection: 'row'}}>
                                         {[1,2,3,4,5].map(star => (
                                             <Icon 
                                                key={star} 
                                                name="star" 
                                                size={12} 
                                                color={star <= review.rating ? theme.colors.warning : theme.colors.gray[300]} 
                                             />
                                         ))}
                                     </View>
                                 </View>
                             </View>
                             <Text style={styles.reviewDate}>
                                 {new Date(review.createdAt).toLocaleDateString()}
                             </Text>
                         </View>
                         {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
                         {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                     </View>
                 ))
             )}
          </Animated.View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <Animated.View style={[styles.stickyHeader, stickyHeaderStyle]}>
        <View style={styles.stickyHeaderContent}>
           <Text style={styles.stickyTitle}>{displayTruck.name}</Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Parallax Header */}
        <View style={styles.headerContainer}>
          <Animated.Image
            source={{ uri: coverPhoto }}
            style={[styles.headerImage, headerStyle]}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.headerGradient}
          />
          
          <Animated.View 
            entering={FadeInUp.delay(200)}
            style={styles.headerContent}
          >
            {displayTruck.isOnline && (
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>LIVE NOW</Text>
              </View>
            )}
            <Text style={styles.truckName}>{displayTruck.name}</Text>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color={theme.colors.warning} />
              <Text style={styles.ratingText}>{Number(displayTruck.rating || 0).toFixed(1)} ({displayTruck.reviewCount || 0} reviews)</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.specialty}>{displayTruck.specialty}</Text>
            </View>
            
            {displayTruck.location && (
               <View style={styles.addressRow}>
                 <Icon name="location" size={14} color={theme.colors.gray[300]} />
                 <Text style={styles.addressText} numberOfLines={1}>{displayTruck.location.address}</Text>
               </View>
             )}
             
            {userLocation && displayTruck.location && (
              <View style={styles.distanceBadge}>
                <Icon name="navigate" size={12} color={theme.colors.white} />
                <Text style={styles.distanceText}>
                  {formatDistance(calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    displayTruck.location.latitude,
                    displayTruck.location.longitude
                  ))}
                </Text>
              </View>
            )}
            
            {/* Favorite Button */}
            <FloatingIconButton 
                name={isFavorite ? "heart-filled" : "heart"}
                color={isFavorite ? theme.colors.error : theme.colors.white}
                onPress={handleToggleFavorite}
                style={styles.favoriteButton}
            />
          </Animated.View>
        </View>

        {/* Action Buttons - Moved outside header container for visibility */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <View style={styles.actionIcon}>
              <Icon name="phone" size={20} color={theme.colors.primary.main} />
            </View>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={handleNavigate}>
            <View style={[styles.actionIcon, styles.primaryAction]}>
                <Icon name="navigate" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.actionLabel}>Go</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <View style={styles.actionIcon}>
              <Icon name="share" size={20} color={theme.colors.primary.main} />
            </View>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {(['menu', 'about', 'reviews'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {renderContent()}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

       {/* Back Button */}
       <View style={styles.backButtonContainer}>
          <IconButton 
            name="back" 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            color={theme.colors.white}
          />
       </View>
       
       {/* Review Modal */}
       <Modal
          visible={showReviewModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowReviewModal(false)}
       >
           <View style={styles.modalContainer}>
               <View style={styles.modalHeader}>
                   <Text style={styles.modalTitle}>Write a Review</Text>
                   <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                       <Icon name="close" size={24} color={theme.colors.gray[500]} />
                   </TouchableOpacity>
               </View>
               
               <ScrollView style={styles.modalContent}>
                   <Text style={styles.label}>Rating</Text>
                   <View style={styles.ratingSelect}>
                       {[1,2,3,4,5].map(star => (
                           <TouchableOpacity key={star} onPress={() => setRating(star)}>
                               <Icon 
                                    name="star" 
                                    size={32} 
                                    color={star <= rating ? theme.colors.warning : theme.colors.gray[300]} 
                                />
                           </TouchableOpacity>
                       ))}
                   </View>
                   
                   <Text style={styles.label}>Title (Optional)</Text>
                   <TextInput
                       style={styles.input}
                       placeholder="e.g. Best Tacos Ever!"
                       value={reviewTitle}
                       onChangeText={setReviewTitle}
                   />
                   
                   <Text style={styles.label}>Review</Text>
                   <TextInput
                       style={[styles.input, styles.textArea]}
                       placeholder="Tell us about your experience..."
                       multiline
                       numberOfLines={4}
                       value={reviewComment}
                       onChangeText={setReviewComment}
                   />
                   
                   <Button 
                       title="Submit Review"
                       loading={submittingReview}
                       onPress={handleSubmitReview}
                       style={{marginTop: theme.spacing.lg}}
                   />
               </ScrollView>
           </View>
       </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    zIndex: 100,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    ...theme.shadows.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stickyTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    backgroundColor: theme.colors.gray[900],
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
  },
  headerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    paddingBottom: 40, // Increased for action buttons overlap
  },
  truckName: {
    fontSize: 28,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.white,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    color: theme.colors.white,
    marginLeft: 4,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  dot: {
    color: theme.colors.white,
    marginHorizontal: 8,
  },
  specialty: {
    color: theme.colors.gray[300],
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginBottom: 8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.white,
    marginRight: 6,
  },
  onlineText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addressText: {
    color: theme.colors.gray[300],
    fontSize: theme.typography.fontSizes.sm,
    marginLeft: 4,
    flex: 1,
  },
  distanceBadge: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  distanceText: {
    color: theme.colors.white,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    marginTop: -30,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
    marginBottom: 4,
  },
  primaryAction: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary.main,
    marginBottom: 8, // Lift up
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.gray[700],
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
    paddingHorizontal: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 0,
  },
  tabText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: '600',
    color: theme.colors.gray[500],
  },
  activeTabText: {
    color: theme.colors.primary.main,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.primary.main,
  },
  contentContainer: {
    padding: theme.spacing.base,
    minHeight: SCREEN_HEIGHT,
    backgroundColor: theme.colors.background,
  },
  tabContent: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  // Offers
  offersSection: {
    marginBottom: theme.spacing.xl,
  },
  offerCard: {
    width: 240,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.md,
    height: 120,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  offerBadgeText: {
    color: theme.colors.primary.main,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  offerTitle: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  offerDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  promoCode: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
  },
  promoText: {
    color: theme.colors.white,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Menu
  menuCategory: {
    marginBottom: theme.spacing.xl,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  menuItemContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[900],
    flex: 1,
    marginRight: 8,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary.main,
  },
  menuItemDesc: {
    fontSize: 13,
    color: theme.colors.gray[500],
    lineHeight: 18,
  },
  menuItemImage: {
    width: 70,
    height: 70,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[100],
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: theme.colors.warning + '20',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularText: {
    fontSize: 10,
    color: theme.colors.warning,
    marginLeft: 3,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: theme.colors.gray[400],
    marginTop: 8,
  },

  // About
  aboutText: {
    fontSize: 14,
    color: theme.colors.gray[600],
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  hoursContainer: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[50],
  },
  dayText: {
    fontSize: 14,
    color: theme.colors.gray[900],
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.gray[600],
  },
  closedText: {
    color: theme.colors.error,
  },
  
  // Gallery
  galleryContainer: {
    marginBottom: theme.spacing.xl,
  },
  galleryImage: {
    width: 200,
    height: 140,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.md,
  },

  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 24,
    left: theme.spacing.md,
    zIndex: 100,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      width: 40,
      height: 40,
      borderRadius: 20,
      zIndex: 101, // Above everything
  },
  
  // Reviews
  reviewCard: {
      backgroundColor: theme.colors.white,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
  },
  reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
  },
  reviewerAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 8,
  },
  reviewerName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.gray[900],
  },
  reviewDate: {
      fontSize: 12,
      color: theme.colors.gray[500],
  },
  reviewTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.gray[900],
      marginTop: 4,
      marginBottom: 2,
  },
  reviewComment: {
      fontSize: 14,
      color: theme.colors.gray[700],
      lineHeight: 20,
  },
  
  // Modal
  modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      marginTop: 60, // Leave space for swipe down
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      ...theme.shadows.xl,
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.gray[100],
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.gray[900],
  },
  modalContent: {
      padding: theme.spacing.lg,
  },
  label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.gray[700],
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
  },
  input: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      fontSize: 16,
  },
  textArea: {
      height: 120,
      textAlignVertical: 'top',
  },
  ratingSelect: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.white,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
  },
});

export default TruckDetailsScreen;
