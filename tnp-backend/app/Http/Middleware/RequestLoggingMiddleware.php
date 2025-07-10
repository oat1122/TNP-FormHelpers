<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class RequestLoggingMiddleware
{
    protected $sensitiveHeaders = [
        'authorization',
        'password',
        'token',
        'api-key',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if the path matches what we want to monitor
        if (str_contains($request->path(), 'api/v1/worksheets') ||
            str_contains($request->path(), 'calendar')) {

            // Log the request
            $startTime = microtime(true);
            $method = $request->method();
            $uri = $request->fullUrl();

            // Log only non-sensitive request headers
            $headers = collect($request->headers->all())
                ->filter(function ($value, $key) {
                    return !in_array(strtolower($key), $this->sensitiveHeaders);
                })
                ->map(function ($value) {
                    return implode(',', $value);
                })
                ->all();

            Log::info("REQUEST: $method $uri", [
                'method' => $method,
                'uri' => $uri,
                'headers' => $headers,
                'ip' => $request->ip(),
            ]);

            // Process the request
            $response = $next($request);

            // Log the response
            $duration = microtime(true) - $startTime;
            $status = $response->getStatusCode();

            Log::info("RESPONSE: $method $uri - $status", [
                'method' => $method,
                'uri' => $uri,
                'status' => $status,
                'duration' => round($duration * 1000, 2) . 'ms',
            ]);

            return $response;
        }

        return $next($request);
    }
}
