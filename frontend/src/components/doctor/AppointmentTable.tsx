import React from 'react';
import type { DoctorAppointment, UpdateAppointmentStatusPayload } from '../../types/doctor';

type AppointmentStatus = UpdateAppointmentStatusPayload['status'];

export interface AppointmentTableProps {
  appointments: DoctorAppointment[];
  loading: boolean;
  onView: (appointment: DoctorAppointment) => void;
  onOpenEhr: (patientId: number) => void;
  onStartConsultation: (appointment: DoctorAppointment) => void;
  onUpdateStatus: (appointment: DoctorAppointment, status: AppointmentStatus) => void;
}

export const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments,
  loading,
  onView,
  onOpenEhr,
  onStartConsultation,
  onUpdateStatus,
}) => {
  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                  No appointments found.
                </td>
              </tr>
            ) : (
              appointments.map((appt) => {
                const patientName = appt.patient
                  ? `${appt.patient.first_name || ''} ${appt.patient.last_name || ''}`.trim() || appt.patient.email || 'Patient'
                  : appt.patient_id
                    ? `Patient #${appt.patient_id}`
                    : '-';

                return (
                  <tr key={appt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{appt.appointment_date}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{(appt.appointment_time || '').slice(0, 5)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{patientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{appt.type === 'telemedicine' ? 'Telemedicine' : 'In Person'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          appt.status === 'scheduled'
                            ? 'bg-teal-100 text-teal-800'
                            : appt.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => onView(appt)}
                          className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onOpenEhr(appt.patient_id)}
                          className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                        >
                          EHR
                        </button>
                        <button
                          onClick={() => onStartConsultation(appt)}
                          className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                        >
                          Consult
                        </button>
                        {appt.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(appt, 'completed')}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => onUpdateStatus(appt, 'cancelled')}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
