import React, { useEffect, useState, useMemo, useRef } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigate } from 'react-router-dom';
import { inventoryApi, supplierApi } from '../../api/pharmacy';
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, AlertTriangle, 
  Calendar, Filter, X, ChevronDown, Download, RefreshCw, 
  Package, DollarSign, MoreVertical, FileText, PlusCircle, MinusCircle, BoxIcon
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'expiring'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false); // Quick Stock Update Modal
  const [viewDetailsItem, setViewDetailsItem] = useState<InventoryItem | null>(null); // For read-only view
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Quick Stock Update State
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [stockAction, setStockAction] = useState<'add' | 'set'>('add');
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [stockBatchNumber, setStockBatchNumber] = useState<string>('');
  const [stockExpiryDate, setStockExpiryDate] = useState<string>('');
  const [stockUpdating, setStockUpdating] = useState(false);
  
  // Searchable Medicine Dropdown State
  const [medicineSearch, setMedicineSearch] = useState<string>('');
  const [showMedicineDropdown, setShowMedicineDropdown] = useState<boolean>(false);
  const [stockMedicineSearch, setStockMedicineSearch] = useState<string>('');
  const [showStockMedicineDropdown, setShowStockMedicineDropdown] = useState<boolean>(false);
  
  // Refs for click-outside detection
  const medicineDropdownRef = useRef<HTMLDivElement>(null);
  const stockMedicineDropdownRef = useRef<HTMLDivElement>(null);
  
  // Form State - Initialize with proper defaults
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

  // --- Calculations for Dashboard ---
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

  // --- Data Loading ---
  useEffect(() => {
    fetchData();
  }, []);

  // Click outside handler to close dropdowns
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
      console.log('Suppliers API Response:', response);
      
      // Handle different response formats
      let suppliersData = [];
      if (response?.data) {
        suppliersData = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        suppliersData = response;
      } else if (response?.suppliers) {
        suppliersData = Array.isArray(response.suppliers) ? response.suppliers : [response.suppliers];
      }
      
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const loadItems = async () => {
    try {
      setRefreshing(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (filterStatus === 'low') params.low_stock = true;
      if (filterStatus === 'expiring') params.expiring_soon = true;
      
      console.log('Loading items with params:', params);
      const response = await inventoryApi.getAll(params);
      console.log('API Response:', response);
      
      // Handle Laravel pagination response structure
      let itemsData = [];
      if (response?.data) {
        // Laravel pagination response
        if (Array.isArray(response.data)) {
          itemsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          // Nested data structure from Laravel pagination
          itemsData = response.data.data;
        } else {
          itemsData = [response.data];
        }
      } else if (Array.isArray(response)) {
        itemsData = response;
      } else if (response?.items && Array.isArray(response.items)) {
        itemsData = response.items;
      } else if (typeof response === 'object' && response !== null) {
        // If response is a single object, wrap it in an array
        itemsData = [response];
      }
      
      console.log('Processed items data:', itemsData);
      setItems(itemsData);
    } catch (error) {
      console.error('Failed to load items:', error);
      alert('Failed to load inventory items. Please check console for details.');
    } finally {
      setRefreshing(false);
    }
  };

  // --- Handlers ---
  const handleFilterChange = (type: 'all' | 'low' | 'expiring') => {
    setFilterStatus(type);
    // In a real app, you might want to trigger a useEffect or immediate fetch here
    // For client-side filtering of small datasets:
    // loadItems() is called via useEffect dependencies or manual trigger if API filtering is needed.
    // Here we will trigger loadItems manually via useEffect in real implementation, 
    // but for now, let's just trigger a re-fetch or filter client side if the API supports it.
  };

  useEffect(() => {
    loadItems();
  }, [searchTerm, selectedCategory, filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields before submission
    if (!formData.name || !formData.name.trim()) {
      alert('Please select a medicine');
      return;
    }
    if (!formData.unit) {
      alert('Unit is required');
      return;
    }
    if (!formData.unit_price || formData.unit_price < 0.01) {
      alert('Unit price must be at least $0.01');
      return;
    }
    if (!formData.selling_price || formData.selling_price < 0.01) {
      alert('Selling price must be at least $0.01');
      return;
    }
    
    try {
      // Prepare the data with proper types and ensure required fields are not empty
      const unitPrice = parseFloat(String(formData.unit_price));
      const sellingPrice = parseFloat(String(formData.selling_price));
      
      // Ensure prices are valid numbers and at least 0.01
      const finalUnitPrice = isNaN(unitPrice) || unitPrice < 0.01 ? 0.01 : unitPrice;
      const finalSellingPrice = isNaN(sellingPrice) || sellingPrice < 0.01 ? 0.01 : sellingPrice;
      
      const submitData = {
        name: formData.name.trim(),
        generic_name: formData.generic_name?.trim() || '',
        brand_name: formData.brand_name?.trim() || '',
        description: formData.description?.trim() || '',
        category: formData.category,
        unit: formData.unit,
        quantity: parseInt(String(formData.quantity)) || 0,
        reorder_level: parseInt(String(formData.reorder_level)) || 0,
        unit_price: finalUnitPrice,
        selling_price: finalSellingPrice,
        expiry_date: formData.expiry_date || null,
        batch_number: formData.batch_number?.trim() || '',
        supplier_id: formData.supplier_id ? parseInt(String(formData.supplier_id)) : null,
      };
      
      // Final validation to ensure required fields are present
      if (!submitData.name) {
        alert('Please select a medicine');
        return;
      }
      if (!submitData.unit) {
        alert('Unit must be selected');
        return;
      }
      if (submitData.unit_price < 0.01) {
        alert('Unit price must be at least $0.01');
        return;
      }
      if (submitData.selling_price < 0.01) {
        alert('Selling price must be at least $0.01');
        return;
      }
      
      console.log('=== FORM SUBMISSION ===');
      console.log('Raw form data:', formData);
      console.log('Prepared submit data:', submitData);
      console.log('Submit data JSON:', JSON.stringify(submitData));
      console.log('unit_price type:', typeof submitData.unit_price, 'value:', submitData.unit_price);
      console.log('selling_price type:', typeof submitData.selling_price, 'value:', submitData.selling_price);
      
      let response;
      if (editingItem) {
        console.log('Updating item:', editingItem.id);
        response = await inventoryApi.update(editingItem.id.toString(), submitData);
      } else {
        console.log('Creating new item');
        response = await inventoryApi.create(submitData);
      }
      
      console.log('Submit response:', response);
      closeModal();
      
      // Add a small delay to ensure the backend has processed the request
      setTimeout(() => {
        loadItems();
      }, 500);
      
      // Show success message
      alert(editingItem ? 'Item updated successfully!' : 'Item created successfully!');
      
    } catch (error) {
      console.error('Submit error:', error);
      alert(`Failed to ${editingItem ? 'update' : 'save'} item. Please check inputs and try again.`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this inventory item? This action cannot be undone.')) return;
    try {
      await inventoryApi.delete(id.toString());
      loadItems();
    } catch (error) {
      alert('Failed to delete item');
    }
  };

  // Quick Stock Update Handler
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

      if (stockBatchNumber) updateData.batch_number = stockBatchNumber;
      if (stockExpiryDate) updateData.expiry_date = stockExpiryDate;

      console.log('Updating stock for item:', selectedMedicineId, 'with data:', updateData);
      const response = await inventoryApi.update(selectedMedicineId, updateData);
      console.log('Stock update response:', response);
      
      closeStockModal();
      
      // Add delay and force refresh
      setTimeout(() => {
        console.log('Refreshing items after stock update');
        loadItems();
      }, 500);
      
      alert('Stock updated successfully!');
    } catch (error) {
      console.error('Stock update failed:', error);
      alert('Failed to update stock. Please try again.');
    } finally {
      setStockUpdating(false);
    }
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

  const openQuickStockForItem = (item: InventoryItem) => {
    setSelectedMedicineId(item.id.toString());
    setStockMedicineSearch(item.name);
    setStockAction('add');
    setStockQuantity(0);
    setStockBatchNumber(item.batch_number || '');
    setStockExpiryDate(item.expiry_date ? item.expiry_date.split('T')[0] : '');
    setShowStockModal(true);
  };

  const selectedMedicineDetails = useMemo(() => {
    if (!selectedMedicineId) return null;
    return items.find(i => i.id.toString() === selectedMedicineId);
  }, [selectedMedicineId, items]);

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

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setMedicineSearch('');
    setShowMedicineDropdown(false);
    setFormData({
      name: '', generic_name: '', brand_name: '', description: '',
      category: '', unit: 'Tablet', quantity: 0, reorder_level: 10,
      unit_price: 0.01, selling_price: 0.01, expiry_date: '',
      batch_number: '', supplier_id: '',
    });
  };

  // --- Render Helpers ---
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
    { name: "Metoprolol 50mg", generic_name: "Metoprolol", category: "Cardiovascular", unit: "Tablet" },
    { name: "Losartan 50mg", generic_name: "Losartan", category: "Cardiovascular", unit: "Tablet" },
    { name: "Pantoprazole 40mg", generic_name: "Pantoprazole", category: "Gastrointestinal", unit: "Tablet" },
    { name: "Doxycycline 100mg", generic_name: "Doxycycline", category: "Antibiotics", unit: "Capsule" },
    { name: "Prednisone 5mg", generic_name: "Prednisone", category: "Anti-inflammatory", unit: "Tablet" },
    { name: "Gabapentin 300mg", generic_name: "Gabapentin", category: "Neurological", unit: "Capsule" },
    { name: "Tramadol 50mg", generic_name: "Tramadol", category: "Pain Relief", unit: "Tablet" },
    { name: "Cough Syrup 100ml", generic_name: "Dextromethorphan", category: "Respiratory", unit: "Syrup" },
    { name: "Eye Drops 10ml", generic_name: "Artificial Tears", category: "Ophthalmic", unit: "Drops" },
    { name: "Hydrocortisone Cream 1%", generic_name: "Hydrocortisone", category: "Dermatological", unit: "Cream" },
  ];
  const units = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler", "Box", "Piece"];

  // Filter medicines based on search term
  const filteredMedicines = useMemo(() => {
    if (!medicineSearch.trim()) return medicines;
    const search = medicineSearch.toLowerCase();
    return medicines.filter(m => 
      m.name.toLowerCase().includes(search) || 
      m.generic_name.toLowerCase().includes(search)
    );
  }, [medicineSearch]);

  // Filter medicines for stock update modal
  const filteredStockMedicines = useMemo(() => {
    if (!stockMedicineSearch.trim()) return items;
    const search = stockMedicineSearch.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(search) || 
      (item.generic_name && item.generic_name.toLowerCase().includes(search))
    );
  }, [stockMedicineSearch, items]);

  // Handle medicine selection from dropdown
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
      setShowMedicineDropdown(false);
    } else {
      setFormData({
        ...formData,
        name: medicineName,
      });
      setMedicineSearch(medicineName);
      setShowMedicineDropdown(false);
    }
  };

  // Handle stock medicine selection
  const handleStockMedicineSelect = (itemId: string, itemName: string) => {
    setSelectedMedicineId(itemId);
    setStockMedicineSearch(itemName);
    setShowStockMedicineDropdown(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/pharmacist')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
                <p className="text-sm text-gray-500">Manage stock, pricing, and suppliers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  console.log('Manual refresh triggered');
                  loadItems();
                }} 
                className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button 
                onClick={() => setShowStockModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium shadow-md transition-all"
              >
                <BoxIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Update Stock</span>
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-medium shadow-md transition-all transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Item</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Products</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.totalItems}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Inventory Value</p>
              <h3 className="text-2xl font-bold text-gray-800">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div 
            onClick={() => handleFilterChange('low')}
            className={`cursor-pointer p-5 rounded-xl shadow-sm border transition-all ${filterStatus === 'low' ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-200' : 'bg-white border-gray-100 hover:border-orange-200'} flex items-start justify-between`}
          >
            <div>
              <p className={`text-sm font-medium mb-1 ${filterStatus === 'low' ? 'text-orange-700' : 'text-gray-500'}`}>Low Stock Alerts</p>
              <h3 className={`text-2xl font-bold ${filterStatus === 'low' ? 'text-orange-800' : 'text-gray-800'}`}>{stats.lowStock}</h3>
            </div>
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div 
            onClick={() => handleFilterChange('expiring')}
            className={`cursor-pointer p-5 rounded-xl shadow-sm border transition-all ${filterStatus === 'expiring' ? 'bg-red-50 border-red-200 ring-2 ring-red-200' : 'bg-white border-gray-100 hover:border-red-200'} flex items-start justify-between`}
          >
            <div>
              <p className={`text-sm font-medium mb-1 ${filterStatus === 'expiring' ? 'text-red-700' : 'text-gray-500'}`}>Expiring Soon</p>
              <h3 className={`text-2xl font-bold ${filterStatus === 'expiring' ? 'text-red-800' : 'text-gray-800'}`}>{stats.expiring}</h3>
            </div>
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search by name, generic name, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-2 md:pb-0">
              <div className="relative min-w-[150px]">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
              
              <button 
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2.5 rounded-lg border font-medium whitespace-nowrap transition-colors ${filterStatus === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                All Items
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Loading inventory data...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Items Found</h3>
              <p className="text-gray-500 max-w-sm mb-6">We couldn't find any inventory items matching your search criteria.</p>
              <div className="flex gap-3 mb-4">
                <button onClick={() => { setSearchTerm(''); setSelectedCategory(''); setFilterStatus('all'); }} className="text-teal-600 font-medium hover:underline">
                  Clear all filters
                </button>
                <button 
                  onClick={() => {
                    console.log('Manual refresh from empty state');
                    loadItems();
                  }} 
                  className="text-blue-600 font-medium hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </button>
              </div>
              
              {/* Debug Info */}
              <details className="text-left bg-gray-50 p-4 rounded-lg text-sm text-gray-600 max-w-md">
                <summary className="cursor-pointer font-medium mb-2">Debug Info (Click to expand)</summary>
                <div className="space-y-2">
                  <p><strong>Search Term:</strong> "{searchTerm}"</p>
                  <p><strong>Category:</strong> "{selectedCategory}"</p>
                  <p><strong>Filter Status:</strong> "{filterStatus}"</p>
                  <p><strong>Items Count:</strong> {items.length}</p>
                  <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                  <p><strong>Refreshing:</strong> {refreshing ? 'Yes' : 'No'}</p>
                </div>
              </details>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price (Unit)</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          <span className="text-xs text-gray-500">{item.generic_name || item.brand_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge quantity={item.quantity} reorderLevel={item.reorder_level} expiryDate={item.expiry_date} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">{item.quantity} <span className="text-gray-500 font-normal text-xs">{item.unit}</span></div>
                        {item.expiry_date && (
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-sm font-semibold text-gray-800">${item.selling_price.toFixed(2)}</span>
                           <span className="text-xs text-gray-400">Cost: ${item.unit_price.toFixed(2)}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openQuickStockForItem(item)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Update Stock">
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">{editingItem ? 'Update Inventory' : 'Add New Product'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="space-y-8">
                {/* Basic Info Section */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Product Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="md:col-span-2 relative" ref={medicineDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Search & Select Medicine *</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Type to search medicines..."
                          value={medicineSearch}
                          onChange={(e) => {
                            setMedicineSearch(e.target.value);
                            setShowMedicineDropdown(true);
                            if (!e.target.value) {
                              setFormData({...formData, name: '', generic_name: '', category: '', unit: 'Tablet'});
                            }
                          }}
                          onFocus={() => setShowMedicineDropdown(true)}
                          className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${!formData.name ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {medicineSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setMedicineSearch('');
                              setFormData({...formData, name: '', generic_name: '', category: '', unit: 'Tablet'});
                              setShowMedicineDropdown(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {/* Dropdown List */}
                      {showMedicineDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredMedicines.length > 0 ? (
                            filteredMedicines.map((m) => (
                              <button
                                type="button"
                                key={m.name}
                                onClick={() => handleMedicineSelect(m.name)}
                                className={`w-full px-4 py-3 text-left hover:bg-teal-50 transition-colors border-b border-gray-100 last:border-b-0 ${formData.name === m.name ? 'bg-teal-50 text-teal-700' : ''}`}
                              >
                                <div className="font-medium text-gray-800">{m.name}</div>
                                <div className="text-xs text-gray-500">{m.generic_name} • {m.category} • {m.unit}</div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-center">
                              No medicines found matching "{medicineSearch}"
                            </div>
                          )}
                        </div>
                      )}
                      {!formData.name && <p className="text-red-500 text-xs mt-1">Medicine is required</p>}
                      {formData.name && (
                        <p className="text-teal-600 text-xs mt-1 flex items-center gap-1">
                          ✓ Selected: {formData.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Generic Name</label>
                      <input type="text" value={formData.generic_name} onChange={e => setFormData({...formData, generic_name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand Name</label>
                      <input type="text" value={formData.brand_name} onChange={e => setFormData({...formData, brand_name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit Type *</label>
                      <select 
                        required
                        value={formData.unit} 
                        onChange={e => {
                          console.log('Unit changed to:', e.target.value);
                          setFormData({...formData, unit: e.target.value});
                        }} 
                        className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-teal-500 transition-all ${!formData.unit ? 'border-red-300' : 'border-gray-300'}`}
                      >
                        <option value="">Select Unit...</option>
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      {!formData.unit && <p className="text-red-500 text-xs mt-1">Unit is required</p>}
                    </div>
                  </div>
                </div>

                {/* Stock & Pricing */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Stock & Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity *</label>
                      <input 
                        type="number" 
                        min="0" 
                        required 
                        value={formData.quantity} 
                        onChange={e => {
                          const value = parseInt(e.target.value);
                          setFormData({...formData, quantity: isNaN(value) ? 0 : Math.max(0, value)});
                        }} 
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" 
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Reorder Level *</label>
                      <input 
                        type="number" 
                        min="0" 
                        required 
                        value={formData.reorder_level} 
                        onChange={e => {
                          const value = parseInt(e.target.value);
                          setFormData({...formData, reorder_level: isNaN(value) ? 10 : Math.max(0, value)});
                        }} 
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" 
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost Price ($) *</label>
                      <input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        required 
                        value={formData.unit_price} 
                        onChange={e => {
                          const value = parseFloat(e.target.value);
                          setFormData({...formData, unit_price: isNaN(value) ? 0.01 : Math.max(0.01, value)});
                        }} 
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" 
                        placeholder="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Selling Price ($) *</label>
                      <input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        required 
                        value={formData.selling_price} 
                        onChange={e => {
                          const value = parseFloat(e.target.value);
                          setFormData({...formData, selling_price: isNaN(value) ? 0.01 : Math.max(0.01, value)});
                        }} 
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" 
                        placeholder="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Tracking Info */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Tracking & Supplier</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
                      <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Batch Number</label>
                      <input type="text" value={formData.batch_number} onChange={e => setFormData({...formData, batch_number: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all" placeholder="e.g. BATCH-001" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier</label>
                      <select value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all">
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 justify-end">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all">
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-lg shadow-teal-500/30 focus:ring-4 focus:ring-teal-500/50 transition-all"
                >
                  {editingItem ? 'Save Changes' : 'Create Product'}
                </button>
                
                {/* Debug info for development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                    <strong>Debug - Required Fields:</strong><br/>
                    Name: "{formData.name}" | Category: "{formData.category}" | Unit: "{formData.unit}" | 
                    Unit Price: {formData.unit_price} | Selling Price: {formData.selling_price}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAILS MODAL --- */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Batch Number</label>
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
            </form>

            <div className="p-6 pt-0 flex gap-3">
              <button 
                type="button" 
                onClick={closeStockModal} 
                className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                onClick={handleQuickStockUpdate}
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
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryManagement;