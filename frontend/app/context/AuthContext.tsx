'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { authService, User as AuthUser } from '../services/authService';
import { patientApi, doctorApi, adminApi } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: any) => Promise<AuthUser>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    const storedToken = Cookies.get('medsync_token');
    const storedUser = localStorage.getItem('medsync_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    let data;

    // 1. Try Admin (Hardcoded checks run lightning fast natively)
    if (email === 'admin@medsync.com') {
      try {
        data = await adminApi.login({ email, password });
      } catch (err) {
        throw new Error('Invalid admin credentials.');
      }
    } else {
      // 2. Try Doctor Database
      try {
        data = await doctorApi.login({ email, password });
      } catch (err) {
        // 3. Fallback to Patient Database
        try {
          data = await patientApi.login({ email, password });
        } catch (innerErr) {
          throw new Error('Invalid email or password.');
        }
      }
    }
    
    authService.setToken(data.token);
    localStorage.setItem('medsync_user', JSON.stringify(data.user || data.doctor || data.patient || data.admin));
    
    setToken(data.token);
    setUser(data.user || data.doctor || data.patient || data.admin);
    return (data.user || data.doctor || data.patient || data.admin);
  };

  const register = async (formData: any) => {
    let data;
    if (formData.role === 'doctor') {
      data = await doctorApi.register(formData);
    } else {
      data = await patientApi.register(formData);
    }

    const userRecord =
      data.user || data.doctor || data.patient || data.admin;
    if (!userRecord) {
      throw new Error('Registration succeeded but user payload was missing.');
    }

    authService.setToken(data.token);
    localStorage.setItem('medsync_user', JSON.stringify(userRecord));

    setToken(data.token);
    setUser(userRecord);
    return userRecord;
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
