<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SanitizeInput
{
    public function handle(Request $request, Closure $next)
    {
        $cleaned = $this->sanitize($request->all());
        $request->merge($cleaned);

        return $next($request);
    }

    private function sanitize(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->sanitize($value);
                continue;
            }

            if (is_string($value)) {
                $value = trim($value);
                $value = str_replace("\0", '', $value);
                $value = strip_tags($value);
                $data[$key] = $value;
            }
        }

        return $data;
    }
}
