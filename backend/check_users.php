<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$users = \App\Models\User::all();

echo "Users in database:\n";
foreach ($users as $user) {
    echo "- {$user->email}: {$user->first_name} {$user->last_name} ({$user->username})\n";
}

echo "\nTotal users: " . $users->count() . "\n";