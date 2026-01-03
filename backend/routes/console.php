<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule automated reorder level checks (runs daily at 9 AM)
Schedule::command('inventory:check-reorder-levels')
    ->dailyAt('09:00')
    ->timezone('UTC');
