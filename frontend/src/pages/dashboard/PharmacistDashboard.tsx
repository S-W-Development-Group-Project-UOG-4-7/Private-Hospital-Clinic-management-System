import React, { useEffect, useMemo, useState } from 'react';
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pharmacistApi } from '../../api/pharmacy';
import type {
  DashboardStats,
  PharmacistPrescription,
  InventoryItem,
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
      setPrescriptions(Array.isArray(resp.data) ? resp.data : []);
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

  const loadInventory = async () => {
    setError(null);
    setInventoryLoading(true);
    try {
      const resp = await pharmacistApi.inventory.list();
      setInventory(Array.isArray(resp.data) ? resp.data : []);
      setInventoryLoaded(true);

      // Update low stock alerts
      const lowStockCount = resp.data?.filter((item: InventoryItem) => item.is_low_stock).length || 0;
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
          message: `${item.drug_name} is running low (${item.quantity} ${item.unit} remaining)`,
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
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Inventory Management</h2>
                {inventoryLoading ? (
                  <div className="text-center py-12">Loading inventory...</div>
                ) : inventory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No inventory items found</div>
                ) : (
                  <div className="space-y-4">
                    {inventory.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.drug_name}</h3>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity} {item.unit}</p>
                            <p className="text-sm text-gray-600">Expiry: {item.expiry_date}</p>
                            {item.is_low_stock && (
                              <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                Low Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
    </div>
  );
};

export default PharmacistDashboard;
