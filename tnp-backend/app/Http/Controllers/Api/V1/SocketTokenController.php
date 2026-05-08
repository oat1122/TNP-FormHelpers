<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Issues short-lived HMAC tokens that authorise a Socket.io handshake
 * against the tnp-notification service. The notification service recomputes
 * the HMAC with the same shared secret to verify ownership of `user_id`.
 *
 * Token format and the formula MUST match
 * `tnp-notification/src/plugins/socket/auth.ts` and the rules in
 * `tnp-notification/.claude/rules/socket-auth.md`.
 */
class SocketTokenController extends Controller
{
    public function issue(Request $request): JsonResponse
    {
        $secret = config('services.notification.token_secret');

        if (empty($secret)) {
            return response()->json([
                'success' => false,
                'message' => 'Socket token service is not configured',
            ], 503);
        }

        $user = $request->user();
        $userId = (string) $user->user_id;
        $exp = time() + (int) config('services.notification.token_ttl', 3600);

        $token = hash_hmac('sha256', "{$userId}:{$exp}", $secret);

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user_id' => $userId,
                'exp' => $exp,
            ],
        ]);
    }
}
