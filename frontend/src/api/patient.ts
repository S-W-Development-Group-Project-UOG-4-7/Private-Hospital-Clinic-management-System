import { API_ENDPOINTS } from '../config/api';
import type {
  CreateAppointmentPayload,
  CreateFeedbackPayload,
  CreatePaymentPayload,
  CreatePaymentResponse,
  PatientAppointmentsResponse,
  PatientAppointment,
  PatientInvoice,
  PatientEhrResponse,
  PatientFeedback,
  PatientFeedbackResponse,
  PatientInvoicesResponse,
  PatientNotificationsResponse,
  PatientProfileResponse,
  PatientPrescription,
  PatientPrescriptionsResponse,
  PatientTeleconsultationsResponse,
  PatientLabOrder,
  PatientLabResult,
  UpdateAppointmentPayload,
  QueueStatusResponse,
  ClinicQueueResponse,
  PatientSlot,
} from '../types/patient';
import { mapAppointmentStatus, normalizeAppointmentStatus } from '../utils/appointmentStatus';

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
      const response = await fetch(API_ENDPOINTS.PATIENT_ME, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientProfileResponse>(response);
    },

    update: async (
      payload: Partial<PatientProfileResponse['profile']> & {
        email?: string;
        first_name?: string;
        last_name?: string;
      }
    ): Promise<PatientProfileResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_ME, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleJson<PatientProfileResponse>(response);
    },

    updatePassword: async (payload: { current_password: string; password: string; password_confirmation: string }): Promise<{ message: string }> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_PASSWORD, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleJson<{ message: string }>(response);
    },
  },

  departments: {
    list: async (): Promise<{ data: { id: number; name: string }[] }> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_DEPARTMENTS, {
        headers: getAuthHeaders(),
      });
      return handleJson<{ data: { id: number; name: string }[] }>(response);
    },
  },

  doctors: {
    list: async (params?: { department_id?: number }): Promise<{ data: Array<{ id: number; first_name?: string; last_name?: string; department?: { id: number; name: string } | null }> }> => {
      const queryParams = new URLSearchParams();
      if (params?.department_id) queryParams.append('department_id', String(params.department_id));

      const url = queryParams.toString()
        ? `${API_ENDPOINTS.PATIENT_DOCTORS}?${queryParams.toString()}`
        : API_ENDPOINTS.PATIENT_DOCTORS;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      return handleJson<{ data: Array<{ id: number; first_name?: string; last_name?: string; department?: { id: number; name: string } | null }> }>(response);
    },
  },

  slots: {
    list: async (params: { date: string; department_id?: number; doctor_id?: number; visit_mode?: string; available_only?: boolean }): Promise<{ data: PatientSlot[] }> => {
      const queryParams = new URLSearchParams();
      queryParams.append('date', params.date);
      if (params.department_id) queryParams.append('department_id', String(params.department_id));
      if (params.doctor_id) queryParams.append('doctor_id', String(params.doctor_id));
      if (params.visit_mode) queryParams.append('visit_mode', params.visit_mode);
      if (params.available_only !== undefined) queryParams.append('available_only', params.available_only ? '1' : '0');

      const response = await fetch(`${API_ENDPOINTS.PATIENT_SLOTS}?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
      });
      return handleJson<{ data: PatientSlot[] }>(response);
    },

    hold: async (slotId: number, payload?: { visit_mode?: string }): Promise<PatientSlot> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_SLOTS}/${slotId}/hold`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload || {}),
      });
      return handleJson<PatientSlot>(response);
    },

    confirm: async (slotId: number, payload: { visit_mode: string; reason?: string; notes?: string }): Promise<{ appointment: PatientAppointment }> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_SLOTS}/${slotId}/confirm`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleJson<{ appointment: PatientAppointment }>(response);
    },
  },

  appointments: {
    list: async (): Promise<PatientAppointmentsResponse> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_APPOINTMENTS, {
        headers: getAuthHeaders(),
      });
      const data = await handleJson<PatientAppointmentsResponse>(response);
      return {
        ...data,
        data: Array.isArray(data.data) ? data.data.map(mapAppointmentStatus) : [],
      };
    },

    create: async (payload: CreateAppointmentPayload): Promise<PatientAppointment> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_APPOINTMENTS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const appointment = await handleJson<PatientAppointment>(response);
      return mapAppointmentStatus(appointment);
    },

    update: async (id: number, payload: UpdateAppointmentPayload): Promise<PatientAppointment> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_APPOINTMENTS}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const appointment = await handleJson<PatientAppointment>(response);
      return mapAppointmentStatus(appointment);
    },

    remove: async (id: number): Promise<{ message: string }> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_APPOINTMENTS}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleJson<{ message: string }>(response);
    },

    cancel: async (id: number): Promise<{ message: string }> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_APPOINTMENTS}/${id}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return handleJson<{ message: string }>(response);
    },

    reschedule: async (id: number, payload: { slot_id: number; reason?: string | null }): Promise<{ appointment: PatientAppointment }> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_APPOINTMENTS}/${id}/reschedule`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleJson<{ appointment: PatientAppointment }>(response);
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

    show: async (id: number): Promise<PatientInvoice> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_INVOICES}/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientInvoice>(response);
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

  labResults: {
    list: async (): Promise<{ data: PatientLabOrder[] }> => {
      const response = await fetch(API_ENDPOINTS.PATIENT_LAB_RESULTS, {
        headers: getAuthHeaders(),
      });
      return handleJson<{ data: PatientLabOrder[] }>(response);
    },

    show: async (id: number): Promise<PatientLabResult> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_LAB_RESULTS}/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleJson<PatientLabResult>(response);
    },
  },

  queue: {
    status: async (): Promise<QueueStatusResponse> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_QUEUE_STATUS}`, {
        headers: getAuthHeaders(),
      });
      const data = await handleJson<QueueStatusResponse>(response);

      return {
        ...data,
        queue_entry: data.queue_entry
          ? {
              ...data.queue_entry,
              appointment: data.queue_entry.appointment
                ? {
                    ...data.queue_entry.appointment,
                    status: normalizeAppointmentStatus(data.queue_entry.appointment.status),
                  }
                : data.queue_entry.appointment,
            }
          : data.queue_entry,
        todays_appointments: Array.isArray(data.todays_appointments)
          ? data.todays_appointments.map((appt) => ({
              ...appt,
              status: normalizeAppointmentStatus(appt.status),
            }))
          : data.todays_appointments,
      };
    },

    clinicQueue: async (clinicId: number): Promise<ClinicQueueResponse> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_QUEUE_CLINIC}/${clinicId}`, {
        headers: getAuthHeaders(),
      });
      return handleJson<ClinicQueueResponse>(response);
    },

    appointmentStatus: async (appointmentId: number): Promise<{
      is_today: boolean;
      current_number: number | null;
      my_position: number | null;
      estimated_wait_minutes: number | null;
    }> => {
      const response = await fetch(`${API_ENDPOINTS.PATIENT_APPOINTMENTS}/${appointmentId}/queue-status`, {
        headers: getAuthHeaders(),
      });
      return handleJson<{
        is_today: boolean;
        current_number: number | null;
        my_position: number | null;
        estimated_wait_minutes: number | null;
      }>(response);
    },
  },
};
