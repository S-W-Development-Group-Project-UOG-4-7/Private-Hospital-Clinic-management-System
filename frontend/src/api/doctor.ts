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
  ReviewLabResultPayload,
  ReferralsResponse,
  Referral,
  CreateReferralPayload,
} from '../types/doctor';

export const doctorApi = {
  appointments: {
    list: async (params?: { date?: string; status?: string; patient_name?: string }): Promise<DoctorAppointmentsResponse> => {
      const response = await http.get<DoctorAppointmentsResponse>(API_ENDPOINTS.DOCTOR_APPOINTMENTS, { params });
      return response.data;
    },

    show: async (id: number): Promise<DoctorAppointment> => {
      const response = await http.get<DoctorAppointment>(`${API_ENDPOINTS.DOCTOR_APPOINTMENTS}/${id}`);
      return response.data;
    },

    updateStatus: async (id: number, payload: UpdateAppointmentStatusPayload): Promise<DoctorAppointment> => {
      const response = await http.put<DoctorAppointment>(API_ENDPOINTS.DOCTOR_APPOINTMENT_STATUS(String(id)), payload);
      return response.data;
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
    create: async (payload: any): Promise<any> => {
      const response = await http.post<any>(API_ENDPOINTS.DOCTOR_PATIENTS, payload);
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
  },

  labs: {
    createOrder: async (payload: CreateLabOrderPayload): Promise<LabOrder> => {
      const response = await http.post<LabOrder>(API_ENDPOINTS.DOCTOR_LAB_ORDERS, payload);
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
};

