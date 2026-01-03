export interface PatientUser {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface PatientProfile {
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
}

export interface PatientProfileResponse {
  user: PatientUser;
  profile: PatientProfile;
}

export type AppointmentType = 'in_person' | 'telemedicine';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface AppointmentDoctor {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface PatientAppointment {
  id: number;
  patient_id: number;
  clinic_id?: number | null;
  doctor_id: number | null;
  appointment_date: string;
  appointment_time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  doctor?: AppointmentDoctor | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAppointmentPayload {
  clinic_id?: number | null;
  doctor_id?: number | null;
  appointment_date: string;
  appointment_time: string;
  type?: AppointmentType;
  reason?: string | null;
}

export interface UpdateAppointmentPayload {
  clinic_id?: number | null;
  doctor_id?: number | null;
  appointment_date?: string;
  appointment_time?: string;
  type?: AppointmentType;
  status?: 'scheduled' | 'cancelled';
  reason?: string | null;
}

export interface PatientAppointmentsResponse {
  data: PatientAppointment[];
}

export type TeleconsultationStatus = 'scheduled' | 'completed' | 'cancelled';

export interface PatientTeleconsultation {
  id: number;
  patient_id: number;
  doctor_id: number | null;
  scheduled_at: string;
  status: TeleconsultationStatus;
  meeting_url: string | null;
  notes: string | null;
  doctor?: AppointmentDoctor | null;
  created_at?: string;
  updated_at?: string;
}

export interface PatientTeleconsultationsResponse {
  data: PatientTeleconsultation[];
}

export type EhrRecordType = 'diagnosis' | 'lab_report';

export interface PatientEhrRecord {
  id: number;
  patient_id: number;
  doctor_id: number | null;
  type: EhrRecordType;
  title: string;
  details: string | null;
  record_date: string | null;
  file_url: string | null;
  doctor?: AppointmentDoctor | null;
  created_at?: string;
  updated_at?: string;
}

export interface PatientEhrResponse {
  data: PatientEhrRecord[];
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface PatientPayment {
  id: number;
  invoice_id: number;
  patient_id: number;
  amount: string;
  method: string;
  status: PaymentStatus;
  paid_at: string | null;
  reference: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PatientInvoice {
  id: number;
  invoice_number: string;
  patient_id: number;
  amount: string;
  status: InvoiceStatus;
  issued_at: string;
  due_date: string | null;
  description: string | null;
  payments?: PatientPayment[];
  created_at?: string;
  updated_at?: string;
}

export interface PatientInvoicesResponse {
  data: PatientInvoice[];
}

export interface CreatePaymentPayload {
  invoice_id: number;
  amount: number;
  method?: string;
}

export interface CreatePaymentResponse {
  message: string;
  payment: PatientPayment;
  invoice: PatientInvoice;
}

export interface PatientFeedback {
  id: number;
  patient_id: number;
  subject: string;
  message: string;
  rating: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface PatientFeedbackResponse {
  data: PatientFeedback[];
}

export interface CreateFeedbackPayload {
  subject: string;
  message: string;
  rating?: number | null;
}

export interface PatientNotification {
  id: number;
  patient_id: number;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PatientNotificationsResponse {
  data: PatientNotification[];
}

export type PrescriptionStatus = 'pending' | 'processing' | 'dispensed' | 'cancelled';

export interface PatientPrescriptionItemInventoryItem {
  id: number;
  name: string;
  generic_name?: string | null;
  brand_name?: string | null;
}

export interface PatientPrescriptionItem {
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
  inventory_item?: PatientPrescriptionItemInventoryItem;
  created_at?: string;
  updated_at?: string;
}

export interface PatientPrescription {
  id: number;
  prescription_number: string;
  patient_id: number;
  doctor_id: number | null;
  pharmacist_id: number | null;
  prescription_date: string;
  status: PrescriptionStatus;
  notes: string | null;
  instructions: string | null;
  dispensed_at: string | null;
  doctor?: AppointmentDoctor | null;
  pharmacist?: AppointmentDoctor | null;
  items?: PatientPrescriptionItem[];
  created_at?: string;
  updated_at?: string;
}

export interface PatientPrescriptionsResponse {
  data: PatientPrescription[];
}
