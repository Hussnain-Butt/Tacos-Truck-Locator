// Enhanced Mock Data with Reviews, Photos, Menu Items, etc.

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'tacos' | 'burritos' | 'drinks' | 'sides' | 'desserts';
  image: string;
  popular: boolean;
  vegetarian: boolean;
  spicy: number; // 0-3
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  photos?: string[];
}

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discount: number; // percentage
  validUntil: string;
  active: boolean;
}

export interface OperatingHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

export interface TruckData {
  id: string;
  name: string;
  description: string;
  specialty: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  isOnline: boolean;
  rating: number;
  reviewCount: number;
  priceRange: string;
  phone: string;
  email: string;
  website?: string;
  coverPhoto: string;
  photos: string[];
  menu: MenuItem[];
  reviews: Review[];
  operatingHours: OperatingHours[];
  specialOffers: SpecialOffer[];
  tags: string[];
  story: string;
}

// Sample Menu Items
const sampleMenu: MenuItem[] = [
  {
    id: 'm1',
    name: 'Classic Beef Taco',
    description: 'Seasoned ground beef, lettuce, cheese, tomato, sour cream',
    price: 3.99,
    category: 'tacos',
    image: '🌮',
    popular: true,
    vegetarian: false,
    spicy: 1,
  },
  {
    id: 'm2',
    name: 'Grilled Chicken Taco',
    description: 'Marinated grilled chicken, pico de gallo, cilantro lime sauce',
    price: 4.49,
    category: 'tacos',
    image: '🌮',
    popular: true,
    vegetarian: false,
    spicy: 2,
  },
  {
    id: 'm3',
    name: 'Veggie Fiesta Taco',
    description: 'Black beans, corn, peppers, onions, guacamole',
    price: 3.49,
    category: 'tacos',
    image: '🌮',
    popular: false,
    vegetarian: true,
    spicy: 0,
  },
  {
    id: 'm4',
    name: 'Spicy Fish Taco',
    description: 'Crispy fish, cabbage slaw, chipotle mayo, lime',
    price: 5.99,
    category: 'tacos',
    image: '🐟',
    popular: true,
    vegetarian: false,
    spicy: 3,
  },
  {
    id: 'm5',
    name: 'Carnitas Taco',
    description: 'Slow-cooked pork, onions, cilantro, salsa verde',
    price: 4.99,
    category: 'tacos',
    image: '🌮',
    popular: true,
    vegetarian: false,
    spicy: 2,
  },
  {
    id: 'm6',
    name: 'California Burrito',
    description: 'Carne asada, fries, cheese, sour cream, guacamole',
    price: 9.99,
    category: 'burritos',
    image: '🌯',
    popular: true,
    vegetarian: false,
    spicy: 1,
  },
  {
    id: 'm7',
    name: 'Breakfast Burrito',
    description: 'Scrambled eggs, bacon, cheese, hash browns, salsa',
    price: 7.99,
    category: 'burritos',
    image: '🌯',
    popular: false,
    vegetarian: false,
    spicy: 0,
  },
  {
    id: 'm8',
    name: 'Horchata',
    description: 'Traditional rice milk with cinnamon',
    price: 2.99,
    category: 'drinks',
    image: '🥛',
    popular: true,
    vegetarian: true,
    spicy: 0,
  },
  {
    id: 'm9',
    name: 'Jamaica',
    description: 'Hibiscus flower iced tea',
    price: 2.99,
    category: 'drinks',
    image: '🧃',
    popular: false,
    vegetarian: true,
    spicy: 0,
  },
  {
    id: 'm10',
    name: 'Chips & Guacamole',
    description: 'Fresh tortilla chips with homemade guacamole',
    price: 4.99,
    category: 'sides',
    image: '🥑',
    popular: true,
    vegetarian: true,
    spicy: 0,
  },
];

