import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { patientApi } from '../../api/patient';
import type {
  CreateFeedbackPayload,
  CreatePaymentPayload,
  PatientEhrRecord,
  PatientFeedback,
  PatientInvoice,
  PatientLabOrder,
  PatientNotification,
  PatientPrescription,
  PatientTeleconsultation,
  PatientAppointment,
  PatientProfileResponse,
  QueueStatusResponse,
  PatientSlot,
} from '../../types/patient';
import { Bell, Calendar, Clock, CreditCard, FileText, FlaskConical, LayoutDashboard, LogOut, Menu, MessageSquare, Pill, UserCircle, Users, X } from 'lucide-react';

type SectionKey =
  | 'overview'
  | 'queue_status'
  | 'profile'
  | 'appointments'
  | 'medical_records'
  | 'lab_results'
  | 'prescriptions'
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

const formatDisplayDate = (value?: string | null) => {
  if (!value) return '-';
  const raw = String(value).trim();
  if (raw === '') return '-';
  const datePart = raw.includes('T') ? raw.split('T')[0] : raw.includes(' ') ? raw.split(' ')[0] : raw;
  const [year, month, day] = datePart.split('-').map((part) => parseInt(part || '0', 10));
  if (!year || !month || !day) return datePart;
  const localDate = new Date(year, month - 1, day);
  if (Number.isNaN(localDate.getTime())) return datePart;
  return localDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
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
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const [teleconsultationsLoaded, setTeleconsultationsLoaded] = useState(false);
  const [teleconsultationsLoading, setTeleconsultationsLoading] = useState(false);
  const [teleconsultations, setTeleconsultations] = useState<PatientTeleconsultation[]>([]);

  const [ehrLoaded, setEhrLoaded] = useState(false);
  const [ehrLoading, setEhrLoading] = useState(false);
  const [ehrRecords, setEhrRecords] = useState<PatientEhrRecord[]>([]);
  const [ehrTab, setEhrTab] = useState<'diagnosis' | 'lab_report'>('diagnosis');
  const [labOrdersLoaded, setLabOrdersLoaded] = useState(false);
  const [labOrdersLoading, setLabOrdersLoading] = useState(false);
  const [labOrders, setLabOrders] = useState<PatientLabOrder[]>([]);
  const [selectedLabOrder, setSelectedLabOrder] = useState<PatientLabOrder | null>(null);

  const [billingLoaded, setBillingLoaded] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [invoices, setInvoices] = useState<PatientInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PatientInvoice | null>(null);
  const [invoiceDetailsLoading, setInvoiceDetailsLoading] = useState(false);

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

  // Queue status state
  const [queueStatus, setQueueStatus] = useState<QueueStatusResponse | null>(null);
  const [queueStatusLoading, setQueueStatusLoading] = useState(false);
  const [appointmentQueueStatus, setAppointmentQueueStatus] = useState<{
    is_today: boolean;
    current_number: number | null;
    my_position: number | null;
    estimated_wait_minutes: number | null;
  } | null>(null);
  const [appointmentQueueLoading, setAppointmentQueueLoading] = useState(false);

  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    nic_passport: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<PatientAppointment | null>(null);
  const [consultationFee, setConsultationFee] = useState<number | null>(null);
  const [consultationFeeLoading, setConsultationFeeLoading] = useState(false);
  const [consultationFeeError, setConsultationFeeError] = useState<string | null>(null);
  const [appointmentForm, setAppointmentForm] = useState({
    clinic_id: '',
    department_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    type: 'in_person' as 'in_person' | 'telemedicine',
    reason: '',
  });
  const [availableSlots, setAvailableSlots] = useState<PatientSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [heldSlotId, setHeldSlotId] = useState<number | null>(null);
  const [slotHoldLoading, setSlotHoldLoading] = useState(false);

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
          first_name: profile.user.first_name || '',
          last_name: profile.user.last_name || '',
          email: profile.user.email || '',
          phone: profile.profile.phone || profile.user.phone || '',
          date_of_birth: (profile.profile.date_of_birth as unknown as string) || '',
          gender: profile.profile.gender || '',
          address: profile.profile.address || '',
          nic_passport: profile.profile.nic_passport || '',
          emergency_contact_name: profile.profile.emergency_contact_name || '',
          emergency_contact_phone: profile.profile.emergency_contact_phone || '',
          emergency_contact_relationship: profile.profile.emergency_contact_relationship || '',
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

  const openInvoiceDetails = async (invoice: PatientInvoice) => {
    setError(null);
    setSelectedInvoice(invoice);
    setInvoiceDetailsLoading(true);
    try {
      const details = await patientApi.billing.show(invoice.id);
      setSelectedInvoice(details);
    } catch (e: any) {
      setError(e?.message || 'Failed to load invoice');
    } finally {
      setInvoiceDetailsLoading(false);
    }
  };

  const closeInvoiceDetails = () => {
    if (invoiceDetailsLoading) return;
    setSelectedInvoice(null);
  };

  const loadTeleconsultations = useCallback(async () => {
    if (teleconsultationsLoaded || teleconsultationsLoading) return;
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
  }, [teleconsultationsLoaded, teleconsultationsLoading]);

  const loadEhr = useCallback(async () => {
    if (ehrLoaded || ehrLoading) return;
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
  }, [ehrLoaded, ehrLoading]);

  const loadLabOrders = useCallback(async () => {
    if (labOrdersLoaded || labOrdersLoading) return;
    setError(null);
    setLabOrdersLoading(true);
    try {
      const resp = await patientApi.labResults.list();
      setLabOrders(Array.isArray(resp.data) ? resp.data : []);
      setLabOrdersLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load lab results');
    } finally {
      setLabOrdersLoading(false);
    }
  }, [labOrdersLoaded, labOrdersLoading]);

  const loadBilling = useCallback(async () => {
    if (billingLoaded || billingLoading) return;
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
  }, [billingLoaded, billingLoading]);

  const loadFeedback = useCallback(async () => {
    if (feedbackLoaded || feedbackLoading) return;
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
  }, [feedbackLoaded, feedbackLoading]);

  const loadNotificationsLazy = useCallback(async () => {
    if (notificationsLoaded || notificationsLoading) return;
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
  }, [notificationsLoaded, notificationsLoading]);

  const loadPrescriptions = useCallback(async () => {
    if (prescriptionsLoaded || prescriptionsLoading) return;
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
  }, [prescriptionsLoaded, prescriptionsLoading]);

  const loadQueueStatus = useCallback(async () => {
    setQueueStatusLoading(true);
    try {
      const resp = await patientApi.queue.status();
      setQueueStatus(resp);
    } catch (e: any) {
      // Non-blocking - queue status is optional info
      console.warn('Failed to load queue status:', e?.message);
    } finally {
      setQueueStatusLoading(false);
    }
  }, []);

  const loadAppointmentQueueStatus = useCallback(async (appointmentId: number) => {
    setAppointmentQueueLoading(true);
    try {
      const resp = await patientApi.queue.appointmentStatus(appointmentId);
      setAppointmentQueueStatus(resp);
    } catch (e: any) {
      setAppointmentQueueStatus(null);
    } finally {
      setAppointmentQueueLoading(false);
    }
  }, []);

  // Load queue status on mount and periodically
  useEffect(() => {
    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadQueueStatus]);

  useEffect(() => {
    if (active === 'medical_records') {
      loadEhr();
    }
    if (active === 'lab_results') {
      loadLabOrders();
    }
    if (active === 'queue_status') {
      const todayAppointments = queueStatus?.todays_appointments || [];
      if (todayAppointments.length > 0) {
        loadAppointmentQueueStatus(todayAppointments[0].id);
      } else {
        setAppointmentQueueStatus(null);
      }
    }
    if (active === 'billing') {
      loadBilling();
    }
    if (active === 'feedback') {
      loadFeedback();
    }
    if (active === 'notifications') {
      loadNotificationsLazy();
    }
    if (active === 'prescriptions') {
      loadPrescriptions();
    }
  }, [active, loadTeleconsultations, loadEhr, loadLabOrders, loadBilling, loadFeedback, loadNotificationsLazy, loadPrescriptions, loadAppointmentQueueStatus, queueStatus]);

  const loadDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    try {
      const resp = await patientApi.departments.list();
      setDepartments(Array.isArray(resp.data) ? resp.data : []);
    } catch {
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!appointmentModalOpen) return;
    loadDepartments();
  }, [appointmentModalOpen, loadDepartments]);

  useEffect(() => {
    if (!appointmentModalOpen) return;
    const departmentId = Number(appointmentForm.department_id);
    if (!appointmentForm.appointment_date || !Number.isFinite(departmentId) || departmentId <= 0) {
      setAvailableSlots([]);
      setSlotsError(null);
      setSlotsLoading(false);
      return;
    }

    setSlotsLoading(true);
    setSlotsError(null);
    patientApi.slots
      .list({
        date: appointmentForm.appointment_date,
        department_id: departmentId,
        visit_mode: 'PHYSICAL',
        available_only: true,
      })
      .then((resp) => {
        const rawSlots = Array.isArray(resp.data) ? resp.data : [];
        const today = new Date().toISOString().slice(0, 10);
        const filtered = rawSlots.filter((slot) => {
          if (appointmentForm.appointment_date !== today) return true;
          const start = slot.start_time || '';
          if (!start) return true;
          const parts = start.split(':');
          const hours = parseInt(parts[0] || '0', 10);
          const minutes = parseInt(parts[1] || '0', 10);
          const slotDate = new Date();
          slotDate.setHours(hours, minutes, 0, 0);
          return slotDate >= new Date();
        });
        setAvailableSlots(filtered);
      })
      .catch((e: any) => {
        setAvailableSlots([]);
        setSlotsError(e?.message || 'Failed to load available slots');
      })
      .finally(() => {
        setSlotsLoading(false);
      });
  }, [appointmentModalOpen, appointmentForm.appointment_date, appointmentForm.department_id]);

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
      department_id: '',
      doctor_id: '',
      appointment_date: '',
      appointment_time: '',
      type: 'in_person',
      reason: '',
    });
    setAvailableSlots([]);
    setSlotsError(null);
    setHeldSlotId(null);
    setAppointmentModalOpen(true);
  };

  const openEditAppointment = (appt: PatientAppointment) => {
    const normalizeDateInput = (value?: string | null) => {
      if (!value) return '';
      const trimmed = String(value).trim();
      if (trimmed === '') return '';
      if (trimmed.includes('T')) return trimmed.slice(0, 10);
      if (trimmed.includes(' ')) return trimmed.slice(0, 10);
      return trimmed;
    };

    setEditingAppointment(appt);
    setAppointmentForm({
      clinic_id: '',
      department_id: appt.department_id ? String(appt.department_id) : '',
      doctor_id: appt.doctor_id ? String(appt.doctor_id) : '',
      appointment_date: normalizeDateInput(appt.appointment_date),
      appointment_time: '',
      type: appt.type || 'in_person',
      reason: appt.reason || '',
    });
    setHeldSlotId(null);
    setAvailableSlots([]);
    setAppointmentModalOpen(true);
  };

  const closeAppointmentModal = () => {
    if (appointmentSaving) return;
    setAppointmentModalOpen(false);
    setEditingAppointment(null);
    setConsultationFeeError(null);
  };

  const loadConsultationFee = useCallback(async () => {
    setConsultationFeeLoading(true);
    setConsultationFeeError(null);
    try {
      const resp = await patientApi.billing.consultationFee();
      const amount = Number(resp.amount);
      setConsultationFee(Number.isFinite(amount) ? amount : 0);
    } catch (e: any) {
      setConsultationFee(null);
      setConsultationFeeError(e?.message || 'Failed to load consultation fee');
    } finally {
      setConsultationFeeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!appointmentModalOpen || editingAppointment) return;
    loadConsultationFee();
  }, [appointmentModalOpen, editingAppointment, loadConsultationFee]);

  const holdSlot = async (slot: PatientSlot) => {
    if (slotHoldLoading) return;
    setSlotsError(null);
    setSlotHoldLoading(true);
    try {
      await patientApi.slots.hold(slot.id, { visit_mode: 'PHYSICAL' });
      setHeldSlotId(slot.id);
      setAppointmentForm((p) => ({ ...p, appointment_time: (slot.start_time || '').slice(0, 5) }));
      setAvailableSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, status: 'HELD' } : s))
      );
    } catch (e: any) {
      setSlotsError(e?.message || 'Failed to hold slot');
    } finally {
      setSlotHoldLoading(false);
    }
  };

  const submitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAppointmentSaving(true);

    try {
      if (!heldSlotId) {
        throw new Error('Please select a time slot before continuing.');
      }

      if (editingAppointment) {
        await patientApi.appointments.reschedule(editingAppointment.id, {
          slot_id: heldSlotId,
          reason: appointmentForm.reason.trim() === '' ? null : appointmentForm.reason.trim(),
        });
      } else {
        await patientApi.slots.confirm(heldSlotId, {
          visit_mode: 'PHYSICAL',
          reason: appointmentForm.reason.trim() === '' ? undefined : appointmentForm.reason.trim(),
        });
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

  const cancelAppointment = async (appt: PatientAppointment) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setError(null);
    try {
      await patientApi.appointments.cancel(appt.id);
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
        first_name: profileForm.first_name.trim() === '' ? undefined : profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim() === '' ? undefined : profileForm.last_name.trim(),
        email: profileForm.email.trim() === '' ? undefined : profileForm.email.trim(),
        phone: profileForm.phone.trim() === '' ? null : profileForm.phone.trim(),
        date_of_birth: profileForm.date_of_birth.trim() === '' ? null : profileForm.date_of_birth.trim(),
        gender: profileForm.gender.trim() === '' ? null : profileForm.gender.trim(),
        address: profileForm.address.trim() === '' ? null : profileForm.address.trim(),
        nic_passport: profileForm.nic_passport.trim() === '' ? null : profileForm.nic_passport.trim(),
        emergency_contact_name: profileForm.emergency_contact_name.trim() === '' ? null : profileForm.emergency_contact_name.trim(),
        emergency_contact_phone: profileForm.emergency_contact_phone.trim() === '' ? null : profileForm.emergency_contact_phone.trim(),
        emergency_contact_relationship: profileForm.emergency_contact_relationship.trim() === '' ? null : profileForm.emergency_contact_relationship.trim(),
      };
      const updated = await patientApi.profile.update(payload);
      setProfileData(updated);
      setProfileEditMode(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to update profile');
    }
  };

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordMessage(null);
    setPasswordSaving(true);
    try {
      const payload = {
        current_password: passwordForm.current_password,
        password: passwordForm.password,
        password_confirmation: passwordForm.password_confirmation,
      };
      const resp = await patientApi.profile.updatePassword(payload);
      setPasswordMessage(resp.message || 'Password updated.');
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const patientName =
    profileData?.user?.name ||
    `${profileData?.user?.first_name || ''} ${profileData?.user?.last_name || ''}`.trim() ||
    authUser?.name ||
    'Patient';
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
          onClick={() => setActive('queue_status')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'queue_status' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">Queue Status</span>
        </button>
        <button
          onClick={() => setActive('medical_records')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'medical_records' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-sm font-medium">Medical Records</span>
        </button>
        <button
          onClick={() => setActive('lab_results')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'lab_results' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <FlaskConical className="w-5 h-5" />
          <span className="text-sm font-medium">Lab Results</span>
        </button>
        <button
          onClick={() => setActive('prescriptions')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'prescriptions' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Pill className="w-5 h-5" />
          <span className="text-sm font-medium">Prescriptions</span>
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
                    setActive('queue_status');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'queue_status' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Queue Status</span>
                </button>
                <button
                  onClick={() => {
                    setActive('medical_records');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'medical_records' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">Medical Records</span>
                </button>
                <button
                  onClick={() => {
                    setActive('lab_results');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'lab_results' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <FlaskConical className="w-5 h-5" />
                  <span className="text-sm font-medium">Lab Results</span>
                </button>
                <button
                  onClick={() => {
                    setActive('prescriptions');
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'prescriptions' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <Pill className="w-5 h-5" />
                  <span className="text-sm font-medium">Prescriptions</span>
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

              {/* Queue Status Section - Shows when patient has an appointment today */}
              {queueStatus && (queueStatus.queue_entry || queueStatus.todays_appointments.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg shadow-lg p-6 text-white"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Today's Queue Status</h2>
                  </div>
                  
                  {queueStatus.queue_entry && (
                    <div className="bg-white/20 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-3xl font-bold">#{queueStatus.queue_entry.queue_number || '-'}</p>
                          <p className="text-sm opacity-90">Your Queue Number</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold">{queueStatus.queue_stats.my_position || '-'}</p>
                          <p className="text-sm opacity-90">Your Position</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold">{queueStatus.queue_stats.people_ahead}</p>
                          <p className="text-sm opacity-90">People Ahead</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold">
                            {queueStatus.queue_stats.estimated_wait_minutes != null 
                              ? `~${queueStatus.queue_stats.estimated_wait_minutes}m`
                              : '-'}
                          </p>
                          <p className="text-sm opacity-90">Est. Wait Time</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/30 flex items-center justify-between">
                        <span className="text-sm">
                          Status: <span className="font-semibold capitalize">{queueStatus.queue_entry.status.replace('_', ' ')}</span>
                        </span>
                        {queueStatus.queue_entry.appointment?.doctor && (
                          <span className="text-sm">
                            Doctor: <span className="font-semibold">Dr. {queueStatus.queue_entry.appointment.doctor.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {queueStatus.todays_appointments.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Today's Appointments
                      </h3>
                      <div className="space-y-2">
                        {queueStatus.todays_appointments.map((appt) => (
                          <div key={appt.id} className="bg-white/20 rounded-lg px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold">{appt.time.slice(0, 5)}</span>
                              <span className="text-sm capitalize px-2 py-0.5 bg-white/20 rounded">
                                {appt.type === 'in_person' ? 'Physical' : 'Online'}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="mr-3">{appt.clinic}</span>
                              <span className="capitalize font-semibold px-2 py-0.5 rounded bg-white/20">{appt.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!queueStatus.queue_entry && queueStatus.todays_appointments.length > 0 && (
                    <p className="text-sm opacity-90 mt-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Please check in at the reception to get your queue number
                    </p>
                  )}
                </motion.div>
              )}

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

          {active === 'queue_status' && (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Queue Status</h2>
                  <p className="text-gray-600 text-sm">Live updates for today’s appointment</p>
                </div>
              </div>
              {queueStatusLoading || appointmentQueueLoading ? (
                <div className="text-center py-10">Loading...</div>
              ) : queueStatus?.todays_appointments?.length ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase">Current Number</div>
                      <div className="text-xl font-semibold text-gray-900">{appointmentQueueStatus?.current_number ?? '-'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase">My Position</div>
                      <div className="text-xl font-semibold text-gray-900">{appointmentQueueStatus?.my_position ?? '-'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase">Estimated Wait</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {appointmentQueueStatus?.estimated_wait_minutes != null ? `~${appointmentQueueStatus.estimated_wait_minutes}m` : '-'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase">Today</div>
                      <div className="text-xl font-semibold text-gray-900">Yes</div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-1">Today’s Appointment</div>
                    <div className="text-sm text-gray-600">
                      {queueStatus.todays_appointments[0]?.time || '-'} • {queueStatus.todays_appointments[0]?.clinic || 'OPD'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Doctor: {queueStatus.todays_appointments[0]?.doctor || 'Any available doctor'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">No appointments scheduled for today.</div>
              )}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={profileForm.first_name}
                          onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))}
                          disabled={!profileEditMode}
                          className={`w-full px-3 py-2 border rounded-lg ${profileEditMode ? '' : 'bg-gray-50'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={profileForm.last_name}
                          onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))}
                          disabled={!profileEditMode}
                          className={`w-full px-3 py-2 border rounded-lg ${profileEditMode ? '' : 'bg-gray-50'}`}
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NIC/Passport</label>
                        <input
                          type="text"
                          value={profileForm.nic_passport}
                          onChange={(e) => setProfileForm((p) => ({ ...p, nic_passport: e.target.value }))}
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                        <input
                          type="text"
                          value={profileForm.emergency_contact_name}
                          onChange={(e) => setProfileForm((p) => ({ ...p, emergency_contact_name: e.target.value }))}
                          disabled={!profileEditMode}
                          className={`w-full px-3 py-2 border rounded-lg ${profileEditMode ? '' : 'bg-gray-50'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                        <input
                          type="text"
                          value={profileForm.emergency_contact_phone}
                          onChange={(e) => setProfileForm((p) => ({ ...p, emergency_contact_phone: e.target.value }))}
                          disabled={!profileEditMode}
                          className={`w-full px-3 py-2 border rounded-lg ${profileEditMode ? '' : 'bg-gray-50'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Relationship</label>
                        <input
                          type="text"
                          value={profileForm.emergency_contact_relationship}
                          onChange={(e) => setProfileForm((p) => ({ ...p, emergency_contact_relationship: e.target.value }))}
                          disabled={!profileEditMode}
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

                  <div className="border-t mt-8 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Change Password</h3>
                    <form onSubmit={submitPasswordChange} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                          <input
                            type="password"
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <input
                            type="password"
                            value={passwordForm.password}
                            onChange={(e) => setPasswordForm((p) => ({ ...p, password: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            value={passwordForm.password_confirmation}
                            onChange={(e) => setPasswordForm((p) => ({ ...p, password_confirmation: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                      {passwordMessage && (
                        <div className="text-sm text-green-600">{passwordMessage}</div>
                      )}
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={passwordSaving}
                          className="bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                        >
                          {passwordSaving ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>
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
                                <td className="px-6 py-4 text-sm text-gray-900">{formatDisplayDate(appt.appointment_date)}</td>
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

          {active === 'lab_results' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Lab Results</h2>
                <p className="text-gray-600 text-sm">View your lab orders and results</p>
              </div>

              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {labOrdersLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-600">Loading...</td>
                        </tr>
                      ) : labOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-600">No lab results found.</td>
                        </tr>
                      ) : (
                        labOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{order.order_number || `#${order.id}`}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{order.test_type || order.test_description || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{order.status || 'pending'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{order.order_date || '-'}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setSelectedLabOrder(order)}
                                className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() => openInvoiceDetails(inv)}
                                      className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-3 py-1.5 rounded-full text-xs transition duration-300"
                                    >
                                      View
                                    </button>
                                    {remaining > 0 && inv.status !== 'cancelled' ? (
                                      <button
                                        onClick={() => payInvoice(inv)}
                                        className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                                      >
                                        Pay
                                      </button>
                                    ) : null}
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

            <form onSubmit={submitAppointment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    required
                    value={appointmentForm.department_id}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAppointmentForm((p) => ({
                        ...p,
                        department_id: value,
                        appointment_time: '',
                      }));
                      setHeldSlotId(null);
                      setAvailableSlots([]);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {departmentsLoading && (
                    <div className="text-xs text-gray-500 mt-1">Loading departments...</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={appointmentForm.appointment_date}
                    onChange={(e) => {
                      setAppointmentForm((p) => ({ ...p, appointment_date: e.target.value, appointment_time: '' }));
                      setHeldSlotId(null);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value="in_person"
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
                  >
                    <option value="in_person">In Person</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Available Slots</label>
                    <span className="text-xs text-gray-500">Select a slot to hold it for 5 minutes</span>
                  </div>
                  {!appointmentForm.department_id || !appointmentForm.appointment_date ? (
                    <div className="text-sm text-gray-500 border border-dashed rounded-lg p-3">
                      Select department and date to load slots.
                    </div>
                  ) : slotsLoading ? (
                    <div className="text-sm text-gray-500 border border-dashed rounded-lg p-3">Loading available slots...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-sm text-gray-500 border border-dashed rounded-lg p-3">
                      No slots available for the selected date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => {
                        const isSelected = heldSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={slotHoldLoading}
                            onClick={() => holdSlot(slot)}
                            className={`rounded-lg border px-3 py-2 text-left transition ${
                              isSelected
                                ? 'border-teal-600 bg-teal-600 text-white'
                                : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50 text-gray-800'
                            }`}
                          >
                            <div className="text-sm font-semibold">{(slot.start_time || '').slice(0, 5)}</div>
                            <div className={`text-xs ${isSelected ? 'text-teal-100' : 'text-gray-500'}`}>
                              {isSelected ? 'Held' : 'Available'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {slotsError && <div className="text-xs text-red-600 mt-2">{slotsError}</div>}
                  {!heldSlotId && availableSlots.length > 0 && (
                    <div className="text-xs text-gray-500 mt-2">Select a slot to continue.</div>
                  )}
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

              {!editingAppointment && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span className="font-medium">Consultation fee</span>
                    <span>
                      {consultationFeeLoading
                        ? 'Loading...'
                        : consultationFee != null
                          ? formatMoney(consultationFee)
                          : '-'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Paid online before booking and recorded in your billing history.
                  </div>
                  {consultationFeeError ? (
                    <div className="text-xs text-red-600 mt-1">{consultationFeeError}</div>
                  ) : null}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={appointmentSaving || !heldSlotId}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  {appointmentSaving
                    ? 'Saving...'
                    : editingAppointment
                      ? 'Reschedule'
                      : consultationFee != null && consultationFee > 0
                        ? `Pay ${formatMoney(consultationFee)} & Book`
                        : 'Create'}
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

      {selectedLabOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Lab Order Details</h2>
                <p className="text-gray-600 text-sm">{selectedLabOrder.order_number || `#${selectedLabOrder.id}`}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLabOrder(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 uppercase">Test</div>
                <div className="text-sm font-semibold text-gray-900">{selectedLabOrder.test_type || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 uppercase">Status</div>
                <div className="text-sm font-semibold text-gray-900">{selectedLabOrder.status || 'pending'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 uppercase">Order Date</div>
                <div className="text-sm font-semibold text-gray-900">{selectedLabOrder.order_date || '-'}</div>
              </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <div className="text-sm font-semibold text-gray-900">Results</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Range</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedLabOrder.results.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-600">No results yet.</td>
                      </tr>
                    ) : (
                      selectedLabOrder.results.map((res) => (
                        <tr key={res.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{res.test_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {res.result_value ?? '-'} {res.unit || ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{res.reference_range || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{res.result_date || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {res.file_url ? (
                              <a className="text-teal-600 hover:text-teal-700 underline" href={res.file_url} target="_blank" rel="noreferrer">
                                Download
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
                <p className="text-gray-600 text-sm">{selectedInvoice.invoice_number}</p>
              </div>
              <button
                type="button"
                onClick={closeInvoiceDetails}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {invoiceDetailsLoading ? (
              <div className="text-center py-10">Loading...</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase">Amount</div>
                    <div className="text-sm font-semibold text-gray-900">{formatMoney(selectedInvoice.amount)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase">Status</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedInvoice.status}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase">Issued</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedInvoice.issued_at}</div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <div className="text-sm font-semibold text-gray-900">Payments</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(selectedInvoice.payments || []).length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-gray-600">No payments yet.</td>
                          </tr>
                        ) : (
                          (selectedInvoice.payments || []).map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{formatMoney(p.amount)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{p.method}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{p.paid_at || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => window.print()}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                  >
                    Print
                  </button>
                </div>
              </div>
            )}
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
