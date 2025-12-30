import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// IMPORT YOUR NEW COMPONENT
// Ensure this path matches your folder structure:
import BedManagement from '../../components/admin/BedManagement';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Define the View State type explicitly for TypeScript
  type ViewState = 'dashboard' | 'beds';
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage hospital operations and staff</p>
          </div>
          <div className="flex space-x-4">
            {/* Show 'Back' button if we are NOT on the dashboard */}
            {currentView !== 'dashboard' && (
               <button
                 onClick={() => setCurrentView('dashboard')}
                 className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
               >
                 ← Back to Dashboard
               </button>
            )}

            <button
              onClick={() => navigate('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              Home
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* --- VIEW 1: MAIN DASHBOARD --- */}
        {currentView === 'dashboard' && (
          <>
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* 1. Ward & Bed Management (NEW CARD) */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6 border-l-4 border-blue-500">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Ward & Beds</h2>
                <p className="text-gray-600 mb-4">Track occupancy, admit/discharge patients</p>
                <button 
                  onClick={() => setCurrentView('beds')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition w-full"
                >
                  Manage Wards
                </button>
              </div>

              {/* 2. Users Management */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">User Management</h2>
                <p className="text-gray-600 mb-4">Manage doctors, staff, and patient accounts</p>
                <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
                  Manage Users
                </button>
              </div>

              {/* 3. Appointments */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointments</h2>
                <p className="text-gray-600 mb-4">View and manage all appointments</p>
                <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
                  View Appointments
                </button>
              </div>

              {/* 4. System Settings */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">System Settings</h2>
                <p className="text-gray-600 mb-4">Configure hospital system settings</p>
                <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
                  Settings
                </button>
              </div>

              {/* 5. Reports */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Reports</h2>
                <p className="text-gray-600 mb-4">Generate and view reports</p>
                <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
                  View Reports
                </button>
              </div>

              {/* 6. Pharmacy */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Pharmacy</h2>
                <p className="text-gray-600 mb-4">Manage pharmacy inventory and orders</p>
                <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
                  Pharmacy Management
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                <h3 className="text-2xl font-bold text-teal-500">150</h3>
                <p className="text-gray-600">Total Patients</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                <h3 className="text-2xl font-bold text-teal-500">25</h3>
                <p className="text-gray-600">Doctors</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                <h3 className="text-2xl font-bold text-teal-500">45</h3>
                <p className="text-gray-600">Today's Appointments</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                <h3 className="text-2xl font-bold text-teal-500">12</h3>
                <p className="text-gray-600">Staff Members</p>
              </div>
            </div>
          </>
        )}

        {/* --- VIEW 2: BED MANAGEMENT --- */}
        {currentView === 'beds' && (
          <div className="animate-fade-in">
            <BedManagement />
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;