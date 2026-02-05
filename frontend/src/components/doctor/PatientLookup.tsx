import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Pill, 
  Hospital,
  FileText,
  Clock,
  AlertCircle,
  X,
  TestTube,
  Stethoscope,
  Activity,
  Heart
} from 'lucide-react';
import { doctorApi } from '../../api/doctor';
import toast from 'react-hot-toast';

interface PatientRecord {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  patient_profile?: {
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    blood_type?: string;
    city?: string;
    state?: string;
    allergies?: string;
    medical_conditions?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
  } | null;
  last_consultation?: {
    date: string;
    time: string;
    doctor_name: string;
    reason?: string;
  } | null;
  prescriptions?: Array<{
    id: number;
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    status: string;
    prescribed_date: string;
    doctor_name?: string;
  }>;
  lab_orders?: Array<{
    id: number;
    test_type: string;
    test_description?: string;
    status: string;
    order_date: string;
    due_date?: string;
    result_date?: string;
    result_value?: string;
    result_unit?: string;
    notes?: string;
    instructions?: string;
    doctor_name?: string;
  }>;
  clinic_referrals?: Array<{
    id: number;
    clinic_name: string;
    clinic_location?: string;
    reason: string;
    priority: string;
    status: string;
    preferred_appointment_date?: string;
    created_at: string;
  }>;
}

interface PatientLookupProps {
  open: boolean;
  onClose: () => void;
}

