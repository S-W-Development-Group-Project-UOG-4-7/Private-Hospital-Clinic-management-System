<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AddMedicineInventorySeeder extends Seeder
{
    public function run(): void
    {
        $normalizeName = fn(string $name) => strtolower(trim($name));
        $supplierId = DB::table('suppliers')->orderBy('id')->value('id');

        // Selling prices in LKR for commonly used medicines
        $sellingPriceOverrides = [
            'paracetamol 500mg' => 12,
            'paracetamol 650mg' => 16,
            'ibuprofen 200mg' => 18,
            'ibuprofen 400mg' => 28,
            'aspirin 75mg' => 10,
            'diclofenac 50mg' => 35,
            'naproxen 500mg' => 45,
            'amoxicillin 250mg' => 30,
            'amoxicillin 500mg' => 45,
            'azithromycin 250mg' => 70,
            'azithromycin 500mg' => 120,
            'ciprofloxacin 500mg' => 85,
            'metronidazole 400mg' => 45,
            'cephalexin 500mg' => 60,
            'doxycycline 100mg' => 55,
            'augmentin 625mg' => 120,
            'amlodipine 5mg' => 25,
            'amlodipine 10mg' => 35,
            'losartan 50mg' => 40,
            'atenolol 50mg' => 20,
            'metoprolol 25mg' => 22,
            'lisinopril 10mg' => 30,
            'enalapril 5mg' => 20,
            'metformin 500mg' => 18,
            'metformin 850mg' => 24,
            'glimepiride 2mg' => 20,
            'glibenclamide 5mg' => 15,
            'sitagliptin 100mg' => 85,
            'omeprazole 20mg' => 30,
            'pantoprazole 40mg' => 40,
            'ranitidine 150mg' => 22,
            'domperidone 10mg' => 18,
            'ondansetron 4mg' => 60,
            'loperamide 2mg' => 15,
            'antacid suspension' => 240,
            'salbutamol inhaler 100mcg' => 950,
            'montelukast 10mg' => 60,
            'cetirizine 10mg' => 25,
            'loratadine 10mg' => 30,
            'fexofenadine 180mg' => 80,
            'chlorpheniramine 4mg' => 12,
            'dextromethorphan syrup' => 350,
            'guaifenesin 100mg/5ml' => 320,
            'ambroxol 30mg' => 35,
            'pseudoephedrine 60mg' => 25,
        ];

        $resolveSellingPrice = function (array $medicine) use ($normalizeName, $sellingPriceOverrides): float {
            $nameKey = $normalizeName($medicine['name']);
            if (array_key_exists($nameKey, $sellingPriceOverrides)) {
                return (float) $sellingPriceOverrides[$nameKey];
            }

            $category = strtolower($medicine['category'] ?? '');
            if (str_contains($category, 'antibiotic')) {
                return 75;
            }
            if (str_contains($category, 'antidepressant')) {
                return 90;
            }
            if (str_contains($category, 'benzodiazepine') || str_contains($category, 'opioid')) {
                return 80;
            }
            if (str_contains($category, 'statin')) {
                return 55;
            }
            if (str_contains($category, 'diabetes')) {
                return 35;
            }
            if (str_contains($category, 'thyroid')) {
                return 40;
            }
            if (str_contains($category, 'vitamin') || str_contains($category, 'supplement')) {
                return 25;
            }
            if (str_contains($category, 'antihistamine')) {
                return 35;
            }
            if (str_contains($category, 'bronchodilator')) {
                return 45;
            }
            if (str_contains($category, 'antifungal')) {
                return 55;
            }
            if (str_contains($category, 'corticosteroid') || str_contains($category, 'steroid')) {
                return 50;
            }

            $unit = strtolower($medicine['unit'] ?? '');
            if (str_contains($nameKey, 'inhaler') || str_contains($unit, 'inhaler')) {
                return 950;
            }
            if (str_contains($nameKey, 'syrup') || str_contains($nameKey, 'suspension')) {
                return 320;
            }
            if (
                str_contains($nameKey, 'cream') ||
                str_contains($nameKey, 'ointment') ||
                str_contains($nameKey, 'gel') ||
                str_contains($nameKey, 'shampoo') ||
                str_contains($unit, 'tube')
            ) {
                return 280;
            }
            if (
                str_contains($nameKey, 'drops') ||
                str_contains($unit, 'bottle')
            ) {
                return 260;
            }
            if (str_contains($unit, 'capsule') || str_contains($unit, 'tablet') || str_contains($nameKey, 'mg')) {
                return 30;
            }

            return 40;
        };

        $resolveBuyingPrice = fn(float $sellingPrice) => max(1, round($sellingPrice * 0.7, 2));

        $medicines = [
            // Pain Relievers & Analgesics
            ['name' => 'Paracetamol 500mg', 'generic_name' => 'Paracetamol (Acetaminophen)', 'brand_name' => 'Tylenol', 'category' => 'Analgesic', 'unit' => 'tablet'],
            ['name' => 'Paracetamol 650mg', 'generic_name' => 'Paracetamol (Acetaminophen)', 'brand_name' => 'Panadol Extra', 'category' => 'Analgesic', 'unit' => 'tablet'],
            ['name' => 'Ibuprofen 200mg', 'generic_name' => 'Ibuprofen', 'brand_name' => 'Advil', 'category' => 'NSAID', 'unit' => 'tablet'],
            ['name' => 'Ibuprofen 400mg', 'generic_name' => 'Ibuprofen', 'brand_name' => 'Motrin', 'category' => 'NSAID', 'unit' => 'tablet'],
            ['name' => 'Aspirin 75mg', 'generic_name' => 'Acetylsalicylic Acid', 'brand_name' => 'Disprin', 'category' => 'Analgesic/Antiplatelet', 'unit' => 'tablet'],
            ['name' => 'Aspirin 300mg', 'generic_name' => 'Acetylsalicylic Acid', 'brand_name' => 'Bayer Aspirin', 'category' => 'Analgesic', 'unit' => 'tablet'],
            ['name' => 'Diclofenac 50mg', 'generic_name' => 'Diclofenac Sodium', 'brand_name' => 'Voltaren', 'category' => 'NSAID', 'unit' => 'tablet'],
            ['name' => 'Naproxen 250mg', 'generic_name' => 'Naproxen', 'brand_name' => 'Aleve', 'category' => 'NSAID', 'unit' => 'tablet'],
            ['name' => 'Tramadol 50mg', 'generic_name' => 'Tramadol HCl', 'brand_name' => 'Ultram', 'category' => 'Opioid Analgesic', 'unit' => 'capsule'],
            
            // Antibiotics
            ['name' => 'Amoxicillin 250mg', 'generic_name' => 'Amoxicillin', 'brand_name' => 'Amoxil', 'category' => 'Antibiotic', 'unit' => 'capsule'],
            ['name' => 'Amoxicillin 500mg', 'generic_name' => 'Amoxicillin', 'brand_name' => 'Amoxil', 'category' => 'Antibiotic', 'unit' => 'capsule'],
            ['name' => 'Amoxicillin-Clavulanate 625mg', 'generic_name' => 'Amoxicillin/Clavulanic Acid', 'brand_name' => 'Augmentin', 'category' => 'Antibiotic', 'unit' => 'tablet'],
            ['name' => 'Azithromycin 250mg', 'generic_name' => 'Azithromycin', 'brand_name' => 'Zithromax', 'category' => 'Antibiotic', 'unit' => 'tablet'],
            ['name' => 'Azithromycin 500mg', 'generic_name' => 'Azithromycin', 'brand_name' => 'Z-Pack', 'category' => 'Antibiotic', 'unit' => 'tablet'],
            ['name' => 'Ciprofloxacin 500mg', 'generic_name' => 'Ciprofloxacin', 'brand_name' => 'Cipro', 'category' => 'Antibiotic', 'unit' => 'tablet'],
            ['name' => 'Levofloxacin 500mg', 'generic_name' => 'Levofloxacin', 'brand_name' => 'Levaquin', 'category' => 'Antibiotic', 'unit' => 'tablet'],
            ['name' => 'Metronidazole 400mg', 'generic_name' => 'Metronidazole', 'brand_name' => 'Flagyl', 'category' => 'Antibiotic/Antiprotozoal', 'unit' => 'tablet'],
            ['name' => 'Doxycycline 100mg', 'generic_name' => 'Doxycycline', 'brand_name' => 'Vibramycin', 'category' => 'Antibiotic', 'unit' => 'capsule'],
            ['name' => 'Cephalexin 500mg', 'generic_name' => 'Cephalexin', 'brand_name' => 'Keflex', 'category' => 'Antibiotic', 'unit' => 'capsule'],
            ['name' => 'Clindamycin 300mg', 'generic_name' => 'Clindamycin', 'brand_name' => 'Cleocin', 'category' => 'Antibiotic', 'unit' => 'capsule'],
            
            // Gastrointestinal
            ['name' => 'Omeprazole 20mg', 'generic_name' => 'Omeprazole', 'brand_name' => 'Prilosec', 'category' => 'Proton Pump Inhibitor', 'unit' => 'capsule'],
            ['name' => 'Pantoprazole 40mg', 'generic_name' => 'Pantoprazole', 'brand_name' => 'Protonix', 'category' => 'Proton Pump Inhibitor', 'unit' => 'tablet'],
            ['name' => 'Esomeprazole 40mg', 'generic_name' => 'Esomeprazole', 'brand_name' => 'Nexium', 'category' => 'Proton Pump Inhibitor', 'unit' => 'capsule'],
            ['name' => 'Ranitidine 150mg', 'generic_name' => 'Ranitidine', 'brand_name' => 'Zantac', 'category' => 'H2 Blocker', 'unit' => 'tablet'],
            ['name' => 'Domperidone 10mg', 'generic_name' => 'Domperidone', 'brand_name' => 'Motilium', 'category' => 'Antiemetic', 'unit' => 'tablet'],
            ['name' => 'Ondansetron 4mg', 'generic_name' => 'Ondansetron', 'brand_name' => 'Zofran', 'category' => 'Antiemetic', 'unit' => 'tablet'],
            ['name' => 'Loperamide 2mg', 'generic_name' => 'Loperamide', 'brand_name' => 'Imodium', 'category' => 'Antidiarrheal', 'unit' => 'capsule'],
            ['name' => 'Bisacodyl 5mg', 'generic_name' => 'Bisacodyl', 'brand_name' => 'Dulcolax', 'category' => 'Laxative', 'unit' => 'tablet'],
            
            // Cardiovascular
            ['name' => 'Amlodipine 5mg', 'generic_name' => 'Amlodipine', 'brand_name' => 'Norvasc', 'category' => 'Calcium Channel Blocker', 'unit' => 'tablet'],
            ['name' => 'Amlodipine 10mg', 'generic_name' => 'Amlodipine', 'brand_name' => 'Norvasc', 'category' => 'Calcium Channel Blocker', 'unit' => 'tablet'],
            ['name' => 'Lisinopril 5mg', 'generic_name' => 'Lisinopril', 'brand_name' => 'Zestril', 'category' => 'ACE Inhibitor', 'unit' => 'tablet'],
            ['name' => 'Lisinopril 10mg', 'generic_name' => 'Lisinopril', 'brand_name' => 'Zestril', 'category' => 'ACE Inhibitor', 'unit' => 'tablet'],
            ['name' => 'Losartan 50mg', 'generic_name' => 'Losartan', 'brand_name' => 'Cozaar', 'category' => 'ARB', 'unit' => 'tablet'],
            ['name' => 'Atenolol 50mg', 'generic_name' => 'Atenolol', 'brand_name' => 'Tenormin', 'category' => 'Beta Blocker', 'unit' => 'tablet'],
            ['name' => 'Metoprolol 50mg', 'generic_name' => 'Metoprolol', 'brand_name' => 'Lopressor', 'category' => 'Beta Blocker', 'unit' => 'tablet'],
            ['name' => 'Hydrochlorothiazide 25mg', 'generic_name' => 'Hydrochlorothiazide', 'brand_name' => 'Microzide', 'category' => 'Diuretic', 'unit' => 'tablet'],
            ['name' => 'Furosemide 40mg', 'generic_name' => 'Furosemide', 'brand_name' => 'Lasix', 'category' => 'Loop Diuretic', 'unit' => 'tablet'],
            ['name' => 'Atorvastatin 10mg', 'generic_name' => 'Atorvastatin', 'brand_name' => 'Lipitor', 'category' => 'Statin', 'unit' => 'tablet'],
            ['name' => 'Atorvastatin 20mg', 'generic_name' => 'Atorvastatin', 'brand_name' => 'Lipitor', 'category' => 'Statin', 'unit' => 'tablet'],
            ['name' => 'Simvastatin 20mg', 'generic_name' => 'Simvastatin', 'brand_name' => 'Zocor', 'category' => 'Statin', 'unit' => 'tablet'],
            ['name' => 'Clopidogrel 75mg', 'generic_name' => 'Clopidogrel', 'brand_name' => 'Plavix', 'category' => 'Antiplatelet', 'unit' => 'tablet'],
            
            // Diabetes
            ['name' => 'Metformin 500mg', 'generic_name' => 'Metformin HCl', 'brand_name' => 'Glucophage', 'category' => 'Antidiabetic', 'unit' => 'tablet'],
            ['name' => 'Metformin 850mg', 'generic_name' => 'Metformin HCl', 'brand_name' => 'Glucophage', 'category' => 'Antidiabetic', 'unit' => 'tablet'],
            ['name' => 'Glimepiride 2mg', 'generic_name' => 'Glimepiride', 'brand_name' => 'Amaryl', 'category' => 'Sulfonylurea', 'unit' => 'tablet'],
            ['name' => 'Glipizide 5mg', 'generic_name' => 'Glipizide', 'brand_name' => 'Glucotrol', 'category' => 'Sulfonylurea', 'unit' => 'tablet'],
            ['name' => 'Sitagliptin 100mg', 'generic_name' => 'Sitagliptin', 'brand_name' => 'Januvia', 'category' => 'DPP-4 Inhibitor', 'unit' => 'tablet'],
            
            // Respiratory/Allergy
            ['name' => 'Cetirizine 10mg', 'generic_name' => 'Cetirizine', 'brand_name' => 'Zyrtec', 'category' => 'Antihistamine', 'unit' => 'tablet'],
            ['name' => 'Loratadine 10mg', 'generic_name' => 'Loratadine', 'brand_name' => 'Claritin', 'category' => 'Antihistamine', 'unit' => 'tablet'],
            ['name' => 'Fexofenadine 120mg', 'generic_name' => 'Fexofenadine', 'brand_name' => 'Allegra', 'category' => 'Antihistamine', 'unit' => 'tablet'],
            ['name' => 'Montelukast 10mg', 'generic_name' => 'Montelukast', 'brand_name' => 'Singulair', 'category' => 'Leukotriene Inhibitor', 'unit' => 'tablet'],
            ['name' => 'Salbutamol 2mg', 'generic_name' => 'Salbutamol (Albuterol)', 'brand_name' => 'Ventolin', 'category' => 'Bronchodilator', 'unit' => 'tablet'],
            ['name' => 'Salbutamol Inhaler 100mcg', 'generic_name' => 'Salbutamol (Albuterol)', 'brand_name' => 'Ventolin Inhaler', 'category' => 'Bronchodilator', 'unit' => 'inhaler'],
            ['name' => 'Theophylline 300mg', 'generic_name' => 'Theophylline', 'brand_name' => 'Theo-Dur', 'category' => 'Bronchodilator', 'unit' => 'tablet'],
            ['name' => 'Dextromethorphan 15mg', 'generic_name' => 'Dextromethorphan', 'brand_name' => 'Robitussin DM', 'category' => 'Antitussive', 'unit' => 'tablet'],
            ['name' => 'Guaifenesin 200mg', 'generic_name' => 'Guaifenesin', 'brand_name' => 'Mucinex', 'category' => 'Expectorant', 'unit' => 'tablet'],
            
            // Mental Health
            ['name' => 'Sertraline 50mg', 'generic_name' => 'Sertraline', 'brand_name' => 'Zoloft', 'category' => 'SSRI Antidepressant', 'unit' => 'tablet'],
            ['name' => 'Escitalopram 10mg', 'generic_name' => 'Escitalopram', 'brand_name' => 'Lexapro', 'category' => 'SSRI Antidepressant', 'unit' => 'tablet'],
            ['name' => 'Fluoxetine 20mg', 'generic_name' => 'Fluoxetine', 'brand_name' => 'Prozac', 'category' => 'SSRI Antidepressant', 'unit' => 'capsule'],
            ['name' => 'Amitriptyline 25mg', 'generic_name' => 'Amitriptyline', 'brand_name' => 'Elavil', 'category' => 'TCA Antidepressant', 'unit' => 'tablet'],
            ['name' => 'Alprazolam 0.5mg', 'generic_name' => 'Alprazolam', 'brand_name' => 'Xanax', 'category' => 'Benzodiazepine', 'unit' => 'tablet'],
            ['name' => 'Diazepam 5mg', 'generic_name' => 'Diazepam', 'brand_name' => 'Valium', 'category' => 'Benzodiazepine', 'unit' => 'tablet'],
            ['name' => 'Lorazepam 1mg', 'generic_name' => 'Lorazepam', 'brand_name' => 'Ativan', 'category' => 'Benzodiazepine', 'unit' => 'tablet'],
            ['name' => 'Zolpidem 10mg', 'generic_name' => 'Zolpidem', 'brand_name' => 'Ambien', 'category' => 'Sleep Aid', 'unit' => 'tablet'],
            
            // Thyroid
            ['name' => 'Levothyroxine 50mcg', 'generic_name' => 'Levothyroxine', 'brand_name' => 'Synthroid', 'category' => 'Thyroid Hormone', 'unit' => 'tablet'],
            ['name' => 'Levothyroxine 100mcg', 'generic_name' => 'Levothyroxine', 'brand_name' => 'Synthroid', 'category' => 'Thyroid Hormone', 'unit' => 'tablet'],
            ['name' => 'Carbimazole 5mg', 'generic_name' => 'Carbimazole', 'brand_name' => 'Neo-Mercazole', 'category' => 'Antithyroid', 'unit' => 'tablet'],
            
            // Vitamins & Supplements
            ['name' => 'Vitamin D3 1000IU', 'generic_name' => 'Cholecalciferol', 'brand_name' => 'D-Vitum', 'category' => 'Vitamin', 'unit' => 'capsule'],
            ['name' => 'Vitamin B12 500mcg', 'generic_name' => 'Cyanocobalamin', 'brand_name' => 'B12 Plus', 'category' => 'Vitamin', 'unit' => 'tablet'],
            ['name' => 'Vitamin C 500mg', 'generic_name' => 'Ascorbic Acid', 'brand_name' => 'Celin', 'category' => 'Vitamin', 'unit' => 'tablet'],
            ['name' => 'Folic Acid 5mg', 'generic_name' => 'Folic Acid', 'brand_name' => 'Folvite', 'category' => 'Vitamin', 'unit' => 'tablet'],
            ['name' => 'Iron + Folic Acid', 'generic_name' => 'Ferrous Sulfate + Folic Acid', 'brand_name' => 'Fefol', 'category' => 'Supplement', 'unit' => 'tablet'],
            ['name' => 'Calcium + Vitamin D', 'generic_name' => 'Calcium Carbonate + Vitamin D3', 'brand_name' => 'Caltrate', 'category' => 'Supplement', 'unit' => 'tablet'],
            ['name' => 'Multivitamin', 'generic_name' => 'Multiple Vitamins', 'brand_name' => 'Centrum', 'category' => 'Vitamin', 'unit' => 'tablet'],
            
            // Skin/Topical
            ['name' => 'Hydrocortisone Cream 1%', 'generic_name' => 'Hydrocortisone', 'brand_name' => 'Cortizone', 'category' => 'Topical Steroid', 'unit' => 'tube'],
            ['name' => 'Clotrimazole Cream 1%', 'generic_name' => 'Clotrimazole', 'brand_name' => 'Canesten', 'category' => 'Antifungal', 'unit' => 'tube'],
            ['name' => 'Mupirocin Ointment 2%', 'generic_name' => 'Mupirocin', 'brand_name' => 'Bactroban', 'category' => 'Topical Antibiotic', 'unit' => 'tube'],
            ['name' => 'Ketoconazole Shampoo 2%', 'generic_name' => 'Ketoconazole', 'brand_name' => 'Nizoral', 'category' => 'Antifungal', 'unit' => 'bottle'],
            
            // Eye/Ear
            ['name' => 'Ciprofloxacin Eye Drops', 'generic_name' => 'Ciprofloxacin', 'brand_name' => 'Ciloxan', 'category' => 'Ophthalmic Antibiotic', 'unit' => 'bottle'],
            ['name' => 'Artificial Tears', 'generic_name' => 'Carboxymethylcellulose', 'brand_name' => 'Refresh Tears', 'category' => 'Lubricant', 'unit' => 'bottle'],
            ['name' => 'Ofloxacin Ear Drops', 'generic_name' => 'Ofloxacin', 'brand_name' => 'Floxin Otic', 'category' => 'Otic Antibiotic', 'unit' => 'bottle'],
            
            // Miscellaneous
            ['name' => 'Prednisolone 5mg', 'generic_name' => 'Prednisolone', 'brand_name' => 'Prelone', 'category' => 'Corticosteroid', 'unit' => 'tablet'],
            ['name' => 'Prednisone 10mg', 'generic_name' => 'Prednisone', 'brand_name' => 'Deltasone', 'category' => 'Corticosteroid', 'unit' => 'tablet'],
            ['name' => 'Gabapentin 300mg', 'generic_name' => 'Gabapentin', 'brand_name' => 'Neurontin', 'category' => 'Anticonvulsant', 'unit' => 'capsule'],
            ['name' => 'Pregabalin 75mg', 'generic_name' => 'Pregabalin', 'brand_name' => 'Lyrica', 'category' => 'Anticonvulsant', 'unit' => 'capsule'],
            ['name' => 'Allopurinol 100mg', 'generic_name' => 'Allopurinol', 'brand_name' => 'Zyloprim', 'category' => 'Antigout', 'unit' => 'tablet'],
            ['name' => 'Colchicine 0.5mg', 'generic_name' => 'Colchicine', 'brand_name' => 'Colcrys', 'category' => 'Antigout', 'unit' => 'tablet'],
        ];

        $batchNum = 1;
        foreach ($medicines as $med) {
            $sellingPrice = $resolveSellingPrice($med);
            $unitPrice = $resolveBuyingPrice($sellingPrice);

            DB::table('inventory_items')->updateOrInsert(
                ['name' => $med['name']],
                [
                    'name' => $med['name'],
                    'generic_name' => $med['generic_name'],
                    'brand_name' => $med['brand_name'],
                    'description' => $med['generic_name'] . ' - ' . $med['category'],
                    'category' => $med['category'],
                    'unit' => $med['unit'],
                    'quantity' => rand(100, 1000),
                    'reorder_level' => rand(20, 100),
                    'unit_price' => $unitPrice,
                    'selling_price' => $sellingPrice,
                    'expiry_date' => now()->addMonths(rand(6, 24))->format('Y-m-d'),
                    'batch_number' => 'BATCH' . date('Y') . str_pad($batchNum++, 4, '0', STR_PAD_LEFT),
                    'supplier_id' => $supplierId,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $this->command->info('Added ' . count($medicines) . ' medicines to inventory');
    }
}
