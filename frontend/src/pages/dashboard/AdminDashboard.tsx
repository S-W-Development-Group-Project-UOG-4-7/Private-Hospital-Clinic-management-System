import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../../components/admin/AdminSidebar';

// 1. Define the shape of the data we expect from Laravel
interface DashboardStats {
  total_users: number;
  total_doctors: number;
  total_patients: number;
  total_staff: number;
  total_departments: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  path: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // 2. State to hold the real data (initially 0)
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_doctors: 0,
    total_patients: 0,
    total_staff: 0,
    total_departments: 0,
  });

  const [loading, setLoading] = useState(true);

  // 3. Fetch real data on component load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken'); 
        
        if (!token) {
             console.error("No auth token found");
             return;
        }

        const response = await axios.get<DashboardStats>('http://localhost:8000/api/admin/stats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setStats(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading stats:", error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions: QuickAction[] = [
    {
      title: 'User Management',
      description: 'Manage doctors, staff, and patient accounts',
      icon: '👥',
      color: 'bg-blue-500',
      path: '/admin/users'
    },
    {
      title: 'Appointments',
      description: 'View and manage all appointments',
      icon: '📅',
      color: 'bg-green-500',
      path: '/admin/appointments'
    },
    {
      title: 'Departments',
      description: 'Manage hospital departments',
      icon: '🏥',
      color: 'bg-purple-500',
      path: '/admin/departments'
    },
    {
      title: 'Pharmacy',
      description: 'Manage pharmacy inventory and orders',
      icon: '💊',
      color: 'bg-orange-500',
      path: '/admin/pharmacy'
    },
    {
      title: 'Billing',
      description: 'Manage billing and payments',
      icon: '💰',
      color: 'bg-red-500',
      path: '/admin/billing'
    },
    {
      title: 'Reports',
      description: 'Generate and view reports',
      icon: '📈',
      color: 'bg-indigo-500',
      path: '/admin/reports'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="pl-64">
        {/* Header with Background */}
        <div 
          className="relative bg-cover bg-center bg-no-repeat px-8 py-12"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("https://images.unsplash.com/photo-1538108149393-fbbd81895907?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80")',
          }}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-center">
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-lg opacity-90">Welcome back! Here's what's happening in your hospital today.</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg transition border border-white/30"
                >
                  Home
                </button>
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                  <div className="w-8 h-8 bg-white text-teal-600 rounded-full flex items-center justify-center font-bold">
                    A
                  </div>
                  <span className="text-white font-medium">Admin</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {loading ? '...' : stats.total_patients}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👨‍⚕️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Doctors</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {loading ? '...' : stats.total_doctors}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🩺</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Departments</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {loading ? '...' : stats.total_departments}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏥</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Staff Members</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {loading ? '...' : stats.total_staff}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className={`h-2 ${action.color}`}></div>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white text-2xl mr-4`}>
                        {action.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">{action.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{action.description}</p>
                    <button
                      onClick={() => navigate(action.path)}
                      className={`w-full ${action.color} text-white py-2 rounded-lg hover:opacity-90 transition-opacity`}
                    >
                      Open {action.title}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm mr-3">
                      👤
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium">New user registered</p>
                      <p className="text-gray-600 text-sm">2 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm mr-3">
                      📅
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium">Appointment scheduled</p>
                      <p className="text-gray-600 text-sm">15 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm mr-3">
                      💊
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium">Pharmacy order received</p>
                      <p className="text-gray-600 text-sm">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">System Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">System Status</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Database</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Backup</span>
                  <span className="text-gray-800 font-medium">Today, 2:00 AM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Storage Used</span>
                  <span className="text-gray-800 font-medium">45.2 GB / 100 GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
