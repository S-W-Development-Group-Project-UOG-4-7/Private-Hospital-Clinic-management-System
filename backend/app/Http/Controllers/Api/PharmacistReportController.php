<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\InventoryItem;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PharmacistReportController extends Controller
{
    /**
     * Get comprehensive pharmacy dispensing report.
     */
    public function dispensingReport(Request $request)
    {
        $fromDate = $request->input('from_date', Carbon::now()->startOfMonth()->toDateString());
        $toDate = $request->input('to_date', Carbon::now()->toDateString());

        // Dispensed prescriptions in date range
        $dispensedPrescriptions = Prescription::where('status', 'dispensed')
            ->whereDate('dispensed_at', '>=', $fromDate)
            ->whereDate('dispensed_at', '<=', $toDate)
            ->with(['patient', 'pharmacist', 'items.inventoryItem'])
            ->get();

        // Summary statistics
        $totalPrescriptions = $dispensedPrescriptions->count();
        $totalMedicationsDispensed = $dispensedPrescriptions->sum(function ($p) {
            return $p->items->count();
        });
        $totalUnitsDispensed = $dispensedPrescriptions->sum(function ($p) {
            return $p->items->sum('quantity');
        });
        $totalRevenue = $dispensedPrescriptions->sum(function ($p) {
            return $p->items->sum('total_price');
        });

        // Daily breakdown
        $dailyStats = $dispensedPrescriptions->groupBy(function ($p) {
            return Carbon::parse($p->dispensed_at)->toDateString();
        })->map(function ($dayPrescriptions, $date) {
            return [
                'date' => $date,
                'prescriptions_count' => $dayPrescriptions->count(),
                'medications_dispensed' => $dayPrescriptions->sum(fn($p) => $p->items->count()),
                'units_dispensed' => $dayPrescriptions->sum(fn($p) => $p->items->sum('quantity')),
                'revenue' => $dayPrescriptions->sum(fn($p) => $p->items->sum('total_price')),
            ];
        })->values();

        // Top dispensed medications
        $topMedications = PrescriptionItem::whereHas('prescription', function ($q) use ($fromDate, $toDate) {
            $q->where('status', 'dispensed')
              ->whereDate('dispensed_at', '>=', $fromDate)
              ->whereDate('dispensed_at', '<=', $toDate);
        })
        ->with('inventoryItem')
        ->get()
        ->groupBy('inventory_item_id')
        ->map(function ($items) {
            $first = $items->first();
            return [
                'medication_name' => $first->inventoryItem?->name ?? 'Unknown',
                'category' => $first->inventoryItem?->category ?? 'Uncategorized',
                'times_dispensed' => $items->count(),
                'total_quantity' => $items->sum('quantity'),
                'total_revenue' => $items->sum('total_price'),
            ];
        })
        ->sortByDesc('times_dispensed')
        ->values()
        ->take(10);

        // Pharmacist performance
        $pharmacistPerformance = $dispensedPrescriptions->groupBy('pharmacist_id')
            ->map(function ($prescriptions, $pharmacistId) {
                $pharmacist = $prescriptions->first()->pharmacist;
                return [
                    'pharmacist_id' => $pharmacistId,
                    'pharmacist_name' => $pharmacist?->name ?? 'Unknown',
                    'prescriptions_dispensed' => $prescriptions->count(),
                    'total_revenue' => $prescriptions->sum(fn($p) => $p->items->sum('total_price')),
                ];
            })
            ->values();

        return response()->json([
            'report_type' => 'dispensing',
            'period' => [
                'from' => $fromDate,
                'to' => $toDate,
            ],
            'summary' => [
                'total_prescriptions' => $totalPrescriptions,
                'total_medications_dispensed' => $totalMedicationsDispensed,
                'total_units_dispensed' => $totalUnitsDispensed,
                'total_revenue' => round($totalRevenue, 2),
                'average_prescription_value' => $totalPrescriptions > 0 
                    ? round($totalRevenue / $totalPrescriptions, 2) 
                    : 0,
            ],
            'daily_breakdown' => $dailyStats,
            'top_medications' => $topMedications,
            'pharmacist_performance' => $pharmacistPerformance,
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get inventory report with stock levels and valuation.
     */
    public function inventoryReport(Request $request)
    {
        $category = $request->input('category');

        $query = InventoryItem::with('supplier')->where('is_active', true);

        if ($category) {
            $query->where('category', $category);
        }

        $items = $query->get();

        // Summary stats
        $totalItems = $items->count();
        $totalValue = $items->sum(function ($item) {
            return $item->quantity * $item->unit_price;
        });
        $lowStockItems = $items->filter(fn($i) => $i->quantity <= $i->reorder_level);
        $expiredItems = $items->filter(fn($i) => $i->expiry_date && Carbon::parse($i->expiry_date)->isPast());
        $expiringSoon = $items->filter(function ($i) {
            if (!$i->expiry_date) return false;
            $expiry = Carbon::parse($i->expiry_date);
            return $expiry->isFuture() && $expiry->lte(Carbon::now()->addDays(30));
        });

        // Category breakdown
        $categoryBreakdown = $items->groupBy('category')->map(function ($catItems, $cat) {
            return [
                'category' => $cat ?: 'Uncategorized',
                'item_count' => $catItems->count(),
                'total_quantity' => $catItems->sum('quantity'),
                'total_value' => round($catItems->sum(fn($i) => $i->quantity * $i->unit_price), 2),
                'low_stock_count' => $catItems->filter(fn($i) => $i->quantity <= $i->reorder_level)->count(),
            ];
        })->values();

        // Stock level distribution
        $stockLevels = [
            'out_of_stock' => $items->filter(fn($i) => $i->quantity == 0)->count(),
            'critical' => $items->filter(fn($i) => $i->quantity > 0 && $i->quantity <= $i->reorder_level * 0.5)->count(),
            'low' => $items->filter(fn($i) => $i->quantity > $i->reorder_level * 0.5 && $i->quantity <= $i->reorder_level)->count(),
            'adequate' => $items->filter(fn($i) => $i->quantity > $i->reorder_level && $i->quantity <= $i->reorder_level * 3)->count(),
            'overstocked' => $items->filter(fn($i) => $i->quantity > $i->reorder_level * 3)->count(),
        ];

        return response()->json([
            'report_type' => 'inventory',
            'summary' => [
                'total_items' => $totalItems,
                'total_value' => round($totalValue, 2),
                'low_stock_count' => $lowStockItems->count(),
                'expired_count' => $expiredItems->count(),
                'expiring_soon_count' => $expiringSoon->count(),
            ],
            'stock_levels' => $stockLevels,
            'category_breakdown' => $categoryBreakdown,
            'low_stock_items' => $lowStockItems->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'category' => $item->category,
                    'quantity' => $item->quantity,
                    'reorder_level' => $item->reorder_level,
                    'unit' => $item->unit,
                ];
            })->values(),
            'expiring_items' => $expiringSoon->merge($expiredItems)->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'quantity' => $item->quantity,
                    'expiry_date' => $item->expiry_date,
                    'is_expired' => Carbon::parse($item->expiry_date)->isPast(),
                ];
            })->values(),
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get sales/revenue report.
     */
    public function salesReport(Request $request)
    {
        $fromDate = $request->input('from_date', Carbon::now()->startOfMonth()->toDateString());
        $toDate = $request->input('to_date', Carbon::now()->toDateString());

        // Get invoices in date range
        $invoices = Invoice::whereDate('issued_at', '>=', $fromDate)
            ->whereDate('issued_at', '<=', $toDate)
            ->with('patient')
            ->get();

        $totalInvoices = $invoices->count();
        $totalAmount = $invoices->sum('amount');
        $paidAmount = $invoices->where('status', 'paid')->sum('amount');
        $unpaidAmount = $invoices->where('status', 'unpaid')->sum('amount');
        $overdueAmount = $invoices->filter(function ($inv) {
            return $inv->status === 'unpaid' && Carbon::parse($inv->due_date)->isPast();
        })->sum('amount');

        // Daily revenue
        $dailyRevenue = $invoices->groupBy(function ($inv) {
            return Carbon::parse($inv->issued_at)->toDateString();
        })->map(function ($dayInvoices, $date) {
            return [
                'date' => $date,
                'invoices_count' => $dayInvoices->count(),
                'total_amount' => round($dayInvoices->sum('amount'), 2),
                'paid_amount' => round($dayInvoices->where('status', 'paid')->sum('amount'), 2),
                'unpaid_amount' => round($dayInvoices->where('status', 'unpaid')->sum('amount'), 2),
            ];
        })->values();

        // Payment status breakdown
        $statusBreakdown = [
            'paid' => [
                'count' => $invoices->where('status', 'paid')->count(),
                'amount' => round($paidAmount, 2),
            ],
            'unpaid' => [
                'count' => $invoices->where('status', 'unpaid')->count(),
                'amount' => round($unpaidAmount, 2),
            ],
            'partial' => [
                'count' => $invoices->where('status', 'partial')->count(),
                'amount' => round($invoices->where('status', 'partial')->sum('amount'), 2),
            ],
            'overdue' => [
                'count' => $invoices->filter(fn($i) => $i->status === 'unpaid' && Carbon::parse($i->due_date)->isPast())->count(),
                'amount' => round($overdueAmount, 2),
            ],
        ];

        return response()->json([
            'report_type' => 'sales',
            'period' => [
                'from' => $fromDate,
                'to' => $toDate,
            ],
            'summary' => [
                'total_invoices' => $totalInvoices,
                'total_amount' => round($totalAmount, 2),
                'paid_amount' => round($paidAmount, 2),
                'unpaid_amount' => round($unpaidAmount, 2),
                'overdue_amount' => round($overdueAmount, 2),
                'collection_rate' => $totalAmount > 0 
                    ? round(($paidAmount / $totalAmount) * 100, 1) 
                    : 0,
            ],
            'status_breakdown' => $statusBreakdown,
            'daily_revenue' => $dailyRevenue,
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get patient activity report for pharmacy.
     */
    public function patientActivityReport(Request $request)
    {
        $fromDate = $request->input('from_date', Carbon::now()->startOfMonth()->toDateString());
        $toDate = $request->input('to_date', Carbon::now()->toDateString());

        // Get prescriptions in date range
        $prescriptions = Prescription::whereDate('created_at', '>=', $fromDate)
            ->whereDate('created_at', '<=', $toDate)
            ->with(['patient', 'items'])
            ->get();

        // Unique patients served
        $uniquePatients = $prescriptions->pluck('patient_id')->unique()->count();

        // New vs returning patients
        $patientFirstVisit = Prescription::selectRaw('patient_id, MIN(created_at) as first_visit')
            ->groupBy('patient_id')
            ->pluck('first_visit', 'patient_id');

        $newPatients = $prescriptions->filter(function ($p) use ($fromDate, $patientFirstVisit) {
            $firstVisit = $patientFirstVisit[$p->patient_id] ?? null;
            return $firstVisit && Carbon::parse($firstVisit)->gte(Carbon::parse($fromDate));
        })->pluck('patient_id')->unique()->count();

        $returningPatients = $uniquePatients - $newPatients;

        // Top patients by prescriptions
        $topPatients = $prescriptions->groupBy('patient_id')
            ->map(function ($patientPrescriptions) {
                $patient = $patientPrescriptions->first()->patient;
                return [
                    'patient_id' => $patient?->id,
                    'patient_name' => $patient?->name ?? 'Unknown',
                    'prescription_count' => $patientPrescriptions->count(),
                    'total_spent' => round($patientPrescriptions->sum(fn($p) => $p->items->sum('total_price')), 2),
                ];
            })
            ->sortByDesc('prescription_count')
            ->values()
            ->take(10);

        return response()->json([
            'report_type' => 'patient_activity',
            'period' => [
                'from' => $fromDate,
                'to' => $toDate,
            ],
            'summary' => [
                'total_prescriptions' => $prescriptions->count(),
                'unique_patients' => $uniquePatients,
                'new_patients' => $newPatients,
                'returning_patients' => $returningPatients,
                'average_prescriptions_per_patient' => $uniquePatients > 0 
                    ? round($prescriptions->count() / $uniquePatients, 1) 
                    : 0,
            ],
            'top_patients' => $topPatients,
            'generated_at' => now()->toIso8601String(),
        ]);
    }
}
