<?php

namespace App\Http\Controllers\Api\V1\Pricing;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Pricing\PricingCollection;
use App\Http\Resources\V1\Pricing\PricingResource;
use App\Models\MasterStatus;
use App\Services\PricingService;
use App\Models\PricingRequest;
use App\Models\PricingRequestNote;
use App\Models\User;
use App\Services\GlobalService;
use Illuminate\Support\Facades\Storage;

class PricingController extends Controller
{
    protected $pricing_service;
    protected $global_service;

    public function __construct()
    {
        $this->pricing_service = new PricingService();
        $this->global_service = new GlobalService();
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            // query user
            $user_q = User::where('user_is_enable', true)->where('user_uuid', $request->user)->select('user_uuid', 'role')->first();

            $status_q = MasterStatus::where('status_type', '1')
                ->where('status_is_deleted', false)
                ->select('status_id', 'status_name', 'status_remark', 'status_type')
                ->withCount(['pricingReqStatus' => function ($query) use ($user_q, $request) {  // Use withCount
                    $query->where('status_is_deleted', false);
                    $query->where('pr_is_deleted', false);

                    if (!in_array($user_q->role, ['admin', 'manager', 'production', 'account'])) {
                        $query->where('pr_created_by', $user_q->user_uuid);
                    };

                    // for search
                    if ($request->has('search')) {
                        $search_term = '%' . trim($request->search) . '%';
                        $query->where(function ($q) use ($search_term) {
                            $q->orWhere('pr_no', 'like', $search_term)
                                ->orWhere('pr_work_name', 'like', $search_term)
                                ->orWhereHas('prCreatedBy', function ($user_q) use ($search_term) {
                                    $user_q->where('username', 'like', $search_term);
                                })
                                ->orWhereHas('pricingCustomer', function ($user_q) use ($search_term) {
                                    $user_q->where('cus_name', 'like', $search_term);
                                });
                        });
                    }
                }])
                ->get();

            // prepared sql
            $prepared_statement = PricingRequest::where('pr_is_deleted', false);

            // count all data
            $total_query = PricingRequest::where('pr_is_deleted', false);

            // query with status
            if ($request->has('status') && $request->status !== "all") {
                $prepared_statement->where('pr_status_id', $request->status);
            }

            // query with user_id, if role is not admin, manager, production, account
            if (!in_array($user_q->role, ['admin', 'manager', 'production', 'account'])) {
                $prepared_statement->where('pr_created_by', $user_q->user_uuid);
                $total_query->where('pr_created_by', $user_q->user_uuid);
            };

            // for search
            if ($request->has('search')) {
                $search_term = '%' . trim($request->search) . '%';
                $search_sql = function ($query) use ($search_term) {

                    $query->where(function ($q) use ($search_term) {
                        $q->orWhere('pr_no', 'like', $search_term)
                            ->orWhere('pr_work_name', 'like', $search_term)
                            ->orWhereHas('prCreatedBy', function ($user_q) use ($search_term) {
                                $user_q->where('username', 'like', $search_term);
                            })
                            ->orWhereHas('pricingCustomer', function ($user_q) use ($search_term) {
                                $user_q->where('cus_name', 'like', $search_term);
                            });
                    });
                };

                $prepared_statement->where($search_sql);
                $total_query->where($search_sql);
            }

            $perPage = $request->input('per_page', 10);
            $query = $prepared_statement->select([ // Use array syntax for select
                'pr_id',
                'pr_cus_id',
                'pr_mpc_id',
                'pr_status_id',
                'pr_no',
                'pr_work_name',
                'pr_pattern',
                'pr_fabric_type',
                'pr_color',
                'pr_sizes',
                'pr_quantity',
                'pr_due_date',
                'pr_silk',
                'pr_dft',
                'pr_embroider',
                'pr_sub',
                'pr_other_screen',
                'pr_image',
                'pr_created_date',
                'pr_created_by',
                'pr_updated_date',
                'pr_updated_by',
                'pr_is_deleted'
            ])->orderBy('pr_created_date', 'desc')->paginate($perPage);
            $result = PricingResource::collection($query);

            $total_result = $total_query->count();

            return [
                'data' => $result,
                'status' => $status_q,
                'total_count' => $total_result,
                'pagination' => [
                    'current_page' => $query->currentPage(),
                    'per_page' => $query->perPage(),
                    'total_pages' => $query->lastPage(),
                    'total_items' => $query->total()
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Fetch pricing request error : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Fetch pricing request error : ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'pr_cus_id' => 'required',
            'pr_mpc_id' => 'required',
            'pr_work_name' => 'required',
            'pr_quantity' => 'required',
            'pr_created_by' => 'required',
        ]);

        $data_input = $request->all();

        try {
            DB::beginTransaction();

            // บันทึกรูป
            if (isset($data_input['pr_image']) && Str::startsWith($data_input['pr_image'], 'data:image')) {
                // แยกประเภทไฟล์และข้อมูล base64
                preg_match("/^data:image\/(.*?);base64,(.*)$/", $data_input['pr_image'], $matches);
                $image_type = $matches[1]; // png, jpeg, etc.
                $image_data = base64_decode($matches[2]);

                // Rename images file.
                $timestamp = microtime(true) . date('YmdHis');
                $new_filename = $timestamp . '.' . $image_type;

                if (!in_array($image_type, ['png', 'jpeg', 'jpg', 'gif'])) {
                    return response()->json([
                        'status' => 'error',
                        'message' => "ประเภทไฟล์รูปภาพไม่ถูกต้อง\n(รองรับเฉพาะ png, jpeg, jpg, gif)"
                    ]);
                }

                $this->global_service->saveImage('pricing_req', 1600, $image_data, $new_filename, null);

                $data_input['pr_image'] = $new_filename;
            }

            $pricing = new PricingRequest();
            $pricing->fill($data_input);
            $pricing->pr_id = Str::uuid();
            $pricing->pr_no = $this->pricing_service->generatePricingNo();
            $pricing->pr_created_date = now();
            $pricing->pr_status_id = '20db7a92-092b-11f0-b223-38ca84abdf0a';    // สถานะ "รอส่งคำขอ"
            $pricing->pr_created_by = $data_input['pr_created_by'] ?? null;
            $pricing->pr_updated_date = now();
            $pricing->pr_updated_by = $data_input['pr_created_by'] ?? null;
            $pricing->save();
            $pr_id = $pricing->pr_id;

            $noteTypes = [
                'note_sales'   => 1,
                'note_price'   => 2,
                'note_manager' => 3,
            ];
            
            // Get user role to restrict note_manager access
            $user_role = User::where('user_uuid', $data_input['pr_created_by'])->value('role');
            
            foreach ($noteTypes as $key => $type) {
                // Skip note_manager for account and sale roles
                if ($key === 'note_manager' && in_array($user_role, ['account', 'sale'])) {
                    continue;
                }

                if (isset($data_input[$key])) {
                    foreach($data_input[$key] as $item) {
                        if (!isset($item['prn_id'])) {
                            $pricing_note = new PricingRequestNote();
                            $pricing_note->fill($item);
                            $pricing_note->prn_pr_id = $pr_id;
                            $pricing_note->prn_note_type = $type;
                            $pricing_note->save();
                        }
                    }
                }
            }

            DB::commit();
            return response()->json([
                'status' => 'success',
                'message' => 'pr_id: ' . $pr_id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create pricing request error : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Create pricing request error : ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        if ($id === 'all') {
            return new PricingCollection(PricingRequest::orderBy('pr_created_date', 'desc')->get());
        } else {
            $query = PricingRequest::where('pr_is_deleted', '!=', 1)->where('pr_id', $id)->first();

            if ($query) {
                return new PricingResource($query);
            }
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $mapSubmitActions = [
            'SAVE' => 'save',
            'REQUEST' => 'request',
            'PRICING' => 'pricing',
            'REJECT' => 'reject',
            'CANNOT_PRICING' => 'cannot_pricing',
        ];

        $request->validate([
            'pr_cus_id' => 'required',
            'pr_mpc_id' => 'required',
            'pr_work_name' => 'required',
            'pr_quantity' => 'required',
            'pr_created_by' => 'required',
        ]);

        $data_input = $request->except('pr_created_date');

        try {
            DB::beginTransaction();

            $query = PricingRequest::findOrFail($id);

            // บันทึกไฟล์รูป
            if (isset($data_input['pr_image']) && Str::startsWith($data_input['pr_image'], 'data:image')) {
                // แยกประเภทไฟล์และข้อมูล base64
                preg_match("/^data:image\/(.*?);base64,(.*)$/", $data_input['pr_image'], $matches);
                $image_type = $matches[1]; // png, jpeg, etc.
                $image_data = base64_decode($matches[2]);

                // Rename images file.
                $timestamp = microtime(true) . date('YmdHis');
                $new_filename = $timestamp . '.' . $image_type;

                if (!in_array($image_type, ['png', 'jpeg', 'jpg', 'gif'])) {
                    return response()->json([
                        'status' => 'error',
                        'message' => "ประเภทไฟล์รูปภาพไม่ถูกต้อง\n(รองรับเฉพาะ png, jpeg, jpg, gif)"
                    ]);
                }

                $this->global_service->saveImage('pricing_req', 1600, $image_data, $new_filename, $query->pr_image);

                $data_input['pr_image'] = $new_filename;

            } else if (!isset($data_input['pr_image'])) {

                $existing_images_file = Storage::get('public/images/pricing_req/' . $query->pr_image);

                // Delete old images file.
                if ($existing_images_file !== null) {
                    Storage::delete('public/images/pricing_req/' . $query->pr_image);
                }

            } else if (isset($data_input['pr_image']) && Str::startsWith($data_input['pr_image'], 'http')) {

                $only_filename = basename($data_input['pr_image']);
                $data_input['pr_image'] = $only_filename;
            }

            $query->fill($data_input);
            $query->pr_updated_date = now();

            // อัพเดตสถานะคำขอ ถ้ามีการบันทึกและส่งคำขอ หรือให้ราคา
            if (isset($data_input['submit_action']) && $data_input['submit_action'] != $mapSubmitActions['SAVE']) {
                $user_q = User::where('user_uuid', $data_input['pr_updated_by'])->firstOrFail();

                if ($user_q['role'] == 'sale') {

                    if ($data_input['pr_status_id'] == '20db7a92-092b-11f0-b223-38ca84abdf0a') {    // รอส่งคำขอ
                        $query->pr_status_id = '20db8b15-092b-11f0-b223-38ca84abdf0a';   // รอทำราคา
                    } else {
                        $query->pr_status_id = '20db8c29-092b-11f0-b223-38ca84abdf0a';   // แก้ไขรอทำราคา
                    }

                } else if (in_array($user_q['role'], ['manager', 'production'])) {

                    if ($mapSubmitActions['PRICING'] == $data_input['submit_action']) {
                        $query->pr_status_id = '20db8be1-092b-11f0-b223-38ca84abdf0a';   // ได้ราคาแล้ว

                    } else if ($mapSubmitActions['REJECT'] == $data_input['submit_action']) {
                        $query->pr_status_id = '20db8cbf-092b-11f0-b223-38ca84abdf0a';   // ปฏิเสธงาน

                    } else if ($mapSubmitActions['CANNOT_PRICING'] == $data_input['submit_action']) {
                        $query->pr_status_id = '20db8cf1-092b-11f0-b223-38ca84abdf0a';   // ทำราคาไม่ได้

                    }

                }
            }
            $query->save();
            
            $noteTypes = [
                'note_sales'   => 1,
                'note_price'   => 2,
                'note_manager' => 3,
            ];
            
            // Get user role to restrict note_manager access
            $user_role = User::where('user_uuid', $data_input['pr_updated_by'])->value('role');
            
            foreach ($noteTypes as $key => $type) {
                // Skip note_manager for account and sale roles
                if ($key === 'note_manager' && in_array($user_role, ['account', 'sale'])) {
                    continue;
                }

                if (isset($data_input[$key])) {
                    foreach($data_input[$key] as $item) {
                        if (!isset($item['prn_id'])) {
                            $pricing_note = new PricingRequestNote();
                            $pricing_note->fill($item);
                            $pricing_note->prn_pr_id = $data_input['pr_id'];
                            $pricing_note->prn_note_type = $type;
                            $pricing_note->save();
                        }
                    }
                }
            }

            DB::commit();
            return response()->json([
                'status' => 'success',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update pricing request error : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Update pricing request error : ' . $e->getMessage()
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

            $pricing = PricingRequest::findOrFail($id);
            $existing_images_q = $pricing->pr_image;
            $pricing->update([
                'pr_image' => null,
                'pr_is_deleted' => 1,
                'pr_updated_date' => now(),
            ]);

            $pricing_note = PricingRequestNote::where('prn_pr_id', $id)->get();
            if (count($pricing_note) > 0) {

                foreach ($pricing_note as $item) {
                    $item->update([
                        'prn_is_deleted' => 1,
                        'prn_updated_date' => now(),
                    ]);
                }
            }

            DB::commit();

            // Delete old images file.
            $existing_images_file = Storage::get('public/images/pricing_req/' . $existing_images_q);

            if ($existing_images_file !== null) {
                Storage::delete('public/images/pricing_req/' . $existing_images_q);
            }

            return response()->json([
                'status' => 'success',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete pricing request error : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Delete pricing request error : ' . $e->getMessage()
            ]);
        }
    }

    public function update_status(Request $request)
    {
        try {
            DB::beginTransaction();

            $query = PricingRequest::where('pr_id', $request->pr_id)->firstOrFail();
            $user_q = User::where('user_uuid', $request->user_uuid)->firstOrFail();

            $data_update = [
                'pr_updated_date' => now(),
                'pr_updated_by' => $user_q['user_uuid']
            ];

            if ($user_q['role'] == 'sale') {

                if ($request->action == 'request') {
                    $data_update['pr_status_id'] = '20db8b15-092b-11f0-b223-38ca84abdf0a';   // รอทำราคา
                }

            } else if (in_array($user_q['role'], ['manager', 'production'])) {

                if ($request->action == 'pricing') {
                    
                    $data_update['pr_status_id'] = '20db8be1-092b-11f0-b223-38ca84abdf0a';  // ได้ราคาแล้ว

                } else if ($request->action == 'reject') {

                    $data_update['pr_status_id'] = '20db8cbf-092b-11f0-b223-38ca84abdf0a';  // ปฏิเสธงาน

                } else if ($request->action == 'cannot_pricing') {

                    $data_update['pr_status_id'] = '20db8cf1-092b-11f0-b223-38ca84abdf0a';  // ทำราคาไม่ได้
                }

            }

            $query->fill($data_update);
            $query->save();
            DB::commit();

            return response()->json([
                'status' => 'success',
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update pricing req status error : ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Update pricing req status error : ' . $e->getMessage()
            ], 500);
        }
    }

}
