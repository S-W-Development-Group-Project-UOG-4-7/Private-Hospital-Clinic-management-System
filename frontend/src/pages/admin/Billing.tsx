import React, { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  paid_at: string | null;
}

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  status: string;
  issued_at: string | null;
  due_date: string | null;
  description?: string | null;
  patient?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  items?: InvoiceItem[];
  payments?: Payment[];
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

const Billing: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [newInvoiceDescription, setNewInvoiceDescription] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<PaginatedResponse<Invoice>>('/admin/billing/invoices', {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
          patient_id: patientId || undefined,
        },
      });
      setInvoices(response.data.data || []);
      if (response.data.data?.length) {
        setSelectedInvoice(response.data.data[0]);
      } else {
        setSelectedInvoice(null);
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
      setError('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const viewInvoice = async (invoiceId: number) => {
    try {
      const response = await api.get<Invoice>(`/admin/billing/invoices/${invoiceId}`);
      setSelectedInvoice(response.data);
    } catch (err) {
      console.error('Failed to load invoice', err);
    }
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.post('/admin/billing/payments', {
        invoice_id: selectedInvoice.id,
        amount: Number(paymentAmount),
        method: paymentMethod,
      });
      setPaymentAmount('');
      await viewInvoice(selectedInvoice.id);
      await fetchInvoices();
    } catch (err) {
      console.error('Failed to record payment', err);
      setError('Failed to record payment.');
    }
  };

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post<Invoice>('/admin/billing/invoices', {
        patient_id: Number(patientId),
        amount: Number(newInvoiceAmount),
        description: newInvoiceDescription || 'Manual invoice',
      });
      setInvoices((prev) => [response.data, ...prev]);
      setSelectedInvoice(response.data);
      setNewInvoiceAmount('');
      setNewInvoiceDescription('');
    } catch (err) {
      console.error('Failed to create invoice', err);
      setError('Failed to create invoice. Provide a valid Patient ID.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
          <p className="text-sm text-gray-500">View invoices and record payments.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="all">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Patient ID</label>
            <input
              type="number"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Search by patient"
              className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchInvoices}
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition w-full"
            >
              Apply Filters
            </button>
          </div>
          <div className="flex items-end">
            <form onSubmit={createInvoice} className="w-full">
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={newInvoiceAmount}
                onChange={(e) => setNewInvoiceAmount(e.target.value)}
                placeholder="Invoice amount"
                className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none mb-2"
              />
              <input
                type="text"
                value={newInvoiceDescription}
                onChange={(e) => setNewInvoiceDescription(e.target.value)}
                placeholder="Description (optional)"
                className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none mb-2"
              />
              <button type="submit" className="border px-4 py-2 rounded hover:bg-gray-50 w-full">
                Create Invoice
              </button>
            </form>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No invoices found.</td></tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewInvoice(invoice.id)}>
                    <td className="px-4 py-3 font-medium text-gray-800">{invoice.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {invoice.patient ? `${invoice.patient.first_name ?? ''} ${invoice.patient.last_name ?? ''}`.trim() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{invoice.amount}</td>
                    <td className="px-4 py-3 text-gray-600">{invoice.status}</td>
                    <td className="px-4 py-3 text-gray-500">{invoice.issued_at ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Invoice Details</h3>
          {selectedInvoice ? (
            <>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium text-gray-700">Invoice:</span> {selectedInvoice.invoice_number}</p>
                <p><span className="font-medium text-gray-700">Status:</span> {selectedInvoice.status}</p>
                <p><span className="font-medium text-gray-700">Amount:</span> {selectedInvoice.amount}</p>
                <p><span className="font-medium text-gray-700">Issued:</span> {selectedInvoice.issued_at ?? '-'}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
                {selectedInvoice.items?.length ? (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedInvoice.items.map((item) => (
                      <li key={item.id}>
                        {item.description} — {item.quantity} x {item.unit_price}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No line items.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Payments</h4>
                {selectedInvoice.payments?.length ? (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedInvoice.payments.map((payment) => (
                      <li key={payment.id}>
                        {payment.method} — {payment.amount} ({payment.status})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No payments recorded.</p>
                )}
              </div>

              <form onSubmit={recordPayment} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition w-full"
                >
                  Record Payment
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-gray-500">Select an invoice to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;
