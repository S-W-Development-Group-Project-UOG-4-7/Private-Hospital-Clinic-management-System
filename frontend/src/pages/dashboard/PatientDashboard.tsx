import React from 'react';
import { useNavigate } from 'react-router-dom';

const PatientDashboard: React.FC = () => {
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Dashboard</h1>
            <p className="text-gray-600">Manage your appointments and health records</p>
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
          {/* Book Appointment */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Book Appointment</h2>
            <p className="text-gray-600 mb-4">Schedule appointments with doctors</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Book Now
            </button>
          </div>

          {/* My Appointments */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Appointments</h2>
            <p className="text-gray-600 mb-4">View upcoming and past appointments</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              View Appointments
            </button>
          </div>

          {/* Medical Records */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Medical Records</h2>
            <p className="text-gray-600 mb-4">Access your medical history and reports</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              View Records
            </button>
          </div>

          {/* Prescriptions */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Prescriptions</h2>
            <p className="text-gray-600 mb-4">View your current and past prescriptions</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              View Prescriptions
            </button>
          </div>

          {/* Telemedicine */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Telemedicine</h2>
            <p className="text-gray-600 mb-4">Join virtual consultations</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Start Consultation
            </button>
          </div>

          {/* Billing */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Billing & Payments</h2>
            <p className="text-gray-600 mb-4">View invoices and make payments</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              View Bills
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">2</h3>
            <p className="text-gray-600">Upcoming Appointments</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">1</h3>
            <p className="text-gray-600">Active Prescriptions</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">5</h3>
            <p className="text-gray-600">Medical Reports</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">$250</h3>
            <p className="text-gray-600">Pending Bills</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
