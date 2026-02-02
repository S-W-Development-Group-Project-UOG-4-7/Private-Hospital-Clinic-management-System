<?php

namespace App\Services;

use App\Models\PrescriptionItem;

class MedicationQuantityCalculator
{
    public static function calculate(?string $dosage, ?string $frequency, ?int $durationDays, ?int $existingQuantity = null): ?int
    {
        $perDose = self::resolveDose($dosage);
        $perDay = self::resolveFrequency($frequency);
        $duration = $durationDays ?? 1;

        if ($duration <= 0) {
            $duration = 1;
        }

        $estimated = (int) ceil($perDose * $perDay * $duration);

        if ($estimated <= 0) {
            return $existingQuantity;
        }

        return $estimated;
    }

    public static function fromPrescriptionItem(PrescriptionItem $item): int
    {
        $calculated = self::calculate(
            $item->dosage,
            $item->frequency,
            $item->duration_days,
            $item->quantity
        );

        if ($calculated === null || $calculated <= 0) {
            return max(1, (int) $item->quantity);
        }

        return max(1, $calculated);
    }

    protected static function resolveDose(?string $dosage): float
    {
        if (!$dosage) {
            return 1.0;
        }

        $normalized = strtolower($dosage);

        if (preg_match('/(half|½|1\/2)/', $normalized)) {
            return 0.5;
        }

        if (preg_match('/(quarter|¼|1\/4)/', $normalized)) {
            return 0.25;
        }

        if (preg_match('/(three\s*quarters|¾|3\/4)/', $normalized)) {
            return 0.75;
        }

        if (preg_match('/(one\s+and\s+a\s+half|1\s*½|1\.5)/', $normalized)) {
            return 1.5;
        }

        if (preg_match('/(two\s+and\s+a\s+half|2\s*½|2\.5)/', $normalized)) {
            return 2.5;
        }

        if (preg_match('/(\d+(?:[\.,]\d+)?)\s*(tablet|tab|capsule|cap|pill|suppository|drop|puff|spray)/', $normalized, $matches)) {
            $value = (float) str_replace(',', '.', $matches[1]);
            if ($value > 0) {
                return $value;
            }
        }

        if (preg_match('/(\d+(?:[\.,]\d+)?)\s*(mg|mcg|g|kg|ml|l|iu)/', $normalized)) {
            return 1.0;
        }

        if (preg_match('/(\d+(?:[\.,]\d+)?)/', $normalized, $matches)) {
            $value = (float) str_replace(',', '.', $matches[1]);
            if ($value > 0 && str_contains($normalized, 'tablet')) {
                return $value;
            }
        }

        return 1.0;
    }

    protected static function resolveFrequency(?string $frequency): float
    {
        if (!$frequency) {
            return 1.0;
        }

        $normalized = strtolower(trim($frequency));
        $normalized = preg_replace('/\s+/', ' ', $normalized ?? '') ?? '';

        $keywordGroups = [
            [4, ['four times', '4 times', 'qid', 'q.i.d', 'q i d']],
            [3, ['three times', '3 times', 'thrice', 'tid', 't.i.d', 't i d']],
            [2, ['twice', '2 times', 'bid', 'b.i.d', 'b i d']],
            [1, ['once', 'one time', 'daily', 'qd', 'q.d', 'q d', 'od', 'o.d', 'o d']],
            [0.5, ['every other day']],
        ];

        foreach ($keywordGroups as [$value, $keywords]) {
            foreach ($keywords as $keyword) {
                if (str_contains($normalized, $keyword)) {
                    return $value;
                }
            }
        }

        if (preg_match('/(\d+(?:[\.,]\d+)?)\s*(x|times?)/', $normalized, $matches)) {
            $value = (float) str_replace(',', '.', $matches[1]);
            if ($value > 0) {
                return $value;
            }
        }

        if (preg_match('/every\s+(\d+)\s*hours?/', $normalized, $matches)) {
            $hours = (int) $matches[1];
            if ($hours > 0) {
                return max(1, (int) floor(24 / $hours));
            }
        }

        if (preg_match('/q(\d+)(h|hr|hour)/', $normalized, $matches)) {
            $hours = (int) $matches[1];
            if ($hours > 0) {
                return max(1, (int) floor(24 / $hours));
            }
        }

        if (preg_match('/(\d+)\s*/', $normalized, $matches)) {
            $value = (int) $matches[1];
            if ($value > 0) {
                return $value;
            }
        }

        return 1.0;
    }
}
