import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi, supplierApi } from '../../api/pharmacy';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  AlertTriangle, 
  Calendar, 
  Filter, 
  X, 
  MinusCircle, 
  Package, 
  Check, 
  ChevronDown, 
  Download, 
  RefreshCw,
  Box as BoxIcon,
  PlusCircle
} from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
}

interface InventoryItem {
  id: number;
  name: string;
  generic_name: string;
  category: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  unit_price: number;
  selling_price: number;
  batch_number: string;
  expiry_date: string;
  supplier_id: number;
  supplier?: Supplier;
  location?: string;
  status?: string;
}

const InventoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, low_stock, expired, ok

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewDetailsItem, setViewDetailsItem] = useState<InventoryItem | null>(null);
  
  // Stock Update Modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAction, setStockAction] = useState<'add' | 'set'>('add');
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [stockMedicineSearch, setStockMedicineSearch] = useState('');
  const [showStockMedicineDropdown, setShowStockMedicineDropdown] = useState(false);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [stockBatchNumber, setStockBatchNumber] = useState('');
  const [stockExpiryDate, setStockExpiryDate] = useState('');
  const [stockUpdating, setStockUpdating] = useState(false);
  const stockMedicineDropdownRef = useRef<HTMLDivElement>(null);

  // Dispense Modal
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [selectedDrugToDispense, setSelectedDrugToDispense] = useState<InventoryItem | null>(null);
  const [dispenseQty, setDispenseQty] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category: '',
    unit: 'Tablet',
    quantity: 0,
    reorder_level: 10,
    unit_price: 0,
    selling_price: 0,
    batch_number: '',
    expiry_date: '',
    supplier_id: '',
    location: ''
  });

  useEffect(() => {
    fetchData();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (stockMedicineDropdownRef.current && !stockMedicineDropdownRef.current.contains(event.target as Node)) {
        setShowStockMedicineDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inventoryRes, suppliersRes] = await Promise.all([
        inventoryApi.getAll(),
        supplierApi.getAll()
      ]);
      setItems(inventoryRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        supplier_id: parseInt(formData.supplier_id),
        quantity: parseInt(String(formData.quantity)),
        reorder_level: parseInt(String(formData.reorder_level)),
        unit_price: parseFloat(String(formData.unit_price)),
        selling_price: parseFloat(String(formData.selling_price))
      };

      if (editingItem) {
        await inventoryApi.update(String(editingItem.id), dataToSubmit);
      } else {
        await inventoryApi.create(dataToSubmit);
      }
      
      fetchData();
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item. Please check the inputs.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryApi.delete(String(id));
        fetchData();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      generic_name: item.generic_name || '',
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      reorder_level: item.reorder_level,
      unit_price: item.unit_price,
      selling_price: item.selling_price,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
      supplier_id: item.supplier_id.toString(),
      location: item.location || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      generic_name: '',
      category: '',
      unit: 'Tablet',
      quantity: 0,
      reorder_level: 10,
      unit_price: 0,
      selling_price: 0,
      batch_number: '',
      expiry_date: '',
      supplier_id: '',
      location: ''
    });
  };

  // --- Quick Stock Update Logic ---
  const openStockModal = () => {
    setStockAction('add');
    setSelectedMedicineId('');
    setStockMedicineSearch('');
    setStockQuantity(0);
    setStockBatchNumber('');
    setStockExpiryDate('');
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedMedicineId('');
  };

  const handleStockMedicineSelect = (id: string, name: string) => {
    setSelectedMedicineId(id);
    setStockMedicineSearch(name);
    setShowStockMedicineDropdown(false);
    
    // Pre-fill existing data if available
    const item = items.find(i => String(i.id) === String(id));
    if (item) {
      setFormData(prev => ({
        ...prev,
        unit_price: item.unit_price,
        selling_price: item.selling_price
      }));
    }
  };

  const handleQuickStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicineId) {
      alert("Please select a medicine first.");
      return;
    }

    try {
      setStockUpdating(true);
      
      const item = items.find(i => String(i.id) === String(selectedMedicineId));
      if (!item) throw new Error("Item not found");

      let newQuantity = stockQuantity;
      
      if (stockAction === 'add') {
        newQuantity = item.quantity + stockQuantity;
      } 
      // If 'set', we just use the entered quantity directly

      const updateData = {
        quantity: newQuantity,
        batch_number: stockBatchNumber || item.batch_number,
        expiry_date: stockExpiryDate || item.expiry_date,
        unit_price: formData.unit_price,
        selling_price: formData.selling_price
      };

      await inventoryApi.update(selectedMedicineId, updateData);
      
      // Success
      alert(`Stock updated successfully! New quantity: ${newQuantity}`);
      closeStockModal();
      fetchData(); // Refresh list

    } catch (error) {
      console.error("Failed to update stock", error);
      alert("Failed to update stock. Please try again.");
    } finally {
      setStockUpdating(false);
    }
  };

  // --- Dispense Logic ---
  const openDispenseModal = (item: InventoryItem) => {
    setSelectedDrugToDispense(item);
    setDispenseQty(1);
    setIsDispenseModalOpen(true);
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrugToDispense) return;

    try {
      // FIX: Pass quantity as an object property
      await inventoryApi.dispense(String(selectedDrugToDispense.id), { quantity: dispenseQty });
      alert("Medicine issued successfully!");
      setIsDispenseModalOpen(false);
      fetchData(); // Refresh stock
    } catch (error) {
      console.error("Dispense failed", error);
      alert("Failed to issue medicine.");
    }
  };

  // Filter Logic
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.generic_name && item.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    
    let matchesStatus = true;
    if (statusFilter === 'low_stock') {
      matchesStatus = item.quantity <= item.reorder_level;
    } else if (statusFilter === 'expired') {
      matchesStatus = new Date(item.expiry_date) < new Date();
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(items.map(item => item.category))).filter(Boolean);
  const filteredStockMedicines = items.filter(item => 
    item.name.toLowerCase().includes(stockMedicineSearch.toLowerCase())
  );
  const selectedMedicineDetails = items.find(i => String(i.id) === String(selectedMedicineId));

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/pharmacist')} 
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-gray-500">{items.length} Total Items</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="text-sm font-medium text-orange-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {items.filter(i => i.quantity <= i.reorder_level).length} Low Stock
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={openStockModal}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all"
          >
            <BoxIcon className="w-5 h-5" />
            Quick Stock Update
          </button>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-teal-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Item
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by medicine name, generic name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-gray-700 focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-500 cursor-pointer min-w-[140px]"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-500 cursor-pointer min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="low_stock">Low Stock</option>
            <option value="expired">Expired</option>
          </select>

          <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Medicine Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
                      <span className="font-medium">Loading inventory data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        <span className="text-xs text-gray-500">{item.generic_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold ${item.quantity <= item.reorder_level ? 'text-orange-600' : 'text-gray-900'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-gray-900">${item.selling_price.toFixed(2)}</span>
                        <span className="text-[10px] text-gray-400">Cost: ${item.unit_price.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(item.expiry_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.quantity <= 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                          <MinusCircle className="w-3 h-3" /> Out of Stock
                        </span>
                      ) : item.quantity <= item.reorder_level ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          <Check className="w-3 h-3" /> In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewDetailsItem(item)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDispenseModal(item)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Issue Medicine"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                          title="Edit Item"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Edit Inventory Item' : 'Add New Item'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Basic Info */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Brand Name (e.g. Panadol)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Generic Name</label>
                <input
                  type="text"
                  name="generic_name"
                  value={formData.generic_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. Paracetamol"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
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
                  name="unit"
                  required
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
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
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
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
                  name="quantity"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reorder Level *</label>
                <input
                  type="number"
                  name="reorder_level"
                  required
                  min="0"
                  value={formData.reorder_level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Batch Number</label>
                <input
                  type="text"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Pricing Section */}
              <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Pricing Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cost Price (Per Unit)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        name="unit_price"
                        min="0"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={handleInputChange}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Selling Price (Per Unit)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        name="selling_price"
                        min="0"
                        step="0.01"
                        value={formData.selling_price}
                        onChange={handleInputChange}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-4 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
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
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispense Modal */}
      {isDispenseModalOpen && selectedDrugToDispense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative animate-scale-in border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Issue Medicine</h3>
            <p className="text-sm text-gray-500 mb-6">
              Reducing stock for <span className="font-semibold text-gray-800">{selectedDrugToDispense.name}</span>
            </p>

            <form onSubmit={handleDispense}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity to Issue</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={selectedDrugToDispense.quantity}
                    value={dispenseQty}
                    onChange={(e) => setDispenseQty(parseInt(e.target.value))}
                    className="w-full pl-4 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-lg font-semibold text-gray-800"
                    required
                  />
                  <span className="absolute right-4 top-3 text-gray-400 text-sm">Units</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <AlertTriangle size={12} />
                  Available in stock: {selectedDrugToDispense.quantity}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsDispenseModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 font-medium shadow-sm"
                >
                  <Check size={16} />
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QUICK STOCK UPDATE MODAL --- */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <BoxIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Quick Stock Update</h2>
                  <p className="text-blue-100 text-sm">Update inventory stock levels</p>
                </div>
              </div>
              <button onClick={closeStockModal} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickStockUpdate} className="p-6 space-y-6">
              {/* Medicine Selection Dropdown - Searchable */}
              <div className="relative" ref={stockMedicineDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search & Select Medicine *</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Type to search existing inventory..."
                    value={stockMedicineSearch}
                    onChange={(e) => {
                      setStockMedicineSearch(e.target.value);
                      setShowStockMedicineDropdown(true);
                      if (!e.target.value) {
                        setSelectedMedicineId('');
                      }
                    }}
                    onFocus={() => setShowStockMedicineDropdown(true)}
                    className="w-full pl-12 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 font-medium"
                  />
                  {stockMedicineSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setStockMedicineSearch('');
                        setSelectedMedicineId('');
                        setShowStockMedicineDropdown(false);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {/* Dropdown List */}
                {showStockMedicineDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {filteredStockMedicines.length > 0 ? (
                      filteredStockMedicines.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => handleStockMedicineSelect(String(item.id), item.name)}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${String(selectedMedicineId) === String(item.id) ? 'bg-blue-50 text-blue-700' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-800">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.generic_name || 'No generic name'} • {item.unit}</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-bold ${item.quantity <= item.reorder_level ? 'text-orange-600' : 'text-green-600'}`}>
                                {item.quantity} in stock
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        {items.length === 0 ? 'No inventory items yet. Add products first.' : `No medicines found matching "${stockMedicineSearch}"`}
                      </div>
                    )}
                  </div>
                )}
                {selectedMedicineId && (
                  <p className="text-blue-600 text-xs mt-1 flex items-center gap-1">
                    ✓ Selected: {stockMedicineSearch}
                  </p>
                )}
              </div>

              {/* Selected Medicine Info Card */}
              {selectedMedicineDetails && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800">{selectedMedicineDetails.name}</h4>
                      <p className="text-sm text-gray-500">{selectedMedicineDetails.category} • {selectedMedicineDetails.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{selectedMedicineDetails.quantity}</p>
                      <p className="text-xs text-gray-500">Current Stock</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-100 flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Reorder Level:</span>
                      <span className="ml-1 font-medium text-gray-700">{selectedMedicineDetails.reorder_level}</span>
                    </div>
                    {selectedMedicineDetails.expiry_date && (
                      <div>
                        <span className="text-gray-500">Expires:</span>
                        <span className="ml-1 font-medium text-gray-700">{new Date(selectedMedicineDetails.expiry_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stock Action Toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStockAction('add')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all ${
                      stockAction === 'add'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <PlusCircle className="w-5 h-5" />
                    Add to Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAction('set')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all ${
                      stockAction === 'set'
                        ? 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Package className="w-5 h-5" />
                    Set Stock Level
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {stockAction === 'add' ? 'Quantity to Add' : 'New Stock Level'} *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-semibold text-center"
                  placeholder="Enter quantity"
                />
                {selectedMedicineDetails && stockAction === 'add' && stockQuantity > 0 && (
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    New total will be: <span className="font-bold text-green-600">{selectedMedicineDetails.quantity + stockQuantity} {selectedMedicineDetails.unit}</span>
                  </p>
                )}
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Selling Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Batch Number</label>
                  <input
                    type="text"
                    value={stockBatchNumber}
                    onChange={(e) => setStockBatchNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="e.g. BATCH-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
                  <input
                    type="date"
                    value={stockExpiryDate}
                    onChange={(e) => setStockExpiryDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockUpdating || !selectedMedicineId}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                  {stockUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Update Stock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- View Details Modal --- */}
      {viewDetailsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Medicine Details</h2>
              <button onClick={() => setViewDetailsItem(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-teal-700">{viewDetailsItem.name}</h3>
                  <p className="text-gray-500 font-medium">{viewDetailsItem.generic_name}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  viewDetailsItem.quantity <= viewDetailsItem.reorder_level 
                    ? 'bg-red-50 text-red-700 border-red-100' 
                    : 'bg-green-50 text-green-700 border-green-100'
                }`}>
                  {viewDetailsItem.quantity <= viewDetailsItem.reorder_level ? 'Low Stock' : 'In Stock'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Category</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.category}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Unit</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.unit}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Selling Price</span>
                  <span className="text-lg font-bold text-teal-600">${viewDetailsItem.selling_price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Cost Price</span>
                  <span className="text-sm font-medium text-gray-800">${viewDetailsItem.unit_price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Quantity</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.quantity}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Batch No.</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.batch_number || 'N/A'}</span>
                </div>
              </div>

              {viewDetailsItem.supplier && (
                <div className="pt-4 border-t border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase mb-1">Supplier</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {viewDetailsItem.supplier.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{viewDetailsItem.supplier.name}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => { setViewDetailsItem(null); openEditModal(viewDetailsItem); }} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 mr-2">Edit Item</button>
              <button onClick={() => setViewDetailsItem(null)} className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryManagement;