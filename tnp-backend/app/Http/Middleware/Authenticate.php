<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // return $request->expectsJson() ? null : route('login');
        // Check if the request expects a JSON response
        if ($request->expectsJson()) {
            // Return a custom JSON response for API requests
            return response()->json(['message' => 'You are not authenticated.'], 401);
        }

        // For non-API requests, you can still return a custom message (optional)
        // This will allow you to display text directly in a view
        return abort(401, 'You are not authenticated.');
    }
}
