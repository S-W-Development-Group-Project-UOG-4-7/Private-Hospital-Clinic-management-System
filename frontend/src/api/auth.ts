import { API_ENDPOINTS } from '../config/api';
import { AuthResponse, AuthUser } from '../types/auth';

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    if (!response.ok) {
      throw new Error(text || `Request failed (${response.status})`);
    }
    throw new Error(`Unexpected response from server (expected JSON, got ${contentType || 'unknown content-type'})`);
  }

  const data = await response.json().catch(() => {
    throw new Error('Invalid JSON response from server');
  });

  if (!response.ok) {
    const validationMessage = data?.errors
      ? Object.values<string[]>(data.errors).flat().join(' ')
      : undefined;

    const message = validationMessage || data?.message || data?.error || 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

function normalizeAuthResponse(raw: any): AuthResponse {
  const token =
    raw?.token ??
    raw?.access_token ??
    raw?.accessToken ??
    raw?.plainTextToken ??
    raw?.plain_text_token ??
    raw?.data?.token ??
    raw?.data?.access_token ??
    raw?.data?.accessToken ??
    raw?.data?.plainTextToken ??
    raw?.data?.plain_text_token ??
    raw?.data?.data?.token ??
    raw?.data?.data?.access_token ??
    raw?.data?.data?.accessToken ??
    raw?.data?.data?.plainTextToken ??
    raw?.data?.data?.plain_text_token;

  const user = raw?.user ?? raw?.data?.user ?? raw?.data?.data?.user;
  const message = raw?.message ?? raw?.data?.message ?? raw?.data?.data?.message;

  if (!token || !user) {
    throw new Error('Invalid login response from server (missing token or user)');
  }

  return {
    message,
    token,
    user,
  } as AuthResponse;
}

export async function login(login: string, password: string): Promise<AuthResponse> {
  const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ login, password }),
  });

  const raw = await handleResponse<any>(response);
  return normalizeAuthResponse(raw);
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
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });

  const raw = await handleResponse<any>(response);
  return normalizeAuthResponse(raw);
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

