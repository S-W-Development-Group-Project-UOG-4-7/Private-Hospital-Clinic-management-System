import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import api from '../../api/axiosConfig'; 
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Users, Stethoscope, Building2, UserCog, 
  ArrowUpRight, Bell, Search, Menu, BarChart3 // <--- Added BarChart3 icon
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';

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

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Determines if we are on the main dashboard page or a sub-page
  const isMainPage = location.pathname === '/admin' || location.pathname === '/admin/';
  
  // State for Counts
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0, total_doctors: 0, total_patients: 0, total_staff: 0, total_departments: 0,
  });

  // State for Chart
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true); // For mobile responsiveness

  // Date Helper
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

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

  // Quick Actions Config
  const actions = [
    { title: 'Manage Users', icon: <Users size={20} />, path: '/admin/users', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Inventory', icon: <Building2 size={20} />, path: '/admin/inventory', color: 'text-orange-600', bg: 'bg-orange-50' },
    // --- NEW: Added Reports Button ---
    { title: 'System Reports', icon: <BarChart3 size={20} />, path: '/admin/reports', color: 'text-purple-600', bg: 'bg-purple-50' },
    // ---------------------------------
    { title: 'Departments', icon: <Building2 size={20} />, path: '/admin/departments', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Add Staff', icon: <UserCog size={20} />, path: '/admin/users/new', color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-100 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <AdminSidebar />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-gray-700">
                <Menu size={24} />
             </button>
             <h2 className="text-xl font-bold text-gray-800 tracking-tight">Hospital Admin</h2>
             <span className="hidden md:inline px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-500">{today}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Global search..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none w-64 transition-all" />
            </div>
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
                <Bell size={20} />
            </button>
            <div className="h-8 w-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                A
            </div>
          </div>
        </header>

        <main className="p-8 flex-1 overflow-y-auto">
          {/* LOGIC: If we are at "/admin", show the dashboard widgets.
            If we are at "/admin/users", show the <Outlet /> which renders the UsersList component.
          */}
          {isMainPage ? (
            <div className="space-y-8 animate-fade-in">
              
              <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">Here is what is happening in your hospital today.</p>
                </div>
                <button onClick={() => navigate('/admin/users/new')} className="bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 transition shadow-sm font-medium flex items-center gap-2">
                    <Users size={18} /> Add New Staff
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Patients</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.total_patients}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users size={20} /></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Doctors</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.total_doctors}</h3>
                        </div>
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600"><Stethoscope size={20} /></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Staff</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.total_staff}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><UserCog size={20} /></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Departments</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.total_departments}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Building2 size={20} /></div>
                    </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* REAL CHART DATA */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-gray-800">Patient Flow Analytics (Last 7 Days)</h3>
                      </div>
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData}>
                                  <defs>
                                      <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                  <Area type="monotone" dataKey="patients" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorPatients)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Quick Access List */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-800 mb-4">Quick Access</h3>
                      <div className="space-y-3">
                          {actions.map((action, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => navigate(action.path)}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition group"
                              >
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${action.bg} ${action.color}`}>
                                          {action.icon}
                                      </div>
                                      <span className="font-medium text-gray-700 group-hover:text-gray-900">{action.title}</span>
                                  </div>
                                  <ArrowUpRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

            </div>
          ) : (
            // This displays UsersList, Departments, etc. when URL is /admin/users or /admin/departments
            <div className="animate-fade-in">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;