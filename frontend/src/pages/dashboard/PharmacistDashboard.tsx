import React, { useEffect, useMemo, useState } from 'react';
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pharmacistApi, inventoryApi } from '../../api/pharmacy';
import type {
  DashboardStats,
  PharmacistPrescription,
  InventoryItem,
  InventoryStats,
  PharmacistNotification,
  ControlledDrugLog,
  PurchaseRequest,
  ReturnItem,
  AuditLog,
  PharmacistPrescriptionItem,
  PharmacistLowStockAlert,
  PharmacistPatient,
  MedicationHistoryPrescription,
  DispensingReport,
  InventoryReport,
  SalesReport,
  PatientActivityReport,
} from '../../types/pharmacist';
import {
  Bell,
  LayoutDashboard,
  Menu,
  LogOut,
  UserCircle,
  X,
  Pill,
  AlertTriangle,
  ShoppingCart,
  FileText,
  Shield,
  Printer,
  RotateCcw,
  BarChart3,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Calendar,
  Activity,
  Plus,
  TrendingUp,
  Users,
  Search,
  DollarSign,
  Download,
  History,
} from 'lucide-react';

type SectionKey =
  | 'overview'
  | 'prescriptions'
  | 'inventory'
  | 'patients'
  | 'reports'
  | 'notifications';

const buildUserDisplayName = (user: any, fallback: string) => {
  if (!user) {
    return fallback;
  }

  if (typeof user === 'string') {
    return user || fallback;
  }

  const parts = [user.first_name, user.last_name].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ');
  }

  if (user.name && typeof user.name === 'string') {
    return user.name;
  }

  if (user.username && typeof user.username === 'string') {
    return user.username;
  }

  return fallback;
};

const parseNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString();
};

const mapPrescriptionFromApi = (prescription: any): PharmacistPrescription => {
  const rawItems = Array.isArray(prescription?.items) ? prescription.items : [];

  const mappedItems: PharmacistPrescriptionItem[] = rawItems.map((item: any) => {
    const medicationName =
      item?.medication_name ??
      item?.inventory_item?.name ??
      item?.inventoryItem?.name ??
      'Medication';

    const durationDays = parseNumber(
      item?.duration_days ?? item?.durationDays,
      0
    );
    const duration =
      item?.duration ||
      (durationDays > 0
        ? `${durationDays} day${durationDays === 1 ? '' : 's'}`
        : '');

    const rawQuantity = parseNumber(item?.quantity, 0);
    const calculatedQuantity = parseNumber(
      item?.calculated_quantity ?? item?.calculatedQuantity,
      rawQuantity
    );
    const quantity = calculatedQuantity > 0 ? calculatedQuantity : rawQuantity;
    const unitPrice = parseNumber(
      item?.unit_price ??
        item?.unitPrice ??
        item?.price_per_unit ??
        item?.inventory_item?.selling_price ??
        item?.inventoryItem?.selling_price,
      0
    );
    const totalPrice = unitPrice * quantity;

    return {
      id: item?.id ?? 0,
      medication_name: medicationName,
      dosage: item?.dosage ?? '',
      frequency: item?.frequency ?? '',
      duration,
      quantity,
      instructions: item?.instructions ?? '',
      unit_price: unitPrice,
      total_price: totalPrice,
    };
  });

  const patientName =
    prescription?.patient_name ??
    buildUserDisplayName(prescription?.patient, 'Unknown patient');

  const doctorName =
    prescription?.doctor_name ??
    buildUserDisplayName(prescription?.doctor, 'Unassigned');

  const invoiceSource =
    prescription?.invoice ??
    prescription?.latest_invoice ??
    prescription?.billing ??
    null;

  const invoice = invoiceSource
    ? {
        id: invoiceSource?.id ?? 0,
        invoice_number:
          invoiceSource?.invoice_number ??
          invoiceSource?.invoiceNumber ??
          invoiceSource?.number ??
          '',
        amount: parseNumber(invoiceSource?.amount, 0),
        status: invoiceSource?.status ?? 'unpaid',
        issued_at: invoiceSource?.issued_at ?? invoiceSource?.issuedAt ?? '',
        due_date: invoiceSource?.due_date ?? invoiceSource?.dueDate ?? '',
        description: invoiceSource?.description ?? '',
      }
    : undefined;

  const lowStockAlerts = Array.isArray(prescription?.low_stock_alerts)
    ? prescription.low_stock_alerts.map((alert: any) => ({
        inventory_item_id:
          alert?.inventory_item_id ?? alert?.inventoryItemId ?? alert?.id ?? 0,
        name: alert?.name ?? 'Inventory item',
        quantity: parseNumber(alert?.quantity, 0),
        reorder_level: parseNumber(alert?.reorder_level, 0),
      }))
    : undefined;

  return {
    id: prescription?.id ?? 0,
    patient_id: prescription?.patient_id ?? prescription?.patient?.id ?? 0,
    patient_name: patientName,
    doctor_id: prescription?.doctor_id ?? prescription?.doctor?.id ?? 0,
    doctor_name: doctorName,
    status: prescription?.status ?? 'pending',
    created_at: prescription?.created_at ?? new Date().toISOString(),
    updated_at: prescription?.updated_at ?? prescription?.created_at ?? new Date().toISOString(),
    items: mappedItems,
    interaction_warnings:
      prescription?.interaction_warnings ?? prescription?.warnings ?? [],
    dispensed_at: prescription?.dispensed_at ?? prescription?.dispensedAt ?? undefined,
    notes: prescription?.notes ?? prescription?.pharmacist_notes ?? null,
    invoice,
    low_stock_alerts: lowStockAlerts,
  };
};

const PharmacistDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [active, setActive] = useState<SectionKey>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    prescriptions_today: 0,
    medications_dispensed: 0,
    low_stock_alerts: 0,
    pending_requests: 0,
  });

  const [prescriptionsLoaded, setPrescriptionsLoaded] = useState(false);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PharmacistPrescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<PharmacistPrescription | null>(null);
  const [prescriptionDetailsLoading, setPrescriptionDetailsLoading] = useState(false);
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [dispensing, setDispensing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryStats, setInventoryStats] = useState({
    total_items: 0,
    low_stock_items: 0,
    expiring_soon_items: 0,
    total_value: 0,
  });

  // Inventory management state
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('');
  const [inventoryShowLowStock, setInventoryShowLowStock] = useState(false);
  const [inventoryShowExpiringSoon, setInventoryShowExpiringSoon] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [inventoryForm, setInventoryForm] = useState({
    drug_name: '',
    category: '',
    quantity: '',
    unit: '',
    unit_price: '',
    selling_price: '',
    expiry_date: '',
    batch_number: '',
    supplier_name: '',
    low_stock_threshold: '',
  });
  const [inventorySaving, setInventorySaving] = useState(false);
  
  // Drug search dropdown state
  const [drugSearchTerm, setDrugSearchTerm] = useState('');
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  
  // List of 50 common drugs
  const drugsList = [
    { name: "Paracetamol 500mg", generic_name: "Acetaminophen", category: "Pain Relief", unit: "tablets" },
    { name: "Ibuprofen 400mg", generic_name: "Ibuprofen", category: "Pain Relief", unit: "tablets" },
    { name: "Aspirin 100mg", generic_name: "Acetylsalicylic Acid", category: "Pain Relief", unit: "tablets" },
    { name: "Amoxicillin 500mg", generic_name: "Amoxicillin", category: "Antibiotics", unit: "capsules" },
    { name: "Azithromycin 250mg", generic_name: "Azithromycin", category: "Antibiotics", unit: "tablets" },
    { name: "Ciprofloxacin 500mg", generic_name: "Ciprofloxacin", category: "Antibiotics", unit: "tablets" },
    { name: "Doxycycline 100mg", generic_name: "Doxycycline", category: "Antibiotics", unit: "capsules" },
    { name: "Metronidazole 400mg", generic_name: "Metronidazole", category: "Antibiotics", unit: "tablets" },
    { name: "Cephalexin 500mg", generic_name: "Cephalexin", category: "Antibiotics", unit: "capsules" },
    { name: "Clindamycin 300mg", generic_name: "Clindamycin", category: "Antibiotics", unit: "capsules" },
    { name: "Metformin 500mg", generic_name: "Metformin", category: "Diabetes", unit: "tablets" },
    { name: "Metformin 850mg", generic_name: "Metformin", category: "Diabetes", unit: "tablets" },
    { name: "Glibenclamide 5mg", generic_name: "Glibenclamide", category: "Diabetes", unit: "tablets" },
    { name: "Insulin Regular 100IU/ml", generic_name: "Insulin", category: "Diabetes", unit: "vials" },
    { name: "Omeprazole 20mg", generic_name: "Omeprazole", category: "Gastrointestinal", unit: "capsules" },
    { name: "Pantoprazole 40mg", generic_name: "Pantoprazole", category: "Gastrointestinal", unit: "tablets" },
    { name: "Ranitidine 150mg", generic_name: "Ranitidine", category: "Gastrointestinal", unit: "tablets" },
    { name: "Domperidone 10mg", generic_name: "Domperidone", category: "Gastrointestinal", unit: "tablets" },
    { name: "Loperamide 2mg", generic_name: "Loperamide", category: "Gastrointestinal", unit: "capsules" },
    { name: "Lisinopril 10mg", generic_name: "Lisinopril", category: "Cardiovascular", unit: "tablets" },
    { name: "Amlodipine 5mg", generic_name: "Amlodipine", category: "Cardiovascular", unit: "tablets" },
    { name: "Amlodipine 10mg", generic_name: "Amlodipine", category: "Cardiovascular", unit: "tablets" },
    { name: "Atorvastatin 20mg", generic_name: "Atorvastatin", category: "Cardiovascular", unit: "tablets" },
    { name: "Atorvastatin 40mg", generic_name: "Atorvastatin", category: "Cardiovascular", unit: "tablets" },
    { name: "Metoprolol 50mg", generic_name: "Metoprolol", category: "Cardiovascular", unit: "tablets" },
    { name: "Losartan 50mg", generic_name: "Losartan", category: "Cardiovascular", unit: "tablets" },
    { name: "Furosemide 40mg", generic_name: "Furosemide", category: "Cardiovascular", unit: "tablets" },
    { name: "Hydrochlorothiazide 25mg", generic_name: "Hydrochlorothiazide", category: "Cardiovascular", unit: "tablets" },
    { name: "Warfarin 5mg", generic_name: "Warfarin", category: "Cardiovascular", unit: "tablets" },
    { name: "Clopidogrel 75mg", generic_name: "Clopidogrel", category: "Cardiovascular", unit: "tablets" },
    { name: "Salbutamol Inhaler 100mcg", generic_name: "Salbutamol", category: "Respiratory", unit: "units" },
    { name: "Beclomethasone Inhaler", generic_name: "Beclomethasone", category: "Respiratory", unit: "units" },
    { name: "Montelukast 10mg", generic_name: "Montelukast", category: "Respiratory", unit: "tablets" },
    { name: "Cetirizine 10mg", generic_name: "Cetirizine", category: "Antihistamines", unit: "tablets" },
    { name: "Loratadine 10mg", generic_name: "Loratadine", category: "Antihistamines", unit: "tablets" },
    { name: "Chlorpheniramine 4mg", generic_name: "Chlorpheniramine", category: "Antihistamines", unit: "tablets" },
    { name: "Diazepam 5mg", generic_name: "Diazepam", category: "Neurological", unit: "tablets" },
    { name: "Alprazolam 0.5mg", generic_name: "Alprazolam", category: "Neurological", unit: "tablets" },
    { name: "Gabapentin 300mg", generic_name: "Gabapentin", category: "Neurological", unit: "capsules" },
    { name: "Carbamazepine 200mg", generic_name: "Carbamazepine", category: "Neurological", unit: "tablets" },
    { name: "Tramadol 50mg", generic_name: "Tramadol", category: "Pain Relief", unit: "capsules" },
    { name: "Codeine 30mg", generic_name: "Codeine", category: "Pain Relief", unit: "tablets" },
    { name: "Prednisone 5mg", generic_name: "Prednisone", category: "Anti-inflammatory", unit: "tablets" },
    { name: "Dexamethasone 4mg", generic_name: "Dexamethasone", category: "Anti-inflammatory", unit: "tablets" },
    { name: "Hydrocortisone Cream 1%", generic_name: "Hydrocortisone", category: "Dermatological", unit: "units" },
    { name: "Clotrimazole Cream 1%", generic_name: "Clotrimazole", category: "Dermatological", unit: "units" },
    { name: "Vitamin C 1000mg", generic_name: "Ascorbic Acid", category: "Vitamins", unit: "tablets" },
    { name: "Vitamin D3 1000IU", generic_name: "Cholecalciferol", category: "Vitamins", unit: "capsules" },
    { name: "Vitamin B Complex", generic_name: "B Vitamins", category: "Vitamins", unit: "tablets" },
    { name: "Folic Acid 5mg", generic_name: "Folic Acid", category: "Vitamins", unit: "tablets" },
    { name: "Iron Sulfate 200mg", generic_name: "Ferrous Sulfate", category: "Vitamins", unit: "tablets" },
    { name: "Calcium Carbonate 500mg", generic_name: "Calcium", category: "Vitamins", unit: "tablets" },
    { name: "Eye Drops (Artificial Tears)", generic_name: "Artificial Tears", category: "Ophthalmic", unit: "bottles" },
    { name: "Timolol Eye Drops 0.5%", generic_name: "Timolol", category: "Ophthalmic", unit: "bottles" },
  ];

  // Filter drugs based on search term
  const filteredDrugs = useMemo(() => {
    if (!drugSearchTerm.trim()) return drugsList;
    const search = drugSearchTerm.toLowerCase();
    return drugsList.filter(d => 
      d.name.toLowerCase().includes(search) || 
      d.generic_name.toLowerCase().includes(search)
    );
  }, [drugSearchTerm]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }),
    []
  );

  const selectedPrescriptionTotal = useMemo(() => {
    if (!selectedPrescription) {
      return 0;
    }

    return selectedPrescription.items.reduce((sum, item) => {
      const baseTotal = item.total_price ?? item.quantity * (item.unit_price ?? 0);
      return sum + (Number.isFinite(baseTotal) ? baseTotal : 0);
    }, 0);
  }, [selectedPrescription]);

  // Handle drug selection
  const handleDrugSelect = (drug: typeof drugsList[0]) => {
    setInventoryForm(prev => ({
      ...prev,
      drug_name: drug.name,
      category: drug.category,
      unit: drug.unit,
    }));
    setDrugSearchTerm(drug.name);
    setShowDrugDropdown(false);
  };

  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState<PharmacistNotification[]>([]);

  const [auditLogsLoaded, setAuditLogsLoaded] = useState(false);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Patients state
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patients, setPatients] = useState<PharmacistPatient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PharmacistPatient | null>(null);
  const [medicationHistory, setMedicationHistory] = useState<MedicationHistoryPrescription[]>([]);
  const [medicationHistoryLoading, setMedicationHistoryLoading] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);

  // Reports state
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [activeReportType, setActiveReportType] = useState<'dispensing' | 'inventory' | 'sales' | 'patient_activity'>('dispensing');
  const [reportDateFrom, setReportDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [reportDateTo, setReportDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [dispensingReport, setDispensingReport] = useState<DispensingReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [patientActivityReport, setPatientActivityReport] = useState<PatientActivityReport | null>(null);

  // Get user info from localStorage
  const user = useMemo(() => {
    const userData = localStorage.getItem('authUser');
    return userData ? JSON.parse(userData) : null;
  }, []);

  const pharmacistName = user?.name || 'Pharmacist';

  const unreadNotificationsCount = useMemo(
    () => notifications.filter(n => !n.is_read).length,
    [notifications]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setProfileLoading(true);
      try {
        // Load dashboard stats (we'll need to create this endpoint)
        // For now, calculate from existing data
        await loadPrescriptions();
        await loadInventory();
        await loadNotifications();
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard data');
      } finally {
        setProfileLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadSectionData = async () => {
      if (active === 'prescriptions' && !prescriptionsLoaded && !prescriptionsLoading) {
        await loadPrescriptions();
      }
      if (active === 'inventory' && !inventoryLoaded && !inventoryLoading) {
        await loadInventory();
        await loadInventoryStats();
      }
      if (active === 'patients' && !patientsLoaded && !patientsLoading) {
        await loadPatients();
      }
      if (active === 'reports' && !reportsLoaded && !reportsLoading) {
        await loadReport();
      }
      if (active === 'reports' && !auditLogsLoaded && !auditLogsLoading) {
        await loadAuditLogs();
      }
    };

    loadSectionData();
  }, [active]);

  const loadPrescriptions = async () => {
    setError(null);
    setPrescriptionsLoading(true);
    try {
      const resp = await pharmacistApi.prescriptions.list();
      const rawPrescriptions = Array.isArray(resp?.data)
        ? resp.data
        : Array.isArray(resp)
        ? resp
        : Array.isArray(resp?.data?.data)
        ? resp.data.data
        : [];

      const mapped = rawPrescriptions.map(mapPrescriptionFromApi);

      setPrescriptions(mapped);
      setPrescriptionsLoaded(true);

      // Update stats
      const today = new Date().toISOString().slice(0, 10);
      const todayPrescriptions = mapped.filter((p: PharmacistPrescription) =>
        p.created_at?.startsWith(today)
      ).length;
      const dispensedCount = mapped.filter((p: PharmacistPrescription) => p.status === 'dispensed').length;

      setStats(prev => ({
        ...prev,
        prescriptions_today: todayPrescriptions,
        medications_dispensed: dispensedCount,
      }));
    } catch (e: any) {
      setError(e?.message || 'Failed to load prescriptions');
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const handleViewPrescription = async (prescription: PharmacistPrescription) => {
    setModalError(null);
    setModalSuccess(null);
    setDispenseNotes(prescription.notes ?? '');
    setSelectedPrescription(prescription);
    setPrescriptionDetailsLoading(true);
    try {
      const resp = await pharmacistApi.prescriptions.show(String(prescription.id));
      const payload = resp?.data ?? resp;
      const mapped = mapPrescriptionFromApi(payload);
      setSelectedPrescription(mapped);
      setDispenseNotes(mapped.notes ?? '');
    } catch (e: any) {
      setModalError(e?.message || 'Failed to load prescription details');
    } finally {
      setPrescriptionDetailsLoading(false);
    }
  };

  const closePrescriptionModal = () => {
    setSelectedPrescription(null);
    setPrescriptionDetailsLoading(false);
    setDispenseNotes('');
    setModalError(null);
    setModalSuccess(null);
  };

  const handleDispense = async () => {
    if (!selectedPrescription) {
      return;
    }

    setModalError(null);
    setModalSuccess(null);
    setDispensing(true);
    try {
      const resp = await pharmacistApi.prescriptions.dispense(String(selectedPrescription.id), {
        notes: dispenseNotes.trim() || undefined,
      });
      const payload = resp?.data ?? resp;
      const updated = mapPrescriptionFromApi(payload);
      setSelectedPrescription(updated);
      const alerts = Array.isArray(updated.low_stock_alerts) ? updated.low_stock_alerts : [];
      const lowStockMessage =
        alerts.length > 0
          ? ` Low stock alert: ${alerts
              .map((alert) => `${alert.name} (${alert.quantity} remaining${alert.reorder_level ? `, reorder level ${alert.reorder_level}` : ''})`)
              .join(', ')}.`
          : '';
      setModalSuccess(
        `Medication dispensed and invoice sent to reception.${lowStockMessage}`.trim()
      );
      setDispenseNotes(updated.notes ?? '');
      await loadPrescriptions();
      const latestInventory = await loadInventory();
      await loadNotifications(latestInventory);
    } catch (e: any) {
      setModalError(e?.message || 'Failed to dispense prescription');
    } finally {
      setDispensing(false);
    }
  };

  const loadInventory = async (filters?: {
    search?: string;
    category?: string;
    low_stock?: boolean;
    expiring_soon?: boolean;
  }): Promise<InventoryItem[]> => {
    setError(null);
    setInventoryLoading(true);
    let normalizedItems: InventoryItem[] = [];
    try {
      const resp = await inventoryApi.getAll(filters);
      const rawItems: InventoryItem[] = Array.isArray(resp.data)
        ? resp.data
        : Array.isArray(resp?.data?.data)
        ? resp.data.data
        : [];

      const now = new Date();
      const inThirtyDays = new Date(now.getTime());
      inThirtyDays.setDate(inThirtyDays.getDate() + 30);

      normalizedItems = rawItems.map((item: any) => {
        const quantity = parseNumber(item?.quantity, 0);
        const reorderLevel = parseNumber(item?.reorder_level, 0);
        const expiryDate = item?.expiry_date ? new Date(item.expiry_date) : null;
        const expiringSoon =
          typeof item?.is_expiring_soon === 'boolean'
            ? item.is_expiring_soon
            : expiryDate
            ? expiryDate <= inThirtyDays && expiryDate >= now
            : false;

        return {
          ...item,
          quantity,
          reorder_level: reorderLevel,
          is_low_stock:
            typeof item?.is_low_stock === 'boolean'
              ? item.is_low_stock
              : quantity <= reorderLevel,
          is_expiring_soon: expiringSoon,
        } as InventoryItem;
      });

      setInventory(normalizedItems);
      setInventoryLoaded(true);

      // Update low stock alerts - calculate from the returned data
      const lowStockCount = normalizedItems.filter((item) => item.quantity <= item.reorder_level).length;
      setStats(prev => ({
        ...prev,
        low_stock_alerts: lowStockCount,
      }));
    } catch (e: any) {
      setError(e?.message || 'Failed to load inventory');
    } finally {
      setInventoryLoading(false);
    }
    return normalizedItems;
  };

  const loadInventoryStats = async () => {
    try {
      const resp = await inventoryApi.getStats();
      setInventoryStats(resp.data || inventoryStats);
    } catch (e: any) {
      console.error('Failed to load inventory stats:', e);
    }
  };

  const handleInventorySearch = () => {
    loadInventory({
      search: inventorySearch || undefined,
      category: inventoryCategoryFilter || undefined,
      low_stock: inventoryShowLowStock || undefined,
      expiring_soon: inventoryShowExpiringSoon || undefined,
    });
  };

  const openInventoryModal = (item?: InventoryItem) => {
    if (item) {
      setEditingInventoryItem(item);
      setDrugSearchTerm(item.name);
      setInventoryForm({
        drug_name: item.name,
        category: item.category,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unit_price: item.unit_price?.toString() || '',
        selling_price: item.selling_price?.toString() || '',
        expiry_date: item.expiry_date,
        batch_number: item.batch_number || '',
        supplier_name: item.supplier?.name || '',
        low_stock_threshold: item.reorder_level.toString(),
      });
    } else {
      setEditingInventoryItem(null);
      setDrugSearchTerm('');
      setInventoryForm({
        drug_name: '',
        category: '',
        quantity: '',
        unit: '',
        unit_price: '',
        selling_price: '',
        expiry_date: '',
        batch_number: '',
        supplier_name: '',
        low_stock_threshold: '',
      });
    }
    setInventoryModalOpen(true);
  };

  const closeInventoryModal = () => {
    setInventoryModalOpen(false);
    setEditingInventoryItem(null);
    setDrugSearchTerm('');
    setShowDrugDropdown(false);
    setInventoryForm({
      drug_name: '',
      category: '',
      quantity: '',
      unit: '',
      unit_price: '',
      selling_price: '',
      expiry_date: '',
      batch_number: '',
      supplier_name: '',
      low_stock_threshold: '',
    });
  };

  const saveInventoryItem = async () => {
    if (!inventoryForm.drug_name.trim()) {
      setError('Drug name is required');
      return;
    }
    if (!inventoryForm.unit) {
      setError('Unit is required');
      return;
    }
    if (!inventoryForm.unit_price || parseFloat(inventoryForm.unit_price) < 0.01) {
      setError('Unit price must be at least $0.01');
      return;
    }
    if (!inventoryForm.selling_price || parseFloat(inventoryForm.selling_price) < 0.01) {
      setError('Selling price must be at least $0.01');
      return;
    }

    setInventorySaving(true);
    setError(null);
    setSuccess(null);
    try {
      const data = {
        name: inventoryForm.drug_name,
        category: inventoryForm.category,
        quantity: parseInt(inventoryForm.quantity) || 0,
        unit: inventoryForm.unit,
        unit_price: parseFloat(inventoryForm.unit_price) || 0.01,
        selling_price: parseFloat(inventoryForm.selling_price) || 0.01,
        expiry_date: inventoryForm.expiry_date,
        batch_number: inventoryForm.batch_number,
        reorder_level: parseInt(inventoryForm.low_stock_threshold) || 0,
        supplier_id: null, // For now, we'll set this to null since we don't have supplier selection
        is_active: true,
      };

      if (editingInventoryItem) {
        await inventoryApi.update(editingInventoryItem.id.toString(), data);
        setSuccess('Inventory item updated successfully!');
      } else {
        await inventoryApi.create(data);
        setSuccess('Inventory item added successfully!');
      }

      await loadInventory();
      await loadInventoryStats();
      closeInventoryModal();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to save inventory item');
      setSuccess(null);
    } finally {
      setInventorySaving(false);
    }
  };

  const deleteInventoryItem = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;

    setError(null);
    setSuccess(null);
    try {
      await inventoryApi.delete(id.toString());
      await loadInventory();
      await loadInventoryStats();
      setSuccess('Inventory item deleted successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete inventory item');
    }
  };

  const loadNotifications = async (sourceInventory?: InventoryItem[]): Promise<PharmacistNotification[]> => {
    setError(null);
    setNotificationsLoading(true);
    let nextNotifications: PharmacistNotification[] = [];
    try {
      // For now, we'll simulate notifications based on inventory state
      const inventorySource = sourceInventory ?? inventory;
      const notifications: PharmacistNotification[] = [];

      // Low stock notifications
      inventorySource
        .filter(item => item.is_low_stock)
        .forEach((item, index) => {
        notifications.push({
            id: Number(`${Date.now()}${index}`),
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${item.name} is running low (${item.quantity} ${item.unit} remaining)` +
              (item.reorder_level ? ` — reorder at ${item.reorder_level}` : ''),
            is_read: false,
            created_at: new Date().toISOString(),
        });
      });

      setNotifications(notifications);
      nextNotifications = notifications;
      setNotificationsLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
    return nextNotifications;
  };

  const loadAuditLogs = async () => {
    setError(null);
    setAuditLogsLoading(true);
    try {
      const resp = await pharmacistApi.auditLogs.list();
      setAuditLogs(Array.isArray(resp.data) ? resp.data : []);
      setAuditLogsLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load audit logs');
    } finally {
      setAuditLogsLoading(false);
    }
  };

  // Patient functions
  const loadPatients = async (search?: string) => {
    setError(null);
    setPatientsLoading(true);
    try {
      const resp = await pharmacistApi.patients.list({ search });
      const data = resp?.data ?? resp;
      const patientsList = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setPatients(patientsList);
      setPatientsLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load patients');
    } finally {
      setPatientsLoading(false);
    }
  };

  const handlePatientSearch = () => {
    loadPatients(patientSearch.trim() || undefined);
  };

  const handleViewPatient = async (patient: PharmacistPatient) => {
    setSelectedPatient(patient);
    setPatientModalOpen(true);
    setMedicationHistoryLoading(true);
    setMedicationHistory([]);
    try {
      const resp = await pharmacistApi.patients.medicationHistory(String(patient.id));
      const prescriptions = resp?.prescriptions?.data ?? resp?.prescriptions ?? [];
      setMedicationHistory(Array.isArray(prescriptions) ? prescriptions : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load medication history');
    } finally {
      setMedicationHistoryLoading(false);
    }
  };

  const closePatientModal = () => {
    setPatientModalOpen(false);
    setSelectedPatient(null);
    setMedicationHistory([]);
  };

  // Report functions
  const loadReport = async (reportType?: 'dispensing' | 'inventory' | 'sales' | 'patient_activity') => {
    const type = reportType ?? activeReportType;
    setReportsLoading(true);
    setError(null);
    try {
      console.log(`Loading ${type} report...`);
      if (type === 'dispensing') {
        const resp = await pharmacistApi.reports.dispensing({ from_date: reportDateFrom, to_date: reportDateTo });
        console.log('Dispensing report response:', resp);
        // Handle both direct response and wrapped response
        const reportData = resp?.data ?? resp;
        if (reportData && reportData.summary) {
          setDispensingReport(reportData);
        } else {
          console.warn('Invalid dispensing report structure:', reportData);
          setError('Invalid report data received');
        }
      } else if (type === 'inventory') {
        const resp = await pharmacistApi.reports.inventory();
        console.log('Inventory report response:', resp);
        // Handle both direct response and wrapped response
        const reportData = resp?.data ?? resp;
        if (reportData && reportData.summary) {
          setInventoryReport(reportData);
        } else {
          console.warn('Invalid inventory report structure:', reportData);
          setError('Invalid report data received');
        }
      } else if (type === 'sales') {
        const resp = await pharmacistApi.reports.sales({ from_date: reportDateFrom, to_date: reportDateTo });
        console.log('Sales report response:', resp);
        // Handle both direct response and wrapped response
        const reportData = resp?.data ?? resp;
        if (reportData && reportData.summary) {
          setSalesReport(reportData);
        } else {
          console.warn('Invalid sales report structure:', reportData);
          setError('Invalid report data received');
        }
      } else if (type === 'patient_activity') {
        const resp = await pharmacistApi.reports.patientActivity({ from_date: reportDateFrom, to_date: reportDateTo });
        console.log('Patient activity report response:', resp);
        // Handle both direct response and wrapped response
        const reportData = resp?.data ?? resp;
        if (reportData && reportData.summary) {
          setPatientActivityReport(reportData);
        } else {
          console.warn('Invalid patient activity report structure:', reportData);
          setError('Invalid report data received');
        }
      }
      setReportsLoaded(true);
    } catch (e: any) {
      console.error('Error loading report:', e);
      setError(e?.message || 'Failed to load report');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleReportTypeChange = (type: 'dispensing' | 'inventory' | 'sales' | 'patient_activity') => {
    setActiveReportType(type);
    loadReport(type);
  };

  // Print bill as PDF
  const handlePrintBill = () => {
    if (!selectedPrescription) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setModalError('Unable to open print window. Please allow popups.');
      return;
    }

    const invoiceNumber = selectedPrescription.invoice?.invoice_number || `RX-${selectedPrescription.id}`;
    const invoiceDate = selectedPrescription.dispensed_at 
      ? new Date(selectedPrescription.dispensed_at).toLocaleDateString()
      : new Date().toLocaleDateString();
    const total = selectedPrescription.invoice?.amount ?? selectedPrescriptionTotal;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px; 
            color: #333;
            max-width: 800px;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #0d9488; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .header h1 { 
            color: #0d9488; 
            font-size: 28px; 
            margin-bottom: 5px;
          }
          .header p { 
            color: #666; 
            font-size: 14px;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
          }
          .invoice-info div { flex: 1; }
          .invoice-info h3 { 
            color: #0d9488; 
            font-size: 12px; 
            text-transform: uppercase; 
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .invoice-info p { 
            font-size: 14px; 
            margin: 4px 0; 
          }
          .invoice-number {
            text-align: right;
          }
          .invoice-number .number {
            font-size: 24px;
            font-weight: bold;
            color: #0d9488;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          th { 
            background: #0d9488; 
            color: white; 
            padding: 12px 15px; 
            text-align: left;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          th:last-child { text-align: right; }
          td { 
            padding: 15px; 
            border-bottom: 1px solid #e5e7eb; 
            font-size: 14px;
          }
          td:last-child { text-align: right; font-weight: 600; }
          .medication-name { font-weight: 600; color: #111; }
          .medication-details { font-size: 12px; color: #666; margin-top: 4px; }
          .totals { 
            margin-top: 20px;
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
          }
          .totals-row {
            display: flex;
            justify-content: flex-end;
            margin: 8px 0;
            font-size: 14px;
          }
          .totals-row span:first-child {
            margin-right: 50px;
            color: #666;
          }
          .totals-row.grand-total {
            font-size: 20px;
            font-weight: bold;
            color: #0d9488;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #0d9488;
          }
          .notes {
            margin-top: 30px;
            padding: 15px;
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
          }
          .notes h4 { 
            color: #92400e; 
            margin-bottom: 8px;
            font-size: 14px;
          }
          .notes p { 
            font-size: 13px; 
            color: #78350f; 
          }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            color: #666; 
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .footer p { margin: 3px 0; }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-dispensed { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-unpaid { background: #fee2e2; color: #991b1b; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏥 Private Hospital & Clinic</h1>
          <p>Pharmacy Department</p>
          <p>123 Medical Center Drive, Healthcare City | Tel: (555) 123-4567</p>
        </div>

        <div class="invoice-info">
          <div>
            <h3>Bill To</h3>
            <p><strong>${selectedPrescription.patient_name}</strong></p>
            <p>Patient ID: ${selectedPrescription.patient_id}</p>
          </div>
          <div>
            <h3>Prescribing Doctor</h3>
            <p>Dr. ${selectedPrescription.doctor_name}</p>
            <p>Date: ${new Date(selectedPrescription.created_at).toLocaleDateString()}</p>
          </div>
          <div class="invoice-number">
            <h3>Invoice</h3>
            <p class="number">${invoiceNumber}</p>
            <p>Date: ${invoiceDate}</p>
            <p>
              <span class="status-badge ${selectedPrescription.status === 'dispensed' ? 'status-dispensed' : 'status-pending'}">
                ${selectedPrescription.status}
              </span>
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%">Medication</th>
              <th style="width: 15%">Qty</th>
              <th style="width: 15%">Unit Price</th>
              <th style="width: 20%">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${selectedPrescription.items.map(item => `
              <tr>
                <td>
                  <div class="medication-name">${item.medication_name}</div>
                  <div class="medication-details">
                    ${[item.dosage, item.frequency, item.duration].filter(Boolean).join(' • ')}
                    ${item.instructions ? `<br/>Instructions: ${item.instructions}` : ''}
                  </div>
                </td>
                <td>${item.quantity}</td>
                <td>$${(item.unit_price ?? 0).toFixed(2)}</td>
                <td>$${(item.total_price ?? item.quantity * (item.unit_price ?? 0)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>$${selectedPrescriptionTotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Tax (0%):</span>
            <span>$0.00</span>
          </div>
          <div class="totals-row grand-total">
            <span>Total Amount:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>

        ${selectedPrescription.invoice ? `
          <div style="margin-top: 20px; text-align: right;">
            <span class="status-badge ${selectedPrescription.invoice.status === 'paid' ? 'status-paid' : 'status-unpaid'}">
              Payment: ${selectedPrescription.invoice.status}
            </span>
          </div>
        ` : ''}

        ${selectedPrescription.notes ? `
          <div class="notes">
            <h4>Pharmacist Notes</h4>
            <p>${selectedPrescription.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p><strong>Thank you for choosing Private Hospital & Clinic Pharmacy</strong></p>
          <p>For questions about your medication, please contact our pharmacy at (555) 123-4567</p>
          <p>Please present this bill at the reception for payment</p>
          <p style="margin-top: 10px; color: #999;">Generated on ${new Date().toLocaleString()}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  const Sidebar = (
    <div className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-white">
      <div className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center">
            <UserCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Pharmacist Portal</div>
            <div className="text-xs text-gray-500">Private Hospital & Clinic</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-1">
        <button
          onClick={() => setActive('overview')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'overview' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm font-medium">Overview</span>
        </button>
        <button
          onClick={() => setActive('prescriptions')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'prescriptions' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Pill className="w-5 h-5" />
          <span className="text-sm font-medium">Prescriptions</span>
        </button>
        <button
          onClick={() => setActive('inventory')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'inventory' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Package className="w-5 h-5" />
          <span className="text-sm font-medium">Inventory</span>
        </button>
        <button
          onClick={() => setActive('patients')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'patients' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">Patients</span>
        </button>
        <button
          onClick={() => setActive('reports')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'reports' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-sm font-medium">Reports</span>
        </button>
        <button
          onClick={() => setActive('notifications')}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition ${active === 'notifications' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <span className="flex items-center gap-3">
            <Bell className="w-5 h-5" />
            <span className="text-sm font-medium">Notifications</span>
          </span>
          {unreadNotificationsCount > 0 && (
            <span className="min-w-6 h-6 px-2 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen bg-gray-50 flex">
        {Sidebar}

        <div className="flex-1 min-w-0">
          <div className="md:hidden bg-white border-b">
            <div className="flex items-center justify-between px-4 h-16">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="text-sm font-semibold text-gray-900">Pharmacist Dashboard</div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Logout"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>

          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
              <div className="absolute top-0 left-0 h-full w-80 bg-white shadow-xl">
                <div className="h-16 flex items-center justify-between px-4 border-b">
                  <div className="font-semibold text-gray-900">Menu</div>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-4 space-y-1">
                  <button
                    onClick={() => {
                      setActive('overview');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'overview' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-sm font-medium">Overview</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('prescriptions');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'prescriptions' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Pill className="w-5 h-5" />
                    <span className="text-sm font-medium">Prescriptions</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('inventory');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'inventory' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Package className="w-5 h-5" />
                    <span className="text-sm font-medium">Inventory</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('patients');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'patients' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-medium">Patients</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('reports');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'reports' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span className="text-sm font-medium">Reports</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('notifications');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition ${active === 'notifications' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className="flex items-center gap-3">
                      <Bell className="w-5 h-5" />
                      <span className="text-sm font-medium">Notifications</span>
                    </span>
                    {unreadNotificationsCount > 0 && (
                      <span className="min-w-6 h-6 px-2 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  <div className="pt-4">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hero-style Header */}
          <div className="relative bg-cover bg-center" style={{ backgroundImage: "url('/images/Hero.png')" }}>
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            <div className="relative z-10 px-4 md:px-8 py-12 md:py-16">
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">Welcome back, {pharmacistName}</h1>
                <p className="text-lg md:text-xl text-gray-200 mb-6">Manage prescriptions and inventory with precision</p>
                <div className="hidden md:flex items-center gap-3">
                  <button
                    onClick={() => setActive('notifications')}
                    className="relative p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition duration-300 backdrop-blur-sm"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 rounded-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-800 transition duration-300 font-bold"
                  >
                    Home
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-full bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition duration-300 font-bold"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="p-4 md:p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {active === 'overview' && (
              <div className="space-y-8">
                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Process Prescriptions */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Pill className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Process Prescriptions</h2>
                      <p className="text-gray-600">Review and dispense patient prescriptions</p>
                    </div>
                    <button
                      onClick={() => setActive('prescriptions')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      View Prescriptions
                    </button>
                  </motion.div>

                  {/* Manage Inventory */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Package className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Manage Inventory</h2>
                      <p className="text-gray-600">Monitor stock levels and reorder medications</p>
                    </div>
                    <button
                      onClick={() => setActive('inventory')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      View Inventory
                    </button>
                  </motion.div>

                  {/* Patient History */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Users className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Patient History</h2>
                      <p className="text-gray-600">View patient medication history and records</p>
                    </div>
                    <button
                      onClick={() => setActive('patients')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      View Patients
                    </button>
                  </motion.div>

                  {/* Reports & Analytics */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <BarChart3 className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Reports & Analytics</h2>
                      <p className="text-gray-600">Generate pharmacy performance reports</p>
                    </div>
                    <button
                      onClick={() => setActive('reports')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      View Reports
                    </button>
                  </motion.div>

                  {/* Notifications */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Bell className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Notifications</h2>
                      <p className="text-gray-600">View alerts and system notifications</p>
                    </div>
                    <button
                      onClick={() => setActive('notifications')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      View Notifications
                    </button>
                  </motion.div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300"
                  >
                    <h3 className="text-4xl font-extrabold text-teal-500 mb-2">
                      {stats.prescriptions_today}
                    </h3>
                    <p className="text-gray-600 font-medium">Prescriptions Today</p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300"
                  >
                    <h3 className="text-4xl font-extrabold text-teal-500 mb-2">
                      {stats.medications_dispensed}
                    </h3>
                    <p className="text-gray-600 font-medium">Medications Dispensed</p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300"
                  >
                    <h3 className="text-4xl font-extrabold text-red-500 mb-2">
                      {stats.low_stock_alerts}
                    </h3>
                    <p className="text-gray-600 font-medium">Low Stock Alerts</p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300"
                  >
                    <h3 className="text-4xl font-extrabold text-teal-500 mb-2">
                      {stats.pending_requests}
                    </h3>
                    <p className="text-gray-600 font-medium">Pending Requests</p>
                  </motion.div>
                </div>
              </div>
            )}

            {active === 'prescriptions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Prescription Management</h2>
                </div>

                {prescriptionsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading prescriptions...</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b">
                      <h3 className="text-lg font-semibold text-gray-800">Prescription Queue</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {prescriptions.map((prescription) => (
                            <tr key={prescription.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{prescription.patient_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">Dr. {prescription.doctor_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  prescription.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                                  prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  prescription.status === 'held' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {prescription.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(prescription.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleViewPrescription(prescription)}
                                  className="text-teal-600 hover:text-teal-900 mr-3"
                                >
                                  View
                                </button>
                                {prescription.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleViewPrescription(prescription)}
                                      className="text-green-600 hover:text-green-900 mr-3"
                                    >
                                      Dispense
                                    </button>
                                    <button className="text-orange-600 hover:text-orange-900 mr-3">
                                      Hold
                                    </button>
                                    <button className="text-red-600 hover:text-red-900">
                                      Reject
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === 'inventory' && (
              <div className="space-y-6">
                {/* Inventory Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                      <Package className="w-8 h-8 text-teal-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Total Items</p>
                        <p className="text-2xl font-bold text-gray-900">{inventoryStats.total_items || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Low Stock</p>
                        <p className="text-2xl font-bold text-red-600">{inventoryStats.low_stock_items || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                      <Clock className="w-8 h-8 text-orange-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Expiring Soon</p>
                        <p className="text-2xl font-bold text-orange-600">{inventoryStats.expiring_soon_items || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                      <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Total Value</p>
                        <p className="text-2xl font-bold text-gray-900">${inventoryStats.total_value || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Success and Error Messages */}
                {success && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {success}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      {error}
                    </div>
                  </div>
                )}

                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search inventory..."
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:w-48">
                      <select
                        value={inventoryCategoryFilter}
                        onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">All Categories</option>
                        <option value="analgesics">Analgesics</option>
                        <option value="antibiotics">Antibiotics</option>
                        <option value="antihistamines">Antihistamines</option>
                        <option value="cardiovascular">Cardiovascular</option>
                        <option value="dermatological">Dermatological</option>
                        <option value="gastrointestinal">Gastrointestinal</option>
                        <option value="respiratory">Respiratory</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={inventoryShowLowStock}
                          onChange={(e) => setInventoryShowLowStock(e.target.checked)}
                          className="mr-2"
                        />
                        Low Stock
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={inventoryShowExpiringSoon}
                          onChange={(e) => setInventoryShowExpiringSoon(e.target.checked)}
                          className="mr-2"
                        />
                        Expiring Soon
                      </label>
                    </div>
                    <button
                      onClick={handleInventorySearch}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg transition duration-300"
                    >
                      Search
                    </button>
                  </div>

                  {/* Add New Item Button */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Inventory Items</h3>
                    <button
                      onClick={() => openInventoryModal()}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>

                  {/* Inventory Table */}
                  {inventoryLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                      <p className="text-gray-500 mt-4">Loading inventory...</p>
                    </div>
                  ) : inventory.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>No inventory items found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drug Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {inventory.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500">{item.batch_number}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 capitalize">
                                  {item.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(item.expiry_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {item.quantity <= item.reorder_level && (
                                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-2">
                                    Low Stock
                                  </span>
                                )}
                                {item.is_expiring_soon && (
                                  <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                    Expiring Soon
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => openInventoryModal(item)}
                                  className="text-teal-600 hover:text-teal-900 mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteInventoryItem(item.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Inventory Modal */}
                {inventoryModalOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {editingInventoryItem ? 'Edit Inventory Item' : 'Add New Item'}
                        </h3>
                        <button
                          onClick={closeInventoryModal}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Success and Error Messages */}
                      {success && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {success}
                          </div>
                        </div>
                      )}

                      {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                          <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            {error}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Searchable Drug Dropdown */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Search & Select Drug *</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Type to search drugs..."
                              value={drugSearchTerm}
                              onChange={(e) => {
                                setDrugSearchTerm(e.target.value);
                                setShowDrugDropdown(true);
                                if (!e.target.value) {
                                  setInventoryForm(prev => ({ ...prev, drug_name: '', category: '', unit: '' }));
                                }
                              }}
                              onFocus={() => setShowDrugDropdown(true)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${!inventoryForm.drug_name ? 'border-red-300' : 'border-gray-300'}`}
                            />
                            {drugSearchTerm && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDrugSearchTerm('');
                                  setInventoryForm(prev => ({ ...prev, drug_name: '', category: '', unit: '' }));
                                  setShowDrugDropdown(false);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {/* Dropdown List */}
                          {showDrugDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {filteredDrugs.length > 0 ? (
                                filteredDrugs.map((drug) => (
                                  <button
                                    type="button"
                                    key={drug.name}
                                    onClick={() => handleDrugSelect(drug)}
                                    className={`w-full px-3 py-2 text-left hover:bg-teal-50 transition-colors border-b border-gray-100 last:border-b-0 ${inventoryForm.drug_name === drug.name ? 'bg-teal-50 text-teal-700' : ''}`}
                                  >
                                    <div className="font-medium text-gray-800 text-sm">{drug.name}</div>
                                    <div className="text-xs text-gray-500">{drug.generic_name} • {drug.category}</div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-gray-500 text-center text-sm">
                                  No drugs found matching "{drugSearchTerm}"
                                </div>
                              )}
                            </div>
                          )}
                          {inventoryForm.drug_name && (
                            <p className="text-teal-600 text-xs mt-1">✓ Selected: {inventoryForm.drug_name}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              value={inventoryForm.quantity}
                              onChange={(e) => setInventoryForm(prev => ({ ...prev, quantity: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                            <select
                              value={inventoryForm.unit}
                              onChange={(e) => setInventoryForm(prev => ({ ...prev, unit: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select Unit...</option>
                              <option value="tablets">Tablets</option>
                              <option value="capsules">Capsules</option>
                              <option value="ml">ml</option>
                              <option value="mg">mg</option>
                              <option value="units">Units</option>
                              <option value="bottles">Bottles</option>
                              <option value="vials">Vials</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($) *</label>
                            <input
                              type="number"
                              value={inventoryForm.unit_price}
                              onChange={(e) => setInventoryForm(prev => ({ ...prev, unit_price: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              min="0.01"
                              step="0.01"
                              placeholder="0.00"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price ($) *</label>
                            <input
                              type="number"
                              value={inventoryForm.selling_price}
                              onChange={(e) => setInventoryForm(prev => ({ ...prev, selling_price: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              min="0.01"
                              step="0.01"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input
                            type="date"
                            value={inventoryForm.expiry_date}
                            onChange={(e) => setInventoryForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                          <input
                            type="text"
                            value={inventoryForm.batch_number}
                            onChange={(e) => setInventoryForm(prev => ({ ...prev, batch_number: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                          <input
                            type="text"
                            value={inventoryForm.supplier_name}
                            onChange={(e) => setInventoryForm(prev => ({ ...prev, supplier_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                          <input
                            type="number"
                            value={inventoryForm.low_stock_threshold}
                            onChange={(e) => setInventoryForm(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={closeInventoryModal}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveInventoryItem}
                          disabled={inventorySaving}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {inventorySaving ? 'Saving...' : (editingInventoryItem ? 'Update' : 'Add')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === 'patients' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Patient Medication History</h2>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search patients by name or email..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch()}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    </div>
                    <button
                      onClick={handlePatientSearch}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg transition duration-300 flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Search
                    </button>
                  </div>
                </div>

                {/* Patients Table */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Patients with Prescriptions</h3>
                  </div>
                  {patientsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                      <p className="text-gray-500 mt-4">Loading patients...</p>
                    </div>
                  ) : patients.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>No patients found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demographics</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescriptions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {patients.map((patient) => (
                            <tr key={patient.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                                    <UserCircle className="w-6 h-6 text-teal-600" />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                    <div className="text-xs text-gray-500">ID: {patient.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{patient.email}</div>
                                <div className="text-xs text-gray-500">{patient.phone || '—'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '—'}
                                  {patient.age ? `, ${patient.age} yrs` : ''}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Blood: {patient.blood_type || '—'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">Total: {patient.total_prescriptions}</div>
                                {patient.pending_prescriptions > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    {patient.pending_prescriptions} pending
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleViewPatient(patient)}
                                  className="text-teal-600 hover:text-teal-900 flex items-center gap-1"
                                >
                                  <History className="w-4 h-4" />
                                  View History
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Patient Modal */}
                {patientModalOpen && selectedPatient && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                      <div className="flex items-start justify-between border-b px-6 py-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {selectedPatient.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Medication History
                          </p>
                        </div>
                        <button
                          onClick={closePatientModal}
                          className="text-gray-500 hover:text-gray-700"
                          aria-label="Close"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-6">
                        {/* Patient Info */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="min-w-0">
                              <span className="text-gray-500">Email:</span>
                              <p className="font-medium truncate" title={selectedPatient.email}>{selectedPatient.email}</p>
                            </div>
                            <div className="min-w-0">
                              <span className="text-gray-500">Phone:</span>
                              <p className="font-medium">{selectedPatient.phone || '—'}</p>
                            </div>
                            <div className="min-w-0">
                              <span className="text-gray-500">Blood Type:</span>
                              <p className="font-medium">{selectedPatient.blood_type || '—'}</p>
                            </div>
                            <div className="min-w-0">
                              <span className="text-gray-500">Allergies:</span>
                              <p className="font-medium break-words">{selectedPatient.allergies || 'None recorded'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Medication History */}
                        {medicationHistoryLoading ? (
                          <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading medication history...</p>
                          </div>
                        ) : medicationHistory.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <Pill className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>No medication history found</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {medicationHistory.map((prescription) => (
                              <div key={prescription.id} className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                                  <div>
                                    <span className="font-medium text-gray-900">
                                      {prescription.prescription_number}
                                    </span>
                                    <span className="mx-2 text-gray-400">•</span>
                                    <span className="text-sm text-gray-600">
                                      Dr. {prescription.doctor_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${
                                      prescription.status === 'dispensed'
                                        ? 'bg-green-100 text-green-700'
                                        : prescription.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {prescription.status}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {new Date(prescription.prescription_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-left text-gray-500">
                                        <th className="pb-2">Medication</th>
                                        <th className="pb-2">Dosage</th>
                                        <th className="pb-2">Frequency</th>
                                        <th className="pb-2">Qty</th>
                                        <th className="pb-2 text-right">Price</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {prescription.medications.map((med) => (
                                        <tr key={med.id} className="border-t">
                                          <td className="py-2 font-medium">{med.medication_name}</td>
                                          <td className="py-2">{med.dosage || '—'}</td>
                                          <td className="py-2">{med.frequency || '—'}</td>
                                          <td className="py-2">{med.quantity}</td>
                                          <td className="py-2 text-right">
                                            {currencyFormatter.format(med.total_price || 0)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t font-semibold">
                                        <td colSpan={4} className="pt-2 text-right">Total:</td>
                                        <td className="pt-2 text-right text-teal-600">
                                          {currencyFormatter.format(prescription.total_amount)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === 'reports' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
                </div>

                {/* Report Type Tabs */}
                <div className="bg-white rounded-lg shadow p-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleReportTypeChange('dispensing')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        activeReportType === 'dispensing'
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Pill className="w-4 h-4 inline mr-2" />
                      Dispensing Report
                    </button>
                    <button
                      onClick={() => handleReportTypeChange('inventory')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        activeReportType === 'inventory'
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Package className="w-4 h-4 inline mr-2" />
                      Inventory Report
                    </button>
                    <button
                      onClick={() => handleReportTypeChange('sales')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        activeReportType === 'sales'
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Sales Report
                    </button>
                    <button
                      onClick={() => handleReportTypeChange('patient_activity')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        activeReportType === 'patient_activity'
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Patient Activity
                    </button>
                  </div>
                </div>

                {/* Date Range Filter */}
                {activeReportType !== 'inventory' && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">From Date</label>
                        <input
                          type="date"
                          value={reportDateFrom}
                          onChange={(e) => setReportDateFrom(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">To Date</label>
                        <input
                          type="date"
                          value={reportDateTo}
                          onChange={(e) => setReportDateTo(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="pt-6">
                        <button
                          onClick={() => loadReport()}
                          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Generate Report
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Report Content */}
                {reportsLoading ? (
                  <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading report...</p>
                  </div>
                ) : (
                  <>
                    {/* Dispensing Report */}
                    {activeReportType === 'dispensing' && dispensingReport && (
                      <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <FileText className="w-8 h-8 text-teal-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Prescriptions</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {dispensingReport.summary.total_prescriptions}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <Pill className="w-8 h-8 text-blue-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Medications</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {dispensingReport.summary.total_medications_dispensed}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <Package className="w-8 h-8 text-purple-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Units Dispensed</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {dispensingReport.summary.total_units_dispensed}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <DollarSign className="w-8 h-8 text-green-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {currencyFormatter.format(dispensingReport.summary.total_revenue)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Top Medications */}
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                          <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Top Dispensed Medications</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medication</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Times Dispensed</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {dispensingReport.top_medications.map((med, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{med.medication_name}</td>
                                    <td className="px-6 py-4 text-gray-600">{med.category}</td>
                                    <td className="px-6 py-4 text-gray-600">{med.times_dispensed}</td>
                                    <td className="px-6 py-4 text-gray-600">{med.total_quantity}</td>
                                    <td className="px-6 py-4 text-gray-600">{currencyFormatter.format(med.total_revenue)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inventory Report */}
                    {activeReportType === 'inventory' && inventoryReport && inventoryReport.summary && (
                      <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <Package className="w-8 h-8 text-teal-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Total Items</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {inventoryReport.summary.total_items ?? 0}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <DollarSign className="w-8 h-8 text-green-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Total Value</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {currencyFormatter.format(inventoryReport.summary.total_value ?? 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <AlertTriangle className="w-8 h-8 text-orange-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Low Stock</p>
                                <p className="text-2xl font-bold text-orange-600">
                                  {inventoryReport.summary.low_stock_count ?? 0}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Expiring Soon</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                  {inventoryReport.summary.expiring_soon_count ?? 0}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <XCircle className="w-8 h-8 text-red-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Expired</p>
                                <p className="text-2xl font-bold text-red-600">
                                  {inventoryReport.summary.expired_count ?? 0}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stock Levels */}
                        {inventoryReport.stock_levels && (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Level Distribution</h3>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                              <p className="text-2xl font-bold text-red-600">{inventoryReport.stock_levels.out_of_stock ?? 0}</p>
                              <p className="text-sm text-gray-600">Out of Stock</p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                              <p className="text-2xl font-bold text-orange-600">{inventoryReport.stock_levels.critical ?? 0}</p>
                              <p className="text-sm text-gray-600">Critical</p>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                              <p className="text-2xl font-bold text-yellow-600">{inventoryReport.stock_levels.low ?? 0}</p>
                              <p className="text-sm text-gray-600">Low</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <p className="text-2xl font-bold text-green-600">{inventoryReport.stock_levels.adequate ?? 0}</p>
                              <p className="text-sm text-gray-600">Adequate</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <p className="text-2xl font-bold text-blue-600">{inventoryReport.stock_levels.overstocked ?? 0}</p>
                              <p className="text-sm text-gray-600">Overstocked</p>
                            </div>
                          </div>
                        </div>
                        )}

                        {/* Category Breakdown */}
                        {inventoryReport.category_breakdown && inventoryReport.category_breakdown.length > 0 && (
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                          <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Category Breakdown</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Low Stock</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {inventoryReport.category_breakdown.map((cat, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{cat.category}</td>
                                    <td className="px-6 py-4 text-gray-600">{cat.item_count}</td>
                                    <td className="px-6 py-4 text-gray-600">{cat.total_quantity}</td>
                                    <td className="px-6 py-4 text-gray-600">{currencyFormatter.format(cat.total_value)}</td>
                                    <td className="px-6 py-4">
                                      {cat.low_stock_count > 0 ? (
                                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                          {cat.low_stock_count}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">0</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        )}
                      </div>
                    )}

                    {/* Sales Report */}
                    {activeReportType === 'sales' && salesReport && (
                      <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <FileText className="w-8 h-8 text-teal-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Total Invoices</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {salesReport.summary.total_invoices}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <DollarSign className="w-8 h-8 text-green-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {currencyFormatter.format(salesReport.summary.total_amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Collected</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {currencyFormatter.format(salesReport.summary.paid_amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Outstanding</p>
                                <p className="text-2xl font-bold text-red-600">
                                  {currencyFormatter.format(salesReport.summary.unpaid_amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Collection Rate */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Collection Rate</h3>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 bg-gray-200 rounded-full h-4">
                              <div 
                                className="bg-teal-500 h-4 rounded-full transition-all"
                                style={{ width: `${salesReport.summary.collection_rate}%` }}
                              ></div>
                            </div>
                            <span className="text-2xl font-bold text-teal-600">
                              {salesReport.summary.collection_rate}%
                            </span>
                          </div>
                        </div>

                        {/* Payment Status */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Status Breakdown</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <p className="text-2xl font-bold text-green-600">{salesReport.status_breakdown.paid.count}</p>
                              <p className="text-sm text-gray-600">Paid</p>
                              <p className="text-xs text-gray-500">{currencyFormatter.format(salesReport.status_breakdown.paid.amount)}</p>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                              <p className="text-2xl font-bold text-yellow-600">{salesReport.status_breakdown.unpaid.count}</p>
                              <p className="text-sm text-gray-600">Unpaid</p>
                              <p className="text-xs text-gray-500">{currencyFormatter.format(salesReport.status_breakdown.unpaid.amount)}</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <p className="text-2xl font-bold text-blue-600">{salesReport.status_breakdown.partial.count}</p>
                              <p className="text-sm text-gray-600">Partial</p>
                              <p className="text-xs text-gray-500">{currencyFormatter.format(salesReport.status_breakdown.partial.amount)}</p>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                              <p className="text-2xl font-bold text-red-600">{salesReport.status_breakdown.overdue.count}</p>
                              <p className="text-sm text-gray-600">Overdue</p>
                              <p className="text-xs text-gray-500">{currencyFormatter.format(salesReport.status_breakdown.overdue.amount)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Patient Activity Report */}
                    {activeReportType === 'patient_activity' && patientActivityReport && (
                      <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <Users className="w-8 h-8 text-teal-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Unique Patients</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {patientActivityReport.summary.unique_patients}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <UserCircle className="w-8 h-8 text-green-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">New Patients</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {patientActivityReport.summary.new_patients}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <Activity className="w-8 h-8 text-blue-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Returning</p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {patientActivityReport.summary.returning_patients}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                              <FileText className="w-8 h-8 text-purple-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-600">Prescriptions</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {patientActivityReport.summary.total_prescriptions}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Top Patients */}
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                          <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Top Patients by Activity</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prescriptions</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {patientActivityReport.top_patients.map((patient, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{patient.patient_name}</td>
                                    <td className="px-6 py-4 text-gray-600">{patient.prescription_count}</td>
                                    <td className="px-6 py-4 text-gray-600">{currencyFormatter.format(patient.total_spent)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* No report loaded */}
                    {!dispensingReport && !inventoryReport && !salesReport && !patientActivityReport && (
                      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-4">Select a report type and click Generate Report</p>
                        <button
                          onClick={() => loadReport()}
                          className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg transition"
                        >
                          Generate Report
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {active === 'notifications' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>
                {notificationsLoading ? (
                  <div className="text-center py-12">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No notifications</div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedPrescription && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-start justify-between border-b px-6 py-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Prescription #{selectedPrescription.id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Patient: {selectedPrescription.patient_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${
                          selectedPrescription.status === 'dispensed'
                            ? 'bg-green-100 text-green-700'
                            : selectedPrescription.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : selectedPrescription.status === 'held'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {selectedPrescription.status}
                      </span>
                      <button
                        onClick={closePrescriptionModal}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Close prescription details"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {prescriptionDetailsLoading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                      <p className="text-gray-500 mt-4">Loading prescription details...</p>
                    </div>
                  ) : (
                    <div className="px-6 py-5 space-y-6">
                      {modalError && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                          <AlertTriangle className="w-5 h-5 mt-0.5" />
                          <p className="text-sm">{modalError}</p>
                        </div>
                      )}

                      {modalSuccess && (
                        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                          <CheckCircle className="w-5 h-5 mt-0.5" />
                          <p className="text-sm">{modalSuccess}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-semibold text-gray-800">Patient</p>
                          <p>{selectedPrescription.patient_name}</p>
                          <p className="mt-3 font-semibold text-gray-800">Doctor</p>
                          <p>Dr. {selectedPrescription.doctor_name}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Created</p>
                          <p>{formatDate(selectedPrescription.created_at)}</p>
                          <p className="mt-3 font-semibold text-gray-800">Updated</p>
                          <p>{formatDate(selectedPrescription.updated_at)}</p>
                        </div>
                      </div>

                      {selectedPrescription.interaction_warnings &&
                        selectedPrescription.interaction_warnings.length > 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-orange-700">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 mt-0.5" />
                              <div>
                                <p className="font-semibold text-sm">Potential drug interactions detected</p>
                                <ul className="mt-2 space-y-1 text-xs">
                                  {selectedPrescription.interaction_warnings.map((warning, index) => (
                                    <li key={index}>• {warning}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                      {selectedPrescription.low_stock_alerts &&
                        selectedPrescription.low_stock_alerts.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 mt-0.5" />
                              <div>
                                <p className="font-semibold text-sm">Inventory alert</p>
                                <ul className="mt-2 space-y-1 text-xs">
                                  {selectedPrescription.low_stock_alerts.map((alert) => (
                                    <li key={alert.inventory_item_id}>
                                      • {alert.name} has {alert.quantity} remaining
                                      {alert.reorder_level ? ` (reorder at ${alert.reorder_level})` : ''}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                      <div>
                        <h4 className="text-base font-semibold text-gray-900 mb-3">Medications</h4>
                        <div className="space-y-3">
                          {selectedPrescription.items.map((item) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-900">{item.medication_name}</p>
                                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                                    {item.dosage && <p>Dosage: {item.dosage}</p>}
                                    {item.frequency && <p>Frequency: {item.frequency}</p>}
                                    {item.duration && <p>Duration: {item.duration}</p>}
                                    {item.instructions && <p>Instructions: {item.instructions}</p>}
                                  </div>
                                </div>
                                <div className="text-right text-sm text-gray-600">
                                  <p>Qty: <span className="font-medium text-gray-900">{item.quantity}</span></p>
                                  <p className="mt-1">Unit price: {currencyFormatter.format(item.unit_price ?? 0)}</p>
                                  <p className="mt-1 text-base font-semibold text-gray-900">
                                    {currencyFormatter.format(item.total_price ?? item.quantity * (item.unit_price ?? 0))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Prescription Total</p>
                          <p className="text-2xl font-semibold text-gray-900 mt-1">
                            {currencyFormatter.format(
                              selectedPrescription.invoice?.amount ?? selectedPrescriptionTotal
                            )}
                          </p>
                          {selectedPrescription.dispensed_at && (
                            <p className="text-xs text-gray-500 mt-2">
                              Dispensed on {new Date(selectedPrescription.dispensed_at).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {selectedPrescription.invoice && (
                          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-teal-700">
                                  Invoice {selectedPrescription.invoice.invoice_number || selectedPrescription.invoice.id}
                                </p>
                                <p className="text-xs text-teal-600 mt-1 capitalize">
                                  Status: {selectedPrescription.invoice.status}
                                </p>
                                {selectedPrescription.invoice.description && (
                                  <p className="text-xs text-gray-600 mt-2">
                                    {selectedPrescription.invoice.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-teal-700">
                                  {currencyFormatter.format(selectedPrescription.invoice.amount ?? 0)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Due {formatDate(selectedPrescription.invoice.due_date)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedPrescription.notes && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-sm font-semibold text-gray-800 mb-2">Existing Notes</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {selectedPrescription.notes}
                          </p>
                        </div>
                      )}

                      {selectedPrescription.status === 'pending' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes to include with invoice (optional)
                          </label>
                          <textarea
                            value={dispenseNotes}
                            onChange={(e) => setDispenseNotes(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Add pharmacist guidance for the patient or receptionist"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            This note will be stored with the prescription record for receptionist billing.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t px-6 py-4 bg-gray-50">
                    <div className="text-xs text-gray-500">
                      {selectedPrescription.dispensed_at
                        ? `Dispensed on ${new Date(selectedPrescription.dispensed_at).toLocaleString()}`
                        : 'Awaiting pharmacist action'}
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={handlePrintBill}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print Bill
                      </button>
                      <button
                        onClick={closePrescriptionModal}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        Close
                      </button>
                      {selectedPrescription.status === 'pending' && (
                        <button
                          onClick={handleDispense}
                          disabled={dispensing}
                          className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {dispensing ? 'Dispensing...' : 'Dispense & Create Invoice'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
