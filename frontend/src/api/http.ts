import axios from 'axios';
import API_BASE_URL from '../config/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

function extractErrorMessage(error: any): string {
  if (!error) return 'Request failed';

  if (error instanceof Error && error.message) {
    return error.message;
  }

  const axiosError = error as any;
  const data = axiosError?.response?.data;

  const validationMessage = data?.errors
    ? Object.values<string[]>(data.errors).flat().join(' ')
    : undefined;

  return (
    validationMessage ||
    data?.message ||
    data?.error ||
    (axiosError?.response ? `Request failed (${axiosError.response.status})` : 'Network error')
  );
}

http.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    return Promise.reject(new Error(extractErrorMessage(error)));
  }
);
