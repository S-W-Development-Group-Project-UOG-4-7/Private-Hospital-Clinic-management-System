<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    echo "=== Testing Login Flow ===\n\n";

    // Step 1: Find user
    $user = User::where('email', 'admin@clinic.com')->first();
    echo "1. User found: " . ($user ? "YES (ID: {$user->id})" : "NO") . "\n";

    if (!$user) {
        die("User not found\n");
    }

    // Step 2: Check password
    $passwordMatch = Hash::check('Admin@123', $user->password);
    echo "2. Password match: " . ($passwordMatch ? "YES" : "NO") . "\n";

    // Step 3: Delete old tokens
    $deleted = $user->tokens()->delete();
    echo "3. Deleted old tokens: $deleted\n";

    // Step 4: Create new token
    $token = $user->createToken('auth_token')->plainTextToken;
    echo "4. Token created: " . substr($token, 0, 30) . "...\n";

    // Step 5: Load role
    $user->load('role');
    echo "5. Role loaded: " . ($user->role ? $user->role->name : "NULL") . "\n";

    // Step 6: Format user data
    $roleName = 'patient';
    if ($user->role) {
        $roleName = $user->role->name;
    } elseif ($user->roles && $user->roles->first()) {
        $roleName = $user->roles->first()->name;
    }

    $userData = [
        'id' => $user->id,
        'first_name' => $user->first_name ?? $user->name,
        'last_name' => $user->last_name ?? '',
        'name' => $user->name ?? ($user->first_name . ' ' . $user->last_name),
        'username' => $user->username,
        'email' => $user->email,
        'role' => $roleName,
    ];
    echo "6. User data formatted: " . json_encode($userData, JSON_PRETTY_PRINT) . "\n";

    // Step 7: Build response
    $response = [
        'message' => 'Login successful.',
        'token' => $token,
        'user' => $userData,
    ];
    echo "\n7. Full response:\n" . json_encode($response, JSON_PRETTY_PRINT) . "\n";

    echo "\n=== ALL STEPS PASSED ===\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
} catch (Error $e) {
    echo "PHP ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
