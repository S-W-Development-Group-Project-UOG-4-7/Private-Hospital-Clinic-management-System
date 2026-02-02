<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$users = [
    'admin@clinic.com' => 'Admin@123',
    'doctor@clinic.com' => 'Doctor@123',
    'pharmacist@clinic.com' => 'Pharmacist@123',
    'receptionist@clinic.com' => 'Receptionist@123',
    'patient@clinic.com' => 'Patient@123',
];

foreach ($users as $email => $password) {
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $updated = DB::table('users')
        ->where('email', $email)
        ->update(['password' => $hash]);
    
    if ($updated) {
        echo "Updated password for {$email}\n";
    } else {
        echo "User {$email} not found\n";
    }
}

echo "\nDone! All passwords reset.\n";
