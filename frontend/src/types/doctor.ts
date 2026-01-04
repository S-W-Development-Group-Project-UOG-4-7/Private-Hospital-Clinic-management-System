export interface DoctorUser {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface DoctorAppointment {
  id: number;
  patient_id: number;
  doctor_id: number | null;
  appointment_date: string;
  appointment_time: string;
  type: 'in_person' | 'telemedicine';
  status: 'scheduled' | 'completed' | 'cancelled';
  reason: string | null;
  notes: string | null;
  patient?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorAppointmentsResponse {
  data: DoctorAppointment[];
}

export interface UpdateAppointmentStatusPayload {
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string | null;
}

export interface DoctorTeleconsultation {
  id: number;
  patient_id: number;
  doctor_id: number | null;
  appointment_id: number | null;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_url: string | null;
  notes: string | null;
  patient?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface StartTeleconsultationPayload {
  appointment_id: number;
}

export interface EndTeleconsultationPayload {
  notes?: string | null;
}

export interface PatientEhrData {
  patient: {
    id: number;
    name: string;
    email: string;
  };
  ehr_records: Array<{
    id: number;
    patient_id: number;
    doctor_id: number | null;
    type: 'diagnosis' | 'lab_report';
    title: string;
    details: string | null;
    record_date: string | null;
    file_url: string | null;
    doctor?: {
      id: number;
      first_name?: string;
      last_name?: string;
      email?: string;
    } | null;
    created_at?: string;
    updated_at?: string;
  }>;
}

export interface VitalSign {
  id: number;
  patient_id: number;
  doctor_id: number | null;
  appointment_id: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  symptoms: string | null;
  notes: string | null;
  recorded_at: string;
  patient?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVitalSignPayload {
  patient_id: number;
  appointment_id?: number | null;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  heart_rate?: number | null;
  temperature?: number | null;
  weight?: number | null;
  height?: number | null;
  respiratory_rate?: number | null;
  oxygen_saturation?: number | null;
  symptoms?: string | null;
  notes?: string | null;
}

export interface UpdateVitalSignPayload {
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  heart_rate?: number | null;
  temperature?: number | null;
  weight?: number | null;
  height?: number | null;
  respiratory_rate?: number | null;
  oxygen_saturation?: number | null;
  symptoms?: string | null;
  notes?: string | null;
}

export interface Patient {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  date_of_birth?: string | null;
  phone?: string | null;
}

export interface CreatePatientPayload {
  name: string;
  email: string;
  password?: string;
  date_of_birth?: string | null;
  phone?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
}

export interface Diagnosis {
  id: number;
  patient_id: number;
  doctor_id: number | null;
  appointment_id: number | null;
  icd10_code: string | null;
  icd10_description: string | null;
  diagnosis_name: string;
  description: string | null;
  status: 'active' | 'resolved' | 'chronic';
  diagnosis_date: string;
  resolved_date: string | null;
  notes: string | null;
  patient?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface DiagnosesResponse {
  data: Diagnosis[];
}

export interface CreateDiagnosisPayload {
  patient_id: number;
  appointment_id?: number | null;
  icd10_code?: string | null;
  icd10_description?: string | null;
  diagnosis_name: string;
  description?: string | null;
  status?: 'active' | 'resolved' | 'chronic';
  diagnosis_date: string;
  notes?: string | null;
}

export interface UpdateDiagnosisPayload {
  icd10_code?: string | null;
  icd10_description?: string | null;
  diagnosis_name?: string;
  description?: string | null;
  status?: 'active' | 'resolved' | 'chronic';
  resolved_date?: string | null;
  notes?: string | null;
}

export interface DoctorPrescription {
  id: number;
  prescription_number: string;
  patient_id: number;
  doctor_id: number | null;
  pharmacist_id: number | null;
  prescription_date: string;
  status: 'pending' | 'processing' | 'dispensed' | 'cancelled';
  notes: string | null;
  instructions: string | null;
  dispensed_at: string | null;
  patient?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  items?: DoctorPrescriptionItem[];
  created_at?: string;
  updated_at?: string;
}

export interface DoctorPrescriptionItem {
  id: number;
  prescription_id: number;
  inventory_item_id: number;
  quantity: number;
  dosage: string | null;
  frequency: string | null;
  duration_days: number | null;
  instructions: string | null;
  unit_price: string;
  total_price: string;
  is_dispensed: boolean;
  inventory_item?: {
    id: number;
    name: string;
    generic_name?: string | null;
    brand_name?: string | null;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorPrescriptionsResponse {
  data: DoctorPrescription[];
}

export interface CreatePrescriptionPayload {
  patient_id: number;
  appointment_id?: number | null;
  prescription_date: string;
  notes?: string | null;
  instructions?: string | null;
  items: Array<{
    inventory_item_id: number;
    quantity: number;
    dosage?: string | null;
    frequency?: string | null;
    duration_days?: number | null;
    instructions?: string | null;
  }>;
}

export interface LabOrder {
  id: number;
  order_number: string;
  patient_id: number;
  doctor_id: number | null;
  appointment_id: number | null;
  test_type: string;
  test_description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  order_date: string;
  due_date: string | null;
  notes: string | null;
  instructions: string | null;
  patient?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  results?: LabResult[];
  created_at?: string;
  updated_at?: string;
}

export interface LabResult {
  id: number;
  lab_order_id: number;
  patient_id: number;
  doctor_id: number | null;
  test_name: string;
  result_value: string | null;
  unit: string | null;
  reference_range: string | null;
  status: 'normal' | 'abnormal' | 'critical';
  interpretation: string | null;
  file_url: string | null;
  result_date: string;
  doctor_reviewed: boolean;
  reviewed_at: string | null;
  doctor_notes: string | null;
  lab_order?: LabOrder;
  created_at?: string;
  updated_at?: string;
}

export interface LabOrdersAndResultsResponse {
  orders: LabOrder[];
  results: LabResult[];
}

export interface CreateLabOrderPayload {
  patient_id: number;
  appointment_id?: number | null;
  test_type: string;
  test_description?: string | null;
  order_date: string;
  due_date?: string | null;
  notes?: string | null;
  instructions?: string | null;
}

export interface ReviewLabResultPayload {
  doctor_notes?: string | null;
}

export interface Referral {
  id: number;
  referral_number: string;
  patient_id: number;
  referring_doctor_id: number | null;
  referred_doctor_id: number | null;
  specialty: string | null;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  reason: string;
  clinical_summary: string | null;
  notes: string | null;
  referral_date: string;
  appointment_date: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  patient?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  referred_doctor?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReferralsResponse {
  data: Referral[];
}

export interface CreateReferralPayload {
  patient_id: number;
  referred_doctor_id?: number | null;
  specialty?: string | null;
  reason: string;
  clinical_summary?: string | null;
  notes?: string | null;
  referral_date: string;
  appointment_date?: string | null;
}

export interface DoctorInventoryItem {
  id: number;
  name: string;
  generic_name?: string | null;
  brand_name?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  [key: string]: any;
}

export type DoctorInventoryResponse = PaginatedResponse<DoctorInventoryItem>;

export interface CdsWarning {
  type: 'drug_interaction' | 'allergy' | 'duplicate_medication' | 'duplicate_diagnosis';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}
