<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api')->group(function () {
    Route::get('/services', [App\Http\Controllers\ServiceController::class, 'index']);
    Route::get('/doctors', [App\Http\Controllers\DoctorController::class, 'index']);
    Route::post('/appointments/check-availability', [App\Http\Controllers\AppointmentController::class, 'checkAvailability']);
    Route::get('/testimonials', [App\Http\Controllers\TestimonialController::class, 'index']);
});
