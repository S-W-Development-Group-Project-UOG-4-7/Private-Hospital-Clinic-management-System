<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;

$request = Request::create('/api/auth/login', 'POST', [
    'login' => 'admin@clinic.com',
    'password' => 'Admin@123',
]);

$response = $app->handle($request);

$status = $response->getStatusCode();
$content = $response->getContent();

fwrite(STDOUT, "Status: {$status}\n");
fwrite(STDOUT, "Response:\n{$content}\n");
