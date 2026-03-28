'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string, role?: 'patient'|'doctor'|'admin') => Promise<void>;
  register: (data: any, role?: 'patient'|'doctor') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PATIENT_SERVICE_URL = process.env.NEXT_PUBLIC_PATIENT_SERVICE_URL || 'http://localhost:3001/api/patients';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('medsync_token');
    const storedUser = localStorage.getItem('medsync_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role = 'patient') => {
    let url = `${PATIENT_SERVICE_URL}/login`;
    if (role === 'admin') url = `${PATIENT_SERVICE_URL}/admin/login`;
    if (role === 'doctor') url = `${process.env.NEXT_PUBLIC_DOCTOR_SERVICE_URL || 'http://localhost:3002/api/doctors'}/login`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Login failed');
    }

    const data = await response.json();
    let authUser: AuthUser;

    if (role === 'doctor' && data.doctor) {
      authUser = {
        id: data.doctor._id,
        email: data.doctor.contact.email,
        name: data.doctor.name,
        role: 'doctor',
        token: data.token
      };
    } else if (role === 'admin' && data.admin) {
      authUser = {
        id: 'admin',
        email: data.admin.email,
        name: data.admin.name,
        role: 'admin',
        token: data.token
      };
    } else {
      authUser = {
        id: data.patient._id,
        email: data.patient.email,
        name: `${data.patient.firstName} ${data.patient.lastName}`,
        role: 'patient',
        token: data.token
      };
    }

    localStorage.setItem('medsync_token', data.token);
    localStorage.setItem('medsync_user', JSON.stringify(authUser));
    setToken(data.token);
    setUser(authUser);
  };

  const register = async (formData: any, role = 'patient') => {
    let url = `${PATIENT_SERVICE_URL}/register`;
    if (role === 'doctor') url = `${process.env.NEXT_PUBLIC_DOCTOR_SERVICE_URL || 'http://localhost:3002/api/doctors'}/register`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Registration failed');
    }

    const data = await response.json();
    let authUser: AuthUser;

    if (role === 'doctor' && data.doctor) {
      authUser = {
        id: data.doctor._id,
        email: data.doctor.contact.email,
        name: data.doctor.name,
        role: 'doctor',
        token: data.token
      };
    } else {
      authUser = {
        id: data.patient._id,
        email: data.patient.email,
        name: `${data.patient.firstName} ${data.patient.lastName}`,
        role: 'patient',
        token: data.token
      };
    }

    localStorage.setItem('medsync_token', data.token);
    localStorage.setItem('medsync_user', JSON.stringify(authUser));
    setToken(data.token);
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('medsync_token');
    localStorage.removeItem('medsync_user');
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
