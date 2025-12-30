/**
 * Socket Service
 * Real-time communication with backend via Socket.IO
 */

import { io, Socket } from 'socket.io-client';

// Socket.IO server URL - use your machine's IP for physical devices
const DEV_MACHINE_IP = '192.168.1.10';
const SOCKET_URL = __DEV__
  ? `http://${DEV_MACHINE_IP}:3000` // Physical device / Android emulator
  : 'https://your-production-api.com';

// For iOS simulator, use: http://localhost:3000
// For physical device, use your computer's IP: http://192.168.x.x:3000

interface LocationData {
  truckId: string;
  latitude: number;
  longitude: number;
}

interface TruckUpdateData {
  truckId: string;
  latitude: number;
  longitude: number;
  name?: string;
  isOnline?: boolean;
}

type TruckUpdateCallback = (data: TruckUpdateData) => void;
type TruckStatusCallback = (data: { truckId: string }) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Connect to Socket.IO server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('📴 Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Setup event handlers for real-time updates
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Truck came online
    this.socket.on('truck:online', (data: TruckUpdateData) => {
      console.log('🟢 Truck online:', data.truckId);
      this.emit('truckOnline', data);
    });

    // Truck moved
    this.socket.on('truck:moved', (data: TruckUpdateData) => {
      console.log('📍 Truck moved:', data.truckId);
      this.emit('truckMoved', data);
    });

    // Truck went offline
    this.socket.on('truck:offline', (data: { truckId: string }) => {
      console.log('🔴 Truck offline:', data.truckId);
      this.emit('truckOffline', data);
    });

    // Full truck list update
    this.socket.on('trucks:update', (trucks: TruckUpdateData[]) => {
      console.log('📋 Trucks update:', trucks.length);
      this.emit('trucksUpdate', trucks);
    });
  }

  /**
   * Internal event emitter
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // ==========================================
  // VENDOR METHODS
  // ==========================================

  /**
   * Vendor goes online
   */
  goOnline(truckId: string, latitude: number, longitude: number): void {
    if (!this.socket) return;
    
    console.log('🟢 Going online:', truckId);
    this.socket.emit('vendor:online', { truckId, latitude, longitude });
  }

  /**
   * Update vendor location
   */
  updateLocation(truckId: string, latitude: number, longitude: number): void {
    if (!this.socket) return;
    
    this.socket.emit('vendor:location', { truckId, latitude, longitude });
  }

  /**
   * Vendor goes offline
   */
  goOffline(truckId: string): void {
    if (!this.socket) return;
    
    console.log('🔴 Going offline:', truckId);
    this.socket.emit('vendor:offline', { truckId });
  }

  // ==========================================
  // CUSTOMER METHODS
  // ==========================================

  /**
   * Subscribe to area updates
   */
  subscribeToArea(latitude: number, longitude: number, radius: number = 10): void {
    if (!this.socket) return;
    
    console.log('👀 Subscribing to area');
    this.socket.emit('customer:subscribe', { latitude, longitude, radius });
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(): void {
    if (!this.socket) return;
    
    console.log('👋 Unsubscribing');
    this.socket.emit('customer:unsubscribe');
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
