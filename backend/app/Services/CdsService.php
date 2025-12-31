<?php

namespace App\Services;

use App\Models\CdsRule;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Diagnosis;
use Illuminate\Support\Collection;

class CdsService
{
    public function checkDrugInteractions(int $patientId, array $medicationIds): Collection
    {
        $warnings = collect();

        // Get active prescriptions for patient
        $activePrescriptions = Prescription::where('patient_id', $patientId)
            ->where('status', '!=', 'cancelled')
            ->with('items.inventoryItem')
            ->get();

        $currentMedications = $activePrescriptions->flatMap(function ($prescription) {
            return $prescription->items->pluck('inventory_item_id');
        })->unique();

        // Check for interactions with new medications
        foreach ($medicationIds as $medId) {
            if ($currentMedications->contains($medId)) {
                $warnings->push([
                    'type' => 'duplicate_medication',
                    'severity' => 'medium',
                    'message' => 'Patient is already prescribed this medication',
                ]);
            }
        }

        // Check CDS rules for drug interactions
        $rules = CdsRule::where('rule_type', 'drug_interaction')
            ->where('is_active', true)
            ->get();

        foreach ($rules as $rule) {
            $conditions = $rule->conditions ?? [];
            // Simple check - in production, implement more sophisticated logic
            if ($this->matchesConditions($medicationIds, $conditions)) {
                $warnings->push([
                    'type' => 'drug_interaction',
                    'severity' => $rule->severity,
                    'message' => $rule->warning_message,
                ]);
            }
        }

        return $warnings;
    }

    public function checkAllergies(int $patientId, array $medicationIds): Collection
    {
        $warnings = collect();

        // Get patient allergies (would be stored in patient profile or separate allergies table)
        // For now, check CDS rules
        $rules = CdsRule::where('rule_type', 'allergy')
            ->where('is_active', true)
            ->get();

        foreach ($rules as $rule) {
            $conditions = $rule->conditions ?? [];
            if ($this->matchesConditions($medicationIds, $conditions)) {
                $warnings->push([
                    'type' => 'allergy',
                    'severity' => $rule->severity,
                    'message' => $rule->warning_message,
                ]);
            }
        }

        return $warnings;
    }

    public function checkDiagnosisWarnings(int $patientId, string $icd10Code = null): Collection
    {
        $warnings = collect();

        // Get existing diagnoses
        $existingDiagnoses = Diagnosis::where('patient_id', $patientId)
            ->where('status', 'active')
            ->get();

        // Check for duplicate diagnoses
        if ($icd10Code) {
            $duplicate = $existingDiagnoses->where('icd10_code', $icd10Code)->first();
            if ($duplicate) {
                $warnings->push([
                    'type' => 'duplicate_diagnosis',
                    'severity' => 'low',
                    'message' => 'Patient already has this diagnosis',
                ]);
            }
        }

        return $warnings;
    }

    private function matchesConditions(array $medicationIds, array $conditions): bool
    {
        // Simple implementation - in production, use more sophisticated matching
        if (isset($conditions['medication_ids'])) {
            $ruleMedIds = $conditions['medication_ids'];
            return !empty(array_intersect($medicationIds, $ruleMedIds));
        }
        return false;
    }
}

