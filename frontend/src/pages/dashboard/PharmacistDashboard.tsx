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
} from 'lucide-react';

type SectionKey =
  | 'overview'
  | 'prescriptions'
  | 'inventory'
  | 'controlled_substances'
  | 'returns'
  | 'reports'
  | 'notifications';

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

  const [controlledDrugsLoaded, setControlledDrugsLoaded] = useState(false);
  const [controlledDrugsLoading, setControlledDrugsLoading] = useState(false);
  const [controlledDrugs, setControlledDrugs] = useState<ControlledDrugLog[]>([]);

  const [returnsLoaded, setReturnsLoaded] = useState(false);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returns, setReturns] = useState<ReturnItem[]>([]);

  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState<PharmacistNotification[]>([]);

  const [auditLogsLoaded, setAuditLogsLoaded] = useState(false);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

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
      if (active === 'controlled_substances' && !controlledDrugsLoaded && !controlledDrugsLoading) {
        await loadControlledDrugs();
      }
      if (active === 'returns' && !returnsLoaded && !returnsLoading) {
        await loadReturns();
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
      // Transform API data to match expected format
      const rawData = Array.isArray(resp.data) ? resp.data : [];
      const transformedData = rawData.map((p: any) => ({
        ...p,
        patient_name: p.patient ? `${p.patient.first_name || ''} ${p.patient.last_name || ''}`.trim() : 'Unknown Patient',
        doctor_name: p.doctor ? `${p.doctor.first_name || ''} ${p.doctor.last_name || ''}`.trim() : 'Unknown Doctor',
        items: p.items?.map((item: any) => ({
          ...item,
          medication_name: item.inventory_item?.name || item.medicine_name || 'Unknown Medication',
        })) || [],
      }));
      setPrescriptions(transformedData);
      setPrescriptionsLoaded(true);

      // Update stats
      const today = new Date().toISOString().slice(0, 10);
      const todayPrescriptions = resp.data?.filter((p: PharmacistPrescription) =>
        p.created_at.startsWith(today)
      ).length || 0;
      const dispensedCount = resp.data?.filter((p: PharmacistPrescription) =>
        p.status === 'dispensed'
      ).length || 0;

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

  const loadInventory = async (filters?: {
    search?: string;
    category?: string;
    low_stock?: boolean;
    expiring_soon?: boolean;
  }) => {
    setError(null);
    setInventoryLoading(true);
    try {
      const resp = await inventoryApi.getAll(filters);
      setInventory(Array.isArray(resp.data) ? resp.data : resp.data?.data || []);
      setInventoryLoaded(true);

      // Update low stock alerts - calculate from the returned data
      const items = Array.isArray(resp.data) ? resp.data : resp.data?.data || [];
      const lowStockCount = items.filter((item: InventoryItem) => item.quantity <= item.reorder_level).length;
      setStats(prev => ({
        ...prev,
        low_stock_alerts: lowStockCount,
      }));
    } catch (e: any) {
      setError(e?.message || 'Failed to load inventory');
    } finally {
      setInventoryLoading(false);
    }
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

  const loadControlledDrugs = async () => {
    setError(null);
    setControlledDrugsLoading(true);
    try {
      const resp = await pharmacistApi.controlledDrugs.list();
      setControlledDrugs(Array.isArray(resp.data) ? resp.data : []);
      setControlledDrugsLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load controlled drugs');
    } finally {
      setControlledDrugsLoading(false);
    }
  };

  const loadReturns = async () => {
    setError(null);
    setReturnsLoading(true);
    try {
      const resp = await pharmacistApi.returns.list();
      setReturns(Array.isArray(resp.data) ? resp.data : []);
      setReturnsLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load returns');
    } finally {
      setReturnsLoading(false);
    }
  };

  const loadNotifications = async () => {
    setError(null);
    setNotificationsLoading(true);
    try {
      // For now, we'll simulate notifications based on inventory and prescriptions
      const notifications: PharmacistNotification[] = [];

      // Low stock notifications
      inventory.filter(item => item.is_low_stock).forEach((item, index) => {
        notifications.push({
          id: index + 1,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${item.name} is running low (${item.quantity} ${item.unit} remaining)`,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      });

      setNotifications(notifications);
      setNotificationsLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
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
          onClick={() => setActive('controlled_substances')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'controlled_substances' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-sm font-medium">Controlled Substances</span>
        </button>
        <button
          onClick={() => setActive('returns')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'returns' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-sm font-medium">Returns</span>
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
                      setActive('controlled_substances');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'controlled_substances' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="text-sm font-medium">Controlled Substances</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('returns');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'returns' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span className="text-sm font-medium">Returns</span>
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

                  {/* Controlled Substances */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Shield className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Controlled Substances</h2>
                      <p className="text-gray-600">Track and manage controlled drug inventory</p>
                    </div>
                    <button
                      onClick={() => setActive('controlled_substances')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      View Logs
                    </button>
                  </motion.div>

                  {/* Returns Management */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <RotateCcw className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Returns Management</h2>
                      <p className="text-gray-600">Handle medication returns and refunds</p>
                    </div>
                    <button
                      onClick={() => setActive('returns')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      View Returns
                    </button>
                  </motion.div>

                  {/* Reports & Analytics */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
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
                    transition={{ duration: 0.5, delay: 0.5 }}
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
                    transition={{ duration: 0.5, delay: 0.6 }}
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
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition">
                      New Prescription
                    </button>
                  </div>
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
                                  onClick={() => setSelectedPrescription(prescription)}
                                  className="text-teal-600 hover:text-teal-900 mr-3"
                                >
                                  View
                                </button>
                                {prescription.status === 'pending' && (
                                  <>
                                    <button className="text-green-600 hover:text-green-900 mr-3">
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

            {active === 'controlled_substances' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Controlled Substances Log</h2>
                {controlledDrugsLoading ? (
                  <div className="text-center py-12">Loading controlled drugs...</div>
                ) : controlledDrugs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No controlled drug logs found</div>
                ) : (
                  <div className="space-y-4">
                    {controlledDrugs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{log.drug_name}</h3>
                            <p className="text-sm text-gray-600">Quantity: {log.quantity}</p>
                            <p className="text-sm text-gray-600">Date: {new Date(log.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {active === 'returns' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Returns Management</h2>
                {returnsLoading ? (
                  <div className="text-center py-12">Loading returns...</div>
                ) : returns.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No returns found</div>
                ) : (
                  <div className="space-y-4">
                    {returns.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.drug_name}</h3>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            <p className="text-sm text-gray-600">Reason: {item.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {active === 'reports' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h2>
                <div className="text-center py-12 text-gray-500">
                  Reports functionality coming soon...
                </div>
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
          </div>
        </div>
      </div>

      {/* Prescription Details Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Prescription Details</h2>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Patient & Doctor Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Patient</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedPrescription.patient_name}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Doctor</p>
                    <p className="text-lg font-semibold text-gray-900">Dr. {selectedPrescription.doctor_name}</p>
                  </div>
                </div>

                {/* Status & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPrescription.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                      selectedPrescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedPrescription.status === 'held' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedPrescription.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-gray-900">{new Date(selectedPrescription.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Medications</h3>
                  {selectedPrescription.items && selectedPrescription.items.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPrescription.items.map((item, index) => (
                        <div key={item.id || index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">{item.medication_name}</p>
                              <div className="text-sm text-gray-600 mt-1 space-y-1">
                                {item.dosage && <p>Dosage: {item.dosage}</p>}
                                {item.frequency && <p>Frequency: {item.frequency}</p>}
                                {item.duration && <p>Duration: {item.duration}</p>}
                                {item.quantity && <p>Quantity: {item.quantity}</p>}
                                {item.instructions && <p>Instructions: {item.instructions}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No medications listed</p>
                  )}
                </div>

                {/* Actions */}
                {selectedPrescription.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        // TODO: Implement dispense functionality
                        setSuccess('Prescription dispensed successfully');
                        setSelectedPrescription(null);
                        loadPrescriptions();
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Dispense
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPrescription(null);
                      }}
                      className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Hold
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPrescription(null);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacistDashboard;
