/**
 * API Service — Core utilities and barrel re-exports
 *
 * Domain-specific API namespaces live in ./api/ (auth, clients, advisor, funds, bse, nmf).
 * This file exports the shared request() helper and token management used by all of them,
 * then re-exports every domain namespace so existing imports continue to work:
 *
 *   import { bseApi, clientsApi, request } from '@/services/api'
 */

export const API_BASE = (() => {
  // Use NEXT_PUBLIC_API_URL if set, otherwise use relative URLs (proxied via Next.js rewrites)
  const url = process.env.NEXT_PUBLIC_API_URL || '';
  // Enforce HTTPS in production (browser environment only)
  if (url && typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
})();

// Token storage key for FA Portal authentication
const FA_TOKEN_KEY = 'fa_auth_token';

// Get auth token from localStorage (client-side only)
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(FA_TOKEN_KEY);
}

// Set auth token in localStorage
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FA_TOKEN_KEY, token);
  }
}

// Clear auth token from localStorage
export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(FA_TOKEN_KEY);
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  skipAuth?: boolean; // Skip adding auth header (for public endpoints)
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  // Build headers with optional auth token
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, config);
  } catch {
    throw new Error('Network error — please check your connection and try again.');
  }

  if (!response.ok) {
    // 401 — session expired, redirect to login
    if (response.status === 401) {
      clearAuthToken()
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        const loginPath = window.location.pathname.startsWith('/admin')
          ? '/admin/login'
          : '/advisor/login'
        window.location.href = loginPath
      }
      throw new Error('Session expired. Please log in again.')
    }

    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    // Sanitize error messages — don't expose internal details in production
    const message = error.message || 'Request failed';
    const safeMessage = process.env.NODE_ENV === 'production' && response.status >= 500
      ? 'An unexpected error occurred. Please try again.'
      : message;
    throw new Error(safeMessage);
  }

  return response.json();
}

// ============= Upload Helper =============

export async function requestUpload<T>(
  endpoint: string,
  file: File,
  fieldName = 'file',
): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);

  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Upload failed: ${res.status}`);
  }

  return res.json();
}

// ============= Upload with extra fields =============

export async function requestUploadWithFields<T>(
  endpoint: string,
  formData: FormData,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Upload failed: ${res.status}`);
  }

  return res.json();
}

// ============= Domain re-exports =============
// Every namespace and type from the domain files is re-exported here
// so `import { X } from '@/services/api'` continues to work unchanged.

export * from './api/auth'
export * from './api/funds'
export * from './api/clients'
export * from './api/advisor'
export * from './api/bse'
export * from './api/nmf'
export * from './api/admin'
export * from './api/onboarding'
