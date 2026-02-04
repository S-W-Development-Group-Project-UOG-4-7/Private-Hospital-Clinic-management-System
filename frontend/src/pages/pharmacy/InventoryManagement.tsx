import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi, supplierApi } from '../../api/pharmacy';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, AlertTriangle, 
  Calendar, RefreshCw, Package, DollarSign, PlusCircle, MinusCircle, Check, X, FileText, ChevronDown
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'expiring'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewDetailsItem, setViewDetailsItem] = useState<InventoryItem | null>(null);

  // Dispense Modal State
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [selectedDrugToDispense, setSelectedDrugToDispense] = useState<InventoryItem | null>(null);
  const [dispenseQty, setDispenseQty] = useState(1);
  
  // Quick Stock Update State
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [stockAction, setStockAction] = useState<'add' | 'set'>('add');
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [stockUpdating, setStockUpdating] = useState(false);
  const [stockBatchNumber, setStockBatchNumber] = useState<string>('');
  const [stockExpiryDate, setStockExpiryDate] = useState<string>('');
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
      }),
    []
  );
  
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

  const handleFilterChange = (status: 'all' | 'low' | 'expiring') => {
    setFilterStatus(status);
    if (status === 'low') {
      setShowLowStock(true);
      setShowExpiringSoon(false);
    } else if (status === 'expiring') {
      setShowLowStock(false);
      setShowExpiringSoon(true);
    } else {
      setShowLowStock(false);
      setShowExpiringSoon(false);
    }
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
    setStockBatchNumber('');
    setStockExpiryDate('');
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

  const openEditModal = (item: InventoryItem) => {
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

      if (stockBatchNumber) {
        updateData.batch_number = stockBatchNumber;
      }
      if (stockExpiryDate) {
        updateData.expiry_date = stockExpiryDate;
      }

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
    setStockBatchNumber(item.batch_number || '');
    setStockExpiryDate(item.expiry_date ? item.expiry_date.split('T')[0] : '');
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
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-sm text-gray-500">Manage pharmacy stock and medications</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStockModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Quick Stock Update
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Item
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => handleFilterChange('all')}
            className={`cursor-pointer p-5 rounded-xl shadow-sm border transition-all ${filterStatus === 'all' ? 'bg-teal-50 border-teal-200 ring-2 ring-teal-200' : 'bg-white border-gray-100 hover:border-teal-200'} flex items-start justify-between`}
          >
            <div>
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <Package className="w-6 h-6 text-teal-600" />
            </div>
          </div>

          <div 
            onClick={() => handleFilterChange('low')}
            className={`cursor-pointer p-5 rounded-xl shadow-sm border transition-all ${filterStatus === 'low' ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-200' : 'bg-white border-gray-100 hover:border-orange-200'} flex items-start justify-between`}
          >
            <div>
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.lowStock}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>

          <div 
            onClick={() => handleFilterChange('expiring')}
            className={`cursor-pointer p-5 rounded-xl shadow-sm border transition-all ${filterStatus === 'expiring' ? 'bg-red-50 border-red-200 ring-2 ring-red-200' : 'bg-white border-gray-100 hover:border-red-200'} flex items-start justify-between`}
          >
            <div>
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.expiring}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{currencyFormatter.format(stats.totalValue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
              <button
                onClick={() => {
                  setShowLowStock(!showLowStock);
                  if (!showLowStock) setShowExpiringSoon(false);
                }}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${showLowStock ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <AlertTriangle className="w-4 h-4" />
                Low Stock
              </button>
              <button
                onClick={() => {
                  setShowExpiringSoon(!showExpiringSoon);
                  if (!showExpiringSoon) setShowLowStock(false);
                }}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 ${showExpiringSoon ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Medicine</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Expiry</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No items found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.generic_name || 'No generic name'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {item.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`font-semibold ${item.quantity <= item.reorder_level ? 'text-orange-600' : 'text-gray-900'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">{item.unit}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <StatusBadge quantity={item.quantity} reorderLevel={item.reorder_level} expiryDate={item.expiry_date} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <p className="font-semibold text-gray-900">{currencyFormatter.format(item.selling_price)}</p>
                        <p className="text-xs text-gray-500">Cost: {currencyFormatter.format(item.unit_price)}</p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {item.expiry_date ? (
                          <span className={`text-sm ${isExpiringSoon(item) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openDispenseModal(item)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Dispense">
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => openQuickStockForItem(item)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Add Stock">
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => setViewDetailsItem(item)} className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="View Details">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(item)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Update Inventory' : 'Add New Product'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
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
                      value={medicineSearch}
                      onChange={(e) => {
                        setMedicineSearch(e.target.value);
                        setFormData({ ...formData, name: e.target.value });
                        setShowMedicineDropdown(true);
                      }}
                      onFocus={() => setShowMedicineDropdown(true)}
                      placeholder="Search or enter medicine name..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  {showMedicineDropdown && filteredMedicines.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredMedicines.map((medicine) => (
                        <button
                          key={medicine.name}
                          type="button"
                          onClick={() => handleMedicineSelect(medicine.name)}
                          className="w-full px-4 py-2 text-left hover:bg-teal-50 flex justify-between items-center"
                        >
                          <span className="font-medium">{medicine.name}</span>
                          <span className="text-sm text-gray-500">{medicine.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generic Name & Brand */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Generic Name</label>
                    <input
                      type="text"
                      value={formData.generic_name}
                      onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                    <input
                      type="text"
                      value={formData.brand_name}
                      onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Category & Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {/* Quantity & Reorder Level */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (Cost)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0.01 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0.01 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Expiry & Batch */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                    <input
                      type="text"
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Update Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center justify-between bg-blue-50">
              <h2 className="text-xl font-bold text-gray-800">Quick Stock Update</h2>
              <button onClick={closeStockModal} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleQuickStockUpdate} className="p-6 space-y-5">
              {/* Medicine Selection */}
              <div className="relative" ref={stockMedicineDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Medicine *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={stockMedicineSearch}
                    onChange={(e) => {
                      setStockMedicineSearch(e.target.value);
                      setShowStockMedicineDropdown(true);
                    }}
                    onFocus={() => setShowStockMedicineDropdown(true)}
                    placeholder="Search inventory..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {showStockMedicineDropdown && filteredStockMedicines.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredStockMedicines.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleStockMedicineSelect(item.id.toString(), item.name)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 flex justify-between items-center"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-gray-500">Stock: {item.quantity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Stock Info */}
              {selectedMedicineDetails && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Current Stock: <span className="font-bold text-gray-900">{selectedMedicineDetails.quantity} {selectedMedicineDetails.unit}</span></p>
                </div>
              )}

              {/* Action Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStockAction('add')}
                    className={`flex-1 py-2.5 rounded-lg font-medium ${stockAction === 'add' ? 'bg-green-100 text-green-700 border-2 border-green-400' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
                  >
                    <PlusCircle className="w-4 h-4 inline mr-2" />
                    Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAction('set')}
                    className={`flex-1 py-2.5 rounded-lg font-medium ${stockAction === 'set' ? 'bg-blue-100 text-blue-700 border-2 border-blue-400' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
                  >
                    Set Quantity
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {stockAction === 'add' ? 'Quantity to Add' : 'New Quantity'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Batch Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number (optional)</label>
                <input 
                  type="text"
                  value={stockBatchNumber}
                  onChange={(e) => setStockBatchNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. BATCH-001"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date (optional)</label>
                <input 
                  type="date"
                  value={stockExpiryDate}
                  onChange={(e) => setStockExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={closeStockModal} className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!selectedMedicineId || stockUpdating}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {stockUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {viewDetailsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{viewDetailsItem.name}</h2>
                <p className="text-teal-100 text-sm mt-1">{viewDetailsItem.generic_name || 'No Generic Name'}</p>
              </div>
              <button onClick={() => setViewDetailsItem(null)} className="p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Stock Status</span>
                <StatusBadge quantity={viewDetailsItem.quantity} reorderLevel={viewDetailsItem.reorder_level} expiryDate={viewDetailsItem.expiry_date} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Category</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.category || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Unit</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.unit}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Selling Price</span>
                  <span className="text-lg font-bold text-teal-600">{currencyFormatter.format(viewDetailsItem.selling_price)}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Cost Price</span>
                  <span className="text-sm font-medium text-gray-800">{currencyFormatter.format(viewDetailsItem.unit_price)}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Quantity</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.quantity}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Batch No.</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.batch_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Expiry Date</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.expiry_date ? new Date(viewDetailsItem.expiry_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">Reorder Level</span>
                  <span className="text-sm font-medium text-gray-800">{viewDetailsItem.reorder_level}</span>
                </div>
              </div>
              <div className="pt-4 border-t flex gap-3">
                <button onClick={() => { openEditModal(viewDetailsItem); setViewDetailsItem(null); }} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                  Edit Item
                </button>
                <button onClick={() => setViewDetailsItem(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispense Modal */}
      {isDispenseModalOpen && selectedDrugToDispense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center justify-between bg-purple-50">
              <h2 className="text-xl font-bold text-gray-800">Dispense Medicine</h2>
              <button onClick={() => setIsDispenseModalOpen(false)} className="p-2 hover:bg-purple-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleDispense} className="p-6 space-y-5">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{selectedDrugToDispense.name}</p>
                <p className="text-sm text-gray-500">Available: {selectedDrugToDispense.quantity} {selectedDrugToDispense.unit}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity to Dispense</label>
                <input
                  type="number"
                  min="1"
                  max={selectedDrugToDispense.quantity}
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setIsDispenseModalOpen(false)} className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={dispenseQty < 1 || dispenseQty > selectedDrugToDispense.quantity}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <MinusCircle className="w-4 h-4" />
                  Dispense
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
