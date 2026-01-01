import { API_ENDPOINTS } from '../config/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };
};

// Prescription API
export const prescriptionApi = {
  getAll: (params?: { status?: string; patient_id?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.patient_id) queryParams.append('patient_id', params.patient_id.toString());
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.PRESCRIPTIONS}?${queryParams.toString()}`
      : API_ENDPOINTS.PRESCRIPTIONS;
    
    return fetch(url, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  getById: (id: string) => {
    return fetch(`${API_ENDPOINTS.PRESCRIPTIONS}/${id}`, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  process: (id: string) => {
    return fetch(API_ENDPOINTS.PRESCRIPTION_PROCESS(id), {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  update: (id: string, data: any) => {
    return fetch(`${API_ENDPOINTS.PRESCRIPTIONS}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => res.json());
  },
};

// Inventory API
export const inventoryApi = {
  getAll: (params?: { search?: string; category?: string; low_stock?: boolean; expiring_soon?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.low_stock) queryParams.append('low_stock', '1');
    if (params?.expiring_soon) queryParams.append('expiring_soon', '1');
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.INVENTORY}?${queryParams.toString()}`
      : API_ENDPOINTS.INVENTORY;
    
    return fetch(url, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  getById: (id: string) => {
    return fetch(`${API_ENDPOINTS.INVENTORY}/${id}`, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  create: (data: any) => {
    return fetch(API_ENDPOINTS.INVENTORY, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => res.json());
  },

  update: (id: string, data: any) => {
    return fetch(`${API_ENDPOINTS.INVENTORY}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => res.json());
  },

  delete: (id: string) => {
    return fetch(`${API_ENDPOINTS.INVENTORY}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  getLowStock: () => {
    return fetch(API_ENDPOINTS.INVENTORY_LOW_STOCK, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  getExpiringSoon: () => {
    return fetch(API_ENDPOINTS.INVENTORY_EXPIRING_SOON, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  getStats: () => {
    return fetch(API_ENDPOINTS.INVENTORY_STATS, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },
};

// Supplier API
export const supplierApi = {
  getAll: (params?: { search?: string; is_active?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active ? '1' : '0');
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.SUPPLIERS}?${queryParams.toString()}`
      : API_ENDPOINTS.SUPPLIERS;
    
    return fetch(url, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  getById: (id: string) => {
    return fetch(`${API_ENDPOINTS.SUPPLIERS}/${id}`, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  create: (data: any) => {
    return fetch(API_ENDPOINTS.SUPPLIERS, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => res.json());
  },

  update: (id: string, data: any) => {
    return fetch(`${API_ENDPOINTS.SUPPLIERS}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => res.json());
  },

  delete: (id: string) => {
    return fetch(`${API_ENDPOINTS.SUPPLIERS}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },
};

// Drug Purchase API
export const drugPurchaseApi = {
  getAll: (params?: { status?: string; supplier_id?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.supplier_id) queryParams.append('supplier_id', params.supplier_id.toString());
    
    const url = queryParams.toString() 
      ? `${API_ENDPOINTS.DRUG_PURCHASES}?${queryParams.toString()}`
      : API_ENDPOINTS.DRUG_PURCHASES;
    
    return fetch(url, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  getById: (id: string) => {
    return fetch(`${API_ENDPOINTS.DRUG_PURCHASES}/${id}`, {
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  create: (data: any) => {
    return fetch(API_ENDPOINTS.DRUG_PURCHASES, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => res.json());
  },

  update: (id: string, data: any) => {
    return fetch(`${API_ENDPOINTS.DRUG_PURCHASES}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => res.json());
  },

  receive: (id: string) => {
    return fetch(API_ENDPOINTS.DRUG_PURCHASE_RECEIVE(id), {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },

  delete: (id: string) => {
    return fetch(`${API_ENDPOINTS.DRUG_PURCHASES}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(res => res.json());
  },
};

