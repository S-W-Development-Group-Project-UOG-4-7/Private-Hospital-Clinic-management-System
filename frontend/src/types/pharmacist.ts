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
  dispensed_at?: string;
  notes?: string | null;
  invoice?: PharmacistInvoiceSummary;
  low_stock_alerts?: PharmacistLowStockAlert[];
}

export interface PharmacistPrescriptionItem {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
  unit_price?: number;
  total_price?: number;
}

export interface PharmacistInvoiceSummary {
  id: number;
  invoice_number: string;
  amount: number;
  status: string;
  issued_at?: string;
  due_date?: string;
  description?: string;
}

export interface PharmacistLowStockAlert {
  inventory_item_id: number;
  name: string;
  quantity: number;
  reorder_level: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  generic_name?: string;
  brand_name?: string;
  description?: string;
  category: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  unit_price?: number;
  selling_price?: number;
  expiry_date: string;
  batch_number?: string;
  supplier_id?: number;
  supplier?: {
    id: number;
    name: string;
  };
  is_active: boolean;
  is_low_stock: boolean;
  is_expiring_soon: boolean;
  created_at?: string;
  updated_at?: string;
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

export interface InventoryStats {
  total_items: number;
  low_stock_items: number;
  expiring_soon_items: number;
  total_value: number;
}

export interface DashboardStats {
  prescriptions_today: number;
  medications_dispensed: number;
  low_stock_alerts: number;
  pending_requests: number;
}

// Patient types for pharmacist view
export interface PharmacistPatient {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  blood_type?: string;
  allergies?: string;
  total_prescriptions: number;
  pending_prescriptions: number;
  last_prescription_date?: string;
}

export interface MedicationHistoryItem {
  id: number;
  medication_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  quantity: number;
  instructions?: string;
  unit_price?: number;
  total_price?: number;
  is_dispensed: boolean;
}

export interface MedicationHistoryPrescription {
  id: number;
  prescription_number: string;
  status: string;
  doctor_name: string;
  pharmacist_name?: string;
  prescription_date: string;
  dispensed_at?: string;
  notes?: string;
  medications: MedicationHistoryItem[];
  total_amount: number;
}

export interface MedicationSummaryItem {
  medication_id?: number;
  medication_name: string;
  generic_name?: string;
  category?: string;
  times_prescribed: number;
  total_quantity: number;
  last_prescribed: string;
  first_prescribed: string;
}

// Report types
export interface DispensingReportSummary {
  total_prescriptions: number;
  total_medications_dispensed: number;
  total_units_dispensed: number;
  total_revenue: number;
  average_prescription_value: number;
}

export interface DispensingDailyStats {
  date: string;
  prescriptions_count: number;
  medications_dispensed: number;
  units_dispensed: number;
  revenue: number;
}

export interface TopMedication {
  medication_name: string;
  category: string;
  times_dispensed: number;
  total_quantity: number;
  total_revenue: number;
}

export interface PharmacistPerformance {
  pharmacist_id: number;
  pharmacist_name: string;
  prescriptions_dispensed: number;
  total_revenue: number;
}

export interface DispensingReport {
  report_type: 'dispensing';
  period: { from: string; to: string };
  summary: DispensingReportSummary;
  daily_breakdown: DispensingDailyStats[];
  top_medications: TopMedication[];
  pharmacist_performance: PharmacistPerformance[];
  generated_at: string;
}

export interface InventoryReportSummary {
  total_items: number;
  total_value: number;
  low_stock_count: number;
  expired_count: number;
  expiring_soon_count: number;
}

export interface StockLevels {
  out_of_stock: number;
  critical: number;
  low: number;
  adequate: number;
  overstocked: number;
}

export interface CategoryBreakdown {
  category: string;
  item_count: number;
  total_quantity: number;
  total_value: number;
  low_stock_count: number;
}

export interface InventoryReport {
  report_type: 'inventory';
  summary: InventoryReportSummary;
  stock_levels: StockLevels;
  category_breakdown: CategoryBreakdown[];
  low_stock_items: Array<{
    id: number;
    name: string;
    category: string;
    quantity: number;
    reorder_level: number;
    unit: string;
  }>;
  expiring_items: Array<{
    id: number;
    name: string;
    quantity: number;
    expiry_date: string;
    is_expired: boolean;
  }>;
  generated_at: string;
}

export interface SalesReportSummary {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  unpaid_amount: number;
  overdue_amount: number;
  collection_rate: number;
}

export interface StatusBreakdown {
  paid: { count: number; amount: number };
  unpaid: { count: number; amount: number };
  partial: { count: number; amount: number };
  overdue: { count: number; amount: number };
}

export interface DailyRevenue {
  date: string;
  invoices_count: number;
  total_amount: number;
  paid_amount: number;
  unpaid_amount: number;
}

export interface SalesReport {
  report_type: 'sales';
  period: { from: string; to: string };
  summary: SalesReportSummary;
  status_breakdown: StatusBreakdown;
  daily_revenue: DailyRevenue[];
  generated_at: string;
}

export interface PatientActivitySummary {
  total_prescriptions: number;
  unique_patients: number;
  new_patients: number;
  returning_patients: number;
  average_prescriptions_per_patient: number;
}

export interface TopPatient {
  patient_id: number;
  patient_name: string;
  prescription_count: number;
  total_spent: number;
}

export interface PatientActivityReport {
  report_type: 'patient_activity';
  period: { from: string; to: string };
  summary: PatientActivitySummary;
  top_patients: TopPatient[];
  generated_at: string;
}