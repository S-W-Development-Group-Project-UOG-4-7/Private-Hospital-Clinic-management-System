import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Search, X, Check, Calendar, Clock } from 'lucide-react';
import api from '../../api/axiosConfig';

// 1. Updated Interface to match Backend Response
interface Appointment {
  id: number;
  patient_name: string;
  doctor_name: string;
  department: string;
  appointment_date: string; // Backend sends 'YYYY-MM-DD'
  appointment_time: string; // Backend sends 'HH:MM:SS'
  status: string;
  reason: string;
  notes: string;
}

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Edit Modal State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    appointment_date: '',
    appointment_time: '',
    status: '',
    notes: ''
  });

  // 2. Fetch Data
  const fetchAppointments = async () => {
    try {
      const res = await api.get<Appointment[]>('/admin/appointments');
      // Ensure we always set an array to avoid crashes
      setAppointments(Array.isArray(res.data) ? res.data : []); 
    } catch (error) {
      console.error("Error fetching appointments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // 3. Handle Delete
  const handleDelete = async (id: number) => {
    if(!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await api.delete(`/admin/appointments/${id}`);
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      alert("Failed to delete appointment");
    }
  };

  // 4. Handle Edit Click
  const handleEditClick = (appt: Appointment) => {
    setEditingAppointment(appt);
    setFormData({
      appointment_date: appt.appointment_date,
      appointment_time: appt.appointment_time || '',
      status: appt.status,
      notes: appt.notes || ''
    });
    setIsEditModalOpen(true);
  };

  // 5. Submit Updates
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    try {
      await api.put(`/admin/appointments/${editingAppointment.id}`, formData);
      setIsEditModalOpen(false);
      fetchAppointments(); // Refresh list to show changes
      alert("Appointment updated successfully!");
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update appointment.");
    }
  };

  // Helper: Format Date safely
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  };

  // Helper: Get Status Badge Color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAppointments = appointments.filter(appt => 
    (appt.patient_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (appt.doctor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : filteredAppointments.map((appt) => (
              <tr key={appt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{appt.patient_name}</td>
                <td className="px-6 py-4 text-gray-600">{appt.doctor_name}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-sm">
                    <span className="font-medium text-gray-900">{formatDate(appt.appointment_date)}</span>
                    <span className="text-gray-500 text-xs">{appt.appointment_time}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(appt.status)}`}>
                    {appt.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => handleEditClick(appt)} 
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(appt.id)} 
                    className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-fade-in">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Edit size={20} className="text-teal-600" />
              Edit Appointment
            </h3>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              {/* Date Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input 
                    type="date" 
                    value={formData.appointment_date ? formData.appointment_date.split('T')[0] : ''} 
                    onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input 
                    type="time" 
                    value={formData.appointment_time} 
                    onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none capitalize"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none"
                  placeholder="Add notes here..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center gap-2"
                >
                  <Check size={16} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;