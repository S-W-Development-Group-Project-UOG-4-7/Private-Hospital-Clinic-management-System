import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi, supplierApi } from '../../api/pharmacy';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, AlertTriangle, 
  Calendar, RefreshCw, Package, DollarSign, PlusCircle, MinusCircle, Check, X
} from 'lucide-react';

// --- Interfaces ---
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
  stock_quantity?: number;
  reorder_level: number;
  unit_price: number;
  selling_price: number;
  expiry_date?: string;
  batch_number?: string;
  description?: string;
  supplier?: Supplier;
  updated_at?: string;
}

// --- Status Badge Component ---
const StatusBadge = ({ quantity, reorderLevel, expiryDate }: { quantity: number, reorderLevel: number, expiryDate?: string }) => {
  const isLow = quantity <= reorderLevel;
  const isOut = quantity === 0;
  
  let isExpiring = false;
  if (expiryDate) {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    isExpiring = days <= 30 && days > 0;
  }

  if (isOut) return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold border border-red-200">Out of Stock</span>;
  if (isExpiring) return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">Expiring Soon</span>;
  if (isLow) return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold border border-orange-200">Low Stock</span>;
  return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">In Stock</span>;
};

const InventoryManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // --- State ---
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Dispense Modal State
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [selectedDrugToDispense, setSelectedDrugToDispense] = useState<InventoryItem | null>(null);
  const [dispenseQty, setDispenseQty] = useState(1);

  // Quick Stock Update State
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [stockAction, setStockAction] = useState<'add' | 'set'>('add');
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [stockUpdating, setStockUpdating] = useState(false);
  
  // Searchable Medicine Dropdown State
  const [medicineSearch, setMedicineSearch] = useState<string>('');
  const [showMedicineDropdown, setShowMedicineDropdown] = useState<boolean>(false);
  const [stockMedicineSearch, setStockMedicineSearch] = useState<string>('');
  const [showStockMedicineDropdown, setShowStockMedicineDropdown] = useState<boolean>(false);
  
  // Refs for click-outside detection
  const medicineDropdownRef = useRef<HTMLDivElement>(null);
  const stockMedicineDropdownRef = useRef<HTMLDivElement>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', 
    generic_name: '', 
    brand_name: '', 
    description: '',
    category: '', 
    unit: 'Tablet', 
    quantity: 0, 
    reorder_level: 10,
    unit_price: 0.01, 
    selling_price: 0.01, 
    expiry_date: '',
    batch_number: '', 
    supplier_id: '',
  });

  // --- Constants ---
  const categories = ["Pain Relief", "Antibiotics", "Cardiovascular", "Diabetes", "Respiratory", "Gastrointestinal", "Neurological", "Dermatological", "Vitamins", "Allergy", "Anti-inflammatory", "Ophthalmic"];
  const medicines = [
    { name: "Paracetamol 500mg", generic_name: "Acetaminophen", category: "Pain Relief", unit: "Tablet" },
    { name: "Ibuprofen 400mg", generic_name: "Ibuprofen", category: "Pain Relief", unit: "Tablet" },
    { name: "Amoxicillin 500mg", generic_name: "Amoxicillin", category: "Antibiotics", unit: "Capsule" },
    { name: "Azithromycin 250mg", generic_name: "Azithromycin", category: "Antibiotics", unit: "Tablet" },
    { name: "Ciprofloxacin 500mg", generic_name: "Ciprofloxacin", category: "Antibiotics", unit: "Tablet" },
    { name: "Metformin 500mg", generic_name: "Metformin", category: "Diabetes", unit: "Tablet" },
    { name: "Omeprazole 20mg", generic_name: "Omeprazole", category: "Gastrointestinal", unit: "Capsule" },
    { name: "Lisinopril 10mg", generic_name: "Lisinopril", category: "Cardiovascular", unit: "Tablet" },
    { name: "Amlodipine 5mg", generic_name: "Amlodipine", category: "Cardiovascular", unit: "Tablet" },
    { name: "Atorvastatin 20mg", generic_name: "Atorvastatin", category: "Cardiovascular", unit: "Tablet" },
    { name: "Salbutamol Inhaler", generic_name: "Salbutamol", category: "Respiratory", unit: "Inhaler" },
    { name: "Cetirizine 10mg", generic_name: "Cetirizine", category: "Allergy", unit: "Tablet" },
    { name: "Vitamin C 1000mg", generic_name: "Ascorbic Acid", category: "Vitamins", unit: "Tablet" },
    { name: "Vitamin D3 1000IU", generic_name: "Cholecalciferol", category: "Vitamins", unit: "Capsule" },
    { name: "Aspirin 100mg", generic_name: "Acetylsalicylic Acid", category: "Pain Relief", unit: "Tablet" },
  ];
  const units = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler", "Box", "Piece"];

  // --- Calculations ---
  const stats = useMemo(() => {
    return {
      totalItems: items.length,
      lowStock: items.filter(i => i.quantity <= i.reorder_level).length,
      totalValue: items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0),
      expiring: items.filter(i => {
        if (!i.expiry_date) return false;
        const days = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days <= 30 && days > 0;
      }).length
    };
  }, [items]);

  // --- Helper Functions ---
  const isLowStock = (item: InventoryItem) => item.quantity <= item.reorder_level;
  
  const isExpiringSoon = (item: InventoryItem) => {
    if (!item.expiry_date) return false;
    const days = Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  };

  // --- Data Loading ---
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (medicineDropdownRef.current && !medicineDropdownRef.current.contains(event.target as Node)) {
        setShowMedicineDropdown(false);
      }
      if (stockMedicineDropdownRef.current && !stockMedicineDropdownRef.current.contains(event.target as Node)) {
        setShowStockMedicineDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([loadItems(), loadSuppliers()]);
    setLoading(false);
  };

  const loadSuppliers = async () => {
    try {
      const response = await supplierApi.getAll();
      let suppliersData: Supplier[] = [];
      if (response?.data) {
        suppliersData = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        suppliersData = response;
      }
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const loadItems = async () => {
    try {
      setRefreshing(true);
      const response = await inventoryApi.getAll({});
      
      let itemsData: InventoryItem[] = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          itemsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          itemsData = response.data.data;
        } else {
          itemsData = [response.data];
        }
      } else if (Array.isArray(response)) {
        itemsData = response;
      }
      
      // Normalize quantity fields
      itemsData = itemsData.map((item: any) => ({
        ...item,
        quantity: item.stock_quantity !== undefined ? item.stock_quantity : item.quantity,
      }));
      
      setItems(itemsData);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Frontend Filtering
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesLowStock = showLowStock ? isLowStock(item) : true;
      const matchesExpiring = showExpiringSoon ? isExpiringSoon(item) : true;

      return matchesSearch && matchesCategory && matchesLowStock && matchesExpiring;
    });
  }, [items, searchTerm, selectedCategory, showLowStock, showExpiringSoon]);

  // Medicine dropdown filtering
  const filteredMedicines = useMemo(() => {
    if (!medicineSearch.trim()) return medicines;
    const search = medicineSearch.toLowerCase();
    return medicines.filter(m => 
      m.name.toLowerCase().includes(search) || 
      m.generic_name.toLowerCase().includes(search)
    );
  }, [medicineSearch]);

  const filteredStockMedicines = useMemo(() => {
    if (!stockMedicineSearch.trim()) return items;
    const search = stockMedicineSearch.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(search) || 
      (item.generic_name && item.generic_name.toLowerCase().includes(search))
    );
  }, [stockMedicineSearch, items]);

  const selectedMedicineDetails = useMemo(() => {
    if (!selectedMedicineId) return null;
    return items.find(i => i.id.toString() === selectedMedicineId);
  }, [selectedMedicineId, items]);

  // --- Handlers ---
  const resetForm = () => {
    setFormData({
      name: '', generic_name: '', brand_name: '', description: '',
      category: '', unit: 'Tablet', quantity: 0, reorder_level: 10,
      unit_price: 0.01, selling_price: 0.01, expiry_date: '',
      batch_number: '', supplier_id: '',
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setMedicineSearch('');
    setShowMedicineDropdown(false);
    resetForm();
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedMedicineId('');
    setStockAction('add');
    setStockQuantity(0);
    setStockMedicineSearch('');
    setShowStockMedicineDropdown(false);
  };

  const handleMedicineSelect = (medicineName: string) => {
    const selectedMedicine = medicines.find(m => m.name === medicineName);
    if (selectedMedicine) {
      setFormData({
        ...formData,
        name: selectedMedicine.name,
        generic_name: selectedMedicine.generic_name,
        category: selectedMedicine.category,
        unit: selectedMedicine.unit,
      });
      setMedicineSearch(selectedMedicine.name);
    } else {
      setFormData({ ...formData, name: medicineName });
      setMedicineSearch(medicineName);
    }
    setShowMedicineDropdown(false);
  };

  const handleStockMedicineSelect = (itemId: string, itemName: string) => {
    setSelectedMedicineId(itemId);
    setStockMedicineSearch(itemName);
    setShowStockMedicineDropdown(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setMedicineSearch(item.name);
    setFormData({
      name: item.name,
      generic_name: item.generic_name || '',
      brand_name: item.brand_name || '',
      description: item.description || '',
      category: item.category || '',
      unit: item.unit,
      quantity: item.quantity,
      reorder_level: item.reorder_level,
      unit_price: item.unit_price,
      selling_price: item.selling_price,
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
      batch_number: item.batch_number || '',
      supplier_id: item.supplier?.id.toString() || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      alert('Please select a medicine');
      return;
    }
    if (!formData.unit) {
      alert('Unit is required');
      return;
    }
    
    try {
      const submitData = {
        name: formData.name.trim(),
        generic_name: formData.generic_name?.trim() || '',
        brand_name: formData.brand_name?.trim() || '',
        description: formData.description?.trim() || '',
        category: formData.category,
        unit: formData.unit,
        quantity: parseInt(String(formData.quantity)) || 0,
        reorder_level: parseInt(String(formData.reorder_level)) || 0,
        unit_price: parseFloat(String(formData.unit_price)) || 0.01,
        selling_price: parseFloat(String(formData.selling_price)) || 0.01,
        expiry_date: formData.expiry_date || null,
        batch_number: formData.batch_number?.trim() || '',
        supplier_id: formData.supplier_id ? parseInt(String(formData.supplier_id)) : null,
      };
      
      if (editingItem) {
        await inventoryApi.update(editingItem.id.toString(), submitData);
        alert('Item updated successfully!');
      } else {
        await inventoryApi.create(submitData);
        alert('Item created successfully!');
      }
      
      closeModal();
      setTimeout(() => loadItems(), 500);
    } catch (error) {
      console.error('Submit error:', error);
      alert(`Failed to ${editingItem ? 'update' : 'save'} item.`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try {
      await inventoryApi.delete(id.toString());
      loadItems();
    } catch (error) {
      alert('Failed to delete item');
    }
  };

  const handleQuickStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicineId) {
      alert('Please select a medicine');
      return;
    }
    
    setStockUpdating(true);
    try {
      const selectedItem = items.find(i => i.id.toString() === selectedMedicineId);
      if (!selectedItem) {
        alert('Medicine not found');
        return;
      }

      const newQuantity = stockAction === 'add' 
        ? selectedItem.quantity + stockQuantity 
        : stockQuantity;

      const updateData: any = {
        name: selectedItem.name,
        quantity: Math.max(0, newQuantity),
        unit: selectedItem.unit,
        reorder_level: selectedItem.reorder_level,
        unit_price: selectedItem.unit_price,
        selling_price: selectedItem.selling_price,
        category: selectedItem.category,
      };

      await inventoryApi.update(selectedMedicineId, updateData);
      
      closeStockModal();
      setTimeout(() => loadItems(), 500);
      alert('Stock updated successfully!');
    } catch (error) {
      console.error('Stock update failed:', error);
      alert('Failed to update stock.');
    } finally {
      setStockUpdating(false);
    }
  };

  const openDispenseModal = (item: InventoryItem) => {
    setSelectedDrugToDispense(item);
    setDispenseQty(1);
    setIsDispenseModalOpen(true);
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrugToDispense) return;

    try {
      await (inventoryApi as any).dispense(selectedDrugToDispense.id.toString(), { 
        quantity: dispenseQty 
      });
      alert(`Successfully issued ${dispenseQty} units of ${selectedDrugToDispense.name}`);
      setIsDispenseModalOpen(false);
      loadItems();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to dispense medicine");
    }
  };

  const openQuickStockForItem = (item: InventoryItem) => {
    setSelectedMedicineId(item.id.toString());
    setStockMedicineSearch(item.name);
    setStockAction('add');
    setStockQuantity(0);
    setShowStockModal(true);
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/pharmacist')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                <p className="text-sm text-gray-500">Manage pharmacy stock and medications</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStockModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Quick Stock Update
              </button>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-teal-50 rounded-lg">
                <Package className="w-6 h-6 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-50 rounded-lg">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expiring}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                onClick={() => setShowLowStock(!showLowStock)}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                  showLowStock ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Low Stock
              </button>
              <button
                onClick={() => setShowExpiringSoon(!showExpiringSoon)}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                  showExpiringSoon ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Expiring Soon
              </button>
              <button
                onClick={loadItems}
                disabled={refreshing}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.generic_name || 'No generic name'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{item.quantity} {item.unit}</p>
                      <p className="text-xs text-gray-500">Reorder: {item.reorder_level}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        quantity={item.quantity} 
                        reorderLevel={item.reorder_level} 
                        expiryDate={item.expiry_date} 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-teal-600">${item.selling_price?.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Cost: ${item.unit_price?.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openQuickStockForItem(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Update Stock"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDispenseModal(item)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                          title="Dispense"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No inventory items found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Update Inventory' : 'Add New Product'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Medicine Selection */}
                <div className="relative" ref={medicineDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medicine *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search medicines..."
                      value={medicineSearch}
                      onChange={(e) => {
                        setMedicineSearch(e.target.value);
                        setShowMedicineDropdown(true);
                        if (!e.target.value) {
                          setFormData({...formData, name: '', generic_name: '', category: '', unit: 'Tablet'});
                        }
                      }}
                      onFocus={() => setShowMedicineDropdown(true)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  {showMedicineDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredMedicines.map((m) => (
                        <button
                          type="button"
                          key={m.name}
                          onClick={() => handleMedicineSelect(m.name)}
                          className="w-full px-4 py-3 text-left hover:bg-teal-50 border-b last:border-b-0"
                        >
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-gray-500">{m.generic_name} • {m.category}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.name && (
                    <p className="text-teal-600 text-xs mt-1">✓ Selected: {formData.name}</p>
                  )}
                </div>

                {/* Basic Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Generic Name</label>
                    <input
                      type="text"
                      value={formData.generic_name}
                      onChange={e => setFormData({...formData, generic_name: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                {/* Quantity Fields */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                    <select
                      required
                      value={formData.unit}
                      onChange={e => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.reorder_level}
                      onChange={e => setFormData({...formData, reorder_level: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Price Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price ($) *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={formData.unit_price}
                      onChange={e => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0.01})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price ($) *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={formData.selling_price}
                      onChange={e => setFormData({...formData, selling_price: parseFloat(e.target.value) || 0.01})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Other Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={e => setFormData({...formData, expiry_date: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                    <input
                      type="text"
                      value={formData.batch_number}
                      onChange={e => setFormData({...formData, batch_number: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={e => setFormData({...formData, supplier_id: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                >
                  {editingItem ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Update Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center justify-between bg-blue-600 text-white">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5" />
                <h2 className="text-xl font-bold">Quick Stock Update</h2>
              </div>
              <button onClick={closeStockModal} className="p-2 hover:bg-white/20 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleQuickStockUpdate} className="p-6 space-y-6">
              {/* Medicine Selection */}
              <div className="relative" ref={stockMedicineDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Medicine *</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={stockMedicineSearch}
                    onChange={(e) => {
                      setStockMedicineSearch(e.target.value);
                      setShowStockMedicineDropdown(true);
                      if (!e.target.value) setSelectedMedicineId('');
                    }}
                    onFocus={() => setShowStockMedicineDropdown(true)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {showStockMedicineDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {filteredStockMedicines.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleStockMedicineSelect(String(item.id), item.name)}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-b-0 ${
                          String(selectedMedicineId) === String(item.id) ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                      >
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.generic_name || 'No generic'} • {item.unit}</div>
                          </div>
                          <div className={`font-bold ${item.quantity <= item.reorder_level ? 'text-orange-600' : 'text-green-600'}`}>
                            {item.quantity}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Medicine Info */}
              {selectedMedicineDetails && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-800">{selectedMedicineDetails.name}</h4>
                      <p className="text-sm text-gray-500">{selectedMedicineDetails.category} • {selectedMedicineDetails.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{selectedMedicineDetails.quantity}</p>
                      <p className="text-xs text-gray-500">Current Stock</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStockAction('add')}
                    className={`p-3 rounded-xl border-2 font-medium transition-all ${
                      stockAction === 'add' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200'
                    }`}
                  >
                    <PlusCircle className="w-5 h-5 mx-auto mb-1" />
                    Add to Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAction('set')}
                    className={`p-3 rounded-xl border-2 font-medium transition-all ${
                      stockAction === 'set' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-gray-200'
                    }`}
                  >
                    <Package className="w-5 h-5 mx-auto mb-1" />
                    Set Level
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {stockAction === 'add' ? 'Quantity to Add' : 'New Stock Level'} *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-semibold text-center"
                />
                {selectedMedicineDetails && stockAction === 'add' && stockQuantity > 0 && (
                  <p className="mt-2 text-sm text-center text-gray-500">
                    New total: <span className="font-bold text-green-600">{selectedMedicineDetails.quantity + stockQuantity}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockUpdating || !selectedMedicineId}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl flex items-center justify-center gap-2"
                >
                  {stockUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Update Stock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispense Modal */}
      {isDispenseModalOpen && selectedDrugToDispense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Issue Medicine</h3>
            <p className="text-sm text-gray-500 mb-6">
              Reducing stock for <span className="font-semibold">{selectedDrugToDispense.name}</span>
            </p>

            <form onSubmit={handleDispense}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity to Issue</label>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedDrugToDispense.quantity}
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                />
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Available: {selectedDrugToDispense.quantity}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsDispenseModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
                >
                  <Check size={16} />
                  Confirm
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
