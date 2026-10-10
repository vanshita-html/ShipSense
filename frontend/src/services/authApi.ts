import { api } from './api';
import { AuthResponse, User } from '../types';

export const authApi = {
  register: (data: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    role: string;
    company_name?: string;
  }) => api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  getMe: () => api.get<User>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  changePassword: (data: { current_password: string; new_password: string; confirm_new_password: string }) =>
    api.post<{ message: string }>('/auth/change-password', data),
};