// Sample Reviews
const sampleReviews: Review[] = [
  {
    id: 'r1',
    userId: 'u1',
    userName: 'Sarah Johnson',
    userAvatar: '👩',
    rating: 5,
    comment: 'Best tacos in town! The fish tacos are absolutely amazing. Fresh ingredients and great service!',
    date: '2024-01-15',
    photos: ['🌮', '🌯'],
  },
  {
    id: 'r2',
    userId: 'u2',
    userName: 'Mike Chen',
    userAvatar: '👨',
    rating: 4,
    comment: 'Really good food. The California burrito is huge! Only downside is sometimes they run out of horchata.',
    date: '2024-01-10',
  },
  {
    id: 'r3',
    userId: 'u3',
    userName: 'Emily Rodriguez',
    userAvatar: '👩‍🦰',
    rating: 5,
    comment: 'Amazing truck! Love the carnitas tacos. Always fresh and the staff is super friendly.',
    date: '2024-01-08',
    photos: ['🌮'],
  },
  {
    id: 'r4',
    userId: 'u4',
    userName: 'James Wilson',
    userAvatar: '👨‍🦱',
    rating: 5,
    comment: 'My go-to spot for lunch! Never disappoints. The veggie options are great too!',
    date: '2024-01-05',
  },
  {
    id: 'r5',
    userId: 'u5',
    userName: 'Lisa Park',
    userAvatar: '👩‍🦳',
    rating: 4,
    comment: 'Solid tacos, good portions. The spicy salsa is no joke! 🔥',
    date: '2024-01-03',
  },
];

// Operating Hours
const operatingHours: OperatingHours[] = [
  { day: 'Monday', open: '11:00 AM', close: '9:00 PM', isOpen: true },
  { day: 'Tuesday', open: '11:00 AM', close: '9:00 PM', isOpen: true },
  { day: 'Wednesday', open: '11:00 AM', close: '9:00 PM', isOpen: true },
  { day: 'Thursday', open: '11:00 AM', close: '10:00 PM', isOpen: true },
  { day: 'Friday', open: '11:00 AM', close: '11:00 PM', isOpen: true },
  { day: 'Saturday', open: '10:00 AM', close: '11:00 PM', isOpen: true },
  { day: 'Sunday', open: '10:00 AM', close: '8:00 PM', isOpen: true },
];

// Special Offers
const specialOffers: SpecialOffer[] = [
  {
    id: 'o1',
    title: 'Taco Tuesday!',
    description: 'Buy 2 tacos, get 1 free',
    discount: 33,
    validUntil: '2024-12-31',
    active: true,
  },
  {
    id: 'o2',
    title: 'Happy Hour',
    description: '20% off drinks from 3-5 PM',
    discount: 20,
    validUntil: '2024-12-31',
    active: true,
  },
];

