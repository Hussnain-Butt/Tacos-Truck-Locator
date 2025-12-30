/**
 * Services Index
 * Export all services from one place
 */

export { apiClient } from './api';
export { authService } from './authService';
export { truckService } from './truckService';
export { socketService } from './socketService';

// Re-export types
export type { Truck, MenuItem, TruckLocation } from './truckService';
