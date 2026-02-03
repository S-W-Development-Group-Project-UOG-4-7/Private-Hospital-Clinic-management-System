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

interface ItemRow {
  inventory_item_id: string;
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
      o.name.toLowerCase().includes(term) ||
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
  initialPatientId?: number | null;
  initialAppointmentId?: number | null;
  initialPrescription?: any | null; // DoctorPrescription for editing
  onClose: () => void;
  onSubmit: (payload: CreatePrescriptionPayload) => Promise<void> | void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  open,
  saving,
  inventory,
  clinics,
  initialPatientId,
  initialAppointmentId,
  initialPrescription,
  onClose,
  onSubmit,
}) => {
  const [patientId, setPatientId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [instructions, setInstructions] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { inventory_item_id: '', quantity: '1', dosage: '', frequency: '', duration_days: '', instructions: '', meal_timing: '' },
  ]);

  useEffect(() => {
    if (!open) return;
    
    if (initialPrescription) {
      // Editing existing prescription
      setPatientId(String(initialPrescription.patient_id));
      setAppointmentId(''); // Appointment ID not editable in updates
      setClinicId(initialPrescription.clinic_id ? String(initialPrescription.clinic_id) : '');
      setPrescriptionDate(initialPrescription.prescription_date);
      setNotes(initialPrescription.notes || '');
      setInstructions(initialPrescription.instructions || '');
      
      // Convert prescription items to form items
      const formItems = initialPrescription.items?.map((item: any) => ({
        inventory_item_id: String(item.inventory_item_id),
        quantity: String(item.quantity),
        dosage: item.dosage || '',
        frequency: item.frequency || '',
        meal_timing: item.meal_timing || '',
        duration_days: item.duration_days ? String(item.duration_days) : '',
        instructions: item.instructions || '',
      })) || [];
      
      setItems(formItems.length > 0 ? formItems : [
        { inventory_item_id: '', quantity: '1', dosage: '', frequency: '', duration_days: '', instructions: '', meal_timing: '' }
      ]);
    } else {
      // Creating new prescription
      setPatientId(initialPatientId ? String(initialPatientId) : '');
      setAppointmentId(initialAppointmentId ? String(initialAppointmentId) : '');
      setClinicId('');
      setPrescriptionDate(new Date().toISOString().slice(0, 10));
      setNotes('');
      setInstructions('');
      setItems([{ inventory_item_id: '', quantity: '1', dosage: '', frequency: '', duration_days: '', instructions: '', meal_timing: '' }]);
    }
  }, [open, initialPatientId, initialAppointmentId, initialPrescription]);

  // Combine inventory with default medicines (inventory items take priority)
  const combinedMedicines = useMemo(() => {
    if (inventory.length > 0) {
      // If inventory has items, use inventory first, then add default medicines that don't conflict
      const inventoryNames = new Set(inventory.map(i => i.name.toLowerCase()));
      const additionalDefaults = DEFAULT_MEDICINES.filter(
        dm => !inventoryNames.has(dm.name.toLowerCase())
      );
      return [...inventory, ...additionalDefaults];
    }
    // If no inventory, use default medicines
    return DEFAULT_MEDICINES;
  }, [inventory]);

  const inventoryMap = useMemo(() => {
    const map = new Map<number, InventoryOption>();
    combinedMedicines.forEach((i) => map.set(i.id, i));
    return map;
  }, [combinedMedicines]);

  if (!open) return null;

  const updateItem = (index: number, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { inventory_item_id: '', quantity: '1', dosage: '', frequency: '', duration_days: '', instructions: '', meal_timing: '' }]);
  };

  // Handle medicine selection with auto-dosage extraction
  const handleMedicineChange = (index: number, medicineId: string) => {
    const selectedMedicine = inventoryMap.get(Number(medicineId));
    const autoDosage = selectedMedicine ? extractDosageFromName(selectedMedicine.name) : '';
    
    updateItem(index, { 
      inventory_item_id: medicineId,
      dosage: autoDosage,
      // Reset frequency and meal timing when changing medicine
      frequency: '',
      meal_timing: ''
    });
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

        // Allow negative IDs for default medicines (they start with negative IDs)
        if (!Number.isFinite(inventoryId) || inventoryId === 0) return null;
        if (!Number.isFinite(quantity) || quantity <= 0) return null;
        if (durationDays !== null && (!Number.isFinite(durationDays) || durationDays <= 0)) return null;

        // Get the medicine name for default medicines (negative IDs)
        const medicine = inventoryMap.get(inventoryId);
        
        return {
          inventory_item_id: inventoryId > 0 ? inventoryId : null, // Set to null for default medicines
          medicine_name: medicine?.name || null, // Include medicine name for reference
          quantity,
          dosage: row.dosage.trim() === '' ? null : row.dosage.trim(),
          frequency: row.frequency.trim() === '' ? null : row.frequency.trim(),
          meal_timing: row.meal_timing.trim() === '' ? null : row.meal_timing.trim(),
          duration_days: durationDays,
          instructions: row.instructions.trim() === '' ? null : row.instructions.trim(),
        };
      })
      .filter(Boolean) as CreatePrescriptionPayload['items'];

    if (normalizedItems.length === 0) return;

    const payload: CreatePrescriptionPayload = {
      patient_id: pid,
      appointment_id: Number.isFinite(apptIdRaw as any) ? (apptIdRaw as number) : null,
      clinic_id: clinicId.trim() === '' ? null : Number(clinicId),
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
          <h2 className="text-2xl font-bold">{initialPrescription ? 'Update Prescription' : 'Create Prescription'}</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID *</label>
              <input
                type="number"
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                readOnly={!!initialPatientId}
                className={`w-full px-3 py-2 border rounded-lg ${initialPatientId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment ID</label>
              <input
                type="number"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                readOnly={!!initialAppointmentId}
                className={`w-full px-3 py-2 border rounded-lg ${initialAppointmentId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Clinic</label>
              <select
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- No Clinic --</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={String(clinic.id)}>
                    {clinic.name}
                  </option>
                ))}
              </select>
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
                    <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medicine *</label>
                        <MedicineSelect
                          value={row.inventory_item_id}
                          onChange={(val) => handleMedicineChange(index, val)}
                          options={combinedMedicines}
                          required
                        />
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                        <select
                          value={row.frequency}
                          onChange={(e) => updateItem(index, { frequency: e.target.value })}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meal Timing</label>
                        <select
                          value={row.meal_timing}
                          onChange={(e) => updateItem(index, { meal_timing: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          {MEAL_TIMING_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Instructions</label>
                        <input
                          type="text"
                          value={row.instructions}
                          onChange={(e) => updateItem(index, { instructions: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-end">
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
            {saving ? (initialPrescription ? 'Updating...' : 'Creating...') : (initialPrescription ? 'Update Prescription' : 'Create Prescription')}
          </button>
        </form>
      </div>
    </div>
  );
};
