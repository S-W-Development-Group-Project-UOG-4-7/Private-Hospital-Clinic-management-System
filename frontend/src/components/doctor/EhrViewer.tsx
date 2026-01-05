import React from 'react';
import type { PatientEhrData } from '../../types/doctor';

export interface EhrViewerProps {
  patientId: string;
  onPatientIdChange: (next: string) => void;
  onLoad: () => void;
  loading: boolean;
  data: PatientEhrData | null;
  tab: 'diagnosis' | 'lab_report';
  onTabChange: (tab: 'diagnosis' | 'lab_report') => void;
}

export const EhrViewer: React.FC<EhrViewerProps> = ({
  patientId,
  onPatientIdChange,
  onLoad,
  loading,
  data,
  tab,
  onTabChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Electronic Health Records</h2>
          <p className="text-gray-600 text-sm">Access patient history, diagnoses and lab reports</p>
        </div>

        <div className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
            <input
              type="number"
              value={patientId}
              onChange={(e) => onPatientIdChange(e.target.value)}
              className="w-40 px-3 py-2 border rounded-lg"
              placeholder="e.g. 1"
            />
          </div>
          <button
            type="button"
            onClick={onLoad}
            disabled={loading || patientId.trim() === ''}
            className="bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
          >
            {loading ? 'Loading...' : 'Load'}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onTabChange('diagnosis')}
          className={`px-6 py-3 rounded-full text-sm font-bold transition duration-300 ${tab === 'diagnosis' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Diagnoses
        </button>
        <button
          type="button"
          onClick={() => onTabChange('lab_report')}
          className={`px-6 py-3 rounded-full text-sm font-bold transition duration-300 ${tab === 'lab_report' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Lab Reports
        </button>
      </div>

      {data ? (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-600">Patient</div>
            <div className="text-lg font-semibold text-gray-900">{data.patient.name}</div>
            <div className="text-sm text-gray-600">{data.patient.email}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.ehr_records.filter((r) => r.type === tab).length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-6 text-gray-600">No records found.</div>
            ) : (
              data.ehr_records
                .filter((r) => r.type === tab)
                .map((r) => (
                  <div key={r.id} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{r.title}</h3>
                        <p className="text-sm text-gray-600">{r.record_date || '-'}</p>
                      </div>
                      {r.file_url && (
                        <a
                          href={r.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-teal-600 hover:text-teal-700"
                        >
                          View File
                        </a>
                      )}
                    </div>
                    {r.details && <p className="text-gray-700 text-sm mt-3 whitespace-pre-line">{r.details}</p>}
                  </div>
                ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6 text-gray-600">Enter a patient id to load records.</div>
      )}
    </div>
  );
};
