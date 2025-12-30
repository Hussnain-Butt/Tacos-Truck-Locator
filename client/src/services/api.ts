/**
 * API Client Configuration
 * Base configuration for all API calls to backend
 */

import { Platform } from 'react-native';

// API Base URL - Auto-detect based on platform
// For real Android devices, use your computer's IP address
const DEV_MACHINE_IP = '192.168.1.10'; // Your computer's IP

const getBaseUrl = () => {
  if (!__DEV__) {
    return 'https://tacos-truck-locator-production.up.railway.app';
  }
  
  // For Android (both emulator and real device)
  if (Platform.OS === 'android') {
    // Use actual IP for real devices (works for emulator too)
    return `http://${DEV_MACHINE_IP}:3000`;
  }
  
  // iOS simulator and web
  return 'http://localhost:3000';
};

const API_BASE_URL = getBaseUrl();
console.log('🌐 API Base URL:', API_BASE_URL);

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set the auth token (call this after Clerk login)
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Get current auth token
   */
  getAuthToken() {
    return this.authToken;
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || 'An error occurred',
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
