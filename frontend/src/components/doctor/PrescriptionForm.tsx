import React, { useEffect, useMemo, useState, useRef } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import type { CreatePrescriptionPayload } from '../../types/doctor';

export interface InventoryOption {
  id: number;
  name: string;
  generic_name?: string | null;
  brand_name?: string | null;
  category?: string | null;
}

export interface ClinicOption {
  id: number;
  name: string;
}

export interface PatientOption {
  id: number;
  name: string;
  phone_number: string;
}

interface ItemRow {
  inventory_item_id: string;
  medicine_name: string;
  quantity: string;
  dosage: string;
  frequency: string;
  duration_days: string;
  instructions: string;
  meal_timing: string;
}

// Searchable Medicine Select Component
interface MedicineSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: InventoryOption[];
  required?: boolean;
}

const MedicineSelect: React.FC<MedicineSelectProps> = ({ value, onChange, options, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => String(o.id) === value);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();
    return options.filter(o => 
      (o.name && o.name.toLowerCase().includes(term)) ||
      (o.generic_name && o.generic_name.toLowerCase().includes(term)) ||
      (o.brand_name && o.brand_name.toLowerCase().includes(term)) ||
      (o.category && o.category.toLowerCase().includes(term))
    );
  }, [options, search]);

  // Group by category
  const groupedOptions = useMemo(() => {
    const groups: Record<string, InventoryOption[]> = {};
    filteredOptions.forEach(opt => {
      const cat = opt.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(opt);
    });
    return groups;
  }, [filteredOptions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between bg-white hover:bg-gray-50"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.name : 'Select medicine...'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Hidden input for form validation */}
      <input 
        type="text" 
        value={value} 
        required={required} 
        onChange={() => {}} 
        className="sr-only" 
        tabIndex={-1}
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, generic, brand, or category..."
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-60">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No medicines found</div>
            ) : (
              Object.entries(groupedOptions).map(([category, items]) => (
                <div key={category}>
                  <div className="px-3 py-1 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider sticky top-0">
                    {category}
                  </div>
                  {items.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onChange(String(opt.id));
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-teal-50 transition ${
                        String(opt.id) === value ? 'bg-teal-100' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900 text-sm">{opt.name}</div>
                      <div className="text-xs text-gray-500">
                        {opt.generic_name && <span>{opt.generic_name}</span>}
                        {opt.brand_name && opt.generic_name && <span> • </span>}
                        {opt.brand_name && <span className="text-teal-600">{opt.brand_name}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Extract dosage from medicine name (e.g. "Amlodipine 10mg" -> "10mg")
const extractDosageFromName = (medicineName: string): string => {
  const dosageMatch = medicineName.match(/\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?|iu|%))\b/i);
  return dosageMatch ? dosageMatch[1] : '';
};

const FREQUENCY_OPTIONS = [
  { value: '', label: 'Select frequency' },
  { value: 'Once daily', label: 'Once daily (OD)' },
  { value: 'Twice daily', label: 'Twice daily (BD)' },
  { value: 'Three times daily', label: 'Three times daily (TDS)' },
  { value: 'Four times daily', label: 'Four times daily (QDS)' },
  { value: 'Every 4 hours', label: 'Every 4 hours' },
  { value: 'Every 6 hours', label: 'Every 6 hours' },
  { value: 'Every 8 hours', label: 'Every 8 hours' },
  { value: 'Every 12 hours', label: 'Every 12 hours' },
  { value: 'As needed', label: 'As needed (PRN)' },
  { value: 'At bedtime', label: 'At bedtime (HS)' },
  { value: 'On alternate days', label: 'On alternate days' },
  { value: 'Weekly', label: 'Weekly' },
];

const MEAL_TIMING_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'Before meals', label: 'Before meals' },
  { value: 'After meals', label: 'After meals' },
  { value: 'With meals', label: 'With meals' },
  { value: 'On empty stomach', label: 'On empty stomach' },
  { value: 'Independent of meals', label: 'Independent of meals' },
];

// Default common medicines list (used when inventory is empty or as additional options)
const DEFAULT_MEDICINES: InventoryOption[] = [
  // Analgesics & Antipyretics
  { id: -1, name: 'Paracetamol 500mg', generic_name: 'Acetaminophen', brand_name: 'Panadol', category: 'Analgesics' },
  { id: -2, name: 'Paracetamol 650mg', generic_name: 'Acetaminophen', brand_name: 'Calpol', category: 'Analgesics' },
  { id: -3, name: 'Ibuprofen 400mg', generic_name: 'Ibuprofen', brand_name: 'Brufen', category: 'Analgesics' },
  { id: -4, name: 'Ibuprofen 200mg', generic_name: 'Ibuprofen', brand_name: 'Advil', category: 'Analgesics' },
  { id: -5, name: 'Aspirin 75mg', generic_name: 'Acetylsalicylic Acid', brand_name: 'Disprin', category: 'Analgesics' },
  { id: -6, name: 'Diclofenac 50mg', generic_name: 'Diclofenac Sodium', brand_name: 'Voltaren', category: 'Analgesics' },
  { id: -7, name: 'Naproxen 500mg', generic_name: 'Naproxen', brand_name: 'Naprosyn', category: 'Analgesics' },
  
  // Antibiotics
  { id: -10, name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', brand_name: 'Amoxil', category: 'Antibiotics' },
  { id: -11, name: 'Amoxicillin 250mg', generic_name: 'Amoxicillin', brand_name: 'Amoxil', category: 'Antibiotics' },
  { id: -12, name: 'Azithromycin 500mg', generic_name: 'Azithromycin', brand_name: 'Zithromax', category: 'Antibiotics' },
  { id: -13, name: 'Azithromycin 250mg', generic_name: 'Azithromycin', brand_name: 'Z-Pack', category: 'Antibiotics' },
  { id: -14, name: 'Ciprofloxacin 500mg', generic_name: 'Ciprofloxacin', brand_name: 'Cipro', category: 'Antibiotics' },
  { id: -15, name: 'Metronidazole 400mg', generic_name: 'Metronidazole', brand_name: 'Flagyl', category: 'Antibiotics' },
  { id: -16, name: 'Cephalexin 500mg', generic_name: 'Cefalexin', brand_name: 'Keflex', category: 'Antibiotics' },
  { id: -17, name: 'Doxycycline 100mg', generic_name: 'Doxycycline', brand_name: 'Vibramycin', category: 'Antibiotics' },
  { id: -18, name: 'Augmentin 625mg', generic_name: 'Amoxicillin/Clavulanate', brand_name: 'Augmentin', category: 'Antibiotics' },
  
  // Antihypertensives
  { id: -20, name: 'Amlodipine 5mg', generic_name: 'Amlodipine', brand_name: 'Norvasc', category: 'Cardiovascular' },
  { id: -21, name: 'Amlodipine 10mg', generic_name: 'Amlodipine', brand_name: 'Norvasc', category: 'Cardiovascular' },
  { id: -22, name: 'Losartan 50mg', generic_name: 'Losartan', brand_name: 'Cozaar', category: 'Cardiovascular' },
  { id: -23, name: 'Atenolol 50mg', generic_name: 'Atenolol', brand_name: 'Tenormin', category: 'Cardiovascular' },
  { id: -24, name: 'Metoprolol 25mg', generic_name: 'Metoprolol', brand_name: 'Lopressor', category: 'Cardiovascular' },
  { id: -25, name: 'Lisinopril 10mg', generic_name: 'Lisinopril', brand_name: 'Zestril', category: 'Cardiovascular' },
  { id: -26, name: 'Enalapril 5mg', generic_name: 'Enalapril', brand_name: 'Vasotec', category: 'Cardiovascular' },
  
  // Diabetes Medications
  { id: -30, name: 'Metformin 500mg', generic_name: 'Metformin', brand_name: 'Glucophage', category: 'Diabetes' },
  { id: -31, name: 'Metformin 850mg', generic_name: 'Metformin', brand_name: 'Glucophage', category: 'Diabetes' },
  { id: -32, name: 'Glimepiride 2mg', generic_name: 'Glimepiride', brand_name: 'Amaryl', category: 'Diabetes' },
  { id: -33, name: 'Glibenclamide 5mg', generic_name: 'Glyburide', brand_name: 'Daonil', category: 'Diabetes' },
  { id: -34, name: 'Sitagliptin 100mg', generic_name: 'Sitagliptin', brand_name: 'Januvia', category: 'Diabetes' },
  
  // Gastrointestinal
  { id: -40, name: 'Omeprazole 20mg', generic_name: 'Omeprazole', brand_name: 'Prilosec', category: 'Gastrointestinal' },
  { id: -41, name: 'Pantoprazole 40mg', generic_name: 'Pantoprazole', brand_name: 'Protonix', category: 'Gastrointestinal' },
  { id: -42, name: 'Ranitidine 150mg', generic_name: 'Ranitidine', brand_name: 'Zantac', category: 'Gastrointestinal' },
  { id: -43, name: 'Domperidone 10mg', generic_name: 'Domperidone', brand_name: 'Motilium', category: 'Gastrointestinal' },
  { id: -44, name: 'Ondansetron 4mg', generic_name: 'Ondansetron', brand_name: 'Zofran', category: 'Gastrointestinal' },
  { id: -45, name: 'Loperamide 2mg', generic_name: 'Loperamide', brand_name: 'Imodium', category: 'Gastrointestinal' },
  { id: -46, name: 'Antacid Suspension', generic_name: 'Aluminium/Magnesium Hydroxide', brand_name: 'Maalox', category: 'Gastrointestinal' },
  
  // Respiratory
  { id: -50, name: 'Salbutamol Inhaler 100mcg', generic_name: 'Albuterol', brand_name: 'Ventolin', category: 'Respiratory' },
  { id: -51, name: 'Montelukast 10mg', generic_name: 'Montelukast', brand_name: 'Singulair', category: 'Respiratory' },
  { id: -52, name: 'Cetirizine 10mg', generic_name: 'Cetirizine', brand_name: 'Zyrtec', category: 'Antihistamines' },
  { id: -53, name: 'Loratadine 10mg', generic_name: 'Loratadine', brand_name: 'Claritin', category: 'Antihistamines' },
  { id: -54, name: 'Fexofenadine 180mg', generic_name: 'Fexofenadine', brand_name: 'Allegra', category: 'Antihistamines' },
  { id: -55, name: 'Chlorpheniramine 4mg', generic_name: 'Chlorpheniramine', brand_name: 'Piriton', category: 'Antihistamines' },
  
  // Cough & Cold
  { id: -60, name: 'Dextromethorphan Syrup', generic_name: 'Dextromethorphan', brand_name: 'Robitussin', category: 'Cough & Cold' },
  { id: -61, name: 'Guaifenesin 100mg/5ml', generic_name: 'Guaifenesin', brand_name: 'Mucinex', category: 'Cough & Cold' },
  { id: -62, name: 'Ambroxol 30mg', generic_name: 'Ambroxol', brand_name: 'Mucosolvan', category: 'Cough & Cold' },
  { id: -63, name: 'Pseudoephedrine 60mg', generic_name: 'Pseudoephedrine', brand_name: 'Sudafed', category: 'Cough & Cold' },
  
  // Vitamins & Supplements
  { id: -70, name: 'Vitamin D3 1000IU', generic_name: 'Cholecalciferol', brand_name: 'Calcirol', category: 'Vitamins' },
  { id: -71, name: 'Vitamin B Complex', generic_name: 'B Vitamins', brand_name: 'Becosules', category: 'Vitamins' },
  { id: -72, name: 'Vitamin C 500mg', generic_name: 'Ascorbic Acid', brand_name: 'Celin', category: 'Vitamins' },
  { id: -73, name: 'Iron + Folic Acid', generic_name: 'Ferrous Sulfate/Folic Acid', brand_name: 'Fefol', category: 'Vitamins' },
  { id: -74, name: 'Calcium + Vitamin D', generic_name: 'Calcium Carbonate/D3', brand_name: 'Shelcal', category: 'Vitamins' },
  { id: -75, name: 'Multivitamin Tablet', generic_name: 'Multivitamins', brand_name: 'Supradyn', category: 'Vitamins' },
  
  // Steroids & Anti-inflammatory
  { id: -80, name: 'Prednisolone 5mg', generic_name: 'Prednisolone', brand_name: 'Wysolone', category: 'Steroids' },
  { id: -81, name: 'Dexamethasone 0.5mg', generic_name: 'Dexamethasone', brand_name: 'Decadron', category: 'Steroids' },
  { id: -82, name: 'Hydrocortisone Cream 1%', generic_name: 'Hydrocortisone', brand_name: 'Cortaid', category: 'Topical' },
  
  // Antifungals
  { id: -85, name: 'Fluconazole 150mg', generic_name: 'Fluconazole', brand_name: 'Diflucan', category: 'Antifungals' },
  { id: -86, name: 'Clotrimazole Cream 1%', generic_name: 'Clotrimazole', brand_name: 'Canesten', category: 'Antifungals' },
  
  // Muscle Relaxants
  { id: -90, name: 'Cyclobenzaprine 10mg', generic_name: 'Cyclobenzaprine', brand_name: 'Flexeril', category: 'Muscle Relaxants' },
  { id: -91, name: 'Thiocolchicoside 4mg', generic_name: 'Thiocolchicoside', brand_name: 'Myoril', category: 'Muscle Relaxants' },
  
  // Sedatives & Sleep Aids
  { id: -95, name: 'Alprazolam 0.25mg', generic_name: 'Alprazolam', brand_name: 'Xanax', category: 'Anxiolytics' },
  { id: -96, name: 'Zolpidem 10mg', generic_name: 'Zolpidem', brand_name: 'Ambien', category: 'Sleep Aids' },
  
  // Eye/Ear Drops
  { id: -100, name: 'Ciprofloxacin Eye Drops 0.3%', generic_name: 'Ciprofloxacin', brand_name: 'Ciloxan', category: 'Ophthalmics' },
  { id: -101, name: 'Artificial Tears', generic_name: 'Carboxymethylcellulose', brand_name: 'Refresh Tears', category: 'Ophthalmics' },
];

export interface PrescriptionFormProps {
  open: boolean;
  saving: boolean;
  inventory: InventoryOption[];
  clinics: ClinicOption[];
  patients: PatientOption[]; // Add patients prop
  initialPatientId?: number | null;
  initialAppointmentId?: number | null;
  initialPatient?: PatientOption | null; // Add initial patient object
  initialPrescription?: any | null; // DoctorPrescription for editing
  onClose: () => void;
  onSubmit: (payload: CreatePrescriptionPayload) => void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  open,
  saving,
  inventory,
  clinics,
  patients,
  initialPatientId,
  initialAppointmentId,
  initialPatient,
  initialPrescription,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    patient_id: '',
    appointment_id: '',
    diagnosis: '',
    notes: '',
    items: [] as ItemRow[],
    is_external: false,
    external_doctor: '',
    external_clinic: '',
    referral_clinic_id: '',
    referral_notes: '',
  });

  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientSearchRef = useRef<HTMLDivElement>(null);

  const inventoryMap = useMemo(() => new Map(inventory.map(i => [i.id, i])), [inventory]);

  const combinedInventory = useMemo(() => {
    const inventoryIds = new Set(inventory.map(i => i.id));
    const uniqueDefaults = DEFAULT_MEDICINES.filter(d => !inventoryIds.has(d.id));
    return [...inventory, ...uniqueDefaults];
  }, [inventory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Combine patients with initialPatient if it exists and isn't already in the list
  const allPatients = useMemo(() => {
    if (initialPatient && !patients.find(p => p.id === initialPatient.id)) {
      return [initialPatient, ...patients];
    }
    return patients;
  }, [patients, initialPatient]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return allPatients;
    const searchLower = patientSearch.toLowerCase();
    return allPatients.filter(p =>
      (p.name && p.name.toLowerCase().includes(searchLower)) ||
      (p.phone_number && p.phone_number.includes(patientSearch))
    );
  }, [allPatients, patientSearch]);

  const selectedPatient = useMemo(() => {
    return allPatients.find(p => String(p.id) === form.patient_id);
  }, [allPatients, form.patient_id]);

  useEffect(() => {
    if (open) {
      const initialItems = initialPrescription?.items?.map((item: any) => ({
        inventory_item_id: String(item.inventory_item_id),
        quantity: String(item.quantity),
        dosage: item.dosage || '',
        frequency: item.frequency || '',
        meal_timing: item.meal_timing || '',
        duration_days: item.duration_days ? String(item.duration_days) : '',
        instructions: item.instructions || '',
      })) || [{ inventory_item_id: '', medicine_name: '', quantity: '1', dosage: '', frequency: '', duration_days: '', instructions: '', meal_timing: '' }];
      
      // If editing an existing prescription, use its data
      if (initialPrescription) {
        setForm({
          patient_id: String(initialPrescription.patient_id) || '',
          appointment_id: String(initialPrescription.appointment_id) || '',
          diagnosis: initialPrescription.diagnosis || '',
          notes: initialPrescription.notes || '',
          items: initialItems,
          is_external: initialPrescription.is_external || false,
          external_doctor: initialPrescription.external_doctor || '',
          external_clinic: initialPrescription.external_clinic || '',
          referral_clinic_id: initialPrescription.referral_clinic_id || '',
          referral_notes: initialPrescription.referral?.notes || '',
        });
        // Set patient search to the patient's name for editing
        const patient = patients.find(p => p.id === initialPrescription.patient_id);
        setPatientSearch(patient?.name || '');
      } else {
        // For new prescriptions, use initialPatientId and initialAppointmentId
        const patientId = initialPatientId ? String(initialPatientId) : '';
        const appointmentId = initialAppointmentId ? String(initialAppointmentId) : '';
        
        setForm({
          patient_id: patientId,
          appointment_id: appointmentId,
          diagnosis: '',
          notes: '',
          items: initialItems,
          is_external: false,
          external_doctor: '',
          external_clinic: '',
          referral_clinic_id: '',
          referral_notes: '',
        });
        
        // Set patient search to the patient's name for new prescription
        if (initialPatient) {
          // Use the provided patient object and ensure patient_id is set
          setPatientSearch(initialPatient.name || '');
          setForm(prev => ({ ...prev, patient_id: String(initialPatient.id) }));
        } else if (initialPatientId) {
          // Fallback to finding in patients list
          const patient = allPatients.find(p => p.id === initialPatientId);
          setPatientSearch(patient?.name || '');
        } else {
          setPatientSearch('');
        }
      }
    } else {
      // Reset form when closed
      setForm({
        patient_id: '',
        appointment_id: '',
        diagnosis: '',
        notes: '',
        items: [{ inventory_item_id: '', medicine_name: '', quantity: '1', dosage: '', frequency: '', duration_days: '', instructions: '', meal_timing: '' }],
        is_external: false,
        external_doctor: '',
        external_clinic: '',
        referral_clinic_id: '',
        referral_notes: '',
      });
      setPatientSearch('');
    }
  }, [open, initialPrescription, initialPatientId, initialAppointmentId, initialPatient, allPatients]);

  const handleItemChange = (index: number, field: keyof ItemRow, value: string) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'inventory_item_id') {
      const selectedMedicine = combinedInventory.find(inv => String(inv.id) === value);
      if (selectedMedicine) {
        newItems[index].dosage = extractDosageFromName(selectedMedicine.name);
        newItems[index].medicine_name = selectedMedicine.name;
      }
    }
    setForm({ ...form, items: newItems });
  };

  const handlePatientSelect = (patient: PatientOption) => {
    setForm(prev => ({ ...prev, patient_id: String(patient.id) }));
    setPatientSearch(patient.name);
    setIsPatientDropdownOpen(false);
  };

  const addItemRow = () => {
    setForm({
      patient_id: form.patient_id,
      appointment_id: form.appointment_id,
      diagnosis: form.diagnosis,
      notes: form.notes,
      items: [...form.items, { inventory_item_id: '', medicine_name: '', quantity: '1', dosage: '', frequency: '', duration_days: '', instructions: '', meal_timing: '' }],
      is_external: form.is_external,
      external_doctor: form.external_doctor,
      external_clinic: form.external_clinic,
      referral_clinic_id: form.referral_clinic_id,
      referral_notes: form.referral_notes,
    });
  };

  const removeItemRow = (index: number) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreatePrescriptionPayload = {
      ...form,
      patient_id: Number(form.patient_id),
      appointment_id: form.appointment_id ? Number(form.appointment_id) : undefined,
      prescription_date: new Date().toISOString().slice(0, 10),
      items: form.items.map(item => ({
        ...item,
        inventory_item_id: item.inventory_item_id ? Number(item.inventory_item_id) : null,
        medicine_name: item.medicine_name,
        quantity: Number(item.quantity),
        duration_days: item.duration_days ? Number(item.duration_days) : undefined,
      })),
    };
    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {initialPrescription ? 'Edit Prescription' : 'Create Prescription'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-8 space-y-8">
          {/* Patient Section */}
          <div className="p-6 rounded-xl bg-gray-50 border">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div ref={patientSearchRef} className="relative">
                <label htmlFor="patient_id" className="block text-sm font-medium text-gray-600 mb-1">
                  Search Patient (Name or Phone)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setIsPatientDropdownOpen(true);
                      // Clear patient ID if user is typing a new search
                      if (form.patient_id && e.target.value !== selectedPatient?.name) {
                        setForm(prev => ({ ...prev, patient_id: '' }));
                      }
                    }}
                    onFocus={() => setIsPatientDropdownOpen(true)}
                    placeholder="e.g., John Doe or 07..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    required={!form.patient_id}
                  />
                </div>
                {isPatientDropdownOpen && filteredPatients.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPatients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePatientSelect(p)}
                        className="w-full text-left px-4 py-2 hover:bg-teal-50"
                      >
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-gray-500">{p.phone_number}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="bg-teal-50 p-4 rounded-lg">
                  <p className="font-bold text-teal-800">{selectedPatient.name}</p>
                  <p className="text-sm text-teal-700">ID: {selectedPatient.id}</p>
                  <p className="text-sm text-teal-700">Phone: {selectedPatient.phone_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Diagnosis and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
              <input
                type="text"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Medication Section */}
          <div className="p-6 rounded-xl bg-gray-50 border">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Medication</h3>
            {form.items.map((item, index) => (
              <div key={index} className="p-4 rounded-lg border bg-white space-y-4 relative mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Medicine</label>
                    <MedicineSelect
                      value={item.inventory_item_id}
                      onChange={(value) => handleItemChange(index, 'inventory_item_id', value)}
                      options={combinedInventory}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g. 500mg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Frequency *</label>
                    <select
                      value={item.frequency}
                      onChange={(e) => handleItemChange(index, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      {FREQUENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      min={1}
                      value={item.duration_days}
                      onChange={(e) => handleItemChange(index, 'duration_days', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g. 7"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Meal Timing</label>
                    <select
                      value={item.meal_timing}
                      onChange={(e) => handleItemChange(index, 'meal_timing', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {MEAL_TIMING_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Instructions</label>
                    <input
                      type="text"
                      value={item.instructions}
                      onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Special instructions..."
                    />
                  </div>
                </div>
                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addItemRow}
              className="w-full mt-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors"
            >
              + Add Another Medicine
            </button>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
          >
            {saving ? (initialPrescription ? 'Updating...' : 'Creating...') : (initialPrescription ? 'Update Prescription' : 'Create Prescription')}
          </button>
        </form>
      </div>
    </div>
  );
};
