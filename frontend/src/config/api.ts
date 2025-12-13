// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  SERVICES: `${API_BASE_URL}/api/services`,
  TESTIMONIALS: `${API_BASE_URL}/api/testimonials`,
  DOCTORS: `${API_BASE_URL}/api/doctors`,
  APPOINTMENTS: `${API_BASE_URL}/api/appointments`,
};

export default API_BASE_URL;

