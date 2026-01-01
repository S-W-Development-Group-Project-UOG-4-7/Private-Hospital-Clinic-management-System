import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { CreatePrescriptionPayload } from '../../types/doctor';

export interface InventoryOption {
  id: number;
  name: string;
  generic_name?: string | null;
  brand_name?: string | null;
}

interface ItemRow {
  inventory_item_id: string;
  quantity: string;
  dosage: string;
  frequency: string;
  duration_days: string;
  instructions: string;
}

export interface PrescriptionFormProps {
  open: boolean;
  saving: boolean;
  inventory: InventoryOption[];
  initialPatientId?: number | null;
  initialAppointmentId?: number | null;
  onClose: () => void;
  onSubmit: (payload: CreatePrescriptionPayload) => Promise<void> | void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  open,
  saving,
  inventory,
  initialPatientId,
  initialAppointmentId,
  onClose,
  onSubmit,
}) => {
  const [patientId, setPatientId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [instructions, setInstructions] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { inventory_item_id: '', quantity: '1', dosage: '', frequency: '', duration_days: '', instructions: '' },
  ]);

  useEffect(() => {
    if (!open) return;
    setPatientId(initialPatientId ? String(initialPatientId) : '');
    setAppointmentId(initialAppointmentId ? String(initialAppointmentId) : '');
    setPrescriptionDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setInstructions('');
    setItems([{ inventory_item_id: '', quantity: '1', dosage: '', frequency: '', duration_days: '', instructions: '' }]);
  }, [open, initialPatientId, initialAppointmentId]);

  const inventoryMap = useMemo(() => {
    const map = new Map<number, InventoryOption>();
    inventory.forEach((i) => map.set(i.id, i));
    return map;
  }, [inventory]);

  if (!open) return null;

  const updateItem = (index: number, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { inventory_item_id: '', quantity: '1', dosage: '', frequency: '', duration_days: '', instructions: '' }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pid = Number(patientId);
    if (!Number.isFinite(pid) || pid <= 0) {
      return;
    }

    const apptIdRaw = appointmentId.trim() === '' ? null : Number(appointmentId);

    const normalizedItems = items
      .map((row) => {
        const inventoryId = Number(row.inventory_item_id);
        const quantity = Number(row.quantity);
        const durationDays = row.duration_days.trim() === '' ? null : Number(row.duration_days);

        if (!Number.isFinite(inventoryId) || inventoryId <= 0) return null;
        if (!Number.isFinite(quantity) || quantity <= 0) return null;
        if (durationDays !== null && (!Number.isFinite(durationDays) || durationDays <= 0)) return null;

        return {
          inventory_item_id: inventoryId,
          quantity,
          dosage: row.dosage.trim() === '' ? null : row.dosage.trim(),
          frequency: row.frequency.trim() === '' ? null : row.frequency.trim(),
          duration_days: durationDays,
          instructions: row.instructions.trim() === '' ? null : row.instructions.trim(),
        };
      })
      .filter(Boolean) as CreatePrescriptionPayload['items'];

    if (normalizedItems.length === 0) return;

    const payload: CreatePrescriptionPayload = {
      patient_id: pid,
      appointment_id: Number.isFinite(apptIdRaw as any) ? (apptIdRaw as number) : null,
      prescription_date: prescriptionDate,
      notes: notes.trim() === '' ? null : notes.trim(),
      instructions: instructions.trim() === '' ? null : instructions.trim(),
      items: normalizedItems,
    };

    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Create Prescription</h2>
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

        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID *</label>
              <input
                type="number"
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment ID (optional)</label>
              <input
                type="number"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prescription Date *</label>
              <input
                type="date"
                required
                value={prescriptionDate}
                onChange={(e) => setPrescriptionDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">General Instructions</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
              >
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((row, index) => {
                const selectedId = Number(row.inventory_item_id);
                const selected = Number.isFinite(selectedId) ? inventoryMap.get(selectedId) : undefined;

                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medicine *</label>
                        <select
                          value={row.inventory_item_id}
                          onChange={(e) => updateItem(index, { inventory_item_id: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          required
                        >
                          <option value="">Select medicine</option>
                          {inventory.map((item) => (
                            <option key={item.id} value={String(item.id)}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        {selected ? (
                          <div className="text-xs text-gray-500 mt-1">
                            {(selected.generic_name || '').trim() !== '' ? selected.generic_name : selected.brand_name}
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qty *</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={row.quantity}
                          onChange={(e) => updateItem(index, { quantity: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                        <input
                          type="text"
                          value={row.dosage}
                          onChange={(e) => updateItem(index, { dosage: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="e.g. 500mg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                        <input
                          type="text"
                          value={row.frequency}
                          onChange={(e) => updateItem(index, { frequency: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="e.g. 2x/day"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                        <input
                          type="number"
                          min={1}
                          value={row.duration_days}
                          onChange={(e) => updateItem(index, { duration_days: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="e.g. 7"
                        />
                      </div>

                      <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Instructions</label>
                        <input
                          type="text"
                          value={row.instructions}
                          onChange={(e) => updateItem(index, { instructions: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>

                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
          >
            {saving ? 'Creating...' : 'Create Prescription'}
          </button>
        </form>
      </div>
    </div>
  );
};
