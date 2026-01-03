import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Clinic {
  id: number;
  name: string;
  location?: string;
}

interface Doctor {
  id: number;
  name: string;
  email?: string;
}

interface Slot {
  time: string;
  available_count: number;
}

interface SlotsResponse {
  date: string;
  clinic_id: number;
  slots: Slot[];
}

interface ClinicAppointmentFormProps {
  onSuccess?: (data: any) => void;
}

export default function ClinicAppointmentForm({ onSuccess }: ClinicAppointmentFormProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState<Array<{time: string; available_count: number}>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const fetchClinics = async () => {
      setLoadingClinics(true);
      try {
        const res = await axios.get<{ data: Clinic[] }>('/api/clinics');
        setClinics(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingClinics(false);
      }
    };

    fetchClinics();
  }, []);

  useEffect(() => {
    if (!selectedClinic) {
      setDoctors([]);
      setSelectedDoctor(null);
      return;
    }

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await axios.get<{ data: Doctor[] }>(`/api/clinics/${selectedClinic}/doctors`);
        setDoctors(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [selectedClinic]);

  // Fetch slots whenever clinic AND date are selected (optionally filtered by doctor)
  useEffect(() => {
    if (!selectedClinic || !date) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const params: Record<string, string> = { date };
        if (selectedDoctor) {
          params['doctor_id'] = String(selectedDoctor);
        }

        const res = await axios.get<SlotsResponse>(`/api/clinics/${selectedClinic}/slots`, { params });
        setSlots(res.data.slots || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedClinic, date, selectedDoctor]);

  function onClinicChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedClinic(id);
    setDate('');
    setTime('');
    setSlots([]);
    setStep( id ? 2 : 1 );
  }

  function onDoctorChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedDoctor(id);
    setTime('');
    // Re-fetch slots effect depends on selectedDoctor
    setStep( id ? 3 : 2 );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      clinic_id: selectedClinic,
      doctor_id: selectedDoctor,
      appointment_date: date,
      appointment_time: time,
    };

    axios
      .post('/api/patient/appointments', payload)
      .then((res) => {
        console.log('Appointment created', res.data);
        // Notify parent if provided
        if (onSuccess) onSuccess(res.data);
        // Reset local form
        setSelectedClinic(null);
        setSelectedDoctor(null);
        setDate('');
        setTime('');
        setSlots([]);
        setStep(1);
      })
      .catch((err) => {
        console.error(err.response?.data || err);
      });
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <div className={`text-sm ${step === 1 ? 'font-semibold' : ''}`}>Step 1: Clinic</div>
        <div className={`text-sm ${step === 2 ? 'font-semibold' : ''}`}>Step 2: Doctor</div>
        <div className={`text-sm ${step === 3 ? 'font-semibold' : ''}`}>Step 3: Time</div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Clinic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clinic</label>
          <select
            value={selectedClinic ?? ''}
            onChange={onClinicChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select a clinic</option>
            {loadingClinics ? (
              <option disabled>Loading clinics...</option>
            ) : (
              clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.location ? `— ${c.location}` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Doctor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
          <select
            value={selectedDoctor ?? ''}
            onChange={onDoctorChange}
            disabled={!selectedClinic || loadingDoctors}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          >
            <option value="">Select a doctor</option>
            {loadingDoctors ? (
              <option disabled>Loading doctors...</option>
            ) : (
              doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.email ? `(${d.email})` : ''}
                </option>
              ))
            )}
          </select>
        </div>



        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); if (e.target.value) setStep(3); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>

        {/* Time slots grid - fetched from server */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Available time slots</label>

          {loadingSlots ? (
            <div className="text-sm text-gray-500">Loading slots…</div>
          ) : slots.length === 0 ? (
            <div className="text-sm text-gray-500">No available slots for the chosen date.</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => {
                const disabled = s.available_count <= 0;
                const isSelected = time === s.time;
                return (
                  <button
                    key={s.time}
                    type="button"
                    onClick={() => { setTime(s.time); setStep(3); }}
                    disabled={disabled}
                    className={`py-2 px-3 rounded-md border ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white'} text-sm`}
                  >
                    <div className="font-medium">{s.time}</div>
                    <div className="text-xs text-gray-500">{s.available_count} available</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50" disabled={!selectedClinic || !date || !time}>
            Book Appointment
          </button>
        </div>
      </form>
    </div>
  );
}
