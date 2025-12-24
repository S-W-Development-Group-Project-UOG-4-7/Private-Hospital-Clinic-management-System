import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi } from '../../api/pharmacy';
import { Package, ShoppingCart, FileText, Users, AlertTriangle, Calendar } from 'lucide-react';

const PharmacistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_items: 0,
    low_stock_count: 0,
    expiring_soon_count: 0,
    total_value: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await inventoryApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Pharmacy Dashboard</h1>
              <p className="text-gray-600 text-sm">Private Hospital & Clinic Management System</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Items</p>
                <p className="text-3xl font-bold text-teal-600">{loading ? '...' : stats.total_items}</p>
              </div>
              <Package className="w-12 h-12 text-teal-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Low Stock</p>
                <p className="text-3xl font-bold text-orange-600">{loading ? '...' : stats.low_stock_count}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Expiring Soon</p>
                <p className="text-3xl font-bold text-red-600">{loading ? '...' : stats.expiring_soon_count}</p>
              </div>
              <Calendar className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Value</p>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? '...' : `$${stats.total_value.toLocaleString()}`}
                </p>
              </div>
              <Package className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => navigate('/pharmacist/prescriptions')}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 text-left"
          >
            <FileText className="w-10 h-10 text-teal-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Prescriptions</h3>
            <p className="text-gray-600 text-sm">Process and dispense patient prescriptions</p>
          </button>

          <button
            onClick={() => navigate('/pharmacist/inventory')}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 text-left"
          >
            <Package className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Inventory</h3>
            <p className="text-gray-600 text-sm">Manage drug stock and inventory items</p>
          </button>

          <button
            onClick={() => navigate('/pharmacist/suppliers')}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 text-left"
          >
            <Users className="w-10 h-10 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Suppliers</h3>
            <p className="text-gray-600 text-sm">Manage supplier information</p>
          </button>

          <button
            onClick={() => navigate('/pharmacist/purchases')}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 text-left"
          >
            <ShoppingCart className="w-10 h-10 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Purchases</h3>
            <p className="text-gray-600 text-sm">Manage drug purchases and orders</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
