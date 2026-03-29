import Cookies from 'js-cookie';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:5000/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  register: async (userData: any): Promise<AuthResponse> => {
    const response = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },

  logout: () => {
    Cookies.remove('medsync_token');
    localStorage.removeItem('medsync_user');
  },

  setToken: (token: string) => {
    Cookies.set('medsync_token', token, { expires: 7, secure: process.env.NODE_ENV === 'production' });
  },

  getToken: () => {
    return Cookies.get('medsync_token');
  },

  isAuthenticated: () => {
    return !!Cookies.get('medsync_token');
  }
};
