import { API_ENDPOINTS } from '../config/api';
import type {
  CreateAppointmentPayload,
  CreateFeedbackPayload,
  CreatePaymentPayload,
  CreatePaymentResponse,
  PatientAppointmentsResponse,
  PatientAppointment,
  PatientEhrResponse,
  PatientFeedback,
  PatientFeedbackResponse,
  PatientInvoicesResponse,
  PatientNotificationsResponse,
  PatientProfileResponse,
  PatientPrescription,
  PatientPrescriptionsResponse,
  PatientTeleconsultationsResponse,
  UpdateAppointmentPayload,
} from '../types/patient';

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
    const validationMessage = data?.errors
      ? Object.values<string[]>(data.errors).flat().join(' ')
      : undefined;

    const message = validationMessage || data?.message || data?.error || 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

export const patientApi = {
  profile: {
    get: async (): Promise<PatientProfileResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_PROFILE, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientProfileResponse>(response);
    },

    update: async (payload: Partial<PatientProfileResponse['profile']> & { email?: string }): Promise<PatientProfileResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_PROFILE, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleJson<PatientProfileResponse>(response);
    },
  },

  appointments: {
    list: async (): Promise<PatientAppointmentsResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_APPOINTMENTS, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientAppointmentsResponse>(response);
    },

    create: async (payload: CreateAppointmentPayload): Promise<PatientAppointment> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_APPOINTMENTS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleJson<PatientAppointment>(response);
    },

    update: async (id: number, payload: UpdateAppointmentPayload): Promise<PatientAppointment> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_APPOINTMENTS}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleJson<PatientAppointment>(response);
    },

    remove: async (id: number): Promise<{ message: string }> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_APPOINTMENTS}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleJson<{ message: string }>(response);
    },
  },

  teleconsultations: {
    list: async (): Promise<PatientTeleconsultationsResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_TELECONSULTATIONS, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientTeleconsultationsResponse>(response);
    },
  },

  ehr: {
    list: async (): Promise<PatientEhrResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_EHR, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientEhrResponse>(response);
    },
  },

  billing: {
    invoices: async (): Promise<PatientInvoicesResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_INVOICES, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientInvoicesResponse>(response);
    },

    pay: async (payload: CreatePaymentPayload): Promise<CreatePaymentResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_PAYMENTS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleJson<CreatePaymentResponse>(response);
    },
  },

  feedback: {
    list: async (): Promise<PatientFeedbackResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_FEEDBACK, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientFeedbackResponse>(response);
    },

    create: async (payload: CreateFeedbackPayload): Promise<PatientFeedback> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_FEEDBACK, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleJson<PatientFeedback>(response);
    },
  },

  notifications: {
    list: async (): Promise<PatientNotificationsResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_NOTIFICATIONS, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientNotificationsResponse>(response);
    },
  },

  prescriptions: {
    list: async (): Promise<PatientPrescriptionsResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_PRESCRIPTIONS, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientPrescriptionsResponse>(response);
    },

    show: async (id: number): Promise<PatientPrescription> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_PRESCRIPTIONS}/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientPrescription>(response);
    },
  },
};
