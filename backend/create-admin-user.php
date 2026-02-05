<?php
require_once 'vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once 'bootstrap/app.php';

// Initialize the application
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

try {
    // Check if user already exists
    $existingUser = User::where('email', 'newadmin@hospital.com')->first();

    if ($existingUser) {
        echo "User with email 'newadmin@hospital.com' already exists.\n";
        echo "User ID: " . $existingUser->id . "\n";
        echo "Username: " . $existingUser->username . "\n";
        echo "Name: " . $existingUser->first_name . " " . $existingUser->last_name . "\n";

        // Update password if needed
        $existingUser->password = Hash::make('password123');
        $existingUser->save();
        echo "Password updated to 'password123'\n";

    } else {
        // Create new admin user
        $user = User::create([
            'first_name' => 'New',
            'last_name' => 'Admin',
            'username' => 'newadmin',
            'email' => 'newadmin@hospital.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        // Assign admin role
        $user->assignRole('admin');

        echo "New admin user created successfully!\n";
        echo "Email: newadmin@hospital.com\n";
        echo "Password: password123\n";
        echo "Username: newadmin\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
