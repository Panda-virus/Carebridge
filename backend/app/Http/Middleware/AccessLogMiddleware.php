<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AccessLog;
use Illuminate\Support\Facades\Log;

class AccessLogMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        try {
            // Avoid logging health checks and static assets
            $path = $request->path();
            if (str_starts_with($path, '_') || str_contains($path, 'hot') || $path === 'health') {
                return $response;
            }

            $user = $request->user();

            AccessLog::create([
                'user_id' => $user?->id,
                'user_name' => $user?->name,
                'user_email' => $user?->email,
                'user_role' => $user?->role ?? null,
                'method' => $request->method(),
                'path' => $request->path(),
                'ip_address' => $request->ip(),
                'user_agent' => substr($request->header('User-Agent') ?? '', 0, 1024),
                'payload' => $request->except(['password', 'password_confirmation', 'file']),
            ]);
        } catch (\Throwable $e) {
            Log::warning('AccessLogMiddleware failed to record access: ' . $e->getMessage());
        }

        return $response;
    }
}
