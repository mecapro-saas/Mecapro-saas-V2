// src/store/authStore.ts
import { create } from 'zustand';
import client from '../api/client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'MECHANIC' | 'COMPANY';
  city: string;
  profileImage?: string;
  specialities?: string[];
  averageRating?: number;
  totalRatings?: number;
  subscription?: any;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  register: (data: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await client.post('/auth/register', data);
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await client.post('/auth/login', { email, password });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const response = await client.get('/auth/profile');
      set({ user: response.data });
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await client.put('/auth/profile', data);
      set({ user: response.data });
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },
}));
