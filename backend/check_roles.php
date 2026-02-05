<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = App\Models\User::with('roles')->get();
foreach($users as $user) {
    $roles = $user->roles->pluck('name')->implode(',');
    echo $user->email . ' -> ' . ($roles ?: 'NO ROLE') . PHP_EOL;
}
