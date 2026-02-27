<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     * SEC-11: Fixed — must return ?string (URL path or null), not a Response object.
     */
    protected function redirectTo(Request $request): ?string
    {
        // For API/JSON requests, return null → Laravel auto-returns JSON 401
        // For web requests, redirect to login page
        return $request->expectsJson() ? null : '/login';
    }
}
