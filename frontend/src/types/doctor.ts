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
    patient_profile?: {
      phone?: string | null;
      guardian_phone?: string | null;
    } | null;
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
    patient_profile?: {
      phone?: string | null;
      guardian_phone?: string | null;
    } | null;
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
    patient_profile?: {
      phone?: string | null;
      guardian_phone?: string | null;
    } | null;
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
    patient_profile?: {
      phone?: string | null;
      guardian_phone?: string | null;
    } | null;
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
    patient_profile?: {
      phone?: string | null;
      guardian_phone?: string | null;
    } | null;
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
  meal_timing: string | null;
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
  clinic_id?: number | null;
  prescription_date: string;
  notes?: string | null;
  instructions?: string | null;
  items: Array<{
    inventory_item_id: number;
    quantity: number;
    dosage?: string | null;
    frequency?: string | null;
    meal_timing?: string | null;
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
  clinic_id?: number | null;
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

export interface Clinic {
  id: number;
  name: string;
  location?: string | null;
  department_type?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClinicsResponse {
  data: Clinic[];
}

export interface CreateClinicReferralPayload {
  patient_id: number;
  clinic_id: number;
  reason: string;
  clinical_summary?: string | null;
  notes?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  preferred_appointment_date?: string | null;
}

export interface DoctorInventoryItem {
  id: number;
  name: string;
  generic_name?: string | null;
  brand_name?: string | null;
  category?: string | null;
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

export interface PatientRecord {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  patient_profile?: {
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    blood_type?: string;
    city?: string;
    state?: string;
    guardian_name?: string;
    guardian_phone?: string;
    emergency_contact?: string;
    allergies?: string;
    medical_conditions?: string;
  } | null;
  prescriptions?: Array<{
    id: number;
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    status: string;
    prescribed_date: string;
    doctor_name?: string;
  }>;
  clinic_referrals?: Array<{
    id: number;
    clinic_name: string;
    clinic_location?: string;
    reason: string;
    priority: string;
    status: string;
    preferred_appointment_date?: string;
    created_at: string;
  }>;
}

// Daily Summary Types
export interface DailySummaryStats {
  total_appointments: number;
  completed_consultations: number;
  pending_appointments: number;
  cancelled_appointments: number;
  prescriptions_issued: number;
  lab_orders_placed: number;
  referrals_made: number;
  in_person_consultations: number;
  telemedicine_consultations: number;
}

export interface ConsultedPatient {
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string | null;
  patient_phone: string;
  patient_gender: string;
  appointment_time: string;
  consultation_type: 'in_person' | 'telemedicine';
  reason: string | null;
  notes: string | null;
  prescriptions_count: number;
  lab_orders_count: number;
  referrals_count: number;
  prescriptions: Array<{
    id: number;
    prescription_number: string;
    items_count: number;
    status: string;
  }>;
  lab_orders: Array<{
    id: number;
    test_type: string;
    status: string;
  }>;
  referrals: Array<{
    id: number;
    clinic_name: string;
    priority: string;
    status: string;
  }>;
}

export interface DailySummaryResponse {
  date: string;
  doctor_id: number;
  doctor_name: string;
  stats: DailySummaryStats;
  consulted_patients: ConsultedPatient[];
}
