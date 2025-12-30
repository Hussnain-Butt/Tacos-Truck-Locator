/**
 * Mock Data for Taco Trucks
 * Realistic demonstration data for development and testing
 */

export interface TruckLocation {
  latitude: number;
  longitude: number;
}

export interface TruckData {
  id: string;
  name: string;
  description: string;
  isOnline: boolean;
  location: TruckLocation;
  rating: number;
  totalReviews: number;
  image?: string;
  specialty: string;
}

/**
 * Generate mock trucks around a given location
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @returns Array of mock truck data
 */
export const generateMockTrucks = (userLat: number, userLng: number): TruckData[] => {
  const trucks: TruckData[] = [
    {
      id: '1',
      name: "El Taco Loco",
      description: "Authentic Mexican street tacos with homemade tortillas",
      isOnline: true,
      location: {
        latitude: userLat + 0.005,
        longitude: userLng + 0.003,
      },
      rating: 4.8,
      totalReviews: 342,
      specialty: "Street Tacos",
    },
    {
      id: '2',
      name: "Taco Fiesta Express",
      description: "Best California-style burritos and quesadillas in town",
      isOnline: true,
      location: {
        latitude: userLat - 0.008,
        longitude: userLng + 0.006,
      },
      rating: 4.6,
      totalReviews: 218,
      specialty: "Burritos",
    },
    {
      id: '3',
      name: "La Cocina Mobile",
      description: "Traditional recipes passed down through generations",
      isOnline: true,
      location: {
        latitude: userLat + 0.012,
        longitude: userLng - 0.004,
      },
      rating: 4.9,
      totalReviews: 567,
      specialty: "Authentic Mexican",
    },
    {
      id: '4',
      name: "Taco Paradise",
      description: "Fusion tacos with Asian and Mexican flavors",
      isOnline: false,
      location: {
        latitude: userLat - 0.015,
        longitude: userLng - 0.008,
      },
      rating: 4.5,
      totalReviews: 189,
      specialty: "Fusion Tacos",
    },
    {
      id: '5',
      name: "Speedy Tacos",
      description: "Quick service without compromising on taste",
      isOnline: true,
      location: {
        latitude: userLat + 0.003,
        longitude: userLng + 0.010,
      },
      rating: 4.3,
      totalReviews: 156,
      specialty: "Fast Service",
    },
    {
      id: '6',
      name: "Veggie Taco Haven",
      description: "100% vegetarian and vegan taco options",
      isOnline: true,
      location: {
        latitude: userLat - 0.006,
        longitude: userLng - 0.012,
      },
      rating: 4.7,
      totalReviews: 298,
      specialty: "Vegetarian/Vegan",
    },
  ];

  return trucks;
};

/**
 * Get count of online trucks
 */
export const getOnlineTrucksCount = (trucks: TruckData[]): number => {
  return trucks.filter(truck => truck.isOnline).length;
};

/**
 * Filter trucks by status
 */
export const filterTrucksByStatus = (trucks: TruckData[], showOnlineOnly: boolean): TruckData[] => {
  if (showOnlineOnly) {
    return trucks.filter(truck => truck.isOnline);
  }
  return trucks;
};
