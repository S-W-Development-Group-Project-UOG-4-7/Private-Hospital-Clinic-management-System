import React, { useEffect, useState } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigate } from 'react-router-dom';
import { inventoryApi, supplierApi } from '../../api/pharmacy';
import { ArrowLeft, Plus, Edit, Trash2, Search, AlertTriangle, Calendar, Filter, X } from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
}

interface InventoryItem {
  id: number;
  name: string;
  generic_name?: string;
  brand_name?: string;
  category?: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  unit_price: number;
  selling_price: number;
  expiry_date?: string;
  supplier?: {
    id: number;
    name: string;
  };
}

const InventoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    brand_name: '',
    description: '',
    category: '',
    unit: 'Tablet',
    quantity: 0,
    reorder_level: 10,
    unit_price: 0,
    selling_price: 0,
    expiry_date: '',
    batch_number: '',
    supplier_id: '',
  });

  useEffect(() => {
    loadItems();
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await supplierApi.getAll();
      setSuppliers(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (showLowStock) params.low_stock = true;
      if (showExpiringSoon) params.expiring_soon = true;
      
      const data = await inventoryApi.getAll(params);
      setItems(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryApi.update(editingItem.id.toString(), formData);
      } else {
        await inventoryApi.create(formData);
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      // Clear filters to ensure new item appears
      setSearchTerm('');
      setSelectedCategory('');
      setShowLowStock(false);
      setShowExpiringSoon(false);
      loadItems();
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item. Please check the form data.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await inventoryApi.delete(id.toString());
      loadItems();
    } catch (error) {
      alert('Failed to delete item');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      generic_name: item.generic_name || '',
      brand_name: item.brand_name || '',
      description: '', // Not in interface, assume empty
      category: item.category || '',
      unit: item.unit,
      quantity: item.quantity,
      reorder_level: item.reorder_level,
      unit_price: item.unit_price,
      selling_price: item.selling_price,
      expiry_date: item.expiry_date || '',
      batch_number: '', // Not in interface
      supplier_id: item.supplier?.id.toString() || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      generic_name: '',
      brand_name: '',
      description: '',
      category: '',
      unit: 'Tablet',
      quantity: 0,
      reorder_level: 10,
      unit_price: 0,
      selling_price: 0,
      expiry_date: '',
      batch_number: '',
      supplier_id: '',
    });
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.reorder_level;
  const isExpiringSoon = (item: InventoryItem) => {
    if (!item.expiry_date) return false;
    const expiry = new Date(item.expiry_date);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/pharmacist')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-teal-100 rounded-lg">
                <div className="w-6 h-6 bg-teal-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{items.filter(item => isLowStock(item)).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <Calendar className="w-6 h-6 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{items.filter(item => isExpiringSoon(item)).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadItems()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Categories</option>
                <option value="Pain Relief">Pain Relief</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Respiratory">Respiratory</option>
              </select>
              <button
                onClick={() => setShowLowStock(!showLowStock)}
                className={`px-4 py-3 rounded-lg border ${showLowStock ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-gray-300 text-gray-700'}`}
              >
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Low Stock
              </button>
              <button
                onClick={() => setShowExpiringSoon(!showExpiringSoon)}
                className={`px-4 py-3 rounded-lg border ${showExpiringSoon ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-300 text-gray-700'}`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Expiring Soon
              </button>
              <button
                onClick={loadItems}
                className="px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Items Table */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Item Details</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Pricing</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          {item.generic_name && (
                            <p className="text-sm text-gray-600">Generic: {item.generic_name}</p>
                          )}
                          {item.brand_name && (
                            <p className="text-sm text-gray-600">Brand: {item.brand_name}</p>
                          )}
                          {item.supplier && (
                            <p className="text-sm text-gray-500">Supplier: {item.supplier.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.category || '-'}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{item.quantity} {item.unit}</p>
                          <p className="text-sm text-gray-500">Reorder: {item.reorder_level}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">${item.selling_price.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">Cost: ${item.unit_price.toFixed(2)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {isLowStock(item) && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          )}
                          {isExpiringSoon(item) && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              <Calendar className="w-3 h-3" />
                              Expiring Soon
                            </span>
                          )}
                          {item.expiry_date && (
                            <span className="text-xs text-gray-500">
                              Exp: {new Date(item.expiry_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No inventory items found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Generic Name</label>
                  <input
                    type="text"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter generic name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter brand name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    <option value="Pain Relief">Pain Relief</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Diabetes">Diabetes</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Neurological">Neurological</option>
                    <option value="Dermatological">Dermatological</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit *</label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Cream">Cream</option>
                    <option value="Drops">Drops</option>
                    <option value="Inhaler">Inhaler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reorder Level *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter reorder level"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter unit price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Selling Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter selling price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Batch Number</label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter batch number"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;

