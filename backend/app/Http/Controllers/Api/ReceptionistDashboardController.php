<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\Invoice;
use App\Models\QueueEntry;
use Illuminate\Http\Request;

class ReceptionistDashboardController extends Controller
{
    public function stats(Request $request)
    {
        $today = now()->toDateString();

        $todaysAppointments = Appointment::query()
            ->whereDate('appointment_date', $today)
            ->where('status', 'scheduled')
            ->count();

        $checkedInPatients = QueueEntry::query()
            ->whereDate('queue_date', $today)
            ->whereIn('status', ['waiting', 'in_consultation'])
            ->count();

        $pendingPayments = Invoice::query()
            ->whereIn('status', ['unpaid', 'partial'])
            ->count();

        $doctorsOnDuty = DoctorSchedule::query()
            ->whereDate('schedule_date', $today)
            ->where('is_available', true)
            ->distinct()
            ->count('doctor_id');

        return response()->json([
            'todays_appointments' => $todaysAppointments,
            'checked_in_patients' => $checkedInPatients,
            'pending_payments' => $pendingPayments,
            'doctors_on_duty' => $doctorsOnDuty,
        ]);
    }
}
