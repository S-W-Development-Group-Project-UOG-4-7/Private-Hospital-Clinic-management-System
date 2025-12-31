<<<<<<< Updated upstream
import React, { useState } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> Stashed changes
import { useNavigate } from 'react-router-dom';
// IMPORT YOUR NEW COMPONENT
// Ensure this path matches your folder structure:
import BedManagement from '../../components/admin/BedManagement';

// IMPORT COMPONENTS
import BedManagement from '../../components/admin/BedManagement';
import UserManagement from '../../components/admin/UserManagement';
import AppointmentManagement from '../../components/admin/AppointmentManagement';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
<<<<<<< Updated upstream
  
  // Define the View State type explicitly for TypeScript
  type ViewState = 'dashboard' | 'beds';
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
=======
  type ViewState = 'dashboard' | 'beds' | 'users' | 'appointments';
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  // STATE FOR STATS
  const [stats, setStats] = useState({
    total_patients: 0,
    total_doctors: 0,
    available_beds: 0,
    today_appointments: 0
  });

  // FETCH STATS FUNCTION
  useEffect(() => {
    const fetchStats = async () => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/dashboard/stats', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error("Error fetching stats", error);
        }
    };

    fetchStats();
  }, [currentView]); // Re-fetch when switching back to dashboard
>>>>>>> Stashed changes

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        
<<<<<<< Updated upstream
        {/* Header */}
=======
        {/* --- HEADER --- */}
>>>>>>> Stashed changes
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Hospital Admin</h1>
            <p className="text-gray-600">Overview & Management</p>
          </div>
          <div className="flex space-x-4">
<<<<<<< Updated upstream
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
=======
            {currentView !== 'dashboard' && (
               <button onClick={() => setCurrentView('dashboard')} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
                 ← Back
               </button>
            )}
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
>>>>>>> Stashed changes
              Logout
            </button>
          </div>
        </div>

        {/* --- VIEW 1: MAIN DASHBOARD --- */}
        {currentView === 'dashboard' && (
<<<<<<< Updated upstream
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

=======
          <div className="animate-fade-in-up">
            
            {/* 1. STATS ROW (New Feature) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Patients */}
                <div className="bg-white p-4 rounded shadow border-l-4 border-indigo-500">
                    <div className="text-gray-500 text-sm uppercase font-bold">Total Patients</div>
                    <div className="text-3xl font-bold text-indigo-600">{stats.total_patients}</div>
                </div>
                
                {/* Doctors */}
                <div className="bg-white p-4 rounded shadow border-l-4 border-teal-500">
                    <div className="text-gray-500 text-sm uppercase font-bold">Doctors On Staff</div>
                    <div className="text-3xl font-bold text-teal-600">{stats.total_doctors}</div>
                </div>

                {/* Beds */}
                <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                    <div className="text-gray-500 text-sm uppercase font-bold">Available Beds</div>
                    <div className="text-3xl font-bold text-blue-600">{stats.available_beds}</div>
                </div>

                {/* Appointments */}
                <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500">
                    <div className="text-gray-500 text-sm uppercase font-bold">Today's Appointments</div>
                    <div className="text-3xl font-bold text-purple-600">{stats.today_appointments}</div>
                </div>
            </div>

            {/* 2. NAVIGATION CARDS */}
            <h3 className="text-xl font-bold text-gray-700 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500 hover:shadow-xl transition cursor-pointer"
                   onClick={() => setCurrentView('beds')}>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Ward & Beds</h2>
                <p className="text-gray-600 mb-4 text-sm">Manage hospital wards, room capacity, and bed availability.</p>
                <span className="text-blue-600 font-bold hover:underline">Manage Wards →</span>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-teal-500 hover:shadow-xl transition cursor-pointer"
                   onClick={() => setCurrentView('users')}>
                <h2 className="text-xl font-bold text-gray-800 mb-2">User Management</h2>
                <p className="text-gray-600 mb-4 text-sm">Add or remove doctors, patients, and hospital staff.</p>
                <span className="text-teal-600 font-bold hover:underline">Manage Users →</span>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-500 hover:shadow-xl transition cursor-pointer"
                   onClick={() => setCurrentView('appointments')}>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Appointments</h2>
                <p className="text-gray-600 mb-4 text-sm">Schedule and manage doctor visits and patient consultations.</p>
                <span className="text-purple-600 font-bold hover:underline">Manage Schedule →</span>
              </div>

            </div>
          </div>
        )}

        {/* --- VIEW 2: BED MANAGEMENT --- */}
        {currentView === 'beds' && <BedManagement />}

        {/* --- VIEW 3: USER MANAGEMENT --- */}
        {currentView === 'users' && <UserManagement />}

        {/* --- VIEW 4: APPOINTMENT MANAGEMENT --- */}
        {currentView === 'appointments' && <AppointmentManagement />}

>>>>>>> Stashed changes
      </div>
    </div>
  );
};

export default AdminDashboard;