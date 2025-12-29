<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  array<int, string>  $roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(Response::HTTP_UNAUTHORIZED, 'Unauthenticated.');
        }

        // Prefer Spatie roles (used by AuthController::register/login)
        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole($roles)) {
            return $next($request);
        }

        // Fallback for legacy role_id / Role model usage
        $legacyRoleSlug = $user->role?->slug;
        $legacyRoleName = $user->role?->name;
        $legacyRole = $legacyRoleSlug ?: ($legacyRoleName ? strtolower($legacyRoleName) : null);
        if ($legacyRole && in_array($legacyRole, $roles, true)) {
            return $next($request);
        }

        abort(Response::HTTP_FORBIDDEN, 'You do not have permission to access this resource.');
    }
}

