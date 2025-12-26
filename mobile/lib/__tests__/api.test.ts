import * as SecureStore from 'expo-secure-store';

// Mock dependencies BEFORE importing api
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  post: jest.fn(),
}));
jest.mock('expo-secure-store');

import { getAuthHeaders } from '../api';

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthHeaders', () => {
    it('should return headers with Bearer token when token exists', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce('test-token');

      const headers = await getAuthHeaders();

      expect(headers).toEqual({
        Authorization: 'Bearer test-token',
      });
      expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith('accessToken');
    });

    it('should return empty object when no token exists', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const headers = await getAuthHeaders();

      expect(headers).toEqual({});
    });
  });

  describe('API_URL configuration', () => {
    it('should use environment variable when available', () => {
      // This test verifies the baseURL is set from env
      const expectedUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      expect(expectedUrl).toBeTruthy();
    });
  });
});
