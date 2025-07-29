<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAccountingRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        // Check if user has required role
        $userRole = $user->role ?? 'user';
        
        if (!in_array($userRole, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient permissions. Required roles: ' . implode(', ', $roles)
            ], 403);
        }

        return $next($request);
    }
}
