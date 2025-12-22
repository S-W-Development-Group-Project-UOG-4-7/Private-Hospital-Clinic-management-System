import React from 'react';
import { useNavigate } from 'react-router-dom';

const PharmacistDashboard: React.FC = () => {
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Pharmacist Dashboard</h1>
            <p className="text-gray-600">Manage pharmacy inventory and prescriptions</p>
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
          {/* Prescriptions Queue */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Prescriptions Queue</h2>
            <p className="text-gray-600 mb-4">Process and dispense patient prescriptions</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              View Queue
            </button>
          </div>

          {/* Inventory Management */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Inventory Management</h2>
            <p className="text-gray-600 mb-4">Manage drug stock and place orders</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Manage Inventory
            </button>
          </div>

          {/* Drug Search */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Drug Information</h2>
            <p className="text-gray-600 mb-4">Search drug database and interactions</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Search Drugs
            </button>
          </div>

          {/* Order Management */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Management</h2>
            <p className="text-gray-600 mb-4">Track and manage pharmacy orders</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Manage Orders
            </button>
          </div>

          {/* Expiry Tracking */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Expiry Tracking</h2>
            <p className="text-gray-600 mb-4">Monitor soon-to-expire medications</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Check Expiry
            </button>
          </div>

          {/* Reports */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Reports</h2>
            <p className="text-gray-600 mb-4">Generate pharmacy reports and analytics</p>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full">
              Generate Reports
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">15</h3>
            <p className="text-gray-600">Pending Prescriptions</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">8</h3>
            <p className="text-gray-600">Low Stock Items</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">3</h3>
            <p className="text-gray-600">Expiring Soon</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-teal-500">245</h3>
            <p className="text-gray-600">Total Drugs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
