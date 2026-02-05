export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ReceptionistDashboardStats {
  todays_appointments: number;
  checked_in_patients: number;
  pending_payments: number;
  doctors_on_duty: number;
}

export interface ReceptionistUserSummary {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  username: string | null;
  is_active: boolean;
  phone?: string | null;
  department?: {
    id: number;
    name: string;
  } | null;
}

export interface ReceptionistPatientProfile {
  id?: number;
  user_id?: number;
  patient_id: string | null;
  phone: string | null;
  age: number | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
}

export interface ReceptionistPatient extends ReceptionistUserSummary {
  patient_profile?: ReceptionistPatientProfile | null;
}

export interface ReceptionistDoctor extends ReceptionistUserSummary {
  appointment_count?: number;
  is_available?: boolean;
}

export type AppointmentType = 'in_person' | 'telemedicine';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface ReceptionistAppointment {
  id: number;
  patient_id: number;
  doctor_id: number | null;
  department_id?: number | null;
  clinic?: string | null;
  appointment_number?: number | null;
  appointment_date: string;
  appointment_time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  patient?: ReceptionistUserSummary;
  doctor?: ReceptionistUserSummary | null;
  department?: {
    id: number;
    name: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReceptionistAppointmentCreateResponse {
  appointment: ReceptionistAppointment;
  queue_entry?: QueueEntry | null;
}

export type QueueStatus = 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show';

export interface QueueEntry {
  id: number;
  appointment_id: number | null;
  patient_id: number;
  doctor_id: number | null;
  queue_date: string;
  queue_number: number;
  status: QueueStatus;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_by: number | null;
  patient?: ReceptionistUserSummary;
  doctor?: ReceptionistUserSummary | null;
  appointment?: ReceptionistAppointment | null;
  created_at?: string;
  updated_at?: string;
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: string | number;
  unit_price: string | number;
  line_total?: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  patient_id: number;
  amount: string;
  method: string;
  status: string;
  paid_at: string | null;
  reference: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  patient_id: number;
  amount: string;
  status: InvoiceStatus;
  issued_at: string;
  due_date: string | null;
  description: string | null;
  items?: InvoiceItem[];
  patient?: ReceptionistUserSummary;
  payments?: Payment[];
  created_at?: string;
  updated_at?: string;
}

export interface DoctorSchedule {
  id: number;
  doctor_id: number;
  schedule_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
  doctor?: ReceptionistUserSummary;
  created_at?: string;
  updated_at?: string;
}

export type SlotStatus = 'AVAILABLE' | 'HELD' | 'BOOKED';
export type SlotVisitMode = 'BOTH' | 'PHYSICAL' | 'ONLINE';

export interface ClinicSlotAvailability {
  time: string;
  available_count: number;
}

export interface ReceptionistSlot {
  id: number;
  doctor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  allowed_visit_mode: SlotVisitMode;
  status: SlotStatus | string;
  held_until?: string | null;
  held_by_patient_id?: number | null;
  doctor?: {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    department_id?: number | null;
  } | null;
}

export type ReferralType = 'internal' | 'external';
export type ReferralStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';

export interface Referral {
  id: number;
  patient_id: number;
  referred_by_doctor_id: number | null;
  referred_to_doctor_id: number | null;
  type: ReferralType;
  external_provider: string | null;
  reason: string | null;
  status: ReferralStatus;
  referred_at: string | null;
  notes: string | null;
  report_url: string | null;
  created_by: number | null;
  patient?: ReceptionistUserSummary;
  referred_by_doctor?: ReceptionistUserSummary | null;
  referred_to_doctor?: ReceptionistUserSummary | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateReceptionistPatientPayload {
  first_name: string;
  last_name: string;
  phone: string;
  age: number;
}

export interface UpdateReceptionistPatientPayload {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  age?: number | null;
}

export interface CreateReceptionistAppointmentPayload {
  patient_id: string | number;
  doctor_id?: number | null;
  department_id?: number | null;
  clinic?: string | null;
  appointment_date?: string;
  appointment_time?: string;
  slot_id?: number;
  type?: AppointmentType;
  status?: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
}

export interface UpdateReceptionistAppointmentPayload {
  patient_id?: string | number;
  doctor_id?: number | null;
  department_id?: number | null;
  clinic?: string | null;
  appointment_date?: string;
  appointment_time?: string;
  type?: AppointmentType;
  status?: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
}

export interface CheckInPayload {
  patient_id: string | number;
  doctor_id: number;
  department_id: number;
  appointment_id?: number | null;
  queue_date?: string;
}

export interface CreateInvoicePayload {
  patient_id: number;
  amount?: number;
  issued_at?: string;
  due_date?: string | null;
  description?: string | null;
  items?: InvoiceItem[];
}

export interface CreatePaymentPayload {
  invoice_id: number;
  amount: number;
  method?: string;
  status?: string;
}

export interface CreateDoctorSchedulePayload {
  doctor_id: number;
  schedule_date: string;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  notes?: string | null;
}

export interface UpdateDoctorSchedulePayload {
  doctor_id?: number;
  schedule_date?: string;
  start_time?: string;
  end_time?: string;
  is_available?: boolean;
  notes?: string | null;
}

export interface CreateReferralPayload {
  patient_id: number;
  referred_by_doctor_id?: number | null;
  referred_to_doctor_id?: number | null;
  type: ReferralType;
  external_provider?: string | null;
  reason?: string | null;
  status?: ReferralStatus;
  referred_at?: string;
  notes?: string | null;
  report_url?: string | null;
}

export interface UpdateReferralPayload {
  referred_by_doctor_id?: number | null;
  referred_to_doctor_id?: number | null;
  type?: ReferralType;
  external_provider?: string | null;
  reason?: string | null;
  status?: ReferralStatus;
  referred_at?: string | null;
  notes?: string | null;
  report_url?: string | null;
}
