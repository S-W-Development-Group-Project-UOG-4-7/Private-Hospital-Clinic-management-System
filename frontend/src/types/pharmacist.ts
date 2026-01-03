export interface PharmacistProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  license_number: string;
  role: string;
}

export interface PharmacistPrescription {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  status: 'pending' | 'dispensed' | 'held' | 'rejected';
  created_at: string;
  updated_at: string;
  items: PharmacistPrescriptionItem[];
  interaction_warnings?: string[];
}

export interface PharmacistPrescriptionItem {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

export interface InventoryItem {
  id: number;
  drug_name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date: string;
  batch_number: string;
  supplier_name: string;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_expiring_soon: boolean;
}

export interface ControlledDrugLog {
  id: number;
  drug_name: string;
  quantity: number;
  action: 'dispensed' | 'received' | 'returned';
  prescription_id?: number;
  pharmacist_id: number;
  pharmacist_name: string;
  timestamp: string;
}

export interface PurchaseRequest {
  id: number;
  drug_name: string;
  quantity: number;
  supplier_name: string;
  status: 'pending' | 'approved' | 'ordered' | 'received';
  requested_by: string;
  requested_at: string;
}

export interface ReturnItem {
  id: number;
  prescription_id: number;
  drug_name: string;
  quantity: number;
  reason: string;
  status: 'pending' | 'approved' | 'processed';
  returned_by: string;
  returned_at: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  user_id: number;
  user_name: string;
  changes: Record<string, any>;
  timestamp: string;
}

export interface PharmacistNotification {
  id: number;
  type: 'low_stock' | 'expiring_soon' | 'interaction_alert' | 'purchase_request';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  prescriptions_today: number;
  medications_dispensed: number;
  low_stock_alerts: number;
  pending_requests: number;
}