<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Fix receptionist role
$user = App\Models\User::where('email', 'receptionist@clinic.com')->first();
if ($user) {
    $user->syncRoles(['receptionist']);
    echo "Updated receptionist@clinic.com - Roles: " . implode(', ', $user->getRoleNames()->toArray()) . "\n";
} else {
    echo "receptionist@clinic.com not found\n";
}

// Also ensure pharmacist has correct role
$pharmacist = App\Models\User::where('email', 'pharmacist@clinic.com')->first();
if ($pharmacist) {
    $pharmacist->syncRoles(['pharmacist']);
    echo "Updated pharmacist@clinic.com - Roles: " . implode(', ', $pharmacist->getRoleNames()->toArray()) . "\n";
}

echo "Done!\n";
