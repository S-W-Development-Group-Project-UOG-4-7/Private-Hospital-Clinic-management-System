import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axiosConfig'; 
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Users, Stethoscope, Building2, UserCog, 
  Bell, Menu, BarChart3, LayoutDashboard, Package, LogOut, X, Calendar, UserCircle
} from 'lucide-react';

// 1. Define Data Interfaces
interface DashboardStats {
  total_users: number;
  total_doctors: number;
  total_patients: number;
  total_staff: number;
  total_departments: number;
}

interface ChartDataPoint {
  name: string;
  patients: number;
}

interface ApiResponse {
  counts: DashboardStats;
  chart_data: ChartDataPoint[];
}

type SectionKey = 'overview' | 'users' | 'inventory' | 'departments' | 'appointments' | 'reports';

const safeParseJson = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useMemo(() => safeParseJson(localStorage.getItem('authUser')), []);
  const adminName = authUser?.name || 'Administrator';
  
  // Determines if we are on the main dashboard page or a sub-page
  const isMainPage = location.pathname === '/admin' || location.pathname === '/admin/';
  
  const [active, setActive] = useState<SectionKey>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // State for Counts
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0, total_doctors: 0, total_patients: 0, total_staff: 0, total_departments: 0,
  });

  // State for Chart
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch stats if we are actually looking at the dashboard widgets
    if (isMainPage) {
      const fetchStats = async () => {
        try {
          const res = await api.get<ApiResponse>('/admin/dashboard-stats');
          
          setStats(res.data.counts);
          setChartData(res.data.chart_data);
          setLoading(false);
        } catch (error) {
          console.error("Error loading stats:", error);
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [isMainPage]);

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
            <div className="text-sm font-semibold text-gray-900">Admin Portal</div>
            <div className="text-xs text-gray-500">Hospital Management</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-1">
        <button
          onClick={() => { setActive('overview'); navigate('/admin'); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'overview' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm font-medium">Overview</span>
        </button>
        <button
          onClick={() => { setActive('users'); navigate('/admin/users'); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'users' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">User Management</span>
        </button>
        <button
          onClick={() => { setActive('inventory'); navigate('/admin/inventory'); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'inventory' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Package className="w-5 h-5" />
          <span className="text-sm font-medium">Inventory</span>
        </button>
        <button
          onClick={() => { setActive('departments'); navigate('/admin/departments'); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'departments' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-sm font-medium">Departments</span>
        </button>
        <button
          onClick={() => { setActive('appointments'); navigate('/admin/appointments'); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'appointments' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-medium">Appointments</span>
        </button>
        <button
          onClick={() => { setActive('reports'); navigate('/admin/reports'); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'reports' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-sm font-medium">Reports</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen bg-gray-50 flex">
        {Sidebar}

        <div className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="md:hidden bg-white border-b">
            <div className="flex items-center justify-between px-4 h-16">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="text-sm font-semibold text-gray-900">Admin Dashboard</div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Logout"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
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
                    onClick={() => { setActive('overview'); navigate('/admin'); setMobileNavOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'overview' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-sm font-medium">Overview</span>
                  </button>
                  <button
                    onClick={() => { setActive('users'); navigate('/admin/users'); setMobileNavOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'users' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-medium">User Management</span>
                  </button>
                  <button
                    onClick={() => { setActive('inventory'); navigate('/admin/inventory'); setMobileNavOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'inventory' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Package className="w-5 h-5" />
                    <span className="text-sm font-medium">Inventory</span>
                  </button>
                  <button
                    onClick={() => { setActive('departments'); navigate('/admin/departments'); setMobileNavOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'departments' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Departments</span>
                  </button>
                  <button
                    onClick={() => { setActive('appointments'); navigate('/admin/appointments'); setMobileNavOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'appointments' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">Appointments</span>
                  </button>
                  <button
                    onClick={() => { setActive('reports'); navigate('/admin/reports'); setMobileNavOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'reports' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span className="text-sm font-medium">Reports</span>
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
                <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">Welcome back, {adminName}</h1>
                <p className="text-lg md:text-xl text-gray-200 mb-6">Manage your hospital operations efficiently</p>
                <div className="hidden md:flex items-center gap-3">
                  <button
                    className="relative p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition duration-300 backdrop-blur-sm"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
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
            {/* LOGIC: If we are at "/admin", show the dashboard widgets.
              If we are at "/admin/users", show the <Outlet /> which renders the UsersList component.
            */}
            {isMainPage ? (
              <div className="space-y-8">
                {/* Dashboard Grid - Quick Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Manage Users */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Users className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">User Management</h2>
                      <p className="text-gray-600">Manage staff accounts and permissions</p>
                    </div>
                    <button
                      onClick={() => { setActive('users'); navigate('/admin/users'); }}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      Manage Users
                    </button>
                  </motion.div>

                  {/* Inventory */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Package className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Inventory Management</h2>
                      <p className="text-gray-600">Monitor and manage hospital inventory</p>
                    </div>
                    <button
                      onClick={() => { setActive('inventory'); navigate('/admin/inventory'); }}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      View Inventory
                    </button>
                  </motion.div>

                  {/* Departments */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Building2 className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Departments</h2>
                      <p className="text-gray-600">Organize hospital departments</p>
                    </div>
                    <button
                      onClick={() => { setActive('departments'); navigate('/admin/departments'); }}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      Manage Departments
                    </button>
                  </motion.div>

                  {/* Appointments */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Calendar className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Appointments</h2>
                      <p className="text-gray-600">View and manage all appointments</p>
                    </div>
                    <button
                      onClick={() => { setActive('appointments'); navigate('/admin/appointments'); }}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      View Appointments
                    </button>
                  </motion.div>

                  {/* Reports */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <BarChart3 className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">System Reports</h2>
                      <p className="text-gray-600">Generate detailed analytics reports</p>
                    </div>
                    <button
                      onClick={() => { setActive('reports'); navigate('/admin/reports'); }}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      View Reports
                    </button>
                  </motion.div>

                  {/* Add Staff */}
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <UserCog className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Add New Staff</h2>
                      <p className="text-gray-600">Register new staff members</p>
                    </div>
                    <button
                      onClick={() => navigate('/admin/users/new')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      Add Staff
                    </button>
                  </motion.div>
                </div>

                {/* Quick Stats */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                  <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-teal-500">{loading ? '...' : stats.total_patients}</h3>
                    <p className="text-gray-600 mt-1">Total Patients</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-teal-50 rounded-lg">
                        <Stethoscope className="w-6 h-6 text-teal-600" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-teal-500">{loading ? '...' : stats.total_doctors}</h3>
                    <p className="text-gray-600 mt-1">Active Doctors</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <UserCog className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-teal-500">{loading ? '...' : stats.total_staff}</h3>
                    <p className="text-gray-600 mt-1">Total Staff</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <Building2 className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-teal-500">{loading ? '...' : stats.total_departments}</h3>
                    <p className="text-gray-600 mt-1">Departments</p>
                  </div>
                </motion.div>

                {/* Patient Flow Chart */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="bg-white p-6 rounded-xl shadow-lg"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 text-lg">Patient Flow Analytics (Last 7 Days)</h3>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="patients" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorPatients)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

              </div>
            ) : (
              // This displays UsersList, Departments, etc. when URL is /admin/users or /admin/departments
              <div className="animate-fade-in">
                <Outlet />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;