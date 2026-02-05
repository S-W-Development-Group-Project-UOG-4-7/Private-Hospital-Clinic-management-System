<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $required = config('app.required_env', []);
        if (!empty($required)) {
            $missing = collect($required)->filter(function ($key) {
                return empty(env($key));
            })->values()->all();

            if (!empty($missing)) {
                $message = 'Missing required environment variables: ' . implode(', ', $missing);
                Log::warning($message);

                if (config('app.env') === 'production' && config('app.env_validation_strict', false)) {
                    throw new \RuntimeException($message);
                }
            }
        }
    }
}
