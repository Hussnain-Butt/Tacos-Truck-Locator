/**
 * Taco Truck Locator - Backend Server
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import truckRoutes from './modules/trucks/truck.routes.js';
import locationRoutes from './modules/locations/location.routes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Import socket handlers
import { initializeSocket } from './socket/index.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:8081',
    methods: ['GET', 'POST'],
  },
});

// ==========================================
// MIDDLEWARE
// ==========================================

// Security headers
app.use(helmet());

// CORS configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';
app.use(cors({
  origin: clientUrl,
  credentials: clientUrl !== '*', // Disable credentials if allowing all origins (wildcard)
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ==========================================
// API ROUTES
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/locations', locationRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

app.use(notFound);
app.use(errorHandler);

// ==========================================
// SOCKET.IO
// ==========================================

initializeSocket(io);

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
  🌮 Taco Truck Locator API Server
  ================================
  Environment: ${process.env.NODE_ENV || 'development'}
  Port: ${PORT}
  Health: http://localhost:${PORT}/health
  API: http://localhost:${PORT}/api
  Socket.IO: ws://localhost:${PORT}
  ================================
  `);
});

export { app, io };
