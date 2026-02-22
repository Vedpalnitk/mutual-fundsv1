/**
 * Auth, Profile & Users API
 */
import { request, getAuthToken, API_BASE } from '../api'

// ============= Auth API =============

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  ownerId?: string;
  allowedPages?: string[];
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    }),
  register: (email: string, password: string, name: string) =>
    request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: { email, password, name },
      skipAuth: true,
    }),
};

// ============= Users Management API =============

export interface UserProfile {
  name: string;
}

export interface SystemUser {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  profile: UserProfile | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: string;
  phone?: string;
  isActive?: boolean;
}

export const usersApi = {
  getAll: async () => {
    const res = await request<{ data: SystemUser[]; pagination: any }>('/api/v1/users?limit=100')
    return Array.isArray(res) ? res : res.data
  },

  getOne: (id: string) => request<SystemUser>(`/api/v1/users/${id}`),

  create: (data: CreateUserRequest) =>
    request<SystemUser>('/api/v1/users', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateUserRequest) =>
    request<SystemUser>(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    request<void>(`/api/v1/users/${id}`, {
      method: 'DELETE',
    }),

  resetPassword: (id: string, newPassword: string) =>
    request<{ message: string }>(`/api/v1/users/${id}/reset-password`, {
      method: 'POST',
      body: { newPassword },
    }),

  toggleActive: (id: string) =>
    request<SystemUser>(`/api/v1/users/${id}/toggle-active`, {
      method: 'POST',
    }),
};

// ============= Auth Profile API =============

export interface AdvisorProfileData {
  displayName: string;
  companyName: string | null;
  companyLogoUrl: string | null;
  avatarUrl: string | null;
}

export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  clientType?: string;
  advisorProfile?: AdvisorProfileData;
  onboarding?: {
    isComplete: boolean;
    currentStep: number;
  };
}

export const authProfileApi = {
  get: () => request<AuthProfile>('/api/v1/auth/me'),
  update: (data: { name?: string; phone?: string; companyName?: string; displayName?: string }) =>
    request<AuthProfile>('/api/v1/auth/me', {
      method: 'PUT',
      body: data,
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/v1/auth/me/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    }),
  uploadLogo: async (file: File): Promise<{ companyLogoUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}/api/v1/auth/me/logo`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }
    return response.json();
  },
};

// ============= Notification Preferences API =============

export type NotificationPreferences = Record<string, Record<string, boolean>>;

export interface NotificationPreferenceUpdate {
  category: string;
  channel: string;
  enabled: boolean;
}

export const notificationPreferencesApi = {
  get: () => request<NotificationPreferences>('/notifications/preferences'),
  update: (updates: NotificationPreferenceUpdate[]) =>
    request<NotificationPreferences>('/notifications/preferences', {
      method: 'PUT',
      body: { updates },
    }),
};
