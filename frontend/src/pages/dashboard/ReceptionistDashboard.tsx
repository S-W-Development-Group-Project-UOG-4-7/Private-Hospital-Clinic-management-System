import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReceptionistDashboard: React.FC = () => {
  const navigate = useNavigate();

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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Receptionist Dashboard</h1>
            <p className="text-gray-600">Manage appointments and patient check-ins</p>
          </div>
          <div className="flex space-x-4">
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

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Patient Registration */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Registration</h2>
            <p className="text-gray-600 mb-4">Register new patients and update information</p>
            <button 
              onClick={() => navigate('/receptionist/register-patient')}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full"
            >
              Register Patient
            </button>
          </div>

          {/* Appointment Scheduling */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointment Scheduling</h2>
            <p className="text-gray-600 mb-4">Schedule and manage patient appointments</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Schedule Appointment
            </button>
          </div>

          {/* Check-in/Check-out */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Check-in</h2>
            <p className="text-gray-600 mb-4">Manage patient arrivals and departures</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Check-in Patient
            </button>
          </div>

          {/* Billing */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Billing & Payments</h2>
            <p className="text-gray-600 mb-4">Process payments and generate invoices</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Manage Billing
            </button>
          </div>

          {/* Phone Calls */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Phone Management</h2>
            <p className="text-gray-600 mb-4">Handle incoming calls and messages</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Call Log
            </button>
          </div>

          {/* Reports */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Reports</h2>
            <p className="text-gray-600 mb-4">Generate daily activity reports</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Generate Report
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">32</h3>
            <p className="text-gray-600">Today's Appointments</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">8</h3>
            <p className="text-gray-600">Pending Check-ins</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">15</h3>
            <p className="text-gray-600">New Registrations</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">$1,250</h3>
            <p className="text-gray-600">Today's Revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
