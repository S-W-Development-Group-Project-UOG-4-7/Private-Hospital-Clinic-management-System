import React from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard: React.FC = () => {
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Doctor Dashboard</h1>
            <p className="text-gray-600">Manage patient appointments and medical records</p>
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
          {/* Today's Appointments */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Appointments</h2>
            <p className="text-gray-600 mb-4">View and manage today's patient appointments</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              View Appointments
            </button>
          </div>

          {/* Patient Records */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Records</h2>
            <p className="text-gray-600 mb-4">Access and update patient medical records</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Manage Records
            </button>
          </div>

          {/* Prescriptions */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Prescriptions</h2>
            <p className="text-gray-600 mb-4">Create and manage patient prescriptions</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Prescriptions
            </button>
          </div>

          {/* Lab Results */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lab Results</h2>
            <p className="text-gray-600 mb-4">Review patient laboratory test results</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              View Lab Results
            </button>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Schedule</h2>
            <p className="text-gray-600 mb-4">Manage your availability and working hours</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Manage Schedule
            </button>
          </div>

          {/* Telemedicine */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Telemedicine</h2>
            <p className="text-gray-600 mb-4">Conduct virtual consultations</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Start Consultation
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">12</h3>
            <p className="text-gray-600">Today's Patients</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">8</h3>
            <p className="text-gray-600">Pending Reviews</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">5</h3>
            <p className="text-gray-600">Urgent Cases</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">24</h3>
            <p className="text-gray-600">Total Patients</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
