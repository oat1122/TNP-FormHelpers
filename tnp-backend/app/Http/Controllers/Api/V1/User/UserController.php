<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\User\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use App\Models\User\User;
use App\Models\User as MasterUser;

class UserController extends Controller
{
    private $status_code = 200;

    public function signup(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[#?!@$%^&*-]).{8,}$/'
            ],
            'role' => 'required',
            'user_nickname' => 'required',
            'user_is_enable' => 'required',
        ]);

        $data_input = $request->all();

        // เช็คชื่อผู้ใช้งานว่าซ้ำหรือไม่
        $username_exist = $this->check_username_existing($data_input);
        if (!is_null($username_exist) && $username_exist->getData()->status === 'error') {
            return $username_exist;
        }

        try {
            DB::beginTransaction();

            $user = new User();
            $user->fill($data_input);
            $user->user_uuid = Str::uuid();
            $user->password = md5($data_input['password']);
            $user->new_pass = Hash::make($data_input['password']);
            $user->pass_is_updated = true;
            $user->user_is_enable = filter_var($data_input['user_is_enable'], FILTER_VALIDATE_BOOLEAN);
            $user->user_is_deleted = false;
            $user->user_created_date = now();
            $user->user_created_by = $data_input['user_created_by'] ?? null;
            $user->user_updated_date = now();
            $user->user_updated_by = $data_input['user_updated_by'] ?? null;
            $user->save();

            // Sync Sub Roles if provided
            if (isset($data_input['sub_role_ids']) && is_array($data_input['sub_role_ids'])) {
                $user->syncSubRoles($data_input['sub_role_ids'], $user->user_id);
            }

            DB::commit();

            return response()->json([
               'status'=> 'success',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error signup : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Error signup : ' . $e->getMessage()
            ]);
        }
    }

    // ------------ [ User Login ] -------------------
    public function login(Request $request)
    {

        $validator = Validator::make(
            $request->all(),
            [
                "username" => "required",
                "password" => "required"
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                "status" => "error", 
                "message" => $validator->errors(), 
                "validator_error" => true 
            ]);
        }

        // check if entered username exists in db
        $username_status = User::where("username", $request->username)
                                ->where("user_is_enable", true)
                                ->where("user_is_deleted", false)                        
                                ->first();

        // if username exists then we will check password for the same username
        if (!is_null($username_status)) {
            $password_status = User::where("username", $request->username)->where("password", md5($request->password))->first();

            // if password is correct
            if (!is_null($password_status)) {
                $user = $this->userDetail($request->username);

                return response()->json(["status" => "success", "data" => $user]);
            } else {
                return response()->json(["status" => "error", "message" => "Unable to login. Incorrect password."]);
            }
        } else {
            return response()->json(["status" => "error", "message" => "Unable to login. Username doesn't exist."]);
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

    // ---------------- [ Show all users ] ----------------
    public function index(Request $request)
    {
        // prepared sql
        $prepared_statement = MasterUser::where('user_is_deleted', false);

        // for search
        if ($request->has('search')) {
            $search_term = '%' . trim($request->search) . '%';
            $search_sql = function ($query) use ($search_term) {

                $query->where(function ($q) use ($search_term) {
                    $q->orWhere('role', 'like', $search_term)
                        ->orWhere('user_emp_no', 'like', $search_term)
                        ->orWhere('username', 'like', $search_term)
                        ->orWhere('user_nickname', 'like', $search_term);
                });
            };

            $prepared_statement->where($search_sql);
        }

        $perPage = $request->input('per_page', 10);
        $query = $prepared_statement->with('subRoles:msr_id,msr_code,msr_name')->select([ // Use array syntax for select
            'user_id',
            'user_uuid',
            'username',
            'role',
            'user_emp_no',
            'user_firstname',
            'user_lastname',
            'user_phone',
            'user_nickname',
            'user_position',
            'enable',
            'user_is_enable',
            'user_created_date',
            'user_created_by',
            'user_updated_date',
            'user_updated_by',
        ])->orderBy('user_created_date', 'desc')->paginate($perPage);
        $result = UserResource::collection($query);

        return [
            'data' => $result,
            'pagination' => [
                'current_page' => $query->currentPage(),
                'per_page' => $query->perPage(),
                'total_pages' => $query->lastPage(),
                'total_items' => $query->total()
            ]
        ];
    }

    // ---------------- [ Update user ] ----------------
    public function update(Request $request, string $id)
    {
        $request->validate([
            'username' => 'required',
            'role' => 'required',
            'user_nickname' => 'required',
            'user_is_enable' => 'required',
        ]);

        $data_input = $request->except('user_created_by', 'user_created_date');

        try {
            DB::beginTransaction();

            // เช็คชื่อผู้ใช้งานว่าซ้ำหรือไม่
            $username_exist = $this->check_username_existing($data_input);
            if (!is_null($username_exist) && $username_exist->getData()->status === 'error') {
                return $username_exist;
            }

            $query = MasterUser::where('user_uuid', $id)->firstOrFail();
            $query->fill($data_input);
            $query->user_is_enable = filter_var($data_input['user_is_enable'], FILTER_VALIDATE_BOOLEAN);
            $query->user_updated_date = now();
            $query->save();

            // Sync Sub Roles if provided
            if (isset($data_input['sub_role_ids']) && is_array($data_input['sub_role_ids'])) {
                $query->syncSubRoles($data_input['sub_role_ids'], $query->user_id);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update user error : ' . $e);

            return response()->json([
                'status'=> 'error',
                'message' => 'Update user error : ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            DB::beginTransaction();

            $query = MasterUser::where('user_uuid', $id)->firstOrFail();
            $query->update([
                'user_is_deleted' => 1,
                'deleted' => 1,
                'user_is_enable' => 0,
                'enable' => 'N',
                'user_updated_by' => $id,
                'user_updated_date' => now(),
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error delete user : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Error delete user : ' . $e->getMessage()
            ]);
        }
    }

    public function get_users_by_role(Request $request)
    {
        $roles = ['graphic', 'manager', 'production', 'sale', 'technician'];
        $result = [];

        if ($request->has('role')) {
            $roles = array_map('trim', explode(',', $request->role));
        };

        foreach ($roles as $role) {
            $users = MasterUser::where('user_is_enable', true)
                        ->where('user_is_deleted', false)
                        ->where('role', $role)
                        ->select(
                            'user_id',
                            'user_uuid',
                            'username',
                            'user_nickname',
                            'role',
                            'user_is_enable',
                            'user_is_deleted',
                        )
                        ->get()
                        ->map(function ($user) {
                            return [
                                'user_uuid' => $user->user_uuid,
                                'user_id' => $user->user_id,
                                'username' => $user->username,
                                'user_nickname' => $user->user_nickname,
                                'role' => $user->role,
                            ];
                        });
            
            $result["{$role}_role"] = $users;
        }

        return $result;
    }

    /**
     * Get users filtered by sub_role codes
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     * 
     * Usage: GET /api/v1/users/by-sub-role?sub_role_codes=SALES_ONLINE,SALES_OFFLINE
     */
    public function get_users_by_sub_role(Request $request)
    {
        $query = MasterUser::where('user_is_enable', true)
            ->where('user_is_deleted', false)
            ->with('subRoles:msr_id,msr_code,msr_name');

        // Filter by sub_role_codes if provided
        if ($request->has('sub_role_codes')) {
            $codes = array_map('trim', explode(',', $request->sub_role_codes));
            $codes = array_map('strtoupper', $codes);
            
            $query->whereHas('subRoles', function ($q) use ($codes) {
                $q->whereIn('msr_code', $codes);
            });
        }

        $users = $query->select([
            'user_id',
            'user_uuid',
            'username',
            'user_firstname',
            'user_lastname',
            'user_nickname',
            'role',
        ])->get();

        return response()->json([
            'status' => 'success',
            'data' => $users->map(function ($user) {
                return [
                    'user_id' => $user->user_id,
                    'user_uuid' => $user->user_uuid,
                    'username' => $user->username,
                    'user_firstname' => $user->user_firstname,
                    'user_lastname' => $user->user_lastname,
                    'user_nickname' => $user->user_nickname,
                    'role' => $user->role,
                    'sub_roles' => $user->subRoles->map(fn($sr) => [
                        'msr_id' => $sr->msr_id,
                        'msr_code' => $sr->msr_code,
                        'msr_name' => $sr->msr_name,
                    ]),
                ];
            }),
        ]);
    }

    public function resetPassword(Request $request, string $id)
    {
        try {
            DB::beginTransaction();

            $query = MasterUser::where("user_uuid", $id)->firstOrFail();

            if ($request->is_reset) {
                $validated = $request->validate([
                    'username' => 'required'
                ]);
                $query->password = md5($validated['username'].'@153153');
                $query->new_pass = Hash::make($validated['username'].'@153153');
                
            } else {
                $data_input = $request->all();

                $query->password = md5($data_input['password']);
                $query->new_pass = Hash::make($data_input['password']);
            }

            $query->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Reset password error : ' . $e);

            return response()->json([
                'status'=> 'error',
                'message' => 'Reset password error : ' . $e->getMessage()
            ]);
        }
    }

    // เช็คข้อมูลชื่อผู้ใช้ว่าซ้ำหรือไม่
    private function check_username_existing($data_input)
    {
        $query = MasterUser::where("username", $data_input['username']);
    
        // ถ้าเป็นการอัปเดต (มี user_id มา)
        if (isset($data_input['user_uuid'])) {
            $query->where('user_uuid', '!=', $data_input['user_uuid']);
        }

        $username_exist = $query->first();

        if (!is_null($username_exist)) {
            return response()->json([
                'status' => 'error',
                'message' => 'มีชื่อผู้ใช้นี้ในระบบแล้ว'
            ]);
        }
    }

}
