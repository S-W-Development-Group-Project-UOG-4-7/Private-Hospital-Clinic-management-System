<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LabOrder;
use App\Models\LabResult;
use Illuminate\Http\Request;

class PatientLabResultController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $orders = LabOrder::query()
            ->where('patient_id', $user->id)
            ->with([
                'doctor:id,first_name,last_name',
                'clinic:id,name',
                'results',
            ])
            ->orderBy('order_date', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function (LabOrder $order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'test_type' => $order->test_type,
                    'test_description' => $order->test_description,
                    'status' => $order->status,
                    'order_date' => $order->order_date,
                    'due_date' => $order->due_date,
                    'doctor' => $order->doctor ? [
                        'name' => trim(($order->doctor->first_name ?? '') . ' ' . ($order->doctor->last_name ?? '')),
                    ] : null,
                    'clinic' => $order->clinic?->name,
                    'results' => $order->results->map(fn (LabResult $result) => $this->transformResult($result)),
                ];
            });

        return response()->json([
            'data' => $orders,
        ]);
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();

        $result = LabResult::query()
            ->where('patient_id', $user->id)
            ->with(['doctor:id,first_name,last_name', 'labOrder'])
            ->findOrFail($id);

        return response()->json($this->transformResult($result));
    }

    private function transformResult(LabResult $result): array
    {
        return [
            'id' => $result->id,
            'lab_order_id' => $result->lab_order_id,
            'test_name' => $result->test_name,
            'result_value' => $result->result_value,
            'unit' => $result->unit,
            'reference_range' => $result->reference_range,
            'status' => $result->status,
            'interpretation' => $result->interpretation,
            'file_url' => $result->file_url,
            'result_date' => $result->result_date,
            'doctor_reviewed' => $result->doctor_reviewed,
            'reviewed_at' => $result->reviewed_at,
            'doctor' => $result->doctor ? [
                'name' => trim(($result->doctor->first_name ?? '') . ' ' . ($result->doctor->last_name ?? '')),
            ] : null,
        ];
    }
}
