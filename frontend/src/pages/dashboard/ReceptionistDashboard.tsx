import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bell,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { receptionistApi } from '../../api/receptionist';
import type {
  DoctorSchedule,
  Invoice,
  PaginatedResponse,
  QueueEntry,
  ReceptionistAppointment,
  ReceptionistDashboardStats,
  ReceptionistDoctor,
  ReceptionistPatient,
  Referral,
} from '../../types/receptionist';

type SectionKey =
  | 'overview'
  | 'patients'
  | 'appointments'
  | 'queue'
  | 'billing'
  | 'schedules'
  | 'referrals'
  | 'reports';

const safeParseJson = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const ReceptionistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const authUser = useMemo(() => safeParseJson(localStorage.getItem('authUser')), []);

  const [active, setActive] = useState<SectionKey>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<ReceptionistDashboardStats>({
    todays_appointments: 0,
    checked_in_patients: 0,
    pending_payments: 0,
    doctors_on_duty: 0,
  });

  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctors, setDoctors] = useState<ReceptionistDoctor[]>([]);

  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsPage, setPatientsPage] = useState(1);
  const [patientsSearch, setPatientsSearch] = useState('');
  const [patientsQuery, setPatientsQuery] = useState('');
  const [patientsResp, setPatientsResp] = useState<PaginatedResponse<ReceptionistPatient> | null>(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [patientSaving, setPatientSaving] = useState(false);
  const [editingPatient, setEditingPatient] = useState<ReceptionistPatient | null>(null);
  const [patientForm, setPatientForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    age: '',
  });

  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [appointmentsDate, setAppointmentsDate] = useState('');
  const [appointmentsQueryDate, setAppointmentsQueryDate] = useState('');
  const [appointmentsResp, setAppointmentsResp] = useState<PaginatedResponse<ReceptionistAppointment> | null>(null);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<ReceptionistAppointment | null>(null);
  const [appointmentPatientsLoading, setAppointmentPatientsLoading] = useState(false);
  const [appointmentPatients, setAppointmentPatients] = useState<ReceptionistPatient[]>([]);
  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    type: 'in_person' as 'in_person' | 'telemedicine',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
  });

  const [queueLoading, setQueueLoading] = useState(false);
  const [queueDate, setQueueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [queueDoctorFilter, setQueueDoctorFilter] = useState('');
  const [queueItems, setQueueItems] = useState<QueueEntry[]>([]);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_id: '',
  });

  const [billingLoaded, setBillingLoaded] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [invoicesResp, setInvoicesResp] = useState<PaginatedResponse<Invoice> | null>(null);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    patient_id: '',
    amount: '',
    description: '',
    due_date: '',
  });

  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleResp, setScheduleResp] = useState<PaginatedResponse<DoctorSchedule> | null>(null);
  const [schedulePage, setSchedulePage] = useState(1);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    doctor_id: '',
    schedule_date: '',
    start_time: '',
    end_time: '',
    notes: '',
  });

  const [referralsLoaded, setReferralsLoaded] = useState(false);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralsResp, setReferralsResp] = useState<PaginatedResponse<Referral> | null>(null);
  const [referralsPage, setReferralsPage] = useState(1);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [referralSaving, setReferralSaving] = useState(false);
  const [referralForm, setReferralForm] = useState({
    patient_id: '',
    type: 'internal' as 'internal' | 'external',
    referred_by_doctor_id: '',
    referred_to_doctor_id: '',
    external_provider: '',
    reason: '',
  });

  const receptionistName = authUser?.name || 'Receptionist';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  const loadStats = useCallback(async () => {
    setError(null);
    setStatsLoading(true);
    try {
      const data = await receptionistApi.dashboard.stats();
      setStats(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const resp = await receptionistApi.doctors.list();
      setDoctors(Array.isArray(resp.data) ? resp.data : []);
    } catch {
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  const loadPatients = useCallback(async (page = 1) => {
    setError(null);
    setPatientsLoading(true);
    try {
      const resp = await receptionistApi.patients.list({ search: patientsQuery || undefined, per_page: 10, page });
      setPatientsResp(resp);
      setPatientsPage(resp.current_page || page);
    } catch (e: any) {
      setError(e?.message || 'Failed to load patients');
    } finally {
      setPatientsLoading(false);
    }
  }, [patientsQuery]);

  const loadAppointments = useCallback(async (page = 1) => {
    setError(null);
    setAppointmentsLoading(true);
    try {
      const resp = await receptionistApi.appointments.list({ date: appointmentsQueryDate || undefined, per_page: 10, page });
      setAppointmentsResp(resp);
      setAppointmentsPage(resp.current_page || page);
    } catch (e: any) {
      setError(e?.message || 'Failed to load appointments');
    } finally {
      setAppointmentsLoading(false);
    }
  }, [appointmentsQueryDate]);

  const loadAppointmentPatients = useCallback(async () => {
    setAppointmentPatientsLoading(true);
    try {
      const resp = await receptionistApi.patients.list({ per_page: 50, page: 1, is_active: true });
      setAppointmentPatients(Array.isArray(resp.data) ? resp.data : []);
    } catch {
      setAppointmentPatients([]);
    } finally {
      setAppointmentPatientsLoading(false);
    }
  }, []);

  const loadQueue = useCallback(async () => {
    setError(null);
    setQueueLoading(true);
    try {
      const resp = await receptionistApi.queue.list({
        date: queueDate,
        doctor_id: queueDoctorFilter ? Number(queueDoctorFilter) : undefined,
      });
      setQueueItems(Array.isArray(resp.data) ? resp.data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load queue');
    } finally {
      setQueueLoading(false);
    }
  }, [queueDate, queueDoctorFilter]);

  const loadInvoices = useCallback(async (page = 1) => {
    setError(null);
    setBillingLoading(true);
    try {
      const resp = await receptionistApi.invoices.list({ per_page: 10, page });
      setInvoicesResp(resp);
      setInvoicePage(resp.current_page || page);
      setBillingLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load invoices');
    } finally {
      setBillingLoading(false);
    }
  }, []);

  const loadSchedules = useCallback(async (page = 1) => {
    setError(null);
    setScheduleLoading(true);
    try {
      const resp = await receptionistApi.schedules.list({ per_page: 10, page });
      setScheduleResp(resp);
      setSchedulePage(resp.current_page || page);
      setScheduleLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load doctor schedules');
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  const loadReferrals = useCallback(async (page = 1) => {
    setError(null);
    setReferralsLoading(true);
    try {
      const resp = await receptionistApi.referrals.list({ per_page: 10, page });
      setReferralsResp(resp);
      setReferralsPage(resp.current_page || page);
      setReferralsLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load referrals');
    } finally {
      setReferralsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadDoctors();
  }, [loadDoctors, loadStats]);

  useEffect(() => {
    if (active === 'patients') {
      loadPatients(1);
    }
  }, [active, loadPatients, patientsQuery]);

  useEffect(() => {
    if (active === 'appointments') {
      loadAppointments(1);
    }
  }, [active, appointmentsQueryDate, loadAppointments]);

  useEffect(() => {
    if (active === 'queue') {
      loadQueue();
    }
    if (active === 'billing' && !billingLoaded && !billingLoading) {
      loadInvoices(1);
    }
    if (active === 'schedules' && !scheduleLoaded && !scheduleLoading) {
      loadSchedules(1);
    }
    if (active === 'referrals' && !referralsLoaded && !referralsLoading) {
      loadReferrals(1);
    }
  }, [
    active,
    billingLoaded,
    billingLoading,
    loadInvoices,
    loadQueue,
    loadReferrals,
    loadSchedules,
    referralsLoaded,
    referralsLoading,
    scheduleLoaded,
    scheduleLoading,
  ]);

  const openCreatePatient = () => {
    setEditingPatient(null);
    setPatientForm({
      first_name: '',
      last_name: '',
      phone: '',
      age: '',
    });
    setPatientModalOpen(true);
  };

  const openEditPatient = (patient: ReceptionistPatient) => {
    setEditingPatient(patient);
    setPatientForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      phone: patient.patient_profile?.phone || '',
      age: patient.patient_profile?.age?.toString() || '',
    });
    setPatientModalOpen(true);
  };

  const closePatientModal = () => {
    if (patientSaving) return;
    setPatientModalOpen(false);
    setEditingPatient(null);
  };

  const submitPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPatientSaving(true);
    try {
      if (editingPatient) {
        await receptionistApi.patients.update(editingPatient.id, {
          first_name: patientForm.first_name,
          last_name: patientForm.last_name,
          phone: patientForm.phone || null,
          age: patientForm.age ? parseInt(patientForm.age) : null,
        });
        toast.success('Patient updated');
      } else {
        await receptionistApi.patients.create({
          first_name: patientForm.first_name,
          last_name: patientForm.last_name,
          phone: patientForm.phone,
          age: parseInt(patientForm.age),
        });
        toast.success('Patient registered');
      }
      closePatientModal();
      await loadPatients(1);
    } catch (e: any) {
      setError(e?.message || 'Failed to save patient');
    } finally {
      setPatientSaving(false);
    }
  };

  const deactivatePatient = async (patient: ReceptionistPatient) => {
    if (!window.confirm('Deactivate this patient?')) return;
    setError(null);
    try {
      await receptionistApi.patients.deactivate(patient.id);
      toast.success('Patient deactivated');
      await loadPatients(patientsPage);
    } catch (e: any) {
      setError(e?.message || 'Failed to deactivate patient');
    }
  };

  const openCreateAppointment = () => {
    setEditingAppointment(null);
    setAppointmentForm({
      patient_id: '',
      appointment_date: '',
      appointment_time: '',
      type: 'in_person',
      status: 'scheduled',
    });
    loadAppointmentPatients();
    setAppointmentModalOpen(true);
  };

  const openEditAppointment = (appt: ReceptionistAppointment) => {
    setEditingAppointment(appt);
    setAppointmentForm({
      patient_id: String(appt.patient_id),
      appointment_date: appt.appointment_date || '',
      appointment_time: (appt.appointment_time || '').slice(0, 5),
      type: appt.type || 'in_person',
      status: appt.status || 'scheduled',
    });
    loadAppointmentPatients();
    setAppointmentModalOpen(true);
  };

  const closeAppointmentModal = () => {
    if (appointmentSaving) return;
    setAppointmentModalOpen(false);
    setEditingAppointment(null);
  };

  const submitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAppointmentSaving(true);
    try {
      const patientId = appointmentForm.patient_id.trim();
      if (patientId === '') {
        setError('Patient id is required');
        return;
      }

      if (editingAppointment) {
        await receptionistApi.appointments.update(editingAppointment.id, {
          patient_id: patientId,
          appointment_date: appointmentForm.appointment_date,
          appointment_time: appointmentForm.appointment_time,
          type: appointmentForm.type,
          status: appointmentForm.status,
        });
        toast.success('Appointment updated');
      } else {
        const created = await receptionistApi.appointments.create({
          patient_id: patientId,
          appointment_date: appointmentForm.appointment_date,
          appointment_time: appointmentForm.appointment_time,
          type: appointmentForm.type,
          status: appointmentForm.status,
        });
        const apptNo = created?.appointment_number;
        toast.success(apptNo ? `Appointment created (No: ${apptNo})` : 'Appointment created');
      }

      closeAppointmentModal();
      await loadAppointments(1);
    } catch (e: any) {
      setError(e?.message || 'Failed to save appointment');
    } finally {
      setAppointmentSaving(false);
    }
  };

  const deleteAppointment = async (appt: ReceptionistAppointment) => {
    if (!window.confirm('Delete this appointment?')) return;
    setError(null);
    try {
      await receptionistApi.appointments.remove(appt.id);
      toast.success('Appointment deleted');
      await loadAppointments(appointmentsPage);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete appointment');
    }
  };

  const openCheckIn = () => {
    setCheckInForm({
      patient_id: '',
      doctor_id: '',
      appointment_id: '',
    });
    setCheckInModalOpen(true);
  };

  const closeCheckIn = () => {
    if (checkInSaving) return;
    setCheckInModalOpen(false);
  };

  const submitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCheckInSaving(true);
    try {
      const patientId = checkInForm.patient_id.trim();
      const doctorId = Number(checkInForm.doctor_id);
      const appointmentId = checkInForm.appointment_id.trim() === '' ? null : Number(checkInForm.appointment_id);

      if (patientId === '' || !Number.isFinite(doctorId)) {
        setError('Invalid patient or doctor id');
        return;
      }

      await receptionistApi.queue.checkIn({
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_id: Number.isFinite(appointmentId as any) ? (appointmentId as number) : null,
        queue_date: queueDate,
      });

      toast.success('Patient checked in');
      closeCheckIn();
      await loadQueue();
      await loadStats();
    } catch (e: any) {
      setError(e?.message || 'Failed to check in');
    } finally {
      setCheckInSaving(false);
    }
  };

  const setQueueStatus = async (entry: QueueEntry, status: string) => {
    setError(null);
    try {
      await receptionistApi.queue.updateStatus(entry.id, status);
      toast.success('Queue updated');
      await loadQueue();
      await loadStats();
    } catch (e: any) {
      setError(e?.message || 'Failed to update queue status');
    }
  };

  const openCreateInvoice = () => {
    setInvoiceForm({ patient_id: '', amount: '', description: '', due_date: '' });
    setInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    if (invoiceSaving) return;
    setInvoiceModalOpen(false);
  };

  const submitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInvoiceSaving(true);
    try {
      const patientId = Number(invoiceForm.patient_id);
      const amount = Number(invoiceForm.amount);
      if (!Number.isFinite(patientId) || !Number.isFinite(amount) || amount <= 0) {
        setError('Invalid patient id or amount');
        return;
      }
      await receptionistApi.invoices.create({
        patient_id: patientId,
        amount,
        description: invoiceForm.description.trim() === '' ? null : invoiceForm.description.trim(),
        due_date: invoiceForm.due_date.trim() === '' ? null : invoiceForm.due_date.trim(),
      });
      toast.success('Invoice created');
      closeInvoiceModal();
      await loadInvoices(1);
      await loadStats();
    } catch (e: any) {
      setError(e?.message || 'Failed to create invoice');
    } finally {
      setInvoiceSaving(false);
    }
  };

  const recordPayment = async (invoice: Invoice) => {
    const amountStr = window.prompt('Enter payment amount', invoice.amount);
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Invalid payment amount');
      return;
    }
    setError(null);
    try {
      await receptionistApi.payments.create({ invoice_id: invoice.id, amount, method: 'cash' });
      toast.success('Payment recorded');
      await loadInvoices(invoicePage);
      await loadStats();
    } catch (e: any) {
      setError(e?.message || 'Failed to record payment');
    }
  };

  const openCreateSchedule = () => {
    setScheduleForm({ doctor_id: '', schedule_date: '', start_time: '', end_time: '', notes: '' });
    setScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    if (scheduleSaving) return;
    setScheduleModalOpen(false);
  };

  const submitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setScheduleSaving(true);
    try {
      const doctorId = Number(scheduleForm.doctor_id);
      if (!Number.isFinite(doctorId)) {
        setError('Invalid doctor id');
        return;
      }
      await receptionistApi.schedules.create({
        doctor_id: doctorId,
        schedule_date: scheduleForm.schedule_date,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        notes: scheduleForm.notes.trim() === '' ? null : scheduleForm.notes.trim(),
      });
      toast.success('Schedule created');
      closeScheduleModal();
      await loadSchedules(1);
      await loadStats();
    } catch (e: any) {
      setError(e?.message || 'Failed to create schedule');
    } finally {
      setScheduleSaving(false);
    }
  };

  const openCreateReferral = () => {
    setReferralForm({
      patient_id: '',
      type: 'internal',
      referred_by_doctor_id: '',
      referred_to_doctor_id: '',
      external_provider: '',
      reason: '',
    });
    setReferralModalOpen(true);
  };

  const closeReferralModal = () => {
    if (referralSaving) return;
    setReferralModalOpen(false);
  };

  const submitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReferralSaving(true);
    try {
      const patientId = Number(referralForm.patient_id);
      const referredBy = referralForm.referred_by_doctor_id.trim() === '' ? null : Number(referralForm.referred_by_doctor_id);
      const referredTo = referralForm.referred_to_doctor_id.trim() === '' ? null : Number(referralForm.referred_to_doctor_id);
      if (!Number.isFinite(patientId)) {
        setError('Invalid patient id');
        return;
      }
      await receptionistApi.referrals.create({
        patient_id: patientId,
        type: referralForm.type,
        referred_by_doctor_id: Number.isFinite(referredBy as any) ? (referredBy as number) : null,
        referred_to_doctor_id: Number.isFinite(referredTo as any) ? (referredTo as number) : null,
        external_provider: referralForm.external_provider.trim() === '' ? null : referralForm.external_provider.trim(),
        reason: referralForm.reason.trim() === '' ? null : referralForm.reason.trim(),
      });
      toast.success('Referral created');
      closeReferralModal();
      await loadReferrals(1);
    } catch (e: any) {
      setError(e?.message || 'Failed to create referral');
    } finally {
      setReferralSaving(false);
    }
  };

  const exportQueueCsv = () => {
    const rows = [
      ['queue_date', 'queue_number', 'status', 'patient_id', 'patient_name', 'doctor_id', 'doctor_name'],
      ...queueItems.map((q) => [
        q.queue_date,
        String(q.queue_number),
        q.status,
        String(q.patient_id),
        `${q.patient?.first_name || ''} ${q.patient?.last_name || ''}`.trim(),
        q.doctor_id ? String(q.doctor_id) : '',
        `${q.doctor?.first_name || ''} ${q.doctor?.last_name || ''}`.trim(),
      ]),
    ];

    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-queue-${queueDate}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const Sidebar = (
    <div className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-white">
      <div className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center">
            <UserCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Reception Desk</div>
            <div className="text-xs text-gray-500">Private Hospital & Clinic</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-1">
        <button
          onClick={() => setActive('overview')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'overview' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm font-medium">Overview</span>
        </button>
        <button
          onClick={() => setActive('patients')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'patients' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">Patients</span>
        </button>
        <button
          onClick={() => setActive('appointments')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'appointments' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-medium">Appointments</span>
        </button>
        <button
          onClick={() => setActive('queue')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'queue' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-sm font-medium">Queue</span>
        </button>
        <button
          onClick={() => setActive('billing')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'billing' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-sm font-medium">Billing</span>
        </button>
        <button
          onClick={() => setActive('schedules')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'schedules' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Schedules</span>
        </button>
        <button
          onClick={() => setActive('referrals')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'referrals' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-sm font-medium">Referrals</span>
        </button>
        <button
          onClick={() => setActive('reports')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'reports' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-sm font-medium">Reports</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen bg-gray-50 flex">
        {Sidebar}

        <div className="flex-1 min-w-0">
          <div className="md:hidden bg-white border-b">
            <div className="flex items-center justify-between px-4 h-16">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="text-sm font-semibold text-gray-900">Receptionist Dashboard</div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Logout"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>

          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
              <div className="absolute top-0 left-0 h-full w-80 bg-white shadow-xl">
                <div className="h-16 flex items-center justify-between px-4 border-b">
                  <div className="font-semibold text-gray-900">Menu</div>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-4 space-y-1">
                  <button
                    onClick={() => {
                      setActive('overview');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'overview' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-sm font-medium">Overview</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('patients');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'patients' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-medium">Patients</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('appointments');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'appointments' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">Appointments</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('queue');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'queue' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <ClipboardList className="w-5 h-5" />
                    <span className="text-sm font-medium">Queue</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('billing');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'billing' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-sm font-medium">Billing</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('schedules');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'schedules' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-medium">Schedules</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('referrals');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'referrals' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">Referrals</span>
                  </button>
                  <button
                    onClick={() => {
                      setActive('reports');
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'reports' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">Reports</span>
                  </button>

                  <div className="pt-4">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="relative bg-cover bg-center" style={{ backgroundImage: "url('/images/Hero.png')" }}>
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            <div className="relative z-10 px-4 md:px-8 py-12 md:py-16">
              <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">Welcome back, {receptionistName}</h1>
                <p className="text-lg md:text-xl text-gray-200 mb-6">Manage patients, appointments, and billing</p>
                <div className="hidden md:flex items-center gap-3">
                  <button
                    onClick={() => toast.success('No new notifications')}
                    className="relative p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition duration-300 backdrop-blur-sm"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 rounded-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-800 transition duration-300 font-bold"
                  >
                    Home
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-full bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition duration-300 font-bold"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="p-4 md:p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
            )}

            {active === 'overview' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                    <p className="text-gray-600 text-sm">Today at a glance</p>
                  </div>
                  <button
                    onClick={() => loadStats()}
                    className="bg-white border hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg transition"
                    disabled={statsLoading}
                  >
                    Refresh
                  </button>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Patient Registration */}
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Registration</h2>
                    <p className="text-gray-600 mb-4">Register new patients and update information</p>
                    <button
                      onClick={() => setActive('patients')}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full"
                    >
                      Register Patient
                    </button>
                  </div>

                  {/* Appointment Scheduling */}
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointment Scheduling</h2>
                    <p className="text-gray-600 mb-4">Schedule and manage patient appointments</p>
                    <button
                      onClick={() => setActive('appointments')}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full"
                    >
                      Schedule Appointment
                    </button>
                  </div>

                  {/* Check-in/Check-out */}
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Check-in</h2>
                    <p className="text-gray-600 mb-4">Manage patient arrivals and departures</p>
                    <button
                      onClick={() => setActive('queue')}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full"
                    >
                      Check-in Patient
                    </button>
                  </div>

                  {/* Billing */}
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Billing & Payments</h2>
                    <p className="text-gray-600 mb-4">Process payments and generate invoices</p>
                    <button
                      onClick={() => setActive('billing')}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full"
                    >
                      Manage Billing
                    </button>
                  </div>

                  {/* Phone Calls */}
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Doctor Schedules</h2>
                    <p className="text-gray-600 mb-4">Assign and update doctor availability</p>
                    <button
                      onClick={() => setActive('schedules')}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full"
                    >
                      Manage Schedules
                    </button>
                  </div>

                  {/* Reports */}
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Reports</h2>
                    <p className="text-gray-600 mb-4">Generate patient queue report</p>
                    <button
                      onClick={() => setActive('reports')}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition w-full"
                    >
                      Generate Report
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-2xl font-bold text-teal-500">{statsLoading ? '...' : stats.todays_appointments}</h3>
                    <p className="text-gray-600">Today's Appointments</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-2xl font-bold text-teal-500">{statsLoading ? '...' : stats.checked_in_patients}</h3>
                    <p className="text-gray-600">Checked-in Patients</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-2xl font-bold text-teal-500">{statsLoading ? '...' : stats.pending_payments}</h3>
                    <p className="text-gray-600">Pending Payments</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-2xl font-bold text-teal-500">{statsLoading ? '...' : stats.doctors_on_duty}</h3>
                    <p className="text-gray-600">Doctors On Duty</p>
                  </div>
                </div>
              </div>
            )}

            {active === 'patients' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
                    <p className="text-gray-600 text-sm">Register, update, and deactivate patient accounts</p>
                  </div>
                  <button
                    onClick={openCreatePatient}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-lg transition"
                  >
                    New Patient
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-4">
                  <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <input
                      value={patientsSearch}
                      onChange={(e) => setPatientsSearch(e.target.value)}
                      placeholder="Search patients by name or phone"
                      className="w-full md:max-w-md px-3 py-2 border rounded-lg"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const next = patientsSearch.trim();
                          setPatientsPage(1);
                          if (next === patientsQuery) {
                            loadPatients(1);
                          } else {
                            setPatientsQuery(next);
                          }
                        }}
                        className="bg-white border hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg transition"
                        disabled={patientsLoading}
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>

                {patientsLoading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(patientsResp?.data || []).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                                No patients found.
                              </td>
                            </tr>
                          ) : (
                            (patientsResp?.data || []).map((p) => (
                              <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                                  #{p.patient_profile?.patient_id || p.id.toString().padStart(3, '0')}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {`${p.first_name || ''} ${p.last_name || ''}`.trim() || `Patient #${p.id}`}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {p.patient_profile?.age ?? '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{p.patient_profile?.phone || '-'}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {p.is_active ? 'active' : 'inactive'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => openEditPatient(p)}
                                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-3 py-2 rounded-lg text-xs transition"
                                    >
                                      Edit
                                    </button>
                                    {p.is_active ? (
                                      <button
                                        onClick={() => deactivatePatient(p)}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-2 rounded-lg text-xs transition"
                                      >
                                        Deactivate
                                      </button>
                                    ) : (
                                      <span className="text-xs text-gray-500 px-3 py-2">-</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {patientsResp && patientsResp.last_page > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                        <div className="text-sm text-gray-600">
                          Page {patientsResp.current_page} of {patientsResp.last_page}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadPatients(Math.max(1, patientsResp.current_page - 1))}
                            disabled={patientsResp.current_page <= 1}
                            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => loadPatients(Math.min(patientsResp.last_page, patientsResp.current_page + 1))}
                            disabled={patientsResp.current_page >= patientsResp.last_page}
                            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {active === 'appointments' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
                    <p className="text-gray-600 text-sm">Create, reschedule, and cancel appointments</p>
                  </div>
                  <button
                    onClick={openCreateAppointment}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-lg transition"
                  >
                    New Appointment
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-4">
                  <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <input
                      type="date"
                      value={appointmentsDate}
                      onChange={(e) => setAppointmentsDate(e.target.value)}
                      className="w-full md:max-w-xs px-3 py-2 border rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setAppointmentsPage(1);
                        if (appointmentsDate === appointmentsQueryDate) {
                          loadAppointments(1);
                        } else {
                          setAppointmentsQueryDate(appointmentsDate);
                        }
                      }}
                      className="bg-white border hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg transition"
                      disabled={appointmentsLoading}
                    >
                      Filter
                    </button>
                  </div>
                </div>

                {appointmentsLoading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(appointmentsResp?.data || []).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                                No appointments.
                              </td>
                            </tr>
                          ) : (
                            (appointmentsResp?.data || []).map((a) => (
                              <tr key={a.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="font-semibold">{a.appointment_date}</div>
                                  <div className="text-xs text-gray-500">{(a.appointment_time || '').slice(0, 5)}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {a.patient ? `${a.patient.first_name || ''} ${a.patient.last_name || ''}`.trim() : `#${a.patient_id}`}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {a.doctor ? `${a.doctor.first_name || ''} ${a.doctor.last_name || ''}`.trim() : a.doctor_id ? `#${a.doctor_id}` : '-'}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      a.status === 'scheduled'
                                        ? 'bg-teal-50 text-teal-700'
                                        : a.status === 'completed'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {a.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => openEditAppointment(a)}
                                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-3 py-2 rounded-lg text-xs transition"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteAppointment(a)}
                                      className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-2 rounded-lg text-xs transition"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {appointmentsResp && appointmentsResp.last_page > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                        <div className="text-sm text-gray-600">
                          Page {appointmentsResp.current_page} of {appointmentsResp.last_page}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadAppointments(Math.max(1, appointmentsResp.current_page - 1))}
                            disabled={appointmentsResp.current_page <= 1}
                            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => loadAppointments(Math.min(appointmentsResp.last_page, appointmentsResp.current_page + 1))}
                            disabled={appointmentsResp.current_page >= appointmentsResp.last_page}
                            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {active === 'queue' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Patient Queue</h2>
                    <p className="text-gray-600 text-sm">Check-in, assign queue numbers, and update status</p>
                  </div>
                  <button
                    onClick={openCheckIn}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-lg transition"
                  >
                    Check-in
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="date"
                      value={queueDate}
                      onChange={(e) => setQueueDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <select
                      value={queueDoctorFilter}
                      onChange={(e) => setQueueDoctorFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      disabled={doctorsLoading}
                    >
                      <option value="">All Doctors</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {`${d.first_name || ''} ${d.last_name || ''}`.trim() || d.email}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={loadQueue}
                      className="bg-white border hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg transition"
                      disabled={queueLoading}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {queueLoading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queue</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {queueItems.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                                No queue entries.
                              </td>
                            </tr>
                          ) : (
                            queueItems.map((q) => (
                              <tr key={q.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="font-semibold">#{q.queue_number}</div>
                                  <div className="text-xs text-gray-500">{q.queue_date}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {q.patient ? `${q.patient.first_name || ''} ${q.patient.last_name || ''}`.trim() : `#${q.patient_id}`}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {q.doctor ? `${q.doctor.first_name || ''} ${q.doctor.last_name || ''}`.trim() : q.doctor_id ? `#${q.doctor_id}` : '-'}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      q.status === 'waiting'
                                        ? 'bg-teal-50 text-teal-700'
                                        : q.status === 'in_consultation'
                                          ? 'bg-orange-100 text-orange-800'
                                          : q.status === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {q.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setQueueStatus(q, 'in_consultation')}
                                      disabled={q.status !== 'waiting'}
                                      className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-lg text-xs transition"
                                    >
                                      Start
                                    </button>
                                    <button
                                      onClick={() => setQueueStatus(q, 'completed')}
                                      disabled={q.status === 'completed' || q.status === 'cancelled'}
                                      className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-lg text-xs transition"
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={() => setQueueStatus(q, 'cancelled')}
                                      disabled={q.status === 'completed' || q.status === 'cancelled'}
                                      className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-lg text-xs transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === 'billing' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Billing & Payments</h2>
                    <p className="text-gray-600 text-sm">Create invoices and record payments</p>
                  </div>
                  <button
                    onClick={openCreateInvoice}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-lg transition"
                  >
                    New Invoice
                  </button>
                </div>

                {billingLoading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(invoicesResp?.data || []).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                                No invoices.
                              </td>
                            </tr>
                          ) : (
                            (invoicesResp?.data || []).map((inv) => (
                              <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="font-semibold">{inv.invoice_number}</div>
                                  <div className="text-xs text-gray-500">{inv.issued_at}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {inv.patient ? `${inv.patient.first_name || ''} ${inv.patient.last_name || ''}`.trim() : `#${inv.patient_id}`}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">{inv.amount}</td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      inv.status === 'paid'
                                        ? 'bg-green-100 text-green-800'
                                        : inv.status === 'unpaid'
                                          ? 'bg-red-100 text-red-800'
                                          : inv.status === 'partial'
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {inv.status !== 'paid' && inv.status !== 'cancelled' ? (
                                    <button
                                      onClick={() => recordPayment(inv)}
                                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                                    >
                                      Pay
                                    </button>
                                  ) : (
                                    <span className="text-sm text-gray-500">-</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {invoicesResp && invoicesResp.last_page > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                        <div className="text-sm text-gray-600">
                          Page {invoicesResp.current_page} of {invoicesResp.last_page}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadInvoices(Math.max(1, invoicesResp.current_page - 1))}
                            disabled={invoicesResp.current_page <= 1}
                            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => loadInvoices(Math.min(invoicesResp.last_page, invoicesResp.current_page + 1))}
                            disabled={invoicesResp.current_page >= invoicesResp.last_page}
                            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {active === 'schedules' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Doctor Schedules</h2>
                    <p className="text-gray-600 text-sm">Assign doctor availability slots</p>
                  </div>
                  <button
                    onClick={openCreateSchedule}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-lg transition"
                  >
                    New Slot
                  </button>
                </div>

                {scheduleLoading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(scheduleResp?.data || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                                No schedules.
                              </td>
                            </tr>
                          ) : (
                            (scheduleResp?.data || []).map((s) => (
                              <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">{s.schedule_date}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {s.doctor ? `${s.doctor.first_name || ''} ${s.doctor.last_name || ''}`.trim() : `#${s.doctor_id}`}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{`${(s.start_time || '').slice(0, 5)} - ${(s.end_time || '').slice(0, 5)}`}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs ${s.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {s.is_available ? 'yes' : 'no'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {scheduleResp && scheduleResp.last_page > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                        <div className="text-sm text-gray-600">
                          Page {schedulePage} of {scheduleResp.last_page}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadSchedules(Math.max(1, schedulePage - 1))}
                            disabled={schedulePage <= 1}
                            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => loadSchedules(Math.min(scheduleResp.last_page, schedulePage + 1))}
                            disabled={schedulePage >= scheduleResp.last_page}
                            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {active === 'referrals' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Referrals</h2>
                    <p className="text-gray-600 text-sm">Create and track referral history</p>
                  </div>
                  <button
                    onClick={openCreateReferral}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-lg transition"
                  >
                    New Referral
                  </button>
                </div>

                {referralsLoading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(referralsResp?.data || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                                No referrals.
                              </td>
                            </tr>
                          ) : (
                            (referralsResp?.data || []).map((r) => (
                              <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {r.patient ? `${r.patient.first_name || ''} ${r.patient.last_name || ''}`.trim() : `#${r.patient_id}`}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{r.type}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{r.status}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{r.referred_at || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {referralsResp && referralsResp.last_page > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                        <div className="text-sm text-gray-600">
                          Page {referralsPage} of {referralsResp.last_page}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadReferrals(Math.max(1, referralsPage - 1))}
                            disabled={referralsPage <= 1}
                            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => loadReferrals(Math.min(referralsResp.last_page, referralsPage + 1))}
                            disabled={referralsPage >= referralsResp.last_page}
                            className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {active === 'reports' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Patient Queue Report</h2>
                    <p className="text-gray-600 text-sm">Export the queue list by doctor/date</p>
                  </div>
                  <button
                    onClick={exportQueueCsv}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-lg transition"
                    disabled={queueItems.length === 0}
                  >
                    Export CSV
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="date"
                      value={queueDate}
                      onChange={(e) => setQueueDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <select
                      value={queueDoctorFilter}
                      onChange={(e) => setQueueDoctorFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      disabled={doctorsLoading}
                    >
                      <option value="">All Doctors</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {`${d.first_name || ''} ${d.last_name || ''}`.trim() || d.email}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={loadQueue}
                      className="bg-white border hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg transition"
                      disabled={queueLoading}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {queueItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                              No data.
                            </td>
                          </tr>
                        ) : (
                          queueItems.map((q) => (
                            <tr key={q.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">#{q.queue_number}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {q.patient ? `${q.patient.first_name || ''} ${q.patient.last_name || ''}`.trim() : `#${q.patient_id}`}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {q.doctor ? `${q.doctor.first_name || ''} ${q.doctor.last_name || ''}`.trim() : q.doctor_id ? `#${q.doctor_id}` : '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{q.status}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {patientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{editingPatient ? 'Update Patient' : 'Register New Patient'}</h2>
              <button type="button" onClick={closePatientModal} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitPatient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    required
                    value={patientForm.first_name}
                    onChange={(e) => setPatientForm((p) => ({ ...p, first_name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    required
                    value={patientForm.last_name}
                    onChange={(e) => setPatientForm((p) => ({ ...p, last_name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., +1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="150"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm((p) => ({ ...p, age: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 25"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={patientSaving}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  {patientSaving ? 'Saving...' : editingPatient ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closePatientModal}
                  disabled={patientSaving}
                  className="flex-1 bg-transparent border-2 border-gray-300 hover:border-gray-400 disabled:opacity-60 text-gray-800 font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {appointmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{editingAppointment ? 'Update Appointment' : 'Create Appointment'}</h2>
              <button type="button" onClick={closeAppointmentModal} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitAppointment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID *</label>
                  <input
                    type="text"
                    required
                    value={appointmentForm.patient_id}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, patient_id: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <select
                    value=""
                    onChange={(e) => {
                      const selected = appointmentPatients.find((p) => String(p.id) === e.target.value);
                      const patientCode = selected?.patient_profile?.patient_id;
                      const fallbackUserId = selected ? String(selected.id) : '';
                      setAppointmentForm((prev) => ({
                        ...prev,
                        patient_id: (patientCode || fallbackUserId || '').toString(),
                      }));
                    }}
                    className="w-full mt-2 px-3 py-2 border rounded-lg"
                    disabled={appointmentPatientsLoading}
                  >
                    <option value="">{appointmentPatientsLoading ? 'Loading patients...' : 'Select a patient (optional)'}</option>
                    {appointmentPatients.map((p) => {
                      const patientCode = p.patient_profile?.patient_id;
                      const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email;
                      return (
                        <option key={p.id} value={p.id}>
                          {patientCode ? `${patientCode} - ${name}` : `${p.id} - ${name}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={appointmentForm.appointment_date}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, appointment_date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input
                    type="time"
                    required
                    value={appointmentForm.appointment_time}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, appointment_time: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={appointmentForm.type}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="in_person">In Person</option>
                    <option value="telemedicine">Telemedicine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={appointmentForm.status}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={appointmentSaving}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  {appointmentSaving ? 'Saving...' : editingAppointment ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeAppointmentModal}
                  disabled={appointmentSaving}
                  className="flex-1 bg-transparent border-2 border-gray-300 hover:border-gray-400 disabled:opacity-60 text-gray-800 font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {checkInModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Check-in Patient</h2>
              <button type="button" onClick={closeCheckIn} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitCheckIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID *</label>
                <input
                  type="text"
                  required
                  value={checkInForm.patient_id}
                  onChange={(e) => setCheckInForm((p) => ({ ...p, patient_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                <select
                  required
                  value={checkInForm.doctor_id}
                  onChange={(e) => setCheckInForm((p) => ({ ...p, doctor_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={doctorsLoading}
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {`${d.first_name || ''} ${d.last_name || ''}`.trim() || d.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment ID (optional)</label>
                <input
                  type="number"
                  value={checkInForm.appointment_id}
                  onChange={(e) => setCheckInForm((p) => ({ ...p, appointment_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={checkInSaving}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  {checkInSaving ? 'Saving...' : 'Check-in'}
                </button>
                <button
                  type="button"
                  onClick={closeCheckIn}
                  disabled={checkInSaving}
                  className="flex-1 bg-transparent border-2 border-gray-300 hover:border-gray-400 disabled:opacity-60 text-gray-800 font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {invoiceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Create Invoice</h2>
              <button type="button" onClick={closeInvoiceModal} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID *</label>
                <input
                  type="number"
                  required
                  value={invoiceForm.patient_id}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, patient_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={invoiceForm.due_date}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={invoiceSaving}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  {invoiceSaving ? 'Saving...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeInvoiceModal}
                  disabled={invoiceSaving}
                  className="flex-1 bg-transparent border-2 border-gray-300 hover:border-gray-400 disabled:opacity-60 text-gray-800 font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Create Schedule Slot</h2>
              <button type="button" onClick={closeScheduleModal} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                <select
                  required
                  value={scheduleForm.doctor_id}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, doctor_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={doctorsLoading}
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {`${d.first_name || ''} ${d.last_name || ''}`.trim() || d.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={scheduleForm.schedule_date}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, schedule_date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm((p) => ({ ...p, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm((p) => ({ ...p, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={scheduleSaving}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  {scheduleSaving ? 'Saving...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeScheduleModal}
                  disabled={scheduleSaving}
                  className="flex-1 bg-transparent border-2 border-gray-300 hover:border-gray-400 disabled:opacity-60 text-gray-800 font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {referralModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Create Referral</h2>
              <button type="button" onClick={closeReferralModal} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitReferral} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID *</label>
                <input
                  type="number"
                  required
                  value={referralForm.patient_id}
                  onChange={(e) => setReferralForm((p) => ({ ...p, patient_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={referralForm.type}
                  onChange={(e) => setReferralForm((p) => ({ ...p, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </select>
              </div>
              {referralForm.type === 'external' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">External Provider</label>
                  <input
                    value={referralForm.external_provider}
                    onChange={(e) => setReferralForm((p) => ({ ...p, external_provider: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referred By (Doctor ID)</label>
                  <input
                    type="number"
                    value={referralForm.referred_by_doctor_id}
                    onChange={(e) => setReferralForm((p) => ({ ...p, referred_by_doctor_id: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referred To (Doctor ID)</label>
                  <input
                    type="number"
                    value={referralForm.referred_to_doctor_id}
                    onChange={(e) => setReferralForm((p) => ({ ...p, referred_to_doctor_id: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={referralForm.reason}
                  onChange={(e) => setReferralForm((p) => ({ ...p, reason: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={referralSaving}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  {referralSaving ? 'Saving...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeReferralModal}
                  disabled={referralSaving}
                  className="flex-1 bg-transparent border-2 border-gray-300 hover:border-gray-400 disabled:opacity-60 text-gray-800 font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
