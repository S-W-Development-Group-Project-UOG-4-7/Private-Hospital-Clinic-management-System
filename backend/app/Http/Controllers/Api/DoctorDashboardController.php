<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\LabOrder;
use App\Models\ClinicReferral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DoctorDashboardController extends Controller
{
    /**
     * Get daily summary of patients consulted by the doctor
     */
    public function dailySummary(Request $request)
    {
        $doctor = $request->user();
        $date = $request->input('date', now()->toDateString());

        // Get completed appointments for the day
        $completedAppointments = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $date)
            ->where('status', 'completed')
            ->with(['patient:id,first_name,last_name,email', 'patient.patientProfile:user_id,phone,gender,date_of_birth'])
            ->orderBy('appointment_time', 'asc')
            ->get();

        // Get all appointments for the day (for stats)
        $allAppointments = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $date)
            ->get();

        // Get prescriptions created today
        $prescriptionsToday = Prescription::query()
            ->where('doctor_id', $doctor->id)
            ->whereDate('prescription_date', $date)
            ->with(['patient:id,first_name,last_name,email', 'items.inventoryItem:id,name,brand_name'])
            ->get();

        // Get lab orders created today
        $labOrdersToday = LabOrder::query()
            ->where('doctor_id', $doctor->id)
            ->whereDate('order_date', $date)
            ->with(['patient:id,first_name,last_name,email'])
            ->get();

        // Get clinic referrals created today
        $referralsToday = ClinicReferral::query()
            ->where('referring_doctor_id', $doctor->id)
            ->whereDate('created_at', $date)
            ->with(['patient:id,first_name,last_name,email', 'clinic:id,name'])
            ->get();

        // Build summary statistics
        $stats = [
            'total_appointments' => $allAppointments->count(),
            'completed_consultations' => $completedAppointments->count(),
            'pending_appointments' => $allAppointments->where('status', 'scheduled')->count(),
            'cancelled_appointments' => $allAppointments->where('status', 'cancelled')->count(),
            'prescriptions_issued' => $prescriptionsToday->count(),
            'lab_orders_placed' => $labOrdersToday->count(),
            'referrals_made' => $referralsToday->count(),
            'in_person_consultations' => $completedAppointments->where('type', 'in_person')->count(),
            'telemedicine_consultations' => $completedAppointments->where('type', 'telemedicine')->count(),
        ];

        // Build patient consultation list
        $consultedPatients = $completedAppointments->map(function ($appointment) use ($prescriptionsToday, $labOrdersToday, $referralsToday) {
            $patientId = $appointment->patient_id;
            
            // Find related prescriptions for this patient today
            $patientPrescriptions = $prescriptionsToday->where('patient_id', $patientId);
            
            // Find related lab orders for this patient today
            $patientLabOrders = $labOrdersToday->where('patient_id', $patientId);
            
            // Find related referrals for this patient today
            $patientReferrals = $referralsToday->where('patient_id', $patientId);

            return [
                'appointment_id' => $appointment->id,
                'patient_id' => $patientId,
                'patient_name' => $appointment->patient 
                    ? trim($appointment->patient->first_name . ' ' . $appointment->patient->last_name) 
                    : 'Unknown',
                'patient_email' => $appointment->patient?->email,
                'patient_phone' => $appointment->patient?->patientProfile?->phone ?? 'N/A',
                'patient_gender' => $appointment->patient?->patientProfile?->gender ?? 'N/A',
                'appointment_time' => $appointment->appointment_time,
                'consultation_type' => $appointment->type,
                'reason' => $appointment->reason,
                'notes' => $appointment->notes,
                'prescriptions_count' => $patientPrescriptions->count(),
                'lab_orders_count' => $patientLabOrders->count(),
                'referrals_count' => $patientReferrals->count(),
                'prescriptions' => $patientPrescriptions->map(fn($p) => [
                    'id' => $p->id,
                    'prescription_number' => $p->prescription_number,
                    'items_count' => $p->items->count(),
                    'status' => $p->status,
                ])->values(),
                'lab_orders' => $patientLabOrders->map(fn($l) => [
                    'id' => $l->id,
                    'test_type' => $l->test_type,
                    'status' => $l->status,
                ])->values(),
                'referrals' => $patientReferrals->map(fn($r) => [
                    'id' => $r->id,
                    'clinic_name' => $r->clinic?->name ?? 'Unknown',
                    'priority' => $r->priority,
                    'status' => $r->status,
                ])->values(),
            ];
        });

        return response()->json([
            'date' => $date,
            'doctor_id' => $doctor->id,
            'doctor_name' => trim($doctor->first_name . ' ' . $doctor->last_name),
            'stats' => $stats,
            'consulted_patients' => $consultedPatients,
        ]);
    }
}
