import { API_ENDPOINTS } from '../config/api';
import { AuthResponse, AuthUser } from '../types/auth';

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationMessage = data?.errors
      ? Object.values<string[]>(data.errors).flat().join(' ')
      : undefined;

    const message = validationMessage || data?.message || data?.error || 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

export async function login(login: string, password: string): Promise<AuthResponse> {
  const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  });

  return handleResponse<AuthResponse>(response);
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await fetch(API_ENDPOINTS.AUTH_REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse<AuthResponse>(response);
}

export async function logout(token: string): Promise<void> {
  const response = await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  await handleResponse(response);
}

export async function fetchCurrentUser(token: string): Promise<{ user: AuthUser }> {
  const response = await fetch(API_ENDPOINTS.AUTH_ME, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<{ user: AuthUser }>(response);
}

