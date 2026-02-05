import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axiosConfig';

interface SystemStats {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  today_appointments: number;
  recent_registrations: number;
}

interface DepartmentStat {
  name: string;
  total_appointments: number;
  unique_patients: number;
}

interface PatientReportData {
  patient: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
  };
  total_appointments: number;
  medical_history: Array<{
    id: number;
    created_at: string;
    diagnosis: string;
    notes: string;
    prescription: string;
    doctor?: {
      first_name: string;
      last_name: string;
    };
  }>;
}

const Reports: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'patient'>('overview');
  
  // Data State
  const [stats, setStats] = useState<SystemStats | null>(null);
  
  // FIX 1: Initialize as empty array explicitly
  const [deptStats, setDeptStats] = useState<DepartmentStat[]>([]);
  
  // Patient Report State
  const [searchId, setSearchId] = useState('');
  const [patientReport, setPatientReport] = useState<PatientReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Check URL for patient_id
  useEffect(() => {
    const idFromUrl = searchParams.get('patient_id');
    if (idFromUrl) {
      setActiveTab('patient');
      setSearchId(idFromUrl);
    }
  }, [searchParams]);

  // 2. Fetch System Overview Stats
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const [bulkRes, deptRes] = await Promise.all([
          api.get<SystemStats>('/admin/reports/patients/bulk'),
          api.get<DepartmentStat[]>('/admin/reports/departments/patients')
        ]);
        
        setStats(bulkRes.data);

        // --- FIX 2: SAFER DATA HANDLING ---
        // If API returns null, undefined, or an object, default to []
        if (Array.isArray(deptRes.data)) {
            setDeptStats(deptRes.data);
        } else {
            console.warn("Department stats API did not return an array:", deptRes.data);
            setDeptStats([]); 
        }

      } catch (err) {
        console.error("Error fetching reports", err);
        setDeptStats([]); // Fallback on error
      }
    };
    fetchSystemStats();
  }, []);

  // 3. Handle Searching for a Patient
  const handlePatientSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPatientReport(null);

    try {
      const response = await api.get<PatientReportData>(`/admin/reports/patient/${searchId}`);
      setPatientReport(response.data);
    } catch (err: any) {
      setError('Patient not found or no data available.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-3xl font-bold text-gray-800">Hospital Reports</h1>
        <div className="space-x-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded font-medium transition ${activeTab === 'overview' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-600 border'}`}
          >
            System Overview
          </button>
          <button 
            onClick={() => setActiveTab('patient')}
            className={`px-4 py-2 rounded font-medium transition ${activeTab === 'patient' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-600 border'}`}
          >
            Patient Medical Report
          </button>
        </div>
      </div>

      {/* --- TAB 1: OVERVIEW --- */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
              <h3 className="text-gray-500 text-sm uppercase">Total Patients</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.total_patients}</p>
            </div>
            <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
              <h3 className="text-gray-500 text-sm uppercase">Appointments</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.total_appointments}</p>
            </div>
            <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500">
              <h3 className="text-gray-500 text-sm uppercase">Doctors</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.total_doctors}</p>
            </div>
            <div className="bg-white p-4 rounded shadow border-l-4 border-orange-500">
              <h3 className="text-gray-500 text-sm uppercase">New (30 Days)</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.recent_registrations}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow border border-gray-100">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Department Performance</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-sm font-semibold text-gray-600">Department</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Total Visits</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Unique Patients</th>
                </tr>
              </thead>
              <tbody>
                {/* --- FIX 3: SAFE MAPPING --- */}
                {Array.isArray(deptStats) && deptStats.length > 0 ? (
                    deptStats.map((dept, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-800">{dept.name || 'Unassigned'}</td>
                        <td className="p-3 text-gray-600">{dept.total_appointments}</td>
                        <td className="p-3 text-gray-600">{dept.unique_patients}</td>
                      </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={3} className="p-4 text-center text-gray-500 italic">
                            No department data available.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: PATIENT REPORT --- */}
      {activeTab === 'patient' && (
        <div className="animate-fade-in">
          <div className="bg-white p-6 rounded shadow mb-6 print:hidden border border-gray-100">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Generate Patient History</h2>
            <form onSubmit={handlePatientSearch} className="flex gap-4">
              <input 
                type="text" 
                placeholder="Enter Patient ID (e.g. 1)" 
                className="border p-2 rounded flex-1 focus:ring-2 focus:ring-teal-500 outline-none"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 font-medium">
                Generate Report
              </button>
            </form>
            {error && <p className="text-red-500 mt-3 text-sm font-medium">{error}</p>}
          </div>

          {loading && <p className="text-center text-gray-500 py-10">Searching records...</p>}

          {patientReport && (
            <div className="bg-white p-10 rounded shadow-lg border border-gray-200" id="printable-area">
              
              {/* Report Header */}
              <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 uppercase tracking-wide">Medical Report</h1>
                  <p className="text-gray-500 mt-1">Generated on: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-xl text-gray-800">{patientReport.patient.first_name} {patientReport.patient.last_name}</h3>
                  <p className="text-sm text-gray-600">ID: #{patientReport.patient.id}</p>
                  <p className="text-sm text-gray-600">{patientReport.patient.email}</p>
                </div>
              </div>

              {/* Summary Section */}
              <div className="mb-8 bg-gray-50 p-4 rounded">
                <h3 className="font-bold text-gray-800 mb-3 uppercase text-xs tracking-wider border-b pb-1">Patient Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><span className="font-semibold text-gray-700">Total Clinic Visits:</span> {patientReport.total_appointments}</p>
                  <p><span className="font-semibold text-gray-700">Registered Date:</span> {new Date(patientReport.patient.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* History Table */}
              <div>
                <h3 className="font-bold text-gray-800 mb-4 uppercase text-xs tracking-wider border-b pb-1">Clinical History</h3>
                {patientReport.medical_history.length === 0 ? (
                  <p className="text-gray-500 italic py-4">No medical records found on file.</p>
                ) : (
                  <table className="w-full text-left text-sm border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 border-b font-semibold text-gray-700">Date</th>
                        <th className="p-3 border-b font-semibold text-gray-700">Doctor</th>
                        <th className="p-3 border-b font-semibold text-gray-700">Diagnosis</th>
                        <th className="p-3 border-b font-semibold text-gray-700">Notes & Prescription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientReport.medical_history.map((record) => (
                        <tr key={record.id} className="border-b last:border-0">
                          <td className="p-3 align-top whitespace-nowrap text-gray-600">{new Date(record.created_at).toLocaleDateString()}</td>
                          <td className="p-3 align-top font-medium text-gray-800">
                            Dr. {record.doctor?.first_name} {record.doctor?.last_name || 'Unknown'}
                          </td>
                          <td className="p-3 align-top text-teal-700 font-medium">{record.diagnosis || 'N/A'}</td>
                          <td className="p-3 align-top text-gray-600">
                            <div className="mb-1">{record.notes}</div>
                            {record.prescription && (
                              <div className="mt-2 text-xs bg-yellow-50 p-2 rounded border border-yellow-100 text-yellow-800">
                                <strong>Rx:</strong> {record.prescription}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t text-center print:block hidden">
                <p className="text-xs text-gray-400">This document is confidential and intended solely for authorized hospital personnel.</p>
              </div>

              <div className="mt-8 text-right print:hidden">
                <button onClick={handlePrint} className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900 transition flex items-center gap-2 ml-auto">
                   Print Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;