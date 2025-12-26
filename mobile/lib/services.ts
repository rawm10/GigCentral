import api, { AuthResponse } from './api';
import * as SecureStore from 'expo-secure-store';

// Helper to handle storage - SecureStore works on mobile only
const storage = {
  async setItem(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      // Fallback to in-memory for web or if SecureStore fails
      console.warn('SecureStore failed, using localStorage fallback', error);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    }
  },
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      // Fallback to in-memory for web or if SecureStore fails
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
  },
  async deleteItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      // Fallback to in-memory for web or if SecureStore fails
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
  },
};

export const authService = {
  async signup(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', {
      email,
      password,
      displayName,
    });
    
    await storage.setItem('accessToken', response.data.accessToken);
    await storage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    
    await storage.setItem('accessToken', response.data.accessToken);
    await storage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  },

  async logout(): Promise<void> {
    await storage.deleteItem('accessToken');
    await storage.deleteItem('refreshToken');
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getItem('accessToken');
    return !!token;
  },
};

export const sheetService = {
  async getSheets(page: number = 1, pageSize: number = 20) {
    const response = await api.get('/sheets', {
      params: { page, pageSize },
    });
    return response.data;
  },

  async getSheet(id: string) {
    const response = await api.get(`/sheets/${id}`);
    return response.data;
  },

  async createSheet(data: any) {
    const response = await api.post('/sheets', data);
    return response.data;
  },

  async updateSheet(id: string, data: any) {
    const response = await api.put(`/sheets/${id}`, data);
    return response.data;
  },

  async deleteSheet(id: string) {
    await api.delete(`/sheets/${id}`);
  },

  async importSheet(data: any) {
    const response = await api.post('/sheets/import', data);
    return response.data;
  },

  async transposeSheet(id: string, semitones: number, useNashville: boolean = false) {
    const response = await api.post(`/sheets/${id}/transpose`, {
      semitones,
      useNashville,
    });
    return response.data;
  },
};

export const directoryService = {
  async getDirectories() {
    const response = await api.get('/directories');
    return response.data;
  },

  async createDirectory(data: any) {
    const response = await api.post('/directories', data);
    return response.data;
  },

  async updateDirectory(id: string, data: any) {
    const response = await api.put(`/directories/${id}`, data);
    return response.data;
  },

  async deleteDirectory(id: string) {
    await api.delete(`/directories/${id}`);
  },
};

export const setlistService = {
  async createSetlist(directoryId: string, name: string) {
    const response = await api.post('/setlists', {
      directoryId,
      name,
    });
    return response.data;
  },

  async addItem(setlistId: string, sheetId: string, position?: number) {
    const response = await api.post(`/setlists/${setlistId}/items`, {
      sheetId,
      position,
    });
    return response.data;
  },
};

export const preferencesService = {
  async getPreferences() {
    const response = await api.get('/preferences');
    return response.data;
  },

  async updatePreferences(data: any) {
    const response = await api.put('/preferences', data);
    return response.data;
  },
};
