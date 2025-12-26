import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../lib/services';
import { User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('AuthContext: checkAuth starting...');
      const isAuth = await authService.isAuthenticated();
      console.log('AuthContext: isAuthenticated =', isAuth);
      
      if (isAuth) {
        // If we have a token, try to fetch user data from a /me endpoint
        // For now, set a minimal user object to allow navigation
        // TODO: Replace with actual /me API call when available
        setUser({ 
          id: 'temp-id', 
          email: 'user@example.com',
          displayName: 'User'
        } as User);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
      console.log('AuthContext: checkAuth complete');
    } catch (error) {
      console.error('AuthContext: checkAuth error:', error);
      setUser(null);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    const response = await authService.signup(email, password, displayName);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
