import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { CreateDiagnosisPayload, Diagnosis, UpdateDiagnosisPayload } from '../../types/doctor';

export interface DiagnosisFormProps {
  open: boolean;
  saving: boolean;
  diagnosis?: Diagnosis | null;
  initialPatientId?: number | null;
  initialAppointmentId?: number | null;
  onClose: () => void;
  onCreate: (payload: CreateDiagnosisPayload) => Promise<void> | void;
  onUpdate: (id: number, payload: UpdateDiagnosisPayload) => Promise<void> | void;
}

export const DiagnosisForm: React.FC<DiagnosisFormProps> = ({
  open,
  saving,
  diagnosis,
  initialPatientId,
  initialAppointmentId,
  onClose,
  onCreate,
  onUpdate,
}) => {
  const [form, setForm] = useState({
    patient_id: '',
    appointment_id: '',
    icd10_code: '',
    icd10_description: '',
    diagnosis_name: '',
    description: '',
    status: 'active' as 'active' | 'resolved' | 'chronic',
    diagnosis_date: '',
    resolved_date: '',
    notes: '',
  });

  useEffect(() => {
    if (!open) return;

    if (diagnosis) {
      setForm({
        patient_id: String(diagnosis.patient_id ?? ''),
        appointment_id: diagnosis.appointment_id ? String(diagnosis.appointment_id) : '',
        icd10_code: diagnosis.icd10_code ?? '',
        icd10_description: diagnosis.icd10_description ?? '',
        diagnosis_name: diagnosis.diagnosis_name ?? '',
        description: diagnosis.description ?? '',
        status: diagnosis.status ?? 'active',
        diagnosis_date: diagnosis.diagnosis_date ?? new Date().toISOString().slice(0, 10),
        resolved_date: diagnosis.resolved_date ?? '',
        notes: diagnosis.notes ?? '',
      });
      return;
    }

    setForm({
      patient_id: initialPatientId ? String(initialPatientId) : '',
      appointment_id: initialAppointmentId ? String(initialAppointmentId) : '',
      icd10_code: '',
      icd10_description: '',
      diagnosis_name: '',
      description: '',
      status: 'active',
      diagnosis_date: new Date().toISOString().slice(0, 10),
      resolved_date: '',
      notes: '',
    });
  }, [open, diagnosis, initialPatientId, initialAppointmentId]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const patientId = Number(form.patient_id);
    if (!Number.isFinite(patientId) || patientId <= 0) {
      return;
    }

    const appointmentIdRaw = form.appointment_id.trim() === '' ? null : Number(form.appointment_id);

    if (diagnosis) {
      const payload: UpdateDiagnosisPayload = {
        icd10_code: form.icd10_code.trim() === '' ? null : form.icd10_code.trim(),
        icd10_description: form.icd10_description.trim() === '' ? null : form.icd10_description.trim(),
        diagnosis_name: form.diagnosis_name.trim() === '' ? undefined : form.diagnosis_name.trim(),
        description: form.description.trim() === '' ? null : form.description.trim(),
        status: form.status,
        resolved_date: form.resolved_date.trim() === '' ? null : form.resolved_date.trim(),
        notes: form.notes.trim() === '' ? null : form.notes.trim(),
      };
      await onUpdate(diagnosis.id, payload);
      return;
    }

    const payload: CreateDiagnosisPayload = {
      patient_id: patientId,
      appointment_id: Number.isFinite(appointmentIdRaw as any) ? (appointmentIdRaw as number) : null,
      icd10_code: form.icd10_code.trim() === '' ? null : form.icd10_code.trim(),
      icd10_description: form.icd10_description.trim() === '' ? null : form.icd10_description.trim(),
      diagnosis_name: form.diagnosis_name.trim(),
      description: form.description.trim() === '' ? null : form.description.trim(),
      status: form.status,
      diagnosis_date: form.diagnosis_date,
      notes: form.notes.trim() === '' ? null : form.notes.trim(),
    };

    await onCreate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{diagnosis ? 'Update Diagnosis' : 'Add Diagnosis'}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-60"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID *</label>
              <input
                type="number"
                required
                value={form.patient_id}
                onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))}
                disabled={!!diagnosis}
                className={`w-full px-3 py-2 border rounded-lg ${diagnosis ? 'bg-gray-50' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment ID (optional)</label>
              <input
                type="number"
                value={form.appointment_id}
                onChange={(e) => setForm((p) => ({ ...p, appointment_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ICD-10 Code</label>
              <input
                type="text"
                value={form.icd10_code}
                onChange={(e) => setForm((p) => ({ ...p, icd10_code: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Date *</label>
              <input
                type="date"
                required
                value={form.diagnosis_date}
                onChange={(e) => setForm((p) => ({ ...p, diagnosis_date: e.target.value }))}
                disabled={!!diagnosis}
                className={`w-full px-3 py-2 border rounded-lg ${diagnosis ? 'bg-gray-50' : ''}`}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Name *</label>
              <input
                type="text"
                required
                value={form.diagnosis_name}
                onChange={(e) => setForm((p) => ({ ...p, diagnosis_name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ICD-10 Description</label>
              <input
                type="text"
                value={form.icd10_description}
                onChange={(e) => setForm((p) => ({ ...p, icd10_description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="active">active</option>
                <option value="resolved">resolved</option>
                <option value="chronic">chronic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolved Date</label>
              <input
                type="date"
                value={form.resolved_date}
                onChange={(e) => setForm((p) => ({ ...p, resolved_date: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
          >
            {saving ? 'Saving...' : diagnosis ? 'Update Diagnosis' : 'Save Diagnosis'}
          </button>
        </form>
      </div>
    </div>
  );
};