const PatientLookup: React.FC<PatientLookupProps> = ({ open, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [patientRecord, setPatientRecord] = useState<PatientRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(true);

  const normalizedPhoneDigits = useMemo(() => phoneNumber.replace(/[^\d+]/g, '').trim(), [phoneNumber]);

  const handleSearch = async (silent = false, includeName = true) => {
    if (!phoneNumber.trim()) {
      if (!silent) {
        toast.error('Please enter a phone number');
      }
      return;
    }

    setLoading(true);
    setNotFound(false);
    setPatientRecord(null);

    try {
      const nameFilter = includeName ? (patientName.trim() || undefined) : undefined;
      const response = await doctorApi.patients.searchByPhone(phoneNumber.trim(), nameFilter);
      if (response.data) {
        setPatientRecord(response.data);
        setPatientName(`${response.data.first_name || ''} ${response.data.last_name || ''}`.trim());
        setPatientId(String(response.data.id || ''));
      } else {
        setNotFound(true);
      }
    } catch (error: any) {
      console.error('Patient search error:', error);
      const message = error?.message || 'Search failed. Please try again.';
      const normalized = message.toLowerCase();
      if (
        normalized.includes('no patient found') ||
        normalized.includes('patient record not found') ||
        normalized.includes('name does not match')
      ) {
        setNotFound(true);
      } else if (!silent) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoSearchEnabled) return;
    if (!normalizedPhoneDigits || normalizedPhoneDigits.length < 7) {
      setPatientRecord(null);
      setNotFound(false);
      setPatientId('');
      return;
    }
    const timeout = setTimeout(() => {
      handleSearch(true, false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [normalizedPhoneDigits, autoSearchEnabled]);

  const handleClose = () => {
    setPhoneNumber('');
    setPatientName('');
    setPatientId('');
    setPatientRecord(null);
    setNotFound(false);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': case 'dispensed': return 'text-blue-600 bg-blue-100';
      case 'pending': case 'scheduled': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-gray-900">Patient Record Lookup</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Search Section */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., +1234567890"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Patient Name
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., John Doe"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  readOnly={!!patientRecord}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Patient ID
                </label>
                <input
                  type="text"
                  value={patientId}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  placeholder="Auto-filled"
                />
              </div>
              <div className="flex items-end gap-3">
                <button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Search Records</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setAutoSearchEnabled((prev) => !prev)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
                >
                  {autoSearchEnabled ? 'Auto On' : 'Auto Off'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <AnimatePresence>
            {notFound && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Patient Found</h3>
                <p className="text-gray-500">
                  No patient record found for phone number: <strong>{phoneNumber}</strong>
                </p>
              </motion.div>
            )}

            {patientRecord && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Patient Info & Last Consultation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Patient Basic Info */}
                  <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border border-teal-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-teal-600" />
                      Patient Information
                    </h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Patient ID:</span>
                        <p className="text-gray-800 font-semibold">{patientRecord.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Name:</span>
                        <p className="text-gray-800 font-semibold">{patientRecord.first_name} {patientRecord.last_name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Phone:</span>
                        <p className="text-gray-800 font-semibold">{patientRecord.patient_profile?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <p className="text-gray-800 text-sm">{patientRecord.email}</p>
                      </div>
                      {patientRecord.patient_profile?.date_of_birth && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
                          <p className="text-gray-800">{new Date(patientRecord.patient_profile.date_of_birth).toLocaleDateString()}</p>
                        </div>
                      )}
                      {patientRecord.patient_profile?.gender && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Gender:</span>
                          <p className="text-gray-800 capitalize">{patientRecord.patient_profile.gender}</p>
                        </div>
                      )}
                      {patientRecord.patient_profile?.blood_type && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Blood Type:</span>
                          <p className="text-gray-800 font-semibold text-red-600">{patientRecord.patient_profile.blood_type}</p>
                        </div>
                      )}
                    </div>
                    {patientRecord.patient_profile?.address && (
                      <div className="mt-4">
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Address:
                        </span>
                        <p className="text-gray-800 text-sm">
                          {patientRecord.patient_profile.address}
                          {patientRecord.patient_profile.city && `, ${patientRecord.patient_profile.city}`}
                          {patientRecord.patient_profile.state && `, ${patientRecord.patient_profile.state}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Last Consultation & Clinical Info */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-purple-600" />
                      Clinical Information
                    </h3>
                    
                    {/* Last Consultation */}
                    <div className="mb-4 p-4 bg-white rounded-lg border border-purple-100">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        Last Consultation
                      </h4>
                      {patientRecord.last_consultation ? (
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium text-gray-600">Date:</span> {new Date(patientRecord.last_consultation.date).toLocaleDateString()}</p>
                          <p><span className="font-medium text-gray-600">Time:</span> {patientRecord.last_consultation.time}</p>
                          <p><span className="font-medium text-gray-600">Doctor:</span> Dr. {patientRecord.last_consultation.doctor_name}</p>
                          {patientRecord.last_consultation.reason && (
                            <p><span className="font-medium text-gray-600">Reason:</span> {patientRecord.last_consultation.reason}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No previous consultations</p>
                      )}
                    </div>

                    {/* Medical Conditions & Allergies */}
                    <div className="grid grid-cols-1 gap-3">
                      {patientRecord.patient_profile?.allergies && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <span className="text-sm font-semibold text-red-700 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Allergies:
                          </span>
                          <p className="text-red-800 text-sm mt-1">{patientRecord.patient_profile.allergies}</p>
                        </div>
                      )}
                      {patientRecord.patient_profile?.medical_conditions && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <span className="text-sm font-semibold text-yellow-700 flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            Medical Conditions:
                          </span>
                          <p className="text-yellow-800 text-sm mt-1">{patientRecord.patient_profile.medical_conditions}</p>
                        </div>
                      )}
                      {(patientRecord.patient_profile?.emergency_contact_phone ||
                        patientRecord.patient_profile?.emergency_contact_name) && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            Emergency Contact:
                          </span>
                          <div className="text-blue-800 text-sm mt-1 space-y-1">
                            {patientRecord.patient_profile?.emergency_contact_name && (
                              <p>{patientRecord.patient_profile.emergency_contact_name}</p>
                            )}
                            {patientRecord.patient_profile?.emergency_contact_phone && (
                              <p>{patientRecord.patient_profile.emergency_contact_phone}</p>
                            )}
                            {patientRecord.patient_profile?.emergency_contact_relationship && (
                              <p className="text-blue-700">{patientRecord.patient_profile.emergency_contact_relationship}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lab Orders */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <TestTube className="w-5 h-5 text-green-600" />
                      Lab Orders ({patientRecord.lab_orders?.length || 0})
                    </h3>
                  </div>
                  <div className="p-6">
                    {patientRecord.lab_orders && patientRecord.lab_orders.length > 0 ? (
                      <div className="space-y-4">
                        {patientRecord.lab_orders.map((labOrder) => (
                          <div key={labOrder.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-800">{labOrder.test_type}</h4>
                                {labOrder.test_description && (
                                  <p className="text-sm text-gray-600">{labOrder.test_description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(labOrder.status)}`}>
                                  {labOrder.status}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Order Date:</span>
                                <p className="text-gray-800">{new Date(labOrder.order_date).toLocaleDateString()}</p>
                              </div>
                              {labOrder.due_date && (
                                <div>
                                  <span className="font-medium text-gray-600">Due Date:</span>
                                  <p className="text-gray-800">{new Date(labOrder.due_date).toLocaleDateString()}</p>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-600">Ordered by:</span>
                                <p className="text-gray-800">Dr. {labOrder.doctor_name}</p>
                              </div>
                            </div>
                            {labOrder.result_value && (
                              <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                                <span className="font-medium text-green-700 text-sm">Result:</span>
                                <p className="text-green-800">{labOrder.result_value} {labOrder.result_unit}</p>
                              </div>
                            )}
                            {labOrder.instructions && (
                              <div className="mt-3">
                                <span className="font-medium text-gray-600 text-sm">Instructions:</span>
                                <p className="text-gray-800 text-sm">{labOrder.instructions}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No lab orders found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prescriptions */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Pill className="w-5 h-5 text-blue-600" />
                      Prescriptions ({patientRecord.prescriptions?.length || 0})
                    </h3>
                  </div>
                  <div className="p-6">
                    {patientRecord.prescriptions && patientRecord.prescriptions.length > 0 ? (
                      <div className="space-y-4">
                        {patientRecord.prescriptions.map((prescription) => (
                          <div key={prescription.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-800">{prescription.medication_name}</h4>
                                <p className="text-sm text-gray-600">Prescribed by: Dr. {prescription.doctor_name || 'Unknown'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                                  {prescription.status}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(prescription.prescribed_date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Dosage:</span>
                                <p className="text-gray-800">{prescription.dosage}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Frequency:</span>
                                <p className="text-gray-800">{prescription.frequency}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Duration:</span>
                                <p className="text-gray-800">{prescription.duration}</p>
                              </div>
                            </div>
                            {prescription.instructions && (
                              <div className="mt-3">
                                <span className="font-medium text-gray-600 text-sm">Instructions:</span>
                                <p className="text-gray-800 text-sm">{prescription.instructions}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Pill className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No prescriptions found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clinic Referrals */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Hospital className="w-5 h-5 text-purple-600" />
                      Clinic Referrals ({patientRecord.clinic_referrals?.length || 0})
                    </h3>
                  </div>
                  <div className="p-6">
                    {patientRecord.clinic_referrals && patientRecord.clinic_referrals.length > 0 ? (
                      <div className="space-y-4">
                        {patientRecord.clinic_referrals.map((referral, index) => (
                          <div key={referral.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-800">{referral.clinic_name}</h4>
                                {referral.clinic_location && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {referral.clinic_location}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(referral.priority)}`}>
                                  {referral.priority}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                                  {referral.status}
                                </span>
                              </div>
                            </div>
                            <div className="mb-3">
                              <span className="font-medium text-gray-600 text-sm">Reason:</span>
                              <p className="text-gray-800 text-sm">{referral.reason}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Referred: {new Date(referral.created_at).toLocaleDateString()}</span>
                              </div>
                              {referral.preferred_appointment_date && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>Preferred: {new Date(referral.preferred_appointment_date).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Hospital className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No clinic referrals found</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default PatientLookup;
