// API Configuration
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  SERVICES: `${API_BASE_URL}/api/services`,
  TESTIMONIALS: `${API_BASE_URL}/api/testimonials`,
  DOCTORS: `${API_BASE_URL}/api/doctors`,
  APPOINTMENTS: `${API_BASE_URL}/api/appointments`,
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  AUTH_ME: `${API_BASE_URL}/api/auth/me`,
};

export default API_BASE_URL;

