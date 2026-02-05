<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Appointment;
use App\Models\QueueEntry;

$appt = Appointment::whereDate('appointment_date', now()->toDateString())->first();

if ($appt) {
    $exists = QueueEntry::where('appointment_id', $appt->id)->exists();
    
    if (!$exists) {
        QueueEntry::create([
            'appointment_id' => $appt->id,
            'patient_id' => $appt->patient_id,
            'doctor_id' => $appt->doctor_id,
            'queue_date' => now()->toDateString(),
            'queue_number' => 1,
            'status' => 'waiting',
            'checked_in_at' => now(),
        ]);
        echo "Queue entry created for appointment #{$appt->id}\n";
    } else {
        echo "Queue entry already exists for appointment #{$appt->id}\n";
    }
} else {
    echo "No appointment found for today\n";
}

// Show counts
echo "\nCurrent counts:\n";
echo "Appointments for today: " . Appointment::whereDate('appointment_date', now()->toDateString())->count() . "\n";
echo "Queue entries for today: " . QueueEntry::whereDate('queue_date', now()->toDateString())->count() . "\n";
