import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../lib/services';

// Mock the services
jest.mock('../../lib/services', () => ({
  authService: {
    isAuthenticated: jest.fn(),
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
  },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial auth state', async () => {
    mockedAuthService.isAuthenticated.mockResolvedValueOnce(false);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle login successfully', async () => {
    mockedAuthService.isAuthenticated.mockResolvedValueOnce(false);
    mockedAuthService.login.mockResolvedValueOnce({
      user: { id: '1', email: 'test@example.com', displayName: 'Test User' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(mockedAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(result.current.user).toEqual({
      id: '1',
      email: 'test@example.com',
      displayName: 'Test User',
    });
  });

  it('should handle signup successfully', async () => {
    mockedAuthService.isAuthenticated.mockResolvedValueOnce(false);
    mockedAuthService.signup.mockResolvedValueOnce({
      user: { id: '2', email: 'new@example.com', displayName: 'New User' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signup('new@example.com', 'password123', 'New User');
    });

    expect(mockedAuthService.signup).toHaveBeenCalledWith('new@example.com', 'password123', 'New User');
    expect(result.current.user).toEqual({
      id: '2',
      email: 'new@example.com',
      displayName: 'New User',
    });
  });

  it('should handle logout', async () => {
    mockedAuthService.isAuthenticated.mockResolvedValueOnce(false);
    mockedAuthService.login.mockResolvedValueOnce({
      user: { id: '1', email: 'test@example.com', displayName: 'Test User' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    mockedAuthService.logout.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Set a user first
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toBeTruthy();

    // Then logout
    await act(async () => {
      await result.current.logout();
    });

    expect(mockedAuthService.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow();

    consoleError.mockRestore();
  });
});
