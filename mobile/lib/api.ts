import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          await SecureStore.setItemAsync('accessToken', accessToken);
          await SecureStore.setItemAsync('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        // Navigate to login
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function for getting auth headers (exported for testing)
export const getAuthHeaders = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default api;

// Type definitions
export interface User {
  id: string;
  email: string;
  displayName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Sheet {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  capo?: number;
  format: string;
  body: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SheetSummary {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  updatedAt: string;
}

export interface Directory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface Setlist {
  id: string;
  directoryId: string;
  name: string;
  createdAt: string;
}

export interface Preferences {
  fontScale: number;
  theme: string;
  autoScroll: boolean;
  scrollBpm?: number;
  highContrast: boolean;
}
