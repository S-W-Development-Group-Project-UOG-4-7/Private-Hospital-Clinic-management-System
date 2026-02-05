import React, { useEffect, useState } from 'react';
import { Plus, Users, Activity, X } from 'lucide-react';
import api from '../../api/axiosConfig';

interface Doctor {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  description: string;
  doctor_count: number;
  doctors: Doctor[];
  status: string;
}

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '' });

  const fetchDepartments = async () => {
    try {
      // FIXED: Added <Department[]> here to tell TypeScript what data to expect
      const res = await api.get<Department[]>('/admin/departments');
      setDepartments(res.data);
    } catch (error) {
      console.error("Error fetching departments", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', newDept);
      setShowModal(false);
      setNewDept({ name: '', description: '' });
      fetchDepartments();
    } catch (error) {
      alert("Failed to add department");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
          <p className="text-gray-500">Manage hospital departments and doctor assignments.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
        >
          <Plus className="w-5 h-5" /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
                <Activity className="w-6 h-6" />
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${dept.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {dept.status}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">{dept.name}</h3>
            <p className="text-gray-500 text-sm mb-4 min-h-[40px]">{dept.description || "No description provided."}</p>
            
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Users className="w-4 h-4" />
                <span>{dept.doctor_count} Doctors</span>
              </div>
              
              <div className="space-y-2">
                {dept.doctors.length > 0 ? (
                  dept.doctors.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                        {doc.name.charAt(0)}
                      </div>
                      {doc.name}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No doctors assigned yet.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
                <h3 className="font-bold text-lg">Add New Department</h3>
                <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
                <input 
                  className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Department Name (e.g. Cardiology)"
                  value={newDept.name}
                  onChange={e => setNewDept({...newDept, name: e.target.value})}
                  required 
                />
                <textarea 
                  className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Description"
                  value={newDept.description}
                  onChange={e => setNewDept({...newDept, description: e.target.value})}
                />
                <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700">Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;