// Enhanced Mock Trucks
export const generateEnhancedMockTrucks = (
  userLocation: { latitude: number; longitude: number }
): TruckData[] => {
  const trucks: TruckData[] = [
    {
      id: '1',
      name: "Mario's Taco Paradise",
      description: 'Authentic Mexican street tacos made with love',
      specialty: 'Street Tacos',
      location: {
        latitude: userLocation.latitude + 0.01,
        longitude: userLocation.longitude + 0.01,
        address: '123 Main St, Downtown',
      },
      isOnline: true,
      rating: 4.8,
      reviewCount: 342,
      priceRange: '$$',
      phone: '+1 (555) 123-4567',
      email: 'mario@tacoparadise.com',
      website: 'www.tacoparadise.com',
      coverPhoto: '🌮',
      photos: ['🌮', '🌯', '🥑', '🍹', '🌶️', '🧀'],
      menu: sampleMenu,
      reviews: sampleReviews,
      operatingHours: operatingHours,
      specialOffers: specialOffers,
      tags: ['Mexican', 'Street Food', 'Family Owned', 'Outdoor Seating'],
      story: "Mario's family has been making authentic Mexican food for 3 generations. We bring the flavors of Guadalajara to your neighborhood!",
    },
    {
      id: '2',
      name: 'Taco Express',
      description: 'Quick, delicious tacos on the go',
      specialty: 'Quick Service',
      location: {
        latitude: userLocation.latitude - 0.02,
        longitude: userLocation.longitude + 0.015,
        address: '456 Oak Ave, Midtown',
      },
      isOnline: true,
      rating: 4.5,
      reviewCount: 218,
      priceRange: '$',
      phone: '+1 (555) 234-5678',
      email: 'info@tacoexpress.com',
      coverPhoto: '🚚',
      photos: ['🌮', '🌯', '🥤'],
      menu: sampleMenu.slice(0, 6),
      reviews: sampleReviews.slice(0, 3),
      operatingHours: operatingHours,
      specialOffers: [specialOffers[0]],
      tags: ['Fast Food', 'Affordable', 'Late Night'],
      story: 'Fast, fresh, and affordable. Perfect for your lunch break!',
    },
    {
      id: '3',
      name: 'Señor Burrito',
      description: 'Monster burritos that will fill you up',
      specialty: 'Burritos',
      location: {
        latitude: userLocation.latitude + 0.015,
        longitude: userLocation.longitude - 0.01,
        address: '789 Pine Rd, Eastside',
      },
      isOnline: true,
      rating: 4.7,
      reviewCount: 156,
      priceRange: '$$',
      phone: '+1 (555) 345-6789',
      email: 'hello@senorburrito.com',
      coverPhoto: '🌯',
      photos: ['🌯', '🥙', '🍺'],
      menu: sampleMenu.filter(m => m.category === 'burritos' || m.category === 'drinks'),
      reviews: sampleReviews.slice(1, 4),
      operatingHours: operatingHours,
      specialOffers: [],
      tags: ['Burritos', 'Craft Beer', 'Catering'],
      story: 'Specializing in California-style burritos since 2015!',
    },
    {
      id: '4',
      name: 'Veggie Fiesta',
      description: 'Plant-based Mexican cuisine',
      specialty: 'Vegan',
      location: {
        latitude: userLocation.latitude - 0.01,
        longitude: userLocation.longitude - 0.02,
        address: '321 Elm St, Westside',
      },
      isOnline: true,
      rating: 4.9,
      reviewCount: 89,
      priceRange: '$$',
      phone: '+1 (555) 456-7890',
      email: 'contact@veggiefiesta.com',
      coverPhoto: '🥗',
      photos: ['🌮', '🥑', '🌱', '🥤'],
      menu: sampleMenu.filter(m => m.vegetarian),
      reviews: sampleReviews.slice(0, 2),
      operatingHours: operatingHours,
      specialOffers: specialOffers,
      tags: ['Vegan', 'Vegetarian', 'Healthy', 'Organic'],
      story: 'Proving that plant-based Mexican food can be delicious and satisfying!',
    },
    {
      id: '5',
      name: 'Coastal Catch Tacos',
      description: 'Fresh seafood tacos daily',
      specialty: 'Fish Tacos',
      location: {
        latitude: userLocation.latitude + 0.025,
        longitude: userLocation.longitude + 0.02,
        address: '654 Beach Blvd, Northside',
      },
      isOnline: true,
      rating: 4.6,
      reviewCount: 201,
      priceRange: '$$$',
      phone: '+1 (555) 567-8901',
      email: 'info@coastalcatch.com',
      coverPhoto: '🐟',
      photos: ['🐟', '🦐', '🌮', '🍋'],
      menu: sampleMenu.filter(m => m.id === 'm4' || m.category === 'drinks' || m.category === 'sides'),
      reviews: sampleReviews,
      operatingHours: operatingHours,
      specialOffers: [],
      tags: ['Seafood', 'Fresh', 'Premium', 'Coastal'],
      story: 'Fresh catch daily! Our fish tacos are made with sustainably sourced seafood.',
    },
    {
      id: '6',
      name: 'La Cocina Mobile',
      description: 'Traditional home-style cooking',
      specialty: 'Home Cooking',
      location: {
        latitude: userLocation.latitude - 0.015,
        longitude: userLocation.longitude + 0.025,
        address: '987 Market St, Southside',
      },
      isOnline: false,
      rating: 4.4,
      reviewCount: 127,
      priceRange: '$',
      phone: '+1 (555) 678-9012',
      email: 'lacocina@mobile.com',
      coverPhoto: '👵',
      photos: ['🌮', '🫔', '🍲'],
      menu: sampleMenu,
      reviews: sampleReviews.slice(2, 5),
      operatingHours: operatingHours,
      specialOffers: [specialOffers[1]],
      tags: ['Traditional', 'Family Recipes', 'Comfort Food'],
      story: "Grandma's recipes passed down through generations. Taste the love in every bite!",
    },
  ];

  return trucks;
};

export const getOnlineTrucksCount = (trucks: TruckData[]): number => {
  return trucks.filter((truck) => truck.isOnline).length;
};

export const getTrucksByCategory = (trucks: TruckData[], category: string): TruckData[] => {
  if (category === 'all') return trucks;
  return trucks.filter((truck) => truck.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase())));
};

export const getPopularMenuItems = (truck: TruckData): MenuItem[] => {
  return truck.menu.filter(item => item.popular);
};

export const getAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return parseFloat((sum / reviews.length).toFixed(1));
};
