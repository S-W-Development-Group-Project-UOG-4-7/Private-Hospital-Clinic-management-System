import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { drugPurchaseApi, supplierApi, inventoryApi } from '../../api/pharmacy';
import { ArrowLeft, Plus, CheckCircle, Search } from 'lucide-react';

interface PurchaseItem {
  id: number;
  inventory_item: {
    id: number;
    name: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface DrugPurchase {
  id: number;
  purchase_number: string;
  supplier: {
    id: number;
    name: string;
  };
  purchase_date: string;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  total_amount: number;
  items: PurchaseItem[];
}

const DrugPurchaseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<DrugPurchase[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    tax: 0,
    discount: 0,
    notes: '',
    items: [] as Array<{ inventory_item_id: string; quantity: number; unit_price: number }>,
  });

  useEffect(() => {
    loadPurchases();
    loadSuppliers();
    loadInventoryItems();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const data = await drugPurchaseApi.getAll();
      setPurchases(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await supplierApi.getAll({ is_active: true });
      setSuppliers(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const loadInventoryItems = async () => {
    try {
      const data = await inventoryApi.getAll();
      setInventoryItems(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error('Failed to load inventory items:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    try {
      await drugPurchaseApi.create(formData);
      setShowModal(false);
      resetForm();
      loadPurchases();
    } catch (error: any) {
      alert(error.error || 'Failed to create purchase');
    }
  };

  const handleReceive = async (id: number) => {
    if (!window.confirm('Mark this purchase as received? This will update inventory.')) return;
    try {
      await drugPurchaseApi.receive(id.toString());
      alert('Purchase received and inventory updated!');
      loadPurchases();
    } catch (error: any) {
      alert(error.error || 'Failed to receive purchase');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { inventory_item_id: '', quantity: 1, unit_price: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      tax: 0,
      discount: 0,
      notes: '',
      items: [],
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
              <h1 className="text-2xl font-bold text-gray-800">Drug Purchase Management</h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Purchase
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{purchase.purchase_number}</h3>
                    <p className="text-sm text-gray-600">Supplier: {purchase.supplier.name}</p>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(purchase.purchase_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(purchase.status)}`}>
                      {purchase.status}
                    </span>
                    {purchase.status === 'ordered' && (
                      <button
                        onClick={() => handleReceive(purchase.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Receive
                      </button>
                    )}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Items:</span>
                    <span className="font-bold text-lg">Total: ${purchase.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2">
                    {purchase.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{item.inventory_item.name}</span>
                        <span>Qty: {item.quantity} × ${item.unit_price.toFixed(2)} = ${item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">New Drug Purchase</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                  <select
                    required
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Add Item
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <select
                          required
                          value={item.inventory_item_id}
                          onChange={(e) => updateItem(index, 'inventory_item_id', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">Select item</option>
                          {inventoryItems.map((inv) => (
                            <option key={inv.id} value={inv.id}>{inv.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="col-span-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
                >
                  Create Purchase
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
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

export default DrugPurchaseManagement;

