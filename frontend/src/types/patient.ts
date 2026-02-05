export interface PatientUser {
  id: number;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  role?: string;
}

export interface PatientProfile {
  phone: string | null;
  date_of_birth: string | null;
  gender?: string | null;
  address: string | null;
  nic_passport?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
}

export interface PatientProfileResponse {
  user: PatientUser;
  profile: PatientProfile;
}

export type SlotStatus = 'AVAILABLE' | 'HELD' | 'BOOKED';

export interface PatientSlot {
  id: number;
  doctor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  allowed_visit_mode: string;
  status: SlotStatus | string;
  held_until?: string | null;
  held_by_patient_id?: number | null;
  doctor?: AppointmentDoctor | null;
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
  department_id?: number | null;
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
  department_id?: number | null;
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

export interface PatientInvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: string | number;
  unit_price: string | number;
  line_total?: string;
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
  items?: PatientInvoiceItem[];
  payments?: PatientPayment[];
  created_at?: string;
  updated_at?: string;
}

export interface PatientLabResult {
  id: number;
  lab_order_id: number;
  test_name: string | null;
  result_value: string | null;
  unit: string | null;
  reference_range: string | null;
  status: string | null;
  interpretation: string | null;
  file_url: string | null;
  result_date: string | null;
  doctor_reviewed: boolean;
  reviewed_at: string | null;
  doctor?: {
    name: string;
  } | null;
}

export interface PatientLabOrder {
  id: number;
  order_number: string | null;
  test_type: string | null;
  test_description: string | null;
  status: string | null;
  order_date: string | null;
  due_date: string | null;
  doctor?: { name: string } | null;
  clinic?: string | null;
  results: PatientLabResult[];
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

// Queue related types
export interface QueueEntry {
  id: number;
  queue_number: number | null;
  status: string;
  checked_in_at: string | null;
  appointment: {
    id: number;
    time: string;
    type: string;
    status?: string;
    doctor: {
      name: string;
    } | null;
  } | null;
}

export interface QueueStats {
  total_waiting: number;
  my_position: number | null;
  estimated_wait_minutes: number | null;
  people_ahead: number;
}

export interface TodaysAppointment {
  id: number;
  time: string;
  type: string;
  status: string;
  doctor: string;
  clinic: string;
}

export interface QueueStatusResponse {
  queue_entry: QueueEntry | null;
  queue_stats: QueueStats;
  todays_appointments: TodaysAppointment[];
}

export interface ClinicQueueResponse {
  clinic_id: number;
  date: string;
  total_waiting: number;
  in_consultation: number;
  estimated_wait_minutes_for_new: number;
  current_queue_number: number | null;
}
