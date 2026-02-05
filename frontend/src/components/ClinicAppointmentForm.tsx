import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Clock, Users, Video, Building2 } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Slot {
  time: string;
  available_count: number;
}

interface SlotsResponse {
  date: string;
  clinic_id: number;
  slots: Slot[];
}

interface OpdClinic {
  id: number;
  name: string;
}

interface ClinicAppointmentFormProps {
  onSuccess?: (data: any) => void;
}

export default function ClinicAppointmentForm({ onSuccess }: ClinicAppointmentFormProps) {
  const [opdClinic, setOpdClinic] = useState<OpdClinic | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [appointmentType, setAppointmentType] = useState<'in_person' | 'telemedicine'>('in_person');
  const [slots, setSlots] = useState<Array<{time: string; available_count: number}>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingClinic, setLoadingClinic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch OPD clinic on mount
  useEffect(() => {
    const fetchOpdClinic = async () => {
      setLoadingClinic(true);
      try {
        const res = await axios.get<{ data: OpdClinic[] }>(`${API_BASE_URL}/api/clinics`);
        const clinics = res.data.data || [];
        // Find OPD clinic (case-insensitive)
        const opd = clinics.find((c: OpdClinic) => c.name.toLowerCase() === 'opd');
        if (opd) {
          setOpdClinic(opd);
        } else if (clinics.length > 0) {
          // Fallback to first clinic if OPD not found
          setOpdClinic(clinics[0]);
        }
      } catch (err) {
        console.error('Failed to fetch clinics:', err);
        setError('Failed to load clinic information');
      } finally {
        setLoadingClinic(false);
      }
    };

    fetchOpdClinic();
  }, []);

  // Fetch slots when date is selected
  useEffect(() => {
    if (!opdClinic || !date) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      try {
        const res = await axios.get<SlotsResponse>(`${API_BASE_URL}/api/clinics/${opdClinic.id}/slots`, {
          params: { date }
        });
        setSlots(res.data.slots || []);
      } catch (err) {
        console.error('Failed to fetch slots:', err);
        setError('Failed to load available time slots');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [opdClinic, date]);

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!opdClinic || !date || !time) return;

    setSubmitting(true);
    setError(null);

    const token = localStorage.getItem('authToken');
    const payload = {
      clinic_id: opdClinic.id,
      doctor_id: null, // System will assign available doctor
      appointment_date: date,
      appointment_time: time,
      type: appointmentType,
      reason: reason.trim() || null,
    };

    axios
      .post(`${API_BASE_URL}/api/patient/appointments`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      })
      .then((res: any) => {
        setSuccess(true);
        setSubmitting(false);
        // Notify parent if provided
        if (onSuccess) onSuccess(res.data);
        // Reset form after brief delay
        setTimeout(() => {
          setDate('');
          setTime('');
          setReason('');
          setSlots([]);
          setSuccess(false);
        }, 2000);
      })
      .catch((err: any) => {
        const message = err.response?.data?.message || 'Failed to book appointment. Please try again.';
        setError(message);
        setSubmitting(false);
      });
  }

  if (loadingClinic) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Appointment Booked!</h3>
          <p className="text-gray-600">Your appointment has been scheduled successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Book an Appointment</h2>
        <p className="text-gray-600 text-sm">
          Select a date and time to book your appointment at our OPD. An available doctor will be assigned to you.
        </p>
      </div>

      {/* Clinic Info */}
      <div className="bg-teal-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="font-semibold text-teal-800">{opdClinic?.name || 'OPD'}</p>
            <p className="text-sm text-teal-600">General Outpatient Department</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        {/* Appointment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Select Consultation Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Physical Consultation Card */}
            <button
              type="button"
              onClick={() => setAppointmentType('in_person')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                appointmentType === 'in_person'
                  ? 'border-teal-500 bg-teal-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  appointmentType === 'in_person' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-semibold ${appointmentType === 'in_person' ? 'text-teal-700' : 'text-gray-800'}`}>
                    Physical Visit
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 ml-13">
                Visit the clinic in person for face-to-face consultation with a doctor
              </p>
            </button>

            {/* Telemedicine Card */}
            <button
              type="button"
              onClick={() => setAppointmentType('telemedicine')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                appointmentType === 'telemedicine'
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  appointmentType === 'telemedicine' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-semibold ${appointmentType === 'telemedicine' ? 'text-purple-700' : 'text-gray-800'}`}>
                    Online Consultation
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 ml-13">
                Video call consultation from the comfort of your home
              </p>
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Select Date
          </label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => {
              setDate(e.target.value);
              setTime(''); // Reset time when date changes
            }}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 px-3 py-2 border"
          />
        </div>

        {/* Time Slots */}
        {date && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Available Time Slots
            </label>

            {loadingSlots ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading available slots...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-700 text-sm">No available slots for the selected date.</p>
                <p className="text-yellow-600 text-xs mt-1">Please try a different date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((s) => {
                  const disabled = s.available_count <= 0;
                  const isSelected = time === s.time;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => setTime(s.time)}
                      disabled={disabled}
                      className={`py-2 px-2 rounded-lg border transition-all ${
                        disabled
                          ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200'
                          : isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                            : 'bg-white border-gray-300 hover:border-teal-400 hover:bg-teal-50'
                      } text-sm`}
                    >
                      <div className="font-medium">{s.time}</div>
                      <div className={`text-xs ${isSelected ? 'text-teal-100' : 'text-gray-500'}`}>
                        {s.available_count} {s.available_count === 1 ? 'slot' : 'slots'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reason (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Visit (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Describe your symptoms or reason for the appointment..."
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 px-3 py-2 border"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!date || !time || submitting}
            className={`w-full py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition duration-300 flex items-center justify-center gap-2 ${
              appointmentType === 'telemedicine' 
                ? 'bg-purple-500 hover:bg-purple-600' 
                : 'bg-teal-500 hover:bg-teal-600'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Booking...
              </>
            ) : (
              <>
                {appointmentType === 'telemedicine' ? <Video className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                {appointmentType === 'telemedicine' ? 'Book Online Consultation' : 'Book Physical Appointment'}
              </>
            )}
          </button>
        </div>

        {/* Info Note */}
        <p className="text-xs text-gray-500 text-center">
          {appointmentType === 'telemedicine' 
            ? 'You will receive a video call link before your appointment time.'
            : 'Please arrive 15 minutes before your scheduled time. A doctor will be assigned based on availability.'}
        </p>
      </form>
    </div>
  );
}
