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
      const parsedUser = JSON.parse(storedUser);
      // Map _id to id if missing
      if (parsedUser._id && !parsedUser.id) parsedUser.id = parsedUser._id;
      // If role is missing and they aren't the super admin, they are a patient (since doctors were successfully assigned 'doctor' previously)
      if (!parsedUser.role && parsedUser.email !== 'admin@medsync.com') {
        parsedUser.role = 'patient';
      }
      setUser(parsedUser);
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
    
    const userRecord = data.user || data.doctor || data.patient || data.admin;
    if (userRecord && userRecord._id && !userRecord.id) userRecord.id = userRecord._id;
    if (data.doctor && !userRecord.role) userRecord.role = 'doctor';
    if (data.patient && !userRecord.role) userRecord.role = 'patient';
    
    authService.setToken(data.token);
    localStorage.setItem('medsync_user', JSON.stringify(userRecord));
    
    setToken(data.token);
    setUser(userRecord);
    return userRecord;
  };

  const register = async (formData: any) => {
    let data;
    if (formData.role === 'doctor') {
      data = await doctorApi.register(formData);
    } else {
      data = await patientApi.register(formData);
    }

    const userRecord = data.user || data.doctor || data.patient || data.admin;
    if (userRecord && userRecord._id && !userRecord.id) userRecord.id = userRecord._id;
    if (data.doctor || formData.role === 'doctor') {
      if (!userRecord.role) userRecord.role = 'doctor';
    } else if (data.patient || formData.role === 'patient') {
      if (!userRecord.role) userRecord.role = 'patient';
    } else {
      if (!userRecord.role && data.patient) userRecord.role = 'patient';
    }
    
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
