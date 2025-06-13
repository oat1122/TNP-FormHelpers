<?php

namespace App\Http\Controllers\Api\V1\Customers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\CustomerResource;
use App\Services\WorksheetService;
use App\Services\CustomerService;
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

    public function __construct()
    {
        $this->worksheet_service = new WorksheetService;
        $this->customer_service = new CustomerService;
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
            $customer_prepared = Customer::active()->with('customerDetail');

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
    public function store(Request $request)
    {
        $customer = new Customer();
        $customer_detail = new CustomerDetail();
        $rel_cus_user = new CustomerUser();

        $request->validate([
            'cus_channel' => 'required',
            'cus_company' => 'required',
            'cus_firstname' => 'required',
            'cus_lastname' => 'required',
            'cus_name' => 'required',
            'cus_tel_1' => 'required',
        ]);

        $data_input = $request->all();

        try {
            DB::beginTransaction();

            // Get customer group
            $group_q = CustomerGroup::where('mcg_is_use', true)
                ->select('mcg_id', 'mcg_name', 'mcg_recall_default', 'mcg_sort')
                ->orderBy('mcg_sort', 'desc')
                ->first();

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
            $customer->cus_manage_by = $data_input['cus_manage_by']['user_id'] ?? null;
            $customer->cus_created_date = now();
            $customer->cus_created_by = Auth::id();
            $customer->cus_updated_date = now();
            $customer->cus_updated_by = Auth::id();
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

            $rel_cus_user->rcs_cus_id = $cus_id;
            $rel_cus_user->rcs_user_id = $data_input['cus_manage_by']['user_id'] ?? null;
            $rel_cus_user->save();

            DB::commit();
            return response()->json([
                'status' => 'success',
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
            $customer->cus_manage_by = $data_input['cus_manage_by']['user_id'] ?? null;
            $customer->cus_updated_date = now();
            $customer->cus_updated_by = Auth::id();
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
}
