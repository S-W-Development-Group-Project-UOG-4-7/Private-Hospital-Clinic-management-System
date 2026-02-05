<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AuditAction
{
    public function handle(Request $request, Closure $next, ?string $action = null): Response
    {
        $requestId = $request->header('X-Request-Id') ?: (string) Str::uuid();
        $request->attributes->set('request_id', $requestId);

        /** @var \Symfony\Component\HttpFoundation\Response $response */
        $response = $next($request);

        if ($this->shouldSkip($request, $response)) {
            return $response;
        }

        $user = $request->user();
        $route = $request->route();

        $actionName = $action
            ?: ($route?->getName() ?: ($route?->getActionName() ?: ($request->method() . ' ' . $request->path())));

        $entityType = $request->attributes->get('audit.entity_type');
        $entityId = $request->attributes->get('audit.entity_id');

        if ($entityId === null) {
            $params = $route?->parameters() ?? [];
            if (array_key_exists('id', $params)) {
                $entityId = $params['id'];
            }
        }

        if ($entityType === null) {
            $entityType = $route?->getName() ?: ($route?->getActionName() ?: 'unknown');
        }

        $before = $request->attributes->get('audit.before');
        $after = $request->attributes->get('audit.after') ?? $this->sanitizePayload($request->all());

        AuditLog::create([
            'request_id' => $requestId,
            'user_id' => $user?->id,
            'actor_user_id' => $user?->id,
            'action' => $actionName,
            'entity_type' => $entityType,
            'entity_id' => is_numeric($entityId) ? (int) $entityId : null,
            'before_data' => $before,
            'after_data' => $after,
            'changes' => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $response;
    }

    private function shouldSkip(Request $request, Response $response): bool
    {
        if ($response->getStatusCode() >= 400) {
            return true;
        }

        return in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true);
    }

    private function sanitizePayload(array $payload): array
    {
        $redactedKeys = [
            'password',
            'current_password',
            'new_password',
            'password_confirmation',
        ];

        foreach ($redactedKeys as $key) {
            if (array_key_exists($key, $payload)) {
                $payload[$key] = '[redacted]';
            }
        }

        return $payload;
    }
}
