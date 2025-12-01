<?php

namespace App\Http\Controllers\Api\V1\Customers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\CustomerResource;
use App\Services\WorksheetService;
use App\Services\CustomerService;
use App\Services\AddressService;
use App\Helpers\AccountingHelper;
use App\Models\MasterCustomer as Customer;
use App\Models\MasterCustomerGroup as CustomerGroup;
use App\Models\CustomerDetail;
use App\Models\RelationCustomerUser as CustomerUser;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    protected $worksheet_service;
    protected $customer_service;
    protected $address_service;

    public function __construct()
    {
        $this->worksheet_service = new WorksheetService;
        $this->customer_service = new CustomerService;
        $this->address_service = new AddressService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {

            if (!$request->user) {
                return response()->json([
                    'message' => 'User is null'
                ]);
            }

            // query user
            $user_q = User::where('enable', 'Y')->where('user_id', $request->user)->select('user_id', 'role')->first();

            $customer_group_q = CustomerGroup::active()
                ->select('mcg_id', 'mcg_name', 'mcg_remark', 'mcg_recall_default', 'mcg_sort')
                ->orderBy('mcg_sort', 'asc')
                ->withCount(['customerGroup' => function ($query) use ($user_q, $request) {  // Use withCount
                    $query->where('cus_is_use', true);

                    if ($user_q->role !== 'admin') {
                        $query->where('cus_manage_by', $user_q->user_id);
                    }

                    // for search
                    if ($request->has('search')) {
                        $search_term = '%' . trim($request->search) . '%';
                        $query->where(function ($q) use ($search_term) {
                            $q->orWhere('cus_name', 'like', $search_term)
                                ->orWhere('cus_company', 'like', $search_term)
                                ->orWhere('cus_no', 'like', $search_term)
                                ->orWhere('cus_tel_1', 'like', $search_term)
                                ->orWhereHas('cusManageBy', function ($user_q) use ($search_term) {
                                    $user_q->where('username', 'like', $search_term);
                                });
                        });
                    }
                }])
                ->get();

            // customer prepared sql
            $customer_prepared = Customer::active()->with(['customerDetail', 'customerProvice', 'customerDistrict', 'customerSubdistrict']);

            // count all customer data
            $total_customers_q = Customer::active();

            // query with customer group
            if ($request->has('group') && $request->group !== "all") {
                $customer_prepared->where('cus_mcg_id', $request->group);
            }

            // query with user_id, if role is not admin
            if ($user_q->role !== 'admin') {
                $customer_prepared->where('cus_manage_by', $user_q->user_id);
                $total_customers_q->where('cus_manage_by', $user_q->user_id);
            }

            // for search
            if ($request->has('search')) {
                $search_term = '%' . trim($request->search) . '%';
                $search_sql = function ($query) use ($search_term) {
                    $query->orWhere('cus_name', 'like', $search_term)
                        ->orWhere('cus_company', 'like', $search_term)
                        ->orWhere('cus_no', 'like', $search_term)
                        ->orWhere('cus_tel_1', 'like', $search_term)
                        ->orWhereHas('cusManageBy', function ($user_q) use ($search_term) {
                            $user_q->where('username', 'like', $search_term);
                        });
                };

                $customer_prepared->where($search_sql);
                $total_customers_q->where($search_sql);
            }

            // Date Range Filter
            if ($request->has('start_date') || $request->has('end_date')) {
                $customer_prepared->filterByDateRange($request->start_date, $request->end_date);
                $total_customers_q->filterByDateRange($request->start_date, $request->end_date);
            }

            // Sales Names Filter
            if ($request->has('sales_names')) {
                $salesNames = explode(',', $request->sales_names);
                $customer_prepared->filterBySalesNames($salesNames);
                $total_customers_q->filterBySalesNames($salesNames);
            }

            // Channel Filter
            if ($request->has('channels')) {
                $channels = explode(',', $request->channels);
                $customer_prepared->filterByChannels($channels);
                $total_customers_q->filterByChannels($channels);
            }

            // Recall Range Filter
            if ($request->has('min_recall_days') || $request->has('max_recall_days')) {
                $minDays = $request->has('min_recall_days') ? (int)$request->min_recall_days : null;
                $maxDays = $request->has('max_recall_days') ? (int)$request->max_recall_days : null;

                $customer_prepared->filterByRecallRange($minDays, $maxDays);
                $total_customers_q->filterByRecallRange($minDays, $maxDays);
            }

            $perPage = $request->input('per_page', 10);

            // Select fields for customer query
            $customer_prepared->select([
                'cus_id',
                'cus_mcg_id',
                'cus_no',
                'cus_channel',
                'cus_bt_id',
                'cus_company',
                'cus_firstname',
                'cus_lastname',
                'cus_name',
                'cus_tel_1',
                'cus_tel_2',
                'cus_email',
                'cus_tax_id',
                'cus_pro_id',
                'cus_dis_id',
                'cus_sub_id',
                'cus_zip_code',
                'cus_address',
                'cus_manage_by',
                'cus_created_by',
                'cus_created_date',
                'cus_updated_by',
                'cus_updated_date',
                'cus_is_use'
            ]);

            // Apply server-side sorting if provided
            if ($request->has('sort_field') && $request->has('sort_direction')) {
                $sortField = $request->sort_field;
                $sortDirection = $request->sort_direction === 'desc' ? 'desc' : 'asc';

                // Check joins to avoid duplicates
                $joins = collect($customer_prepared->getQuery()->joins)->pluck('table')->toArray();

                // Handle special case for fields in related models
                if ($sortField === 'cus_manage_by') {
                    // For sales name sorting, we need a join with users table
                    if (!in_array('users', $joins)) {
                        $customer_prepared->leftJoin('users', 'master_customers.cus_manage_by', '=', 'users.user_id');
                    }
                    $customer_prepared->orderBy('users.username', $sortDirection);
                }
                elseif ($sortField === 'cd_last_datetime') {
                    // For recall date sorting, we need a join with customer_details (correct table name)
                    if (!in_array('customer_details', $joins)) {
                        $customer_prepared->leftJoin('customer_details', 'master_customers.cus_id', '=', 'customer_details.cd_cus_id');
                    }
                    $customer_prepared->orderBy('customer_details.cd_last_datetime', $sortDirection);
                }
                elseif ($sortField === 'cd_note') {
                    // For note field sorting
                    if (!in_array('customer_details', $joins)) {
                        $customer_prepared->leftJoin('customer_details', 'master_customers.cus_id', '=', 'customer_details.cd_cus_id');
                    }
                    $customer_prepared->orderBy('customer_details.cd_note', $sortDirection);
                }
                else {
                    // Regular field sorting - make sure we use the correct table prefix
                    $customer_prepared->orderBy("master_customers.$sortField", $sortDirection);
                }
            } else {
                // Default ordering
                $customer_prepared->orderBy('master_customers.cus_no', 'desc');
            }

            // Execute the query with pagination
            $customer_q = $customer_prepared->paginate($perPage);
            $customer_r = CustomerResource::collection($customer_q);

            $total_customers_r = $total_customers_q->count();

            return [
                'data' => $customer_r,
                'groups' => $customer_group_q,
                'total_count' => $total_customers_r,
                'pagination' => [
                    'current_page' => $customer_q->currentPage(),
                    'per_page' => $customer_q->perPage(),
                    'total_pages' => $customer_q->lastPage(),
                    'total_items' => $customer_q->total()
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Fetch customer error : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Fetch customer error : ' . $e->getMessage()
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
    public function store(\App\Http\Requests\V1\StoreCustomerRequest $request)
    {
        $customer = new Customer();
        $customer_detail = new CustomerDetail();
        $rel_cus_user = new CustomerUser();

        // Validation handled by StoreCustomerRequest

        $data_input = $request->all();

        try {
            DB::beginTransaction();

            // Get grade D customer group (mcg_sort = 4)
            $group_q = CustomerGroup::where('mcg_is_use', true)
                ->where('mcg_sort', 4) // Grade D has sort order 4
                ->select('mcg_id', 'mcg_name', 'mcg_recall_default', 'mcg_sort')
                ->first();
                
            // If grade D not found, fallback to the lowest grade customer group
            if (!$group_q) {
                $group_q = CustomerGroup::where('mcg_is_use', true)
                    ->select('mcg_id', 'mcg_name', 'mcg_recall_default', 'mcg_sort')
                    ->orderBy('mcg_sort', 'desc')
                    ->first();
            }

            // Get master customer
            $customer_q = Customer::select('cus_id', 'cus_no', 'cus_created_date')
                ->orderByDesc('cus_no')
                ->first();

            // Clean เบอร์โทรศัพท์ & Tax ID อัตโนมัติ
            $fieldsToClean = ['cus_tel_1', 'cus_tel_2', 'cus_tax_id'];
            array_walk($fieldsToClean, function ($field) use (&$data_input) {
                if (isset($data_input[$field])) {
                    $data_input[$field] = preg_replace('/[^0-9]/', '', $data_input[$field]);
                }
            });

            $customer->fill($data_input);
            $customer->cus_id = Str::uuid();
            $customer->cus_no = $this->customer_service->genCustomerNo($customer_q->cus_no);
            $customer->cus_mcg_id = $group_q->mcg_id; // Set default grade (D)
            
            // Telesales Flow: Auto-set source and allocation status
            if (AccountingHelper::isTelesales()) {
                $customer->cus_source = 'telesales';
                $customer->cus_allocation_status = 'pool';
                $customer->cus_manage_by = null; // No manager assigned yet
            } else {
                // Regular flow (Sales/Admin/Manager create customer directly)
                $customer->cus_source = $data_input['cus_source'] ?? 'sales';
                $customer->cus_allocation_status = 'allocated';
                // Accept both object shape { user_id } and scalar for cus_manage_by
                $customer->cus_manage_by = $this->extractManagerId($data_input['cus_manage_by'] ?? null);
            }
            
            $customer->cus_created_date = now();
            $customer->cus_created_by = Auth::id();
            $customer->cus_updated_date = now();
            $customer->cus_updated_by = Auth::id();

            // จัดการที่อยู่ - รองรับทั้งสองแบบ
            $this->handleAddressUpdate($customer, $data_input);

            $customer->save();
            $cus_id = $customer->cus_id;

            $customer_detail->fill($data_input);
            $customer_detail->cd_id = Str::uuid();
            $customer_detail->cd_cus_id = $cus_id;
            $customer_detail->cd_last_datetime = $this->customer_service->setRecallDatetime($group_q->mcg_recall_default);
            $customer_detail->cd_created_date = now();
            $customer_detail->cd_created_by = Auth::id();
            $customer_detail->cd_updated_date = now();
            $customer_detail->cd_updated_by = Auth::id();
            $customer_detail->save();

            // Only create relation if customer is allocated (not in pool)
            if ($customer->cus_allocation_status === 'allocated' && $customer->cus_manage_by) {
                $rel_cus_user->rcs_cus_id = $cus_id;
                $rel_cus_user->rcs_user_id = $customer->cus_manage_by;
                $rel_cus_user->save();
            }

            DB::commit();
            return response()->json([
                'status' => 'success',
                'message' => AccountingHelper::isTelesales() 
                    ? 'สร้างลูกค้าสำเร็จ กำลังรอการจัดสรรงาน' 
                    : 'สร้างลูกค้าสำเร็จ',
                'data' => [
                    'customer_id' => $cus_id,
                    'allocation_status' => $customer->cus_allocation_status
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create customer error : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Create customer error : ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        if ($id === 'all') {

            $query = Customer::select(
                'cus_id',
                'cus_no',
                'cus_channel',
                'cus_company',
                'cus_firstname',
                'cus_lastname',
                'cus_tel_1',
                'cus_tel_2',
                'cus_email',
                'cus_tax_id',
                'cus_pro_id',
                'cus_dis_id',
                'cus_sub_id',
                'cus_zip_code',
                'cus_address',
                'cus_manage_by',
                'cus_created_by',
                'cus_created_date',
                'cus_updated_date',
                'cus_is_use',
            )
                ->orderBy('cus_no', 'desc')
                ->get();

            if (!$query) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer not found'
                ]);
            }

            return CustomerResource::collection($query);
        } else {

            $customer = Customer::active()->find($id);
            if (!$customer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer not found'
                ]);
            }
            return new CustomerResource($customer);
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
        $request->validate([
            'cus_channel' => 'required',
            'cus_company' => 'required',
            'cus_firstname' => 'required',
            'cus_lastname' => 'required',
            'cus_name' => 'required',
            'cus_tel_1' => 'required',
        ]);

        $data_input = $request->all();

        // Clean เบอร์โทรศัพท์ & Tax ID อัตโนมัติ
        $fieldsToClean = ['cus_tel_1', 'cus_tel_2', 'cus_tax_id'];
        array_walk($fieldsToClean, function ($field) use (&$data_input) {
            if (isset($data_input[$field])) {
                $data_input[$field] = preg_replace('/[^0-9]/', '', $data_input[$field]);
            }
        });


        try {
            DB::beginTransaction();

            $customer = Customer::findOrFail($id);
            $customer->fill($data_input);
            // Accept both object shape { user_id } and scalar for cus_manage_by
            $customer->cus_manage_by = $this->extractManagerId($data_input['cus_manage_by'] ?? null);
            $customer->cus_updated_date = now();
            $customer->cus_updated_by = Auth::id();

            // จัดการที่อยู่ - รองรับทั้งสองแบบ
            $this->handleAddressUpdate($customer, $data_input);

            $customer->save();

            $customer_detail = CustomerDetail::where('cd_cus_id', $id)->first();
            if ($customer_detail) {
                $customer_detail->fill($data_input);
                $customer_detail->cd_updated_date = now();
                $customer_detail->cd_updated_by = Auth::id();
                $customer_detail->save();
            }

            DB::commit();
            return response()->json([
                'status' => 'success',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update customer error : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Update customer error : ' . $e->getMessage()
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

            $customer = Customer::findOrFail($id);
            $customer->update([
                'cus_is_use' => 0,
                'cus_updated_date' => now(),
            ]);

            $customer_detail = CustomerDetail::where('cd_cus_id', $id)->first();
            if ($customer_detail) {
                $customer_detail->update([
                    'cd_is_use' => 0,
                    'cd_updated_date' => now(),
                ]);
            }

            $rel_cus_user = CustomerUser::where('rcs_cus_id', $id)->first();
            if ($rel_cus_user) {
                $rel_cus_user->update([
                    'rcs_is_use' => 0,
                    'rcs_updated_date' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete customers error : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'Delete customers error : ' . $e->getMessage()
            ]);
        }
    }

    public function recall(Request $request, string $id)
    {
        $update_input = $request->all();

        try {
            DB::beginTransaction();

            $group_q = CustomerGroup::where('mcg_is_use', true)
                ->where('mcg_id', $request->cus_mcg_id)
                ->select('mcg_id', 'mcg_name', 'mcg_recall_default')
                ->first();

            $customer_detail = CustomerDetail::findOrFail($id);
            $customer_detail->fill($update_input);
            $customer_detail->cd_last_datetime = $this->customer_service->setRecallDatetime($group_q->mcg_recall_default);
            $customer_detail->cd_updated_date = now();
            $customer_detail->cd_updated_by = Auth::id();
            $customer_detail->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
            ]);
        } catch (\Exception $e) {

            DB::rollBack();
            Log::error('recall customer error : ' . $e);

            return response()->json([
                'status' => 'error',
                'message' => 'recall customer error : ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Change customer grade up or down.
     * Grade progression: D → C → B → A (upgrade)
     * Grade regression: A → B, B → C, C → D (downgrade)
     */
    public function changeGrade(Request $request, string $id)
    {
        $direction = $request->input('direction'); // 'up' or 'down'
        
        try {
            DB::beginTransaction();
            
            // Get the customer
            $customer = Customer::findOrFail($id);
            
            // Get current customer group
            $currentGroup = CustomerGroup::where('mcg_id', $customer->cus_mcg_id)
                ->select('mcg_id', 'mcg_name', 'mcg_sort')
                ->firstOrFail();
            
            // Get target group based on direction
            $targetSort = $direction === 'up' 
                ? $currentGroup->mcg_sort - 1  // Move up (e.g., B → A)
                : $currentGroup->mcg_sort + 1; // Move down (e.g., B → C)
                
            // Find the target group by sort order
            $targetGroup = CustomerGroup::where('mcg_sort', $targetSort)
                ->where('mcg_is_use', true)
                ->select('mcg_id', 'mcg_name', 'mcg_recall_default')
                ->first();
                
            if (!$targetGroup) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot change grade. Target grade not found.'
                ], 400);
            }
            
            // Update customer's group
            $customer->cus_mcg_id = $targetGroup->mcg_id;
            $customer->cus_updated_date = now();
            $customer->cus_updated_by = Auth::id();
            $customer->save();
            
            // Update recall date based on new group's settings
            $customer_detail = CustomerDetail::where('cd_cus_id', $id)->first();
            if ($customer_detail) {
                $customer_detail->cd_last_datetime = $this->customer_service->setRecallDatetime($targetGroup->mcg_recall_default);
                $customer_detail->cd_updated_date = now();
                $customer_detail->cd_updated_by = Auth::id();
                $customer_detail->save();
            }
            
            DB::commit();
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'old_grade' => $currentGroup->mcg_name,
                    'new_grade' => $targetGroup->mcg_name
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Change customer grade error: ' . $e);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Change customer grade error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer counts per group with applied filters
     */
    public function getGroupCounts(Request $request)
    {
        try {
            if (!$request->user) {
                return response()->json([
                    'message' => 'User is required'
                ], 400);
            }

            // query user
            $user_q = User::where('enable', 'Y')
                ->where('user_id', $request->user)
                ->select('user_id', 'role')
                ->first();

            if (!$user_q) {
                return response()->json([
                    'message' => 'User not found'
                ], 404);
            }

            // Get all customer groups
            $groups = CustomerGroup::active()
                ->select('mcg_id')
                ->get()
                ->pluck('mcg_id')
                ->toArray();

            $group_counts = [];

            // For each group, count customers with applied filters
            foreach ($groups as $group_id) {
                $query = Customer::active();
                
                // Filter by the current group
                $query->where('cus_mcg_id', $group_id);

                // Filter by user role
                if ($user_q->role !== 'admin') {
                    $query->where('cus_manage_by', $user_q->user_id);
                }

                // Apply search filter if provided
                if ($request->has('search')) {
                    $search_term = '%' . trim($request->search) . '%';
                    $query->where(function ($q) use ($search_term) {
                        $q->orWhere('cus_name', 'like', $search_term)
                          ->orWhere('cus_company', 'like', $search_term)
                          ->orWhere('cus_no', 'like', $search_term)
                          ->orWhere('cus_tel_1', 'like', $search_term)
                          ->orWhereHas('cusManageBy', function ($user_q) use ($search_term) {
                              $user_q->where('username', 'like', $search_term);
                          });
                    });
                }

                // Date Range Filter
                if ($request->has('start_date') || $request->has('end_date')) {
                    $query->filterByDateRange($request->start_date, $request->end_date);
                }

                // Sales Names Filter
                if ($request->has('sales_names')) {
                    $salesNames = explode(',', $request->sales_names);
                    $query->filterBySalesNames($salesNames);
                }

                // Channel Filter
                if ($request->has('channels')) {
                    $channels = explode(',', $request->channels);
                    $query->filterByChannels($channels);
                }

                // Recall Range Filter
                if ($request->has('min_recall_days') || $request->has('max_recall_days')) {
                    $minDays = $request->has('min_recall_days') ? (int)$request->min_recall_days : null;
                    $maxDays = $request->has('max_recall_days') ? (int)$request->max_recall_days : null;
                    $query->filterByRecallRange($minDays, $maxDays);
                }

                // Count customers for this group with all filters applied
                $count = $query->count();
                $group_counts[$group_id] = $count;
            }

            return response()->json([
                'group_counts' => $group_counts,
                'timestamp' => now()->timestamp
            ]);

        } catch (\Exception $e) {
            Log::error('Fetch group counts error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching group counts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * จัดการการอัพเดทที่อยู่ - รองรับทั้งแบบแยก components และแบบรวม
     * @param Customer $customer
     * @param array $data_input
     */
    private function handleAddressUpdate(Customer $customer, array $data_input)
    {
        try {
            // ตรวจสอบว่าส่งข้อมูลแบบไหนมา
            $hasComponents = isset($data_input['cus_pro_id']) || 
                           isset($data_input['cus_dis_id']) || 
                           isset($data_input['cus_sub_id']);
            
            $hasFullAddress = isset($data_input['cus_address']) && !empty($data_input['cus_address']);
            $hasAddressDetail = isset($data_input['cus_address_detail']) && !empty($data_input['cus_address_detail']);

            if ($hasComponents) {
                // แบบที่ 1: ส่งมาเป็น components แยก (มาจากฟอร์มเลือก dropdown)
                Log::info('Updating address from components', [
                    'pro_id' => $data_input['cus_pro_id'] ?? null,
                    'dis_id' => $data_input['cus_dis_id'] ?? null,
                    'sub_id' => $data_input['cus_sub_id'] ?? null,
                    'zip_code' => $data_input['cus_zip_code'] ?? null,
                    'address_detail' => $data_input['cus_address_detail'] ?? null
                ]);

                $customer->updateAddressFromComponents(
                    $data_input['cus_address_detail'] ?? null,
                    $data_input['cus_sub_id'] ?? null,
                    $data_input['cus_dis_id'] ?? null,
                    $data_input['cus_pro_id'] ?? null,
                    $data_input['cus_zip_code'] ?? null
                );

            } elseif ($hasFullAddress) {
                // แบบที่ 2: ส่งมาเป็น full address (มาจากการพิมพ์เอง หรือจาก GPS)
                Log::info('Updating address from full address', [
                    'full_address' => $data_input['cus_address']
                ]);

                $customer->updateAddressFromFull($data_input['cus_address']);

            } elseif ($hasAddressDetail) {
                // แบบที่ 3: มีแค่รายละเอียดที่อยู่ ไม่มีข้อมูลสถานที่
                Log::info('Updating address detail only', [
                    'address_detail' => $data_input['cus_address_detail']
                ]);

                $customer->cus_address = $data_input['cus_address_detail'];
            }

            Log::info('Address updated successfully', [
                'customer_id' => $customer->cus_id,
                'final_address' => $customer->cus_address,
                'pro_id' => $customer->cus_pro_id,
                'dis_id' => $customer->cus_dis_id,
                'sub_id' => $customer->cus_sub_id,
                'zip_code' => $customer->cus_zip_code
            ]);

        } catch (\Exception $e) {
            Log::error('Handle address update error: ' . $e->getMessage(), [
                'customer_id' => $customer->cus_id ?? 'new',
                'input_data' => $data_input
            ]);
            
            // ถ้าเกิดข้อผิดพลาด ให้ใช้ข้อมูลที่ส่งมาตรงๆ
            if (isset($data_input['cus_address'])) {
                $customer->cus_address = $data_input['cus_address'];
            }
        }
    }

    /**
     * แปลงที่อยู่เต็มเป็น components สำหรับใช้ใน frontend
     */
    public function parseAddress(Request $request)
    {
        try {
            $fullAddress = $request->input('address');
            
            if (!$fullAddress) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'กรุณาระบุที่อยู่ที่ต้องการแปลง'
                ], 400);
            }

            $components = $this->address_service->parseFullAddress($fullAddress);
            $locationIds = $this->address_service->findLocationIds(
                $components['province'],
                $components['district'],
                $components['subdistrict']
            );

            return response()->json([
                'status' => 'success',
                'data' => [
                    'components' => $components,
                    'location_ids' => $locationIds
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Parse address error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'เกิดข้อผิดพลาดในการแปลงที่อยู่: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้างที่อยู่เต็มจาก components สำหรับใช้ใน frontend
     */
    public function buildAddress(Request $request)
    {
        try {
            $addressDetail = $request->input('address_detail');
            $subId = $request->input('sub_id');
            $disId = $request->input('dis_id');
            $proId = $request->input('pro_id');
            $zipCode = $request->input('zip_code');

            $fullAddress = $this->address_service->buildFullAddress(
                $addressDetail, $subId, $disId, $proId, $zipCode
            );

            return response()->json([
                'status' => 'success',
                'data' => [
                    'full_address' => $fullAddress
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Build address error: ' . $e);
            return response()->json([
                'status' => 'error', 
                'message' => 'เกิดข้อผิดพลาดในการสร้างที่อยู่: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customers in pool (waiting for allocation)
     * Only accessible by admin and manager
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPoolCustomers(Request $request)
    {
        // Check permission
        if (!AccountingHelper::canAllocateCustomers()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Only admin and manager can access pool customers'
            ], 403);
        }

        try {
            $query = Customer::inPool()
                ->with(['customerDetail', 'customerProvice', 'customerDistrict', 'customerSubdistrict'])
                ->select([
                    'cus_id',
                    'cus_no',
                    'cus_source',
                    'cus_channel',
                    'cus_bt_id',
                    'cus_company',
                    'cus_firstname',
                    'cus_lastname',
                    'cus_name',
                    'cus_tel_1',
                    'cus_tel_2',
                    'cus_email',
                    'cus_tax_id',
                    'cus_pro_id',
                    'cus_dis_id',
                    'cus_sub_id',
                    'cus_zip_code',
                    'cus_address',
                    'cus_allocation_status',
                    'cus_created_by',
                    'cus_created_date',
                ])
                ->orderBy('cus_created_date', 'desc');

            // Filter by source if provided
            if ($request->has('source')) {
                $query->where('cus_source', $request->source);
            }

            // Search functionality
            if ($request->has('search')) {
                $search_term = '%' . trim($request->search) . '%';
                $query->where(function ($q) use ($search_term) {
                    $q->where('cus_name', 'like', $search_term)
                        ->orWhere('cus_company', 'like', $search_term)
                        ->orWhere('cus_no', 'like', $search_term)
                        ->orWhere('cus_tel_1', 'like', $search_term);
                });
            }

            $perPage = $request->input('per_page', 20);
            $customers = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => CustomerResource::collection($customers),
                'pagination' => [
                    'current_page' => $customers->currentPage(),
                    'per_page' => $customers->perPage(),
                    'total_pages' => $customers->lastPage(),
                    'total_items' => $customers->total()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get pool customers error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching pool customers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign customers from pool to a sales person
     * Only accessible by admin and manager
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function assignCustomers(Request $request)
    {
        // Check permission
        if (!AccountingHelper::canAllocateCustomers()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Only admin and manager can allocate customers'
            ], 403);
        }

        $request->validate([
            'customer_ids' => 'required|array',
            'customer_ids.*' => 'required|string|size:36', // UUID format
            'sales_user_id' => 'required|integer|exists:users,user_id'
        ]);

        try {
            DB::beginTransaction();

            $customerIds = $request->customer_ids;
            $salesUserId = $request->sales_user_id;
            $allocatorId = Auth::id();

            // Verify sales user exists and has correct role
            $salesUser = User::where('user_id', $salesUserId)
                ->where('user_is_enable', true)
                ->whereIn('role', ['sale', 'admin', 'manager'])
                ->first();

            if (!$salesUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid sales user or user is not active'
                ], 400);
            }

            // Get customers in pool
            $customers = Customer::whereIn('cus_id', $customerIds)
                ->where('cus_allocation_status', 'pool')
                ->get();

            if ($customers->isEmpty()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No valid customers found in pool'
                ], 404);
            }

            // Update customers with error handling for partial success
            $successCount = 0;
            $failedCustomers = [];
            
            foreach ($customers as $customer) {
                try {
                    $customer->update([
                        'cus_allocation_status' => 'allocated',
                        'cus_manage_by' => $salesUserId,
                        'cus_allocated_by' => $allocatorId,
                        'cus_allocated_at' => now(),
                        'cus_updated_by' => $allocatorId,
                        'cus_updated_date' => now()
                    ]);

                    // Create relation
                    $rel = new CustomerUser();
                    $rel->rcs_cus_id = $customer->cus_id;
                    $rel->rcs_user_id = $salesUserId;
                    $rel->save();
                    
                    $successCount++;
                } catch (\Exception $e) {
                    Log::warning("Failed to assign customer {$customer->cus_id}: " . $e->getMessage());
                    $failedCustomers[] = [
                        'customer_id' => $customer->cus_id,
                        'customer_name' => $customer->cus_name,
                        'error' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            $status = empty($failedCustomers) ? 'success' : ($successCount > 0 ? 'partial_success' : 'error');
            $message = empty($failedCustomers) 
                ? "จัดสรรลูกค้าสำเร็จ {$successCount} รายให้กับ {$salesUser->username}"
                : "จัดสรรลูกค้าสำเร็จ {$successCount} ราย, ล้มเหลว " . count($failedCustomers) . " ราย";

            return response()->json([
                'status' => $status,
                'message' => $message,
                'data' => [
                    'allocated_count' => $successCount,
                    'failed_count' => count($failedCustomers),
                    'failed_customers' => $failedCustomers,
                    'sales_user' => [
                        'user_id' => $salesUser->user_id,
                        'username' => $salesUser->username,
                        'name' => $salesUser->user_firstname . ' ' . $salesUser->user_lastname
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Assign customers error: ' . $e);
            return response()->json([
                'status' => 'error',
                'message' => 'Error assigning customers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract and validate manager user_id from various input shapes.
     * Supports either scalar ("123") or object(["user_id"=>123]). Returns int or null.
     * @param mixed $input
     * @return int|null
     */
    private function extractManagerId($input)
    {
        // If input is an array/object, try common keys
        if (is_array($input)) {
            $candidate = $input['user_id'] ?? $input['id'] ?? null;
        } elseif (is_object($input)) {
            $candidate = $input->user_id ?? $input->id ?? null;
        } else {
            $candidate = $input;
        }

        if ($candidate === null || $candidate === '') {
            return null;
        }

        // Only accept numeric values for user_id (DB column is int)
        if (is_numeric($candidate)) {
            return (int) $candidate;
        }

        // Non-numeric (e.g., UUID) is not valid for this column
        return null;
    }
}
