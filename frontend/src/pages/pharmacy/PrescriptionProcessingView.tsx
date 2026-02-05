import React, { useEffect, useState } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigate } from 'react-router-dom';
import { prescriptionApi } from '../../api/pharmacy';
import { ArrowLeft, CheckCircle, Clock, Search } from 'lucide-react';

interface PrescriptionItem {
  id: number;
  inventory_item: {
    id: number;
    name: string;
    quantity: number;
  };
  quantity: number;
  dosage: string;
  frequency: string;
  is_dispensed: boolean;
}

interface Prescription {
  id: number;
  prescription_number: string;
  patient: {
    id: number;
    first_name: string;
    last_name: string;
  };
  doctor: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  prescription_date: string;
  status: 'pending' | 'processing' | 'dispensed' | 'cancelled';
  items: PrescriptionItem[];
  created_at: string;
}

const PrescriptionProcessingView: React.FC = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'dispensed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPrescriptions();
  }, [filter]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      const data = await prescriptionApi.getAll(params);
      setPrescriptions(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: number) => {
    if (!window.confirm('Are you sure you want to process and dispense this prescription?')) {
      return;
    }

    try {
      await prescriptionApi.process(id.toString());
      alert('Prescription processed successfully!');
      loadPrescriptions();
    } catch (error: any) {
      alert(error.error || 'Failed to process prescription');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'dispensed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      p.prescription_number.toLowerCase().includes(search) ||
      `${p.patient.first_name} ${p.patient.last_name}`.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/pharmacist')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Prescription Processing</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by prescription number or patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'processing', 'dispensed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    filter === status
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No prescriptions found</div>
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <div key={prescription.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {prescription.prescription_number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Patient: {prescription.patient.first_name} {prescription.patient.last_name}
                    </p>
                    {prescription.doctor && (
                      <p className="text-sm text-gray-600">
                        Doctor: {prescription.doctor.first_name} {prescription.doctor.last_name}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Date: {new Date(prescription.prescription_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prescription.status)}`}>
                    {prescription.status}
                  </span>
                </div>

                <div className="border-t pt-4 mb-4">
                  <h4 className="font-semibold mb-2">Medications:</h4>
                  <div className="space-y-2">
                    {prescription.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <div>
                          <p className="font-medium">{item.inventory_item.name}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} | {item.dosage} | {item.frequency}
                          </p>
                          {item.inventory_item.quantity < item.quantity && (
                            <p className="text-sm text-red-600 mt-1">
                              ⚠️ Low stock: Only {item.inventory_item.quantity} available
                            </p>
                          )}
                        </div>
                        {item.is_dispensed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {prescription.status === 'pending' && (
                  <button
                    onClick={() => handleProcess(prescription.id)}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Process & Dispense
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionProcessingView;

