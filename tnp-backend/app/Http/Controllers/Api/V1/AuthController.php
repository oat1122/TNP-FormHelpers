<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // Login function
    public function oldlogin(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required'
        ]);

        try {
            // check if entered username exists in db
            $username_status = User::where("username", $request->username)
                ->where("enable", "Y")
                ->where("deleted", "0")
                ->first();

            // if username exists then we will check password for the same username
            if (!is_null($username_status)) {
                $password_status = User::where("username", $request->username)->where("password", md5($request->password))->first();

                // if password is correct
                if (!is_null($password_status)) {
                    $user = $this->userDetail($request->username);
                    $request->session()->regenerate();

                    return response()->json(["status" => "success", "data" => $user]);
                } else {
                    return response()->json(["status" => "error", "message" => "Unable to login. Incorrect password."], 401);
                }
            } else {
                return response()->json(["status" => "error", "message" => "Unable to login. Username doesn't exist."], 404);
            }
        } catch (\Exception $e) {
            Log::error('Error login: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
    }

    // ------------------ [ User Detail ] ---------------------
    public function userDetail($username)
    {
        $user = [];
        if ($username != "") {
            $user = User::where("username", $username)->firstOrFail();
            $user = collect($user)->except('created_at', 'updated_at');

            return $user;
        }
    }

    // Logout function
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            // ตรวจสอบสถานะการ authenticate
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated'
                ], 401);
            }

            $request->user()->tokens()->delete();

            return response()->json([
                'status' => 'success',
            ]);

        } catch (\Exception $e) {
            Log::error('Error Logout for user ID: ' . ($user->user_id ?? 'unknown') . ' - ' . $e->getMessage(), 
                [ 'exception' => $e->getTraceAsString()]
            );
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
    }

    // Login function
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required',
            'password' => 'required'
        ]);

        try {
            $user = User::where('username', $credentials['username'])
                ->where('user_is_enable', true)
                ->select(
                    'user_id',
                    'user_uuid',
                    'username',
                    'password',
                    'new_pass',
                    'role',
                    'enable',
                    'user_nickname',
                    'user_emp_no',
                    'user_is_enable',
                )
                ->first();

            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'Username not found'], 404);
            }

             // ตรวจสอบรหัสผ่านด้วย new_pass
            if (!Hash::check($credentials['password'], $user->new_pass)) {
                return response()->json(['status' => 'error', 'message' => 'Incorrect password'], 401);
            }

            $token = $user->createToken('api-token')->plainTextToken;

            // ลบข้อมูล sensitive ก่อนส่งกลับ
            unset($user->password, $user->new_pass);

            return response()->json([
                'status' => 'success',
                'data' => $user,
                'token' => $token, // คืนค่า API Token
            ]);

        } catch (\Exception $e) {
            Log::error('Error login for username: ' . $credentials['username'] . ' - ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
    }
}
