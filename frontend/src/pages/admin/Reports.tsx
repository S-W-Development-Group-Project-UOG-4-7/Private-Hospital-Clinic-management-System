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
  const [activeTab, setActiveTab] = useState<'overview' | 'patient' | 'operations'>('overview');
  
  // Data State
  const [stats, setStats] = useState<SystemStats | null>(null);
  
  // FIX 1: Initialize as empty array explicitly
  const [deptStats, setDeptStats] = useState<DepartmentStat[]>([]);
  
  // Patient Report State
  const [searchId, setSearchId] = useState('');
  const [patientReport, setPatientReport] = useState<PatientReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Operational Reports State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appointmentsGroupBy, setAppointmentsGroupBy] = useState<'day' | 'department' | 'doctor'>('day');
  const [revenueGroupBy, setRevenueGroupBy] = useState<'day' | 'month'>('day');
  const [noShowGroupBy, setNoShowGroupBy] = useState<'day' | 'department' | 'doctor'>('day');
  const [stockType, setStockType] = useState<'ALL' | 'PURCHASE' | 'DISPENSE' | 'ADJUST'>('ALL');

  const [appointmentsReport, setAppointmentsReport] = useState<Array<Record<string, any>>>([]);
  const [revenueReport, setRevenueReport] = useState<Array<Record<string, any>>>([]);
  const [noShowReport, setNoShowReport] = useState<Array<Record<string, any>>>([]);
  const [inventoryValuation, setInventoryValuation] = useState<Array<Record<string, any>>>([]);
  const [stockMovement, setStockMovement] = useState<Array<Record<string, any>>>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');

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
        const [bulkRes, deptRes, dashboardRes] = await Promise.all([
          api.get('/admin/reports/patients/bulk'),
          api.get('/admin/reports/departments/patients'),
          api.get('/admin/dashboard-stats'),
        ]);

        const bulkData = bulkRes.data as any;
        const deptData = deptRes.data as any;
        const dashboardData = dashboardRes.data as any;

        const summary = bulkData?.summary_statistics || {};
        const counts = dashboardData?.counts || {};
        setStats({
          total_patients: summary.total_patients ?? 0,
          total_appointments: summary.total_appointments ?? 0,
          total_doctors: counts.total_doctors ?? 0,
          today_appointments: 0,
          recent_registrations: summary.recent_registrations ?? 0,
        });

        // --- FIX 2: SAFER DATA HANDLING ---
        // If API returns null, undefined, or an object, default to []
        if (Array.isArray(deptData?.department_reports)) {
            const mapped = deptData.department_reports.map((dept: any) => ({
              name: dept.department_name ?? dept.name ?? 'Unassigned',
              total_appointments: dept.statistics?.appointments ?? 0,
              unique_patients: dept.statistics?.total_patients ?? 0,
            }));
            setDeptStats(mapped);
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

  const fetchOperationalReports = async () => {
    setReportsLoading(true);
    setReportsError('');

    try {
      const [appointmentsRes, revenueRes, noShowRes, valuationRes, movementRes] = await Promise.all([
        api.get('/admin/reports/appointments', {
          params: { start_date: startDate || undefined, end_date: endDate || undefined, group_by: appointmentsGroupBy },
        }),
        api.get('/admin/reports/revenue', {
          params: { start_date: startDate || undefined, end_date: endDate || undefined, group_by: revenueGroupBy },
        }),
        api.get('/admin/reports/no-show', {
          params: { start_date: startDate || undefined, end_date: endDate || undefined, group_by: noShowGroupBy },
        }),
        api.get('/admin/reports/inventory-valuation'),
        api.get('/admin/reports/stock-movement', {
          params: { start_date: startDate || undefined, end_date: endDate || undefined, type: stockType === 'ALL' ? undefined : stockType },
        }),
      ]);

      const appointmentsData = (appointmentsRes.data as any)?.data || [];
      const revenueData = (revenueRes.data as any)?.data || [];
      const noShowData = (noShowRes.data as any)?.data || [];
      const valuationData = (valuationRes.data as any)?.data || [];
      const movementData = (movementRes.data as any)?.data || [];

      setAppointmentsReport(appointmentsData);
      setRevenueReport(revenueData);
      setNoShowReport(noShowData);
      setInventoryValuation(valuationData);
      setStockMovement(movementData);
    } catch (err) {
      console.error("Error fetching operational reports", err);
      setReportsError('Failed to load reports. Please try again.');
    } finally {
      setReportsLoading(false);
    }
  };

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
          <button 
            onClick={() => setActiveTab('operations')}
            className={`px-4 py-2 rounded font-medium transition ${activeTab === 'operations' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-600 border'}`}
          >
            Operational Reports
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

      {/* --- TAB 3: OPERATIONAL REPORTS --- */}
      {activeTab === 'operations' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded shadow border border-gray-100 print:hidden">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Report Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Start Date</label>
                <input
                  type="date"
                  className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">End Date</label>
                <input
                  type="date"
                  className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Appointments Group</label>
                <select
                  className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  value={appointmentsGroupBy}
                  onChange={(e) => setAppointmentsGroupBy(e.target.value as 'day' | 'department' | 'doctor')}
                >
                  <option value="day">Day</option>
                  <option value="department">Department</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Revenue Group</label>
                <select
                  className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  value={revenueGroupBy}
                  onChange={(e) => setRevenueGroupBy(e.target.value as 'day' | 'month')}
                >
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">No-show Group</label>
                <select
                  className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  value={noShowGroupBy}
                  onChange={(e) => setNoShowGroupBy(e.target.value as 'day' | 'department' | 'doctor')}
                >
                  <option value="day">Day</option>
                  <option value="department">Department</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Stock Movement Type</label>
                <select
                  className="border p-2 rounded w-full focus:ring-2 focus:ring-teal-500 outline-none"
                  value={stockType}
                  onChange={(e) => setStockType(e.target.value as 'ALL' | 'PURCHASE' | 'DISPENSE' | 'ADJUST')}
                >
                  <option value="ALL">All</option>
                  <option value="PURCHASE">Purchase</option>
                  <option value="DISPENSE">Dispense</option>
                  <option value="ADJUST">Adjust</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={fetchOperationalReports}
                className="bg-teal-600 text-white px-5 py-2 rounded hover:bg-teal-700 font-medium"
              >
                Run Reports
              </button>
              {reportsError && <span className="text-sm text-red-600">{reportsError}</span>}
            </div>
          </div>

          {reportsLoading && <p className="text-center text-gray-500 py-6">Loading reports...</p>}

          {/* Appointments Report */}
          <div className="bg-white p-6 rounded shadow border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-700">Appointments Report</h3>
              <button
                onClick={() => downloadCsv('/admin/reports/appointments', {
                  start_date: startDate || undefined,
                  end_date: endDate || undefined,
                  group_by: appointmentsGroupBy,
                }, 'appointments_report.csv')}
                className="text-sm px-4 py-2 rounded border bg-white hover:bg-gray-50"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {appointmentsReport[0] ? Object.keys(appointmentsReport[0]).map((key) => (
                      <th key={key} className="p-3 border-b font-semibold text-gray-700">{key}</th>
                    )) : (
                      <th className="p-3 border-b font-semibold text-gray-700">No data</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {appointmentsReport.length > 0 ? appointmentsReport.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      {Object.keys(row).map((key) => (
                        <td key={key} className="p-3 text-gray-600">{row[key]}</td>
                      ))}
                    </tr>
                  )) : (
                    <tr>
                      <td className="p-4 text-center text-gray-500 italic">No appointment data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Report */}
          <div className="bg-white p-6 rounded shadow border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-700">Revenue Report</h3>
              <button
                onClick={() => downloadCsv('/admin/reports/revenue', {
                  start_date: startDate || undefined,
                  end_date: endDate || undefined,
                  group_by: revenueGroupBy,
                }, 'revenue_report.csv')}
                className="text-sm px-4 py-2 rounded border bg-white hover:bg-gray-50"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {revenueReport[0] ? Object.keys(revenueReport[0]).map((key) => (
                      <th key={key} className="p-3 border-b font-semibold text-gray-700">{key}</th>
                    )) : (
                      <th className="p-3 border-b font-semibold text-gray-700">No data</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {revenueReport.length > 0 ? revenueReport.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      {Object.keys(row).map((key) => (
                        <td key={key} className="p-3 text-gray-600">{row[key]}</td>
                      ))}
                    </tr>
                  )) : (
                    <tr>
                      <td className="p-4 text-center text-gray-500 italic">No revenue data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* No-Show Report */}
          <div className="bg-white p-6 rounded shadow border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-700">No-show Report</h3>
              <button
                onClick={() => downloadCsv('/admin/reports/no-show', {
                  start_date: startDate || undefined,
                  end_date: endDate || undefined,
                  group_by: noShowGroupBy,
                }, 'no_show_report.csv')}
                className="text-sm px-4 py-2 rounded border bg-white hover:bg-gray-50"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {noShowReport[0] ? Object.keys(noShowReport[0]).map((key) => (
                      <th key={key} className="p-3 border-b font-semibold text-gray-700">{key}</th>
                    )) : (
                      <th className="p-3 border-b font-semibold text-gray-700">No data</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {noShowReport.length > 0 ? noShowReport.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      {Object.keys(row).map((key) => (
                        <td key={key} className="p-3 text-gray-600">{row[key]}</td>
                      ))}
                    </tr>
                  )) : (
                    <tr>
                      <td className="p-4 text-center text-gray-500 italic">No no-show data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory Valuation */}
          <div className="bg-white p-6 rounded shadow border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-700">Inventory Valuation</h3>
              <button
                onClick={() => downloadCsv('/admin/reports/inventory-valuation', {}, 'inventory_valuation.csv')}
                className="text-sm px-4 py-2 rounded border bg-white hover:bg-gray-50"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {inventoryValuation[0] ? Object.keys(inventoryValuation[0]).map((key) => (
                      <th key={key} className="p-3 border-b font-semibold text-gray-700">{key}</th>
                    )) : (
                      <th className="p-3 border-b font-semibold text-gray-700">No data</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {inventoryValuation.length > 0 ? inventoryValuation.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      {Object.keys(row).map((key) => (
                        <td key={key} className="p-3 text-gray-600">{row[key]}</td>
                      ))}
                    </tr>
                  )) : (
                    <tr>
                      <td className="p-4 text-center text-gray-500 italic">No inventory data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Movement */}
          <div className="bg-white p-6 rounded shadow border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-700">Stock Movement</h3>
              <button
                onClick={() => downloadCsv('/admin/reports/stock-movement', {
                  start_date: startDate || undefined,
                  end_date: endDate || undefined,
                  type: stockType === 'ALL' ? undefined : stockType,
                }, 'stock_movement.csv')}
                className="text-sm px-4 py-2 rounded border bg-white hover:bg-gray-50"
              >
                Export CSV
              </button>
            </div>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
