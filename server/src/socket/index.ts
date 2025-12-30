/**
 * Socket.IO Handler
 * Real-time location updates and notifications
 */

import { Server as SocketIOServer, Socket } from 'socket.io';

interface LocationData {
  truckId: string;
  latitude: number;
  longitude: number;
}

interface SubscribeData {
  latitude: number;
  longitude: number;
  radius: number; // in kilometers
}

export const initializeSocket = (io: SocketIOServer) => {
  console.log('🔌 Socket.IO initialized');

  io.on('connection', (socket: Socket) => {
    console.log(`📱 Client connected: ${socket.id}`);

    // ==========================================
    // VENDOR EVENTS
    // ==========================================

    // Vendor goes online
    socket.on('vendor:online', (data: LocationData) => {
      console.log(`🟢 Vendor online: ${data.truckId}`);
      socket.join(`truck:${data.truckId}`);
      
      // Broadcast to all customers
      socket.broadcast.emit('truck:online', data);
    });

    // Vendor updates location
    socket.on('vendor:location', (data: LocationData) => {
      console.log(`📍 Location update: ${data.truckId}`);
      
      // Broadcast to all customers
      socket.broadcast.emit('truck:moved', data);
    });

    // Vendor goes offline
    socket.on('vendor:offline', (data: { truckId: string }) => {
      console.log(`🔴 Vendor offline: ${data.truckId}`);
      socket.leave(`truck:${data.truckId}`);
      
      // Broadcast to all customers
      socket.broadcast.emit('truck:offline', data);
    });

    // ==========================================
    // CUSTOMER EVENTS
    // ==========================================

    // Customer subscribes to area
    socket.on('customer:subscribe', (data: SubscribeData) => {
      console.log(`👀 Customer subscribed: ${socket.id}`);
      socket.join('customers');
      
      // In production, we would filter trucks by area
      // For now, subscribe to all truck updates
    });

    // Customer unsubscribes
    socket.on('customer:unsubscribe', () => {
      console.log(`👋 Customer unsubscribed: ${socket.id}`);
      socket.leave('customers');
    });

    // ==========================================
    // DISCONNECT
    // ==========================================

    socket.on('disconnect', () => {
      console.log(`📴 Client disconnected: ${socket.id}`);
    });
  });
};
