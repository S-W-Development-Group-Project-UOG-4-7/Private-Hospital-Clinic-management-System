// API Configuration
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  AUTH_ME: `${API_BASE_URL}/api/auth/me`,
  
  // Patient Portal
  PATIENT_PROFILE: `${API_BASE_URL}/api/patient/profile`,
  PATIENT_APPOINTMENTS: `${API_BASE_URL}/api/patient/appointments`,
  PATIENT_TELECONSULTATIONS: `${API_BASE_URL}/api/patient/teleconsultations`,
  PATIENT_EHR: `${API_BASE_URL}/api/patient/ehr`,
  PATIENT_INVOICES: `${API_BASE_URL}/api/patient/invoices`,
  PATIENT_PAYMENTS: `${API_BASE_URL}/api/patient/payments`,
  PATIENT_FEEDBACK: `${API_BASE_URL}/api/patient/feedback`,
  PATIENT_NOTIFICATIONS: `${API_BASE_URL}/api/patient/notifications`,
  PATIENT_PRESCRIPTIONS: `${API_BASE_URL}/api/patient/prescriptions`,
  
  // Prescriptions
  PRESCRIPTIONS: `${API_BASE_URL}/api/prescriptions`,
  PRESCRIPTION_PROCESS: (id: string) => `${API_BASE_URL}/api/prescriptions/${id}/process`,
  
  // Inventory
  INVENTORY: `${API_BASE_URL}/api/inventory`,
  INVENTORY_LOW_STOCK: `${API_BASE_URL}/api/inventory/low-stock/list`,
  INVENTORY_EXPIRING_SOON: `${API_BASE_URL}/api/inventory/expiring-soon/list`,
  INVENTORY_STATS: `${API_BASE_URL}/api/inventory/stats/overview`,
  
  // Suppliers
  SUPPLIERS: `${API_BASE_URL}/api/suppliers`,
  
  // Drug Purchases
  DRUG_PURCHASES: `${API_BASE_URL}/api/drug-purchases`,
  DRUG_PURCHASE_RECEIVE: (id: string) => `${API_BASE_URL}/api/drug-purchases/${id}/receive`,
};

export default API_BASE_URL;


