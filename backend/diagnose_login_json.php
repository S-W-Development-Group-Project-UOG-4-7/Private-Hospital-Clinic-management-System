<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;

$server = [
    'CONTENT_TYPE' => 'application/json',
    'HTTP_ACCEPT' => 'application/json',
];

$request = Request::create(
    '/api/auth/login',
    'POST',
    [],
    [],
    [],
    $server,
    json_encode([
        'login' => 'admin@clinic.com',
        'password' => 'Admin@123',
    ])
);

$response = $app->handle($request);

fwrite(STDOUT, "Status: {$response->getStatusCode()}\n");
fwrite(STDOUT, "Response:\n{$response->getContent()}\n");
