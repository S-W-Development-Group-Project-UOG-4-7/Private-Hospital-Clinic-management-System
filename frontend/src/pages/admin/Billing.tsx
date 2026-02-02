import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, FileText, AlertCircle, 
  Search, Download, Plus, Settings, RefreshCw 
} from 'lucide-react';
// If you haven't set up the API yet, you can comment this out or keep it if axiosConfig exists
import api from '../../api/axiosConfig';

// --- Types ---
interface Invoice {
  id: string;
  patient_name: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Cancelled';
  payment_method: 'Cash' | 'Card' | 'Insurance';
}

interface ServicePrice {
  id: number;
  name: string;
  code: string;
  price: number;
}

const Billing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'pricing'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // --- State for Data ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [services, setServices] = useState<ServicePrice[]>([]);

  // --- Initial Data Load ---
  useEffect(() => {
    // Simulate fetching data
    setLoading(true);
    setTimeout(() => {
      setInvoices([
        { id: 'INV-2026-001', patient_name: 'John Doe', date: '2026-02-01', amount: 150.00, status: 'Paid', payment_method: 'Card' },
        { id: 'INV-2026-002', patient_name: 'Sarah Smith', date: '2026-02-01', amount: 45.00, status: 'Pending', payment_method: 'Cash' },
        { id: 'INV-2026-003', patient_name: 'Michael Brown', date: '2026-01-31', amount: 200.00, status: 'Cancelled', payment_method: 'Insurance' },
        { id: 'INV-2026-004', patient_name: 'Emily Davis', date: '2026-02-02', amount: 320.00, status: 'Paid', payment_method: 'Insurance' },
      ]);
      setServices([
        { id: 1, name: 'General Consultation', code: 'CON-001', price: 50.00 },
        { id: 2, name: 'Blood Test (CBC)', code: 'LAB-001', price: 25.00 },
        { id: 3, name: 'X-Ray (Chest)', code: 'RAD-001', price: 80.00 },
        { id: 4, name: 'MRI Scan', code: 'IMG-001', price: 450.00 },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  // --- Dynamic Stats Calculations ---
  const totalRevenue = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingPayments = invoices
    .filter(inv => inv.status === 'Pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  // --- Filter Logic ---
  const filteredInvoices = invoices.filter(inv => 
    inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Finance</h1>
          <p className="text-gray-500 mt-1">Manage invoices, payments, and service pricing.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'invoices' 
              ? 'bg-white text-teal-700 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Invoices
          </button>
          <button 
            onClick={() => setActiveTab('pricing')}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'pricing' 
              ? 'bg-white text-teal-700 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Price List
          </button>
        </div>
      </div>

      {/* Stats Cards (Only show on Invoices tab) */}
      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">${totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <DollarSign size={28} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">${pendingPayments.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
              <AlertCircle size={28} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Invoices</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{invoices.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText size={28} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* --- INVOICES TAB --- */}
        {activeTab === 'invoices' && (
          <div>
            {/* Toolbar */}
            <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search invoice ID or patient name..." 
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Download size={16} /> Export CSV
                </button>
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/20">
                  <Plus size={16} /> New Invoice
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Invoice ID</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Patient</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Amount</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Method</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
                          <span>Loading invoices...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No invoices found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{inv.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{inv.patient_name}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">${inv.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-500 flex items-center gap-2">
                          <CreditCard size={14} className="text-gray-400" />
                          {inv.payment_method}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-teal-600 hover:text-teal-800 font-medium text-xs bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PRICING TAB --- */}
        {activeTab === 'pricing' && (
          <div className="p-0">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Standard Price List</h3>
                <p className="text-sm text-gray-500">Manage base rates for clinic services.</p>
              </div>
              <button className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl hover:bg-teal-700 transition shadow-lg shadow-teal-500/20 text-sm font-medium">
                <Plus size={18} /> Add Service
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Service Code</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Service Name</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Standard Price</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {services.map((svc) => (
                    <tr key={svc.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-gray-500 text-xs bg-gray-50/50 w-32">{svc.code}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{svc.name}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">${svc.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-teal-600 transition-colors">
                          <Settings size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;