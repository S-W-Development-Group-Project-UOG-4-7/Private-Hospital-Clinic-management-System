import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { patientApi } from '../../api/patient';
import type {
  CreateAppointmentPayload,
  CreateFeedbackPayload,
  CreatePaymentPayload,
  PatientEhrRecord,
  PatientFeedback,
  PatientInvoice,
  PatientNotification,
  PatientPrescription,
  PatientTeleconsultation,
  PatientAppointment,
  PatientProfileResponse,
  UpdateAppointmentPayload,
} from '../../types/patient';
import { Bell, Calendar, CreditCard, LayoutDashboard, LogOut, Menu, MessageSquare, UserCircle, Video, X } from 'lucide-react';
import ClinicAppointmentForm from '../../components/ClinicAppointmentForm';

type SectionKey =
  | 'overview'
  | 'profile'
  | 'appointments'
  | 'medical_records'
  | 'prescriptions'
  | 'telemedicine'
  | 'billing'
  | 'feedback'
  | 'notifications';

const safeParseJson = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [active, setActive] = useState<SectionKey>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<PatientProfileResponse | null>(null);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [clinics, setClinics] = useState<{ id: number; name: string }[]>([]);

  const [teleconsultationsLoaded, setTeleconsultationsLoaded] = useState(false);
  const [teleconsultationsLoading, setTeleconsultationsLoading] = useState(false);
  const [teleconsultations, setTeleconsultations] = useState<PatientTeleconsultation[]>([]);

  const [ehrLoaded, setEhrLoaded] = useState(false);
  const [ehrLoading, setEhrLoading] = useState(false);
  const [ehrRecords, setEhrRecords] = useState<PatientEhrRecord[]>([]);
  const [ehrTab, setEhrTab] = useState<'diagnosis' | 'lab_report'>('diagnosis');

  const [billingLoaded, setBillingLoaded] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [invoices, setInvoices] = useState<PatientInvoice[]>([]);

  const [feedbackLoaded, setFeedbackLoaded] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState<PatientFeedback[]>([]);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ subject: '', message: '', rating: '' });

  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);

  const [prescriptionsLoaded, setPrescriptionsLoaded] = useState(false);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<PatientPrescription | null>(null);
  const [prescriptionDetailsLoading, setPrescriptionDetailsLoading] = useState(false);

  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
  });

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<PatientAppointment | null>(null);
  const [appointmentForm, setAppointmentForm] = useState({
    clinic_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    type: 'in_person' as 'in_person' | 'telemedicine',
    reason: '',
  });

  const authUser = useMemo(() => safeParseJson(localStorage.getItem('authUser')), []);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  );


  useEffect(() => {
    const loadAll = async () => {
      setError(null);
      try {
        setProfileLoading(true);
        const profile = await patientApi.profile.get();
        setProfileData(profile);
        setProfileForm({
          email: profile.user.email || '',
          phone: profile.profile.phone || '',
          date_of_birth: (profile.profile.date_of_birth as unknown as string) || '',
          gender: profile.profile.gender || '',
          address: profile.profile.address || '',
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setProfileLoading(false);
      }

      try {
        setAppointmentsLoading(true);
        const resp = await patientApi.appointments.list();
        setAppointments(Array.isArray(resp.data) ? resp.data : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load appointments');
      } finally {
        setAppointmentsLoading(false);
      }

      try {
        setNotificationsLoading(true);
        const resp = await patientApi.notifications.list();
        setNotifications(Array.isArray(resp.data) ? resp.data : []);
        setNotificationsLoaded(true);
      } catch (e: any) {
        // Non-blocking on initial load
      } finally {
        setNotificationsLoading(false);
      }
    };
 
     loadAll();
  }, []);

  const openPrescriptionDetails = async (prescription: PatientPrescription) => {
    setError(null);
    setSelectedPrescription(prescription);
    setPrescriptionDetailsLoading(true);
    try {
      const details = await patientApi.prescriptions.show(prescription.id);
      setSelectedPrescription(details);
    } catch (e: any) {
      setError(e?.message || 'Failed to load prescription');
    } finally {
      setPrescriptionDetailsLoading(false);
    }
  };

  const closePrescriptionDetails = () => {
    if (prescriptionDetailsLoading) return;
    setSelectedPrescription(null);
  };

  useEffect(() => {
    const loadTeleconsultations = async () => {
      setError(null);
      setTeleconsultationsLoading(true);
      try {
        const resp = await patientApi.teleconsultations.list();
        setTeleconsultations(Array.isArray(resp.data) ? resp.data : []);
        setTeleconsultationsLoaded(true);
      } catch (e: any) {
        setError(e?.message || 'Failed to load teleconsultations');
      } finally {
        setTeleconsultationsLoading(false);
      }
    };

    const loadEhr = async () => {
      setError(null);
      setEhrLoading(true);
      try {
        const resp = await patientApi.ehr.list();
        setEhrRecords(Array.isArray(resp.data) ? resp.data : []);
        setEhrLoaded(true);
      } catch (e: any) {
        setError(e?.message || 'Failed to load EHR records');
      } finally {
        setEhrLoading(false);
      }
    };

    const loadBilling = async () => {
      setError(null);
      setBillingLoading(true);
      try {
        const resp = await patientApi.billing.invoices();
        setInvoices(Array.isArray(resp.data) ? resp.data : []);
        setBillingLoaded(true);
      } catch (e: any) {
        setError(e?.message || 'Failed to load invoices');
      } finally {
        setBillingLoading(false);
      }
    };

    const loadFeedback = async () => {
      setError(null);
      setFeedbackLoading(true);
      try {
        const resp = await patientApi.feedback.list();
        setFeedbackItems(Array.isArray(resp.data) ? resp.data : []);
        setFeedbackLoaded(true);
      } catch (e: any) {
        setError(e?.message || 'Failed to load feedback');
      } finally {
        setFeedbackLoading(false);
      }
    };

    const loadNotifications = async () => {
      setError(null);
      setNotificationsLoading(true);
      try {
        const resp = await patientApi.notifications.list();
        setNotifications(Array.isArray(resp.data) ? resp.data : []);
        setNotificationsLoaded(true);
      } catch (e: any) {
        setError(e?.message || 'Failed to load notifications');
      } finally {
        setNotificationsLoading(false);
      }
    };

    const loadPrescriptions = async () => {
      setError(null);
      setPrescriptionsLoading(true);
      try {
        const resp = await patientApi.prescriptions.list();
        setPrescriptions(Array.isArray(resp.data) ? resp.data : []);
        setPrescriptionsLoaded(true);
      } catch (e: any) {
        setError(e?.message || 'Failed to load prescriptions');
      } finally {
        setPrescriptionsLoading(false);
      }
    };

    if (active === 'telemedicine' && !teleconsultationsLoaded && !teleconsultationsLoading) {
      loadTeleconsultations();
    }
    if (active === 'medical_records' && !ehrLoaded && !ehrLoading) {
      loadEhr();
    }
    if (active === 'billing' && !billingLoaded && !billingLoading) {
      loadBilling();
    }
    if (active === 'feedback' && !feedbackLoaded && !feedbackLoading) {
      loadFeedback();
    }
    if (active === 'notifications' && !notificationsLoaded && !notificationsLoading) {
      loadNotifications();
    }
    if (active === 'prescriptions' && !prescriptionsLoaded && !prescriptionsLoading) {
      loadPrescriptions();
    }
  }, [active, teleconsultationsLoaded, teleconsultationsLoading, ehrLoaded, ehrLoading, billingLoaded, billingLoading, feedbackLoaded, feedbackLoading, notificationsLoaded, notificationsLoading, prescriptionsLoaded, prescriptionsLoading]);

  const refreshAppointments = async () => {
    setError(null);
    setAppointmentsLoading(true);
    try {
      const resp = await patientApi.appointments.list();
      setAppointments(Array.isArray(resp.data) ? resp.data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load appointments');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.status === 'scheduled' && a.appointment_date >= today),
    [appointments, today]
  );
  const pastAppointments = useMemo(
    () => appointments.filter((a) => a.appointment_date < today || a.status !== 'scheduled'),
    [appointments, today]
  );

  const openCreateAppointment = () => {
    setEditingAppointment(null);
    setAppointmentForm({
      clinic_id: '',
      doctor_id: '',
      appointment_date: '',
      appointment_time: '',
      type: 'in_person',
      reason: '',
    });
    // Load clinics so patient can choose clinic (default OPD is used server-side if left blank)
    (async () => {
      try {
        const resp = await fetch('/api/clinics');
        const json = await resp.json();
        setClinics(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        // non-blocking
      }
    })();
    setAppointmentModalOpen(true);
  };

  const openEditAppointment = (appt: PatientAppointment) => {
    setEditingAppointment(appt);
    setAppointmentForm({
      clinic_id: appt.clinic_id ? String(appt.clinic_id) : '',
      doctor_id: appt.doctor_id ? String(appt.doctor_id) : '',
      appointment_date: appt.appointment_date || '',
      appointment_time: (appt.appointment_time || '').slice(0, 5),
      type: appt.type || 'in_person',
      reason: appt.reason || '',
    });
    // When editing, load clinics so the select is populated
    (async () => {
      try {
        const resp = await fetch('/api/clinics');
        const json = await resp.json();
        setClinics(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        // non-blocking
      }
    })();

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
      const doctorIdValue = appointmentForm.doctor_id.trim() === '' ? null : Number(appointmentForm.doctor_id);
      const clinicIdValue = appointmentForm.clinic_id.trim() === '' ? null : Number(appointmentForm.clinic_id);

      const base: CreateAppointmentPayload = {
        clinic_id: clinicIdValue,
        doctor_id: Number.isFinite(doctorIdValue as any) ? (doctorIdValue as number) : null,
        appointment_date: appointmentForm.appointment_date,
        appointment_time: appointmentForm.appointment_time,
        type: appointmentForm.type,
        reason: appointmentForm.reason.trim() === '' ? null : appointmentForm.reason.trim(),
      };

      if (editingAppointment) {
        const payload: UpdateAppointmentPayload = {
          clinic_id: base.clinic_id ?? null,
          doctor_id: base.doctor_id ?? null,
          appointment_date: base.appointment_date,
          appointment_time: base.appointment_time,
          type: base.type,
          reason: base.reason ?? null,
        };
        await patientApi.appointments.update(editingAppointment.id, payload);
      } else {
        await patientApi.appointments.create(base);
      }

      closeAppointmentModal();
      await refreshAppointments();
      setActive('appointments');
    } catch (e: any) {
      setError(e?.message || 'Failed to save appointment');
    } finally {
      setAppointmentSaving(false);
    }
  };

  // Handler used when ClinicAppointmentForm completes a booking
  const handleClinicAppointmentSuccess = async (data: any) => {
    setAppointmentModalOpen(false);
    try {
      await refreshAppointments();
      setActive('appointments');
    } catch (e: any) {
      setError(e?.message || 'Failed to load appointments');
    }
  };

  const cancelAppointment = async (appt: PatientAppointment) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setError(null);
    try {
      await patientApi.appointments.update(appt.id, { status: 'cancelled' });
      await refreshAppointments();
    } catch (e: any) {
      setError(e?.message || 'Failed to cancel appointment');
    }
  };

  const deleteAppointment = async (appt: PatientAppointment) => {
    if (!window.confirm('Delete this appointment?')) return;
    setError(null);
    try {
      await patientApi.appointments.remove(appt.id);
      await refreshAppointments();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete appointment');
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        email: profileForm.email.trim() === '' ? undefined : profileForm.email.trim(),
        phone: profileForm.phone.trim() === '' ? null : profileForm.phone.trim(),
        date_of_birth: profileForm.date_of_birth.trim() === '' ? null : profileForm.date_of_birth.trim(),
        gender: profileForm.gender.trim() === '' ? null : profileForm.gender.trim(),
        address: profileForm.address.trim() === '' ? null : profileForm.address.trim(),
      };
      const updated = await patientApi.profile.update(payload);
      setProfileData(updated);
      setProfileEditMode(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to update profile');
    }
  };

  const patientName = profileData?.user?.name || authUser?.name || 'Patient';
  const patientEmail = profileData?.user?.email || authUser?.email || '';

  const formatMoney = (value: string | number) => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    return `$${n.toFixed(2)}`;
  };

  const getInvoicePaidTotal = (invoice: PatientInvoice) => {
    const total = (invoice.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    return Number.isFinite(total) ? total : 0;
  };

  const getInvoiceRemaining = (invoice: PatientInvoice) => {
    const amount = Number(invoice.amount);
    const remaining = amount - getInvoicePaidTotal(invoice);
    if (!Number.isFinite(remaining)) return 0;
    return Math.max(0, remaining);
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedbackSaving(true);
    try {
      const payload: CreateFeedbackPayload = {
        subject: feedbackForm.subject.trim(),
        message: feedbackForm.message.trim(),
        rating: feedbackForm.rating.trim() === '' ? null : Number(feedbackForm.rating),
      };
      await patientApi.feedback.create(payload);
      setFeedbackForm({ subject: '', message: '', rating: '' });
      const resp = await patientApi.feedback.list();
      setFeedbackItems(Array.isArray(resp.data) ? resp.data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit feedback');
    } finally {
      setFeedbackSaving(false);
    }
  };

  const payInvoice = async (invoice: PatientInvoice) => {
    const remaining = getInvoiceRemaining(invoice);
    if (remaining <= 0) return;
    const amountStr = window.prompt(`Enter amount to pay (remaining: ${formatMoney(remaining)})`, String(remaining));
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Invalid payment amount');
      return;
    }

    setError(null);
    try {
      const payload: CreatePaymentPayload = {
        invoice_id: invoice.id,
        amount,
        method: 'card',
      };
      await patientApi.billing.pay(payload);
      const resp = await patientApi.billing.invoices();
      setInvoices(Array.isArray(resp.data) ? resp.data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to record payment');
    }
  };

  const Sidebar = (
    <div className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-white">
      <div className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center">
            <UserCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Patient Portal</div>
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
          onClick={() => setActive('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'profile' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <UserCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Profile</span>
        </button>
        <button
          onClick={() => setActive('appointments')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'appointments' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-medium">Appointments</span>
        </button>
        <button
          onClick={() => setActive('medical_records')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'medical_records' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <span className="text-sm font-medium">Medical Records</span>
        </button>
        <button
          onClick={() => setActive('prescriptions')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'prescriptions' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <span className="text-sm font-medium">Prescriptions</span>
        </button>
        <button
          onClick={() => setActive('telemedicine')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'telemedicine' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Video className="w-5 h-5" />
          <span className="text-sm font-medium">Telemedicine</span>
        </button>
        <button
          onClick={() => setActive('billing')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'billing' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-sm font-medium">Billing & Payments</span>
        </button>
        <button
          onClick={() => setActive('feedback')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'feedback' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium">Feedback</span>
        </button>
        <button
          onClick={() => setActive('notifications')}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition ${active === 'notifications' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <span className="flex items-center gap-3">
            <Bell className="w-5 h-5" />
            <span className="text-sm font-medium">Notifications</span>
          </span>
          {unreadNotificationsCount > 0 && (
            <span className="min-w-6 h-6 px-2 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
              {unreadNotificationsCount}
            </span>
          )}
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
              <div className="text-sm font-semibold text-gray-900">Patient Dashboard</div>
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
                    setActive('profile');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'profile' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <UserCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Profile</span>
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
                    setActive('medical_records');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'medical_records' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="text-sm font-medium">Medical Records</span>
                </button>
                <button
                  onClick={() => {
                    setActive('prescriptions');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'prescriptions' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="text-sm font-medium">Prescriptions</span>
                </button>
                <button
                  onClick={() => {
                    setActive('telemedicine');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'telemedicine' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="text-sm font-medium">Telemedicine</span>
                </button>
                <button
                  onClick={() => {
                    setActive('billing');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'billing' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="text-sm font-medium">Billing & Payments</span>
                </button>

                <button
                  onClick={() => {
                    setActive('feedback');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'feedback' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-sm font-medium">Feedback</span>
                </button>

                <button
                  onClick={() => {
                    setActive('notifications');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition ${active === 'notifications' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="flex items-center gap-3">
                    <Bell className="w-5 h-5" />
                    <span className="text-sm font-medium">Notifications</span>
                  </span>
                  {unreadNotificationsCount > 0 && (
                    <span className="min-w-6 h-6 px-2 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
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

        {/* Hero-style Header */}
        <div className="relative bg-cover bg-center" style={{ backgroundImage: "url('/images/Hero.png')" }}>
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative z-10 px-4 md:px-8 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">Welcome back, {patientName}</h1>
              <p className="text-lg md:text-xl text-gray-200 mb-6">Manage your health and appointments with ease</p>
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => setActive('notifications')}
                  className="relative p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition duration-300 backdrop-blur-sm"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
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
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {active === 'overview' && (
            <div className="space-y-8">
              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Book Appointment */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                >
                  <div className="mb-6">
                    <Calendar className="w-12 h-12 text-teal-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Book Appointment</h2>
                    <p className="text-gray-600">Schedule appointments with doctors</p>
                  </div>
                  <button
                    onClick={openCreateAppointment}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                  >
                    Book Now
                  </button>
                </motion.div>

                {/* My Appointments */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                >
                  <div className="mb-6">
                    <Calendar className="w-12 h-12 text-teal-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-3">My Appointments</h2>
                    <p className="text-gray-600">View upcoming and past appointments</p>
                  </div>
                  <button
                    onClick={() => setActive('appointments')}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                  >
                    View Appointments
                  </button>
                </motion.div>

                {/* Medical Records */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                >
                  <div className="mb-6">
                    <UserCircle className="w-12 h-12 text-teal-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Medical Records</h2>
                    <p className="text-gray-600">Access your medical history and reports</p>
                  </div>
                  <button
                    onClick={() => setActive('medical_records')}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                  >
                    View Records
                  </button>
                </motion.div>

                {/* Prescriptions */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                >
                  <div className="mb-6">
                    <CreditCard className="w-12 h-12 text-teal-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Prescriptions</h2>
                    <p className="text-gray-600">View your current and past prescriptions</p>
                  </div>
                  <button
                    onClick={() => setActive('prescriptions')}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                  >
                    View Prescriptions
                  </button>
                </motion.div>

                {/* Telemedicine */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                >
                  <div className="mb-6">
                    <Video className="w-12 h-12 text-teal-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Telemedicine</h2>
                    <p className="text-gray-600">Join virtual consultations</p>
                  </div>
                  <button
                    onClick={() => setActive('telemedicine')}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                  >
                    Start Consultation
                  </button>
                </motion.div>

                {/* Billing */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                >
                  <div className="mb-6">
                    <CreditCard className="w-12 h-12 text-teal-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Billing & Payments</h2>
                    <p className="text-gray-600">View invoices and make payments</p>
                  </div>
                  <button
                    onClick={() => setActive('billing')}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                  >
                    View Bills
                  </button>
                </motion.div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300"
                >
                  <h3 className="text-4xl font-extrabold text-teal-500 mb-2">
                    {appointmentsLoading ? '...' : upcomingAppointments.length}
                  </h3>
                  <p className="text-gray-600 font-medium">Upcoming Appointments</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300"
                >
                  <h3 className="text-4xl font-extrabold text-teal-500 mb-2">-</h3>
                  <p className="text-gray-600 font-medium">Active Prescriptions</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300"
                >
                  <h3 className="text-4xl font-extrabold text-teal-500 mb-2">-</h3>
                  <p className="text-gray-600 font-medium">Medical Reports</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300"
                >
                  <h3 className="text-4xl font-extrabold text-teal-500 mb-2">-</h3>
                  <p className="text-gray-600 font-medium">Pending Bills</p>
                </motion.div>
              </div>
            </div>
          )}

          {active === 'profile' && (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl">
              {profileLoading ? (
                <div className="text-center py-12">Loading...</div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                      <p className="text-gray-600 text-sm">Update your contact details</p>
                    </div>
                    <button
                      onClick={() => setProfileEditMode((v) => !v)}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                    >
                      {profileEditMode ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  <form onSubmit={saveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={patientName}
                          disabled
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={profileEditMode ? profileForm.email : patientEmail}
                          onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                          disabled={!profileEditMode}
                          className={`w-full px-3 py-2 border rounded-lg ${profileEditMode ? '' : 'bg-gray-50'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="text"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                          disabled={!profileEditMode}
                          className={`w-full px-3 py-2 border rounded-lg ${profileEditMode ? '' : 'bg-gray-50'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={profileForm.date_of_birth}
                          onChange={(e) => setProfileForm((p) => ({ ...p, date_of_birth: e.target.value }))}
                          disabled={!profileEditMode}
                          className={`w-full px-3 py-2 border rounded-lg ${profileEditMode ? '' : 'bg-gray-50'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <input
                          type="text"
                          value={profileForm.gender}
                          onChange={(e) => setProfileForm((p) => ({ ...p, gender: e.target.value }))}
                          disabled={!profileEditMode}
                          className={`w-full px-3 py-2 border rounded-lg ${profileEditMode ? '' : 'bg-gray-50'}`}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                          value={profileForm.address}
                          onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                          disabled={!profileEditMode}
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-lg ${profileEditMode ? '' : 'bg-gray-50'}`}
                        />
                      </div>
                    </div>

                    {profileEditMode && (
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileEditMode(false)}
                          className="bg-transparent border-2 border-gray-300 hover:border-gray-400 text-gray-800 font-bold py-3 px-6 rounded-full transition duration-300"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}

          {active === 'appointments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
                  <p className="text-gray-600 text-sm">Manage your upcoming and past appointments</p>
                </div>
                <button
                  onClick={openCreateAppointment}
                  className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  Book Appointment
                </button>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {appointments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                              No appointments yet.
                            </td>
                          </tr>
                        ) : (
                          appointments.map((appt) => {
                            const doctorName = appt.doctor
                              ? `${appt.doctor.first_name || ''} ${appt.doctor.last_name || ''}`.trim() || appt.doctor.email || 'Doctor'
                              : appt.doctor_id
                                ? `Doctor #${appt.doctor_id}`
                                : '-';

                            return (
                              <tr key={appt.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">{appt.appointment_date}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{(appt.appointment_time || '').slice(0, 5)}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {appt.type === 'telemedicine' ? 'Telemedicine' : 'In Person'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{doctorName}</td>
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
                                      onClick={() => openEditAppointment(appt)}
                                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                                    >
                                      Reschedule
                                    </button>
                                    {appt.status === 'scheduled' && (
                                      <button
                                        onClick={() => cancelAppointment(appt)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      onClick={() => deleteAppointment(appt)}
                                      className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                                    >
                                      Delete
                                    </button>
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
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upcoming</h3>
                  <p className="text-gray-600 text-sm">{upcomingAppointments.length} scheduled</p>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">History</h3>
                  <p className="text-gray-600 text-sm">{pastAppointments.length} past/cancelled</p>
                </div>
              </div>
            </div>
          )}

          {active === 'telemedicine' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Telemedicine</h2>
                <p className="text-gray-600 text-sm">Your scheduled teleconsultations</p>
              </div>

              {teleconsultationsLoading ? (
                <div className="text-center py-12">Loading...</div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {teleconsultations.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-600">No teleconsultations found.</td>
                          </tr>
                        ) : (
                          teleconsultations.map((t) => {
                            const doctorName = t.doctor
                              ? `${t.doctor.first_name || ''} ${t.doctor.last_name || ''}`.trim() || t.doctor.email || 'Doctor'
                              : t.doctor_id
                                ? `Doctor #${t.doctor_id}`
                                : '-';

                            return (
                              <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">{t.scheduled_at}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{doctorName}</td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      t.status === 'scheduled'
                                        ? 'bg-teal-100 text-teal-800'
                                        : t.status === 'cancelled'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {t.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {t.meeting_url && t.status === 'scheduled' ? (
                                    <a
                                      href={t.meeting_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                                    >
                                      <Video className="w-4 h-4" />
                                      Join
                                    </a>
                                  ) : (
                                    <span className="text-sm text-gray-500">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {active === 'medical_records' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Electronic Health Records</h2>
                  <p className="text-gray-600 text-sm">Read-only access to your medical records</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEhrTab('diagnosis')}
                    className={`px-6 py-3 rounded-full text-sm font-bold transition duration-300 ${ehrTab === 'diagnosis' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Diagnoses
                  </button>
                  <button
                    onClick={() => setEhrTab('lab_report')}
                    className={`px-6 py-3 rounded-full text-sm font-bold transition duration-300 ${ehrTab === 'lab_report' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Lab Reports
                  </button>
                </div>
              </div>

              {ehrLoading ? (
                <div className="text-center py-12">Loading...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ehrRecords.filter((r) => r.type === ehrTab).length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-6 text-gray-600">No records found.</div>
                  ) : (
                    ehrRecords
                      .filter((r) => r.type === ehrTab)
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
              )}
            </div>
          )}

          {active === 'billing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Billing & Payments</h2>
                <p className="text-gray-600 text-sm">View invoices and payment history (mock payments)</p>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {invoices.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-gray-600">No invoices found.</td>
                          </tr>
                        ) : (
                          invoices.map((inv) => {
                            const paidTotal = getInvoicePaidTotal(inv);
                            const remaining = getInvoiceRemaining(inv);
                            return (
                              <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">{inv.invoice_number}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{inv.issued_at}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{inv.due_date || '-'}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{formatMoney(inv.amount)}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{formatMoney(paidTotal)}</td>
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
                                  {remaining > 0 && inv.status !== 'cancelled' ? (
                                    <button
                                      onClick={() => payInvoice(inv)}
                                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                                    >
                                      Pay
                                    </button>
                                  ) : (
                                    <span className="text-sm text-gray-500">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {active === 'feedback' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Feedback</h2>
                <p className="text-gray-600 text-sm">Share your experience with the clinic</p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Feedback</h3>
                <form onSubmit={submitFeedback} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <input
                      type="text"
                      required
                      value={feedbackForm.subject}
                      onChange={(e) => setFeedbackForm((p) => ({ ...p, subject: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm((p) => ({ ...p, message: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={feedbackForm.rating}
                      onChange={(e) => setFeedbackForm((p) => ({ ...p, rating: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={feedbackSaving}
                    className="bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                  >
                    {feedbackSaving ? 'Submitting...' : 'Submit'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
                {feedbackLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : feedbackItems.length === 0 ? (
                  <div className="text-gray-600">No feedback submitted yet.</div>
                ) : (
                  <div className="space-y-4">
                    {feedbackItems.map((f) => (
                      <div key={f.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold text-gray-900">{f.subject}</div>
                            <div className="text-sm text-gray-600">{f.created_at || ''}</div>
                          </div>
                          {f.rating ? (
                            <div className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">Rating: {f.rating}/5</div>
                          ) : null}
                        </div>
                        <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">{f.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {active === 'notifications' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                <p className="text-gray-600 text-sm">Reminders and important updates</p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                {notificationsLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-gray-600">No notifications.</div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`border rounded-lg p-4 ${n.read_at ? 'bg-white' : 'bg-teal-50 border-teal-100'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold text-gray-900">{n.title}</div>
                            <div className="text-sm text-gray-600">{n.created_at || ''}</div>
                          </div>
                          {!n.read_at && (
                            <span className="text-xs bg-teal-500 text-white px-2 py-1 rounded-full">New</span>
                          )}
                        </div>
                        {n.body && <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">{n.body}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {active === 'prescriptions' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>
                <p className="text-gray-600 text-sm">Read-only view of your prescriptions</p>
              </div>

              {prescriptionsLoading ? (
                <div className="text-center py-12">Loading...</div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prescription</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {prescriptions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-600">No prescriptions found.</td>
                          </tr>
                        ) : (
                          prescriptions.map((p) => {
                            const doctorName = p.doctor
                              ? `${p.doctor.first_name || ''} ${p.doctor.last_name || ''}`.trim() || p.doctor.email || 'Doctor'
                              : p.doctor_id
                                ? `Doctor #${p.doctor_id}`
                                : '-';

                            return (
                              <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.prescription_number}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{p.prescription_date}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{doctorName}</td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      p.status === 'dispensed'
                                        ? 'bg-green-100 text-green-800'
                                        : p.status === 'pending'
                                          ? 'bg-orange-100 text-orange-800'
                                          : p.status === 'cancelled'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => openPrescriptionDetails(p)}
                                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {appointmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {editingAppointment ? 'Reschedule Appointment' : 'Book Appointment'}
              </h2>
              <button
                type="button"
                onClick={closeAppointmentModal}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingAppointment ? (
            <form onSubmit={submitAppointment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic (optional)</label>
                  <select
                    value={appointmentForm.clinic_id}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, clinic_id: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Default (OPD)</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor ID (optional)</label>
                  <input
                    type="number"
                    value={appointmentForm.doctor_id}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, doctor_id: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g. 12"
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={appointmentForm.reason}
                    onChange={(e) => setAppointmentForm((p) => ({ ...p, reason: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Describe your symptoms or reason for visit"
                  />
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
            ) : (
              <ClinicAppointmentForm onSuccess={handleClinicAppointmentSuccess} />
            ) }
          </div>
        </div>
      )}

      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Prescription Details</h2>
                <p className="text-gray-600 text-sm">{selectedPrescription.prescription_number}</p>
              </div>
              <button
                type="button"
                onClick={closePrescriptionDetails}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {prescriptionDetailsLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase">Date</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedPrescription.prescription_date}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase">Status</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedPrescription.status}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase">Dispensed At</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedPrescription.dispensed_at || '-'}</div>
                  </div>
                </div>

                {(selectedPrescription.instructions || selectedPrescription.notes) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPrescription.instructions && (
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm font-semibold text-gray-900 mb-1">Instructions</div>
                        <div className="text-sm text-gray-700 whitespace-pre-line">{selectedPrescription.instructions}</div>
                      </div>
                    )}
                    {selectedPrescription.notes && (
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-sm font-semibold text-gray-900 mb-1">Notes</div>
                        <div className="text-sm text-gray-700 whitespace-pre-line">{selectedPrescription.notes}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <div className="text-sm font-semibold text-gray-900">Medications</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(selectedPrescription.items || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-gray-600">No items.</td>
                          </tr>
                        ) : (
                          (selectedPrescription.items || []).map((it) => {
                            const name = it.inventory_item?.name || `Item #${it.inventory_item_id}`;
                            return (
                              <tr key={it.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{it.quantity}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{it.dosage || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{it.frequency || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{it.duration_days ? `${it.duration_days} days` : '-'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default PatientDashboard;
