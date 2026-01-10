import { API_ENDPOINTS } from '../config/api';
import type {
  CheckInPayload,
  CreateDoctorSchedulePayload,
  CreateInvoicePayload,
  CreatePaymentPayload,
  CreateReceptionistAppointmentPayload,
  CreateReceptionistPatientPayload,
  CreateReferralPayload,
  DoctorSchedule,
  Invoice,
  PaginatedResponse,
  QueueEntry,
  ReceptionistAppointmentCreateResponse,
  ReceptionistAppointment,
  ReceptionistDashboardStats,
  ReceptionistDoctor,
  ReceptionistPatient,
  Referral,
  UpdateDoctorSchedulePayload,
  UpdateReceptionistAppointmentPayload,
  UpdateReceptionistPatientPayload,
  UpdateReferralPayload,
} from '../types/receptionist';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
};

async function handleJson<T>(response: Response): Promise<T> {
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
    const validationMessage = data?.errors ? Object.values<string[]>(data.errors).flat().join(' ') : undefined;
    const message = validationMessage || data?.message || data?.error || 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

export const receptionistApi = {
  dashboard: {
    stats: async (): Promise<ReceptionistDashboardStats> => {
      const response = await fetch(API_ENDPOINTS.RECEPTIONIST_DASHBOARD_STATS, {
        headers: getAuthHeaders(),
      });
      return handleJson<ReceptionistDashboardStats>(response);
    },
  },

  doctors: {
    list: async (): Promise<{ data: ReceptionistDoctor[] }> => {
      const response = await fetch(API_ENDPOINTS.RECEPTIONIST_DOCTORS, {
        headers: getAuthHeaders(),
      });
      return handleJson<{ data: ReceptionistDoctor[] }>(response);
    },
  },

  patients: {
    list: async (params?: { search?: string; per_page?: number; page?: number; is_active?: boolean }): Promise<PaginatedResponse<ReceptionistPatient>> => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.per_page) queryParams.append('per_page', String(params.per_page));
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active ? '1' : '0');

      const url = queryParams.toString()
        ? `${API_ENDPOINTS.RECEPTIONIST_PATIENTS}?${queryParams.toString()}`
        : API_ENDPOINTS.RECEPTIONIST_PATIENTS;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      return handleJson<PaginatedResponse<ReceptionistPatient>>(response);
    },

    create: async (payload: CreateReceptionistPatientPayload): Promise<ReceptionistPatient> => {
      const response = await fetch(API_ENDPOINTS.RECEPTIONIST_PATIENTS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<ReceptionistPatient>(response);
    },

    generateRandom: async (count?: number): Promise<{ data: ReceptionistPatient[] }> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_PATIENTS}/generate-random`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ count }),
      });

      return handleJson<{ data: ReceptionistPatient[] }>(response);
    },

    update: async (id: number, payload: UpdateReceptionistPatientPayload): Promise<ReceptionistPatient> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_PATIENTS}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<ReceptionistPatient>(response);
    },

    deactivate: async (id: number): Promise<{ message: string }> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_PATIENTS}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      return handleJson<{ message: string }>(response);
    },
  },

  appointments: {
    list: async (params?: { date?: string; status?: string; patient_id?: number; doctor_id?: number; per_page?: number; page?: number }): Promise<PaginatedResponse<ReceptionistAppointment>> => {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.patient_id) queryParams.append('patient_id', String(params.patient_id));
      if (params?.doctor_id) queryParams.append('doctor_id', String(params.doctor_id));
      if (params?.per_page) queryParams.append('per_page', String(params.per_page));
      if (params?.page) queryParams.append('page', String(params.page));

      const url = queryParams.toString()
        ? `${API_ENDPOINTS.RECEPTIONIST_APPOINTMENTS}?${queryParams.toString()}`
        : API_ENDPOINTS.RECEPTIONIST_APPOINTMENTS;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      return handleJson<PaginatedResponse<ReceptionistAppointment>>(response);
    },

    create: async (payload: CreateReceptionistAppointmentPayload): Promise<ReceptionistAppointmentCreateResponse> => {
      const response = await fetch(API_ENDPOINTS.RECEPTIONIST_APPOINTMENTS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<ReceptionistAppointmentCreateResponse>(response);
    },

    update: async (id: number, payload: UpdateReceptionistAppointmentPayload): Promise<ReceptionistAppointment> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_APPOINTMENTS}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<ReceptionistAppointment>(response);
    },

    remove: async (id: number): Promise<{ message: string }> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_APPOINTMENTS}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      return handleJson<{ message: string }>(response);
    },
  },

  queue: {
    list: async (params?: { date?: string; doctor_id?: number; status?: string; start_time?: string; end_time?: string }): Promise<{ data: QueueEntry[] }> => {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      if (params?.doctor_id) queryParams.append('doctor_id', String(params.doctor_id));
      if (params?.status) queryParams.append('status', params.status);
      if (params?.start_time) queryParams.append('start_time', params.start_time);
      if (params?.end_time) queryParams.append('end_time', params.end_time);

      const url = queryParams.toString() ? `${API_ENDPOINTS.RECEPTIONIST_QUEUE}?${queryParams.toString()}` : API_ENDPOINTS.RECEPTIONIST_QUEUE;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      return handleJson<{ data: QueueEntry[] }>(response);
    },

    checkIn: async (payload: CheckInPayload): Promise<QueueEntry> => {
      const response = await fetch(API_ENDPOINTS.RECEPTIONIST_QUEUE_CHECK_IN, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<QueueEntry>(response);
    },

    updateStatus: async (id: number, status: string): Promise<QueueEntry> => {
      const response = await fetch(API_ENDPOINTS.RECEPTIONIST_QUEUE_STATUS(id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      return handleJson<QueueEntry>(response);
    },
    clear: async (params?: { date?: string; doctor_id?: number }): Promise<{ deleted: number }> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_QUEUE}/clear`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params || {}),
      });

      return handleJson<{ deleted: number }>(response);
    },
  },

  invoices: {
    list: async (params?: { status?: string; patient_id?: number; per_page?: number; page?: number }): Promise<PaginatedResponse<Invoice>> => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.patient_id) queryParams.append('patient_id', String(params.patient_id));
      if (params?.per_page) queryParams.append('per_page', String(params.per_page));
      if (params?.page) queryParams.append('page', String(params.page));

      const url = queryParams.toString() ? `${API_ENDPOINTS.RECEPTIONIST_INVOICES}?${queryParams.toString()}` : API_ENDPOINTS.RECEPTIONIST_INVOICES;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      return handleJson<PaginatedResponse<Invoice>>(response);
    },

    create: async (payload: CreateInvoicePayload): Promise<Invoice> => {
      const response = await fetch(API_ENDPOINTS.RECEPTIONIST_INVOICES, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<Invoice>(response);
    },

    update: async (id: number, payload: Partial<CreateInvoicePayload> & { status?: string }): Promise<Invoice> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_INVOICES}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<Invoice>(response);
    },

    remove: async (id: number): Promise<{ message: string }> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_INVOICES}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      return handleJson<{ message: string }>(response);
    },
  },

  payments: {
    create: async (payload: CreatePaymentPayload): Promise<{ message: string; payment: any; invoice: Invoice }> => {
      const response = await fetch(API_ENDPOINTS.RECEPTIONIST_PAYMENTS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<{ message: string; payment: any; invoice: Invoice }>(response);
    },
  },

  schedules: {
    list: async (params?: { doctor_id?: number; date?: string; per_page?: number; page?: number }): Promise<PaginatedResponse<DoctorSchedule>> => {
      const queryParams = new URLSearchParams();
      if (params?.doctor_id) queryParams.append('doctor_id', String(params.doctor_id));
      if (params?.date) queryParams.append('date', params.date);
      if (params?.per_page) queryParams.append('per_page', String(params.per_page));
      if (params?.page) queryParams.append('page', String(params.page));

      const url = queryParams.toString() ? `${API_ENDPOINTS.RECEPTIONIST_DOCTOR_SCHEDULES}?${queryParams.toString()}` : API_ENDPOINTS.RECEPTIONIST_DOCTOR_SCHEDULES;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      return handleJson<PaginatedResponse<DoctorSchedule>>(response);
    },

    create: async (payload: CreateDoctorSchedulePayload): Promise<DoctorSchedule> => {
      const response = await fetch(API_ENDPOINTS.RECEPTIONIST_DOCTOR_SCHEDULES, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<DoctorSchedule>(response);
    },

    update: async (id: number, payload: UpdateDoctorSchedulePayload): Promise<DoctorSchedule> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_DOCTOR_SCHEDULES}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<DoctorSchedule>(response);
    },

    remove: async (id: number): Promise<{ message: string }> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_DOCTOR_SCHEDULES}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      return handleJson<{ message: string }>(response);
    },
  },

  referrals: {
    list: async (params?: { status?: string; type?: string; patient_id?: number; per_page?: number; page?: number }): Promise<PaginatedResponse<Referral>> => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.patient_id) queryParams.append('patient_id', String(params.patient_id));
      if (params?.per_page) queryParams.append('per_page', String(params.per_page));
      if (params?.page) queryParams.append('page', String(params.page));

      const url = queryParams.toString() ? `${API_ENDPOINTS.RECEPTIONIST_REFERRALS}?${queryParams.toString()}` : API_ENDPOINTS.RECEPTIONIST_REFERRALS;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      return handleJson<PaginatedResponse<Referral>>(response);
    },

    create: async (payload: CreateReferralPayload): Promise<Referral> => {
      const response = await fetch(API_ENDPOINTS.RECEPTIONIST_REFERRALS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<Referral>(response);
    },

    update: async (id: number, payload: UpdateReferralPayload): Promise<Referral> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_REFERRALS}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      return handleJson<Referral>(response);
    },

    remove: async (id: number): Promise<{ message: string }> => {
      const response = await fetch(`${API_ENDPOINTS.RECEPTIONIST_REFERRALS}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      return handleJson<{ message: string }>(response);
    },
  },
};
