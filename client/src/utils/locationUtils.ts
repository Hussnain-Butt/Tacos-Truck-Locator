/**
 * Location Utilities
 * Helper functions for geolocation calculations and formatting
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 First point latitude
 * @param lon1 First point longitude
 * @param lat2 Second point latitude
 * @param lon2 Second point longitude
 * @returns Distance in miles
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param miles Distance in miles
 * @returns Formatted string (e.g., "0.5 mi", "2.3 mi")
 */
export const formatDistance = (miles: number): string => {
  if (miles < 0.1) {
    return '< 0.1 mi';
  }
  return `${miles.toFixed(1)} mi`;
};

/**
 * Check if a location is nearby (within threshold)
 * @param distance Distance in miles
 * @param threshold Threshold in miles (default: 5)
 * @returns boolean
 */
export const isNearby = (distance: number, threshold: number = 5): boolean => {
  return distance <= threshold;
};

/**
 * Sort locations by distance from user
 * @param locations Array of objects with latitude and longitude
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @returns Sorted array with distances
 */
export const sortByDistance = <T extends { latitude: number; longitude: number }>(
  locations: T[],
  userLat: number,
  userLon: number
): Array<T & { distance: number }> => {
  return locations
    .map(location => ({
      ...location,
      distance: calculateDistance(
        userLat,
        userLon,
        location.latitude,
        location.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Get center point of multiple coordinates
 * Useful for centering map on multiple markers
 */
export const getCenterOfCoordinates = (
  coordinates: Array<{ latitude: number; longitude: number }>
): { latitude: number; longitude: number } => {
  if (coordinates.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      latitude: acc.latitude + coord.latitude,
      longitude: acc.longitude + coord.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: sum.latitude / coordinates.length,
    longitude: sum.longitude / coordinates.length,
  };
};
