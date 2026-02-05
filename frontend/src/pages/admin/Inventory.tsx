import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, ArrowLeft, Search, CheckCircle, Plus, X, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/axiosConfig';

interface Drug {
  id: number;
  name: string;
  stock: number;
  status: string;
  expiry: string;
}

interface ValuationSummary {
  total_cost_value: number;
  total_sell_value: number;
  items: number;
}

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Reports State
  const [valuationSummary, setValuationSummary] = useState<ValuationSummary>({
    total_cost_value: 0,
    total_sell_value: 0,
    items: 0,
  });
  const [stockMovement, setStockMovement] = useState<Array<Record<string, any>>>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [movementType, setMovementType] = useState<'ALL' | 'PURCHASE' | 'DISPENSE' | 'ADJUST'>('ALL');
  const [movementStart, setMovementStart] = useState('');
  const [movementEnd, setMovementEnd] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // Track if we are editing
  const [formData, setFormData] = useState({
    name: '',
    stock_quantity: '',
    expiry_date: ''
  });

  // Fetch Inventory
  const fetchInventory = async () => {
    try {
      const response = await api.get<Drug[]>('/admin/inventory');
      setDrugs(response.data);
    } catch (error) {
      console.error("Failed to load inventory", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setReportsLoading(true);
    setReportsError('');
    try {
      const [valuationRes, movementRes] = await Promise.all([
        api.get('/admin/reports/inventory-valuation'),
        api.get('/admin/reports/stock-movement', {
          params: {
            start_date: movementStart || undefined,
            end_date: movementEnd || undefined,
            type: movementType === 'ALL' ? undefined : movementType,
          },
        }),
      ]);

      const valuationData = valuationRes.data as any;
      const movementData = movementRes.data as any;

      setValuationSummary(valuationData?.summary || {
        total_cost_value: 0,
        total_sell_value: 0,
        items: 0,
      });
      setStockMovement(movementData?.data || []);
    } catch (error) {
      console.error("Failed to load reports", error);
      setReportsError('Failed to load reports.');
    } finally {
      setReportsLoading(false);
    }
  };

  const downloadCsv = async (url: string, params: Record<string, any>, filename: string) => {
    const response = await api.get<Blob>(url, {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });

    const blob = new Blob([response.data as BlobPart], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  };

  // Open Modal for Editing
  const handleEditClick = (drug: Drug) => {
    setEditingId(drug.id);
    setFormData({
      name: drug.name,
      stock_quantity: drug.stock.toString(),
      expiry_date: drug.expiry
    });
    setIsModalOpen(true);
  };

  // Open Modal for Adding
  const handleAddClick = () => {
    setEditingId(null);
    setFormData({ name: '', stock_quantity: '', expiry_date: '' });
    setIsModalOpen(true);
  };

  // Handle Submit (Add OR Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing item
        await api.put(`/admin/inventory/${editingId}`, formData);
        alert("Medicine updated successfully!");
      } else {
        // Create new item
        await api.post('/admin/inventory', formData);
        alert("Medicine added successfully!");
      }
      fetchInventory(); 
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save item", error);
      alert("Failed to save item. Please try again.");
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    
    try {
      await api.delete(`/admin/inventory/${id}`);
      setDrugs(drugs.filter(d => d.id !== id)); // Remove from UI instantly
      alert("Item deleted.");
    } catch (error) {
      console.error("Failed to delete", error);
      alert("Failed to delete item.");
    }
  };

  const filteredDrugs = drugs.filter(drug => 
    drug.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Inventory Tracking</h2>
          <p className="text-sm text-gray-500">Monitor drug stock levels and expiration alerts.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add Medicine
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search medical supplies..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
            <div className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-red-100">
                <AlertTriangle className="w-4 h-4" />
                Low Stock: {drugs.filter(d => d.stock < 10).length}
            </div>
            <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-100">
                <Package className="w-4 h-4" />
                Total Items: {drugs.length}
            </div>
        </div>
      </div>

      {/* Valuation Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow border border-gray-100">
          <h3 className="text-sm text-gray-500 uppercase">Total Cost Value</h3>
          <p className="text-2xl font-bold text-gray-800">{valuationSummary.total_cost_value}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border border-gray-100">
          <h3 className="text-sm text-gray-500 uppercase">Total Sell Value</h3>
          <p className="text-2xl font-bold text-gray-800">{valuationSummary.total_sell_value}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border border-gray-100">
          <h3 className="text-sm text-gray-500 uppercase">Items Counted</h3>
          <p className="text-2xl font-bold text-gray-800">{valuationSummary.items}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
               <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading inventory...</td></tr>
            ) : filteredDrugs.length === 0 ? (
               <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No items found. Click "Add Medicine" to start.</td></tr>
            ) : (
                filteredDrugs.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-gray-700">{item.stock} units</td>
                        <td className="px-6 py-4">
                            {item.stock < 10 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    <AlertTriangle className="w-3 h-3" /> Low Stock
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    <CheckCircle className="w-3 h-3" /> In Stock
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{item.expiry}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button 
                                onClick={() => handleEditClick(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                                title="Edit Item"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                title="Delete Item"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Movement Report */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Stock Movement</h3>
            <p className="text-sm text-gray-500">Track purchases, dispensing, and adjustments.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fetchReports()}
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition"
            >
              Refresh
            </button>
            <button
              onClick={() => downloadCsv('/admin/reports/stock-movement', {
                start_date: movementStart || undefined,
                end_date: movementEnd || undefined,
                type: movementType === 'ALL' ? undefined : movementType,
              }, 'stock_movement.csv')}
              className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Type</label>
            <select
              className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as 'ALL' | 'PURCHASE' | 'DISPENSE' | 'ADJUST')}
            >
              <option value="ALL">All</option>
              <option value="PURCHASE">Purchase</option>
              <option value="DISPENSE">Dispense</option>
              <option value="ADJUST">Adjust</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Start Date</label>
            <input
              type="date"
              className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
              value={movementStart}
              onChange={(e) => setMovementStart(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">End Date</label>
            <input
              type="date"
              className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
              value={movementEnd}
              onChange={(e) => setMovementEnd(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => downloadCsv('/admin/reports/inventory-valuation', {}, 'inventory_valuation.csv')}
              className="w-full px-4 py-2 rounded border bg-white hover:bg-gray-50"
            >
              Export Valuation CSV
            </button>
          </div>
        </div>

        {reportsError && <p className="text-sm text-red-600">{reportsError}</p>}
        {reportsLoading ? (
          <p className="text-center text-gray-500 py-6">Loading stock movement...</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left text-sm border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {stockMovement[0] ? Object.keys(stockMovement[0]).map((key) => (
                    <th key={key} className="p-3 border-b font-semibold text-gray-700">{key}</th>
                  )) : (
                    <th className="p-3 border-b font-semibold text-gray-700">No data</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {stockMovement.length > 0 ? stockMovement.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    {Object.keys(row).map((key) => (
                      <td key={key} className="p-3 text-gray-600">{row[key]}</td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td className="p-4 text-center text-gray-500 italic">No stock movement data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                {editingId ? 'Edit Medicine' : 'Add New Medicine'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g. Paracetamol 500mg"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g. 100"
                  value={formData.stock_quantity}
                  onChange={e => setFormData({...formData, stock_quantity: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  value={formData.expiry_date}
                  onChange={e => setFormData({...formData, expiry_date: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
                >
                  {editingId ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
