import { API_ENDPOINTS } from '../config/api';
import { http } from './http';
import type {
  DoctorAppointmentsResponse,
  DoctorAppointment,
  UpdateAppointmentStatusPayload,
  DoctorTeleconsultation,
  StartTeleconsultationPayload,
  EndTeleconsultationPayload,
  PatientEhrData,
  VitalSign,
  CreateVitalSignPayload,
  UpdateVitalSignPayload,
  DiagnosesResponse,
  Diagnosis,
  CreateDiagnosisPayload,
  UpdateDiagnosisPayload,
  DoctorPrescription,
  DoctorPrescriptionsResponse,
  CreatePrescriptionPayload,
  DoctorInventoryResponse,
  LabOrdersAndResultsResponse,
  LabOrder,
  LabResult,
  CreateLabOrderPayload,
  UpdateLabOrderPayload,
  ReviewLabResultPayload,
  ReferralsResponse,
  Referral,
  CreateReferralPayload,
  ClinicsResponse,
  ClinicReferralsResponse,
  CreateClinicReferralPayload,
  PatientRecord,
  DailySummaryResponse,
} from '../types/doctor';
import { mapAppointmentStatus } from '../utils/appointmentStatus';

export const doctorApi = {
  dashboard: {
    getDailySummary: async (date?: string): Promise<DailySummaryResponse> => {
      const response = await http.get<DailySummaryResponse>(API_ENDPOINTS.DOCTOR_DAILY_SUMMARY, {
        params: date ? { date } : undefined,
      });
      return response.data;
    },
  },

  consultations: {
    show: async (appointmentId: number): Promise<{ appointment_id: number; note: any | null }> => {
      const response = await http.get<{ appointment_id: number; note: any | null }>(`${API_ENDPOINTS.DOCTOR_CONSULTATION_SHOW(String(appointmentId))}`);
      return response.data;
    },
    save: async (appointmentId: number, payload: Partial<{ subjective: string; objective: string; assessment: string; plan: string; diagnosis_text: string; vitals_json: Record<string, any>; attachments: string[] }>): Promise<any> => {
      const response = await http.post(`${API_ENDPOINTS.DOCTOR_CONSULTATION_SAVE(String(appointmentId))}`, payload);
      return response.data;
    },
    start: async (appointmentId: number): Promise<DoctorAppointment> => {
      const response = await http.post<DoctorAppointment>(API_ENDPOINTS.DOCTOR_CONSULTATION_START(String(appointmentId)));
      return mapAppointmentStatus(response.data);
    },
    complete: async (appointmentId: number): Promise<DoctorAppointment> => {
      const response = await http.post<DoctorAppointment>(API_ENDPOINTS.DOCTOR_CONSULTATION_COMPLETE(String(appointmentId)));
      return mapAppointmentStatus(response.data);
    },
  },

  appointments: {
    list: async (params?: { date?: string; status?: string; patient_name?: string }): Promise<DoctorAppointmentsResponse> => {
      const response = await http.get<DoctorAppointmentsResponse>(API_ENDPOINTS.DOCTOR_APPOINTMENTS, { params });
      return {
        ...response.data,
        data: Array.isArray(response.data.data) ? response.data.data.map(mapAppointmentStatus) : [],
      };
    },

    show: async (id: number): Promise<DoctorAppointment> => {
      const response = await http.get<DoctorAppointment>(`${API_ENDPOINTS.DOCTOR_APPOINTMENTS}/${id}`);
      return mapAppointmentStatus(response.data);
    },

    updateStatus: async (id: number, payload: UpdateAppointmentStatusPayload): Promise<DoctorAppointment> => {
      const response = await http.put<DoctorAppointment>(API_ENDPOINTS.DOCTOR_APPOINTMENT_STATUS(String(id)), payload);
      return mapAppointmentStatus(response.data);
    },
  },

  teleconsultations: {
    start: async (payload: StartTeleconsultationPayload): Promise<DoctorTeleconsultation> => {
      const response = await http.post<DoctorTeleconsultation>(API_ENDPOINTS.DOCTOR_TELECONSULTATION_START, payload);
      return response.data;
    },

    end: async (id: number, payload: EndTeleconsultationPayload): Promise<DoctorTeleconsultation> => {
      const response = await http.post<DoctorTeleconsultation>(API_ENDPOINTS.DOCTOR_TELECONSULTATION_END(String(id)), payload);
      return response.data;
    },
  },

  ehr: {
    getPatientEhr: async (patientId: number): Promise<PatientEhrData> => {
      const response = await http.get<PatientEhrData>(API_ENDPOINTS.DOCTOR_PATIENT_EHR(String(patientId)));
      return response.data;
    },
  },

  vitals: {
    create: async (payload: CreateVitalSignPayload): Promise<VitalSign> => {
      const response = await http.post<VitalSign>(API_ENDPOINTS.DOCTOR_VITALS, payload);
      return response.data;
    },

    update: async (id: number, payload: UpdateVitalSignPayload): Promise<VitalSign> => {
      const response = await http.put<VitalSign>(API_ENDPOINTS.DOCTOR_VITAL_UPDATE(String(id)), payload);
      return response.data;
    },

    delete: async (id: number): Promise<{ message: string }> => {
      const response = await http.delete<{ message: string }>(API_ENDPOINTS.DOCTOR_VITAL_UPDATE(String(id)));
      return response.data;
    },
  },

  patients: {
    list: async (): Promise<any> => {
      const response = await http.get(API_ENDPOINTS.DOCTOR_PATIENTS);
      return response.data;
    },

    create: async (payload: any): Promise<any> => {
      const response = await http.post<any>(API_ENDPOINTS.DOCTOR_PATIENTS, payload);
      return response.data;
    },
    
    searchByPhone: async (phoneNumber: string, name?: string): Promise<{ data: PatientRecord | null }> => {
      const response = await http.get<{ data: PatientRecord | null }>(`${API_ENDPOINTS.PATIENTS}/search`, {
        params: { phone: phoneNumber, name }
      });
      return response.data;
    },
  },

  diagnoses: {
    create: async (payload: CreateDiagnosisPayload): Promise<Diagnosis> => {
      const response = await http.post<Diagnosis>(API_ENDPOINTS.DOCTOR_DIAGNOSES, payload);
      return response.data;
    },

    update: async (id: number, payload: UpdateDiagnosisPayload): Promise<Diagnosis> => {
      const response = await http.put<Diagnosis>(API_ENDPOINTS.DOCTOR_DIAGNOSIS_UPDATE(String(id)), payload);
      return response.data;
    },

    getPatientDiagnoses: async (patientId: number): Promise<DiagnosesResponse> => {
      const response = await http.get<DiagnosesResponse>(API_ENDPOINTS.DOCTOR_PATIENT_DIAGNOSES(String(patientId)));
      return response.data;
    },
  },

  prescriptions: {
    create: async (payload: CreatePrescriptionPayload): Promise<DoctorPrescription> => {
      const response = await http.post<DoctorPrescription>(API_ENDPOINTS.DOCTOR_PRESCRIPTIONS, payload);
      return response.data;
    },

    list: async (params?: { patient_id?: number; status?: string }): Promise<DoctorPrescriptionsResponse> => {
      const response = await http.get<DoctorPrescriptionsResponse>(API_ENDPOINTS.DOCTOR_PRESCRIPTIONS, {
        params,
      });
      return response.data;
    },

    show: async (id: number): Promise<DoctorPrescription> => {
      const response = await http.get<DoctorPrescription>(API_ENDPOINTS.DOCTOR_PRESCRIPTION_SHOW(String(id)));
      return response.data;
    },

    update: async (id: number, payload: CreatePrescriptionPayload): Promise<DoctorPrescription> => {
      const response = await http.put<DoctorPrescription>(`${API_ENDPOINTS.DOCTOR_PRESCRIPTIONS}/${id}`, payload);
      return response.data;
    },

    delete: async (id: number): Promise<{ message: string }> => {
      const response = await http.delete<{ message: string }>(`${API_ENDPOINTS.DOCTOR_PRESCRIPTIONS}/${id}`);
      return response.data;
    },
  },

  labs: {
    createOrder: async (payload: CreateLabOrderPayload): Promise<LabOrder> => {
      const response = await http.post<LabOrder>(API_ENDPOINTS.DOCTOR_LAB_ORDERS, payload);
      return response.data;
    },

    listOrders: async (params?: { patient_id?: number; status?: string }): Promise<{ data: LabOrder[] }> => {
      const response = await http.get<{ data: LabOrder[] }>(API_ENDPOINTS.DOCTOR_LAB_ORDERS, { params });
      return response.data;
    },

    showOrder: async (id: number): Promise<LabOrder> => {
      const response = await http.get<LabOrder>(API_ENDPOINTS.DOCTOR_LAB_ORDER(String(id)));
      return response.data;
    },

    updateOrder: async (id: number, payload: UpdateLabOrderPayload): Promise<LabOrder> => {
      const response = await http.put<LabOrder>(API_ENDPOINTS.DOCTOR_LAB_ORDER(String(id)), payload);
      return response.data;
    },

    deleteOrder: async (id: number): Promise<{ message: string }> => {
      const response = await http.delete<{ message: string }>(API_ENDPOINTS.DOCTOR_LAB_ORDER(String(id)));
      return response.data;
    },

    getPatientResults: async (patientId: number): Promise<LabOrdersAndResultsResponse> => {
      const response = await http.get<LabOrdersAndResultsResponse>(API_ENDPOINTS.DOCTOR_LAB_RESULTS(String(patientId)));
      return response.data;
    },

    reviewResult: async (id: number, payload: ReviewLabResultPayload): Promise<LabResult> => {
      const response = await http.post<LabResult>(API_ENDPOINTS.DOCTOR_LAB_RESULT_REVIEW(String(id)), payload);
      return response.data;
    },
  },

  referrals: {
    create: async (payload: CreateReferralPayload): Promise<Referral> => {
      const response = await http.post<Referral>(API_ENDPOINTS.DOCTOR_REFERRALS, payload);
      return response.data;
    },

    list: async (params?: { status?: string; patient_id?: number }): Promise<ReferralsResponse> => {
      const response = await http.get<ReferralsResponse>(API_ENDPOINTS.DOCTOR_REFERRALS, {
        params,
      });
      return response.data;
    },
  },

  inventory: {
    list: async (params?: { search?: string; category?: string; low_stock?: boolean; expiring_soon?: boolean }): Promise<DoctorInventoryResponse> => {
      const response = await http.get<DoctorInventoryResponse>(API_ENDPOINTS.DOCTOR_INVENTORY, { params });
      return response.data;
    },
  },

  clinics: {
    list: async (): Promise<ClinicsResponse> => {
      const response = await http.get<ClinicsResponse>(API_ENDPOINTS.CLINICS);
      return response.data;
    },
    createReferral: async (payload: CreateClinicReferralPayload): Promise<void> => {
      await http.post(API_ENDPOINTS.CLINIC_REFERRAL, payload);
    },
    listReferrals: async (): Promise<ClinicReferralsResponse> => {
      const response = await http.get<ClinicReferralsResponse>(API_ENDPOINTS.CLINIC_REFERRAL);
      return response.data;
    },
  },

  queue: {
    list: async (params?: { date?: string }): Promise<any> => {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      const url = queryParams.toString() ? `${API_ENDPOINTS.DOCTOR_QUEUE}?${queryParams.toString()}` : API_ENDPOINTS.DOCTOR_QUEUE;
      const response = await http.get(url);
      return response.data;
    },
    next: async (params?: { date?: string }): Promise<any> => {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      const url = queryParams.toString() ? `${API_ENDPOINTS.DOCTOR_QUEUE_NEXT}?${queryParams.toString()}` : API_ENDPOINTS.DOCTOR_QUEUE_NEXT;
      const response = await http.get(url);
      return response.data;
    },
    callNext: async (params?: { date?: string }): Promise<any> => {
      const response = await http.post(API_ENDPOINTS.DOCTOR_QUEUE_CALL_NEXT, params || {});
      return response.data;
    },
    updateStatus: async (id: number, status: string): Promise<any> => {
      const response = await http.put(API_ENDPOINTS.DOCTOR_QUEUE_STATUS(String(id)), { status });
      return response.data;
    },
  },
};
