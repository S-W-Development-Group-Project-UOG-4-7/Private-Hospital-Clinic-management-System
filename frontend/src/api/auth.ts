import api from './axiosConfig';

// --- TYPES ---
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  [key: string]: any;
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

// --- ERROR HELPER ---
const getErrorMessage = (error: any): string => {
  if (error && error.response && error.response.data) {
    const data = error.response.data;
    if (data.errors) {
      return Object.values(data.errors).flat().join(' ');
    }
    return data.message || data.error || `Request failed (${error.response.status})`;
  }
  return error.message || 'An unexpected error occurred';
};

// --- HELPER: NORMALIZE TOKEN ---
function normalizeAuthResponse(data: any): AuthResponse {
  const token =
    data?.token ??
    data?.access_token ??
    data?.plainTextToken ??
    data?.data?.token;

  const user = data?.user ?? data?.data?.user;
  const message = data?.message ?? data?.data?.message;

  if (!token || !user) {
    // Only warn, don't crash, in case the backend returns a different structure
    console.warn('Login response missing token/user:', data);
  }

  return { message, token, user: user || {} };
}

// --- API FUNCTIONS ---

export async function login(emailInput: string, password: string): Promise<AuthResponse> {
  try {
    // FIX: Send the key as 'login' instead of 'email'
    // This satisfies the backend error: "The login field is required."
    const response = await api.post('/auth/login', { 
      login: emailInput, 
      password 
    });
    
    return normalizeAuthResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const response = await api.post('/auth/register', payload);
    return normalizeAuthResponse(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.warn('Logout failed:', error);
  }
}

export async function fetchCurrentUser(): Promise<{ user: AuthUser }> {
  try {
    const response = await api.get('/user');
    const user = (response.data as any).user || response.data;
    return { user };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}