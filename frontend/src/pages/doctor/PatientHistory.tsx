import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

interface EhrRecord {
  id: number;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  created_at: string;
  doctor?: { first_name: string; last_name: string };
}

// 1. Define what the API response looks like
interface HistoryApiResponse {
  patient: {
    name: string;
  };
  records: EhrRecord[];
}

const PatientHistory: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState<EhrRecord[]>([]);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 2. Add <HistoryApiResponse> here to tell TypeScript the data shape
        const response = await api.get<HistoryApiResponse>(`/doctor/patients/${id}/history`);
        
        // 3. Now TypeScript is happy because it knows 'records' and 'patient' exist
        setRecords(response.data.records);
        setPatientName(response.data.patient.name);
      } catch (err: any) {
        setError('Failed to load history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchHistory();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading records...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="text-teal-600 mb-4 hover:underline">
        &larr; Back to Patient List
      </button>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-teal-500">
        <h1 className="text-2xl font-bold text-gray-800">Medical History</h1>
        <p className="text-gray-600">Patient: <span className="font-semibold">{patientName}</span></p>
      </div>

      <div className="space-y-4">
        {records.length === 0 ? (
          <p className="text-gray-500 text-center">No medical records found for this patient.</p>
        ) : (
          records.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                  {new Date(record.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-400">
                  Dr. {record.doctor?.first_name} {record.doctor?.last_name}
                </span>
              </div>
              <h3 className="font-bold text-gray-800">{record.diagnosis || 'No Diagnosis'}</h3>
              <p className="text-gray-600 mt-1">{record.notes}</p>
              {record.prescription && (
                <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700 border border-gray-200">
                  <strong>Prescription:</strong> {record.prescription}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientHistory;