<?php
namespace App\Http\Controllers\Api\V1\Customers;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\CustomerResource;
use App\Models\CustomerDetail;
use App\Models\MasterCustomer as Customer;
use App\Models\MasterCustomerGroup as CustomerGroup;
use App\Models\RelationCustomerUser as CustomerUser;
use App\Models\User;
use App\Services\CustomerService;
use App\Services\WorksheetService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    protected $worksheet_service;
    protected $customer_service;

    public function __construct()
    {
        $this->worksheet_service = new WorksheetService;
        $this->customer_service  = new CustomerService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {

            if (! $request->user) {
                return response()->json([
                    'message' => 'User is null',
                ]);
            }

            // query user
            $user_q = User::where('enable', 'Y')->where('user_id', $request->user)->select('user_id', 'role')->first();

            $customer_group_q = CustomerGroup::active()
                ->select('mcg_id', 'mcg_name', 'mcg_remark', 'mcg_recall_default', 'mcg_sort')
                ->orderBy('mcg_sort', 'asc')
                ->withCount(['customerGroup' => function ($query) use ($user_q, $request) { // Use withCount
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

                    // Apply the same filters to group count
                    if ($request->has('date_start') && $request->date_start) {
                        $query->whereDate('cus_created_date', '>=', $request->date_start);
                    }
                    if ($request->has('date_end') && $request->date_end) {
                        $query->whereDate('cus_created_date', '<=', $request->date_end);
                    }

                    // Multi-select support for sales_name in group count
                    if ($request->has('sales_name')) {
                        if (is_array($request->sales_name) && count($request->sales_name) > 0) {
                            $query->whereHas('cusManageBy', function ($q) use ($request) {
                                $q->whereIn('username', $request->sales_name);
                            });
                        } elseif (! is_array($request->sales_name) && $request->sales_name) {
                            // Backward compatibility for single value
                            $query->whereHas('cusManageBy', function ($q) use ($request) {
                                $q->where('username', $request->sales_name);
                            });
                        }
                    }

                    // Multi-select support for channel in group count
                    if ($request->has('channel')) {
                        if (is_array($request->channel) && count($request->channel) > 0) {
                            $query->whereIn('cus_channel', $request->channel);
                        } elseif (! is_array($request->channel) && $request->channel) {
                            // Backward compatibility for single value
                            $query->where('cus_channel', $request->channel);
                        }
                    }

                    if ($request->has('recall_min') || $request->has('recall_max')) {
                        $query->whereHas('customerDetail', function ($q) use ($request) {
                            $now = now();

                            if ($request->has('recall_min') && $request->recall_min) {
                                $min_date = $now->copy()->subDays($request->recall_min);
                                $q->where('cd_last_datetime', '<=', $min_date);
                            }

                            if ($request->has('recall_max') && $request->recall_max) {
                                $max_date = $now->copy()->subDays($request->recall_max);
                                $q->where('cd_last_datetime', '>=', $max_date);
                            }
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
                $search_sql  = function ($query) use ($search_term) {
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

            // Filter by date range
            if ($request->has('date_start') && $request->date_start) {
                $customer_prepared->whereDate('cus_created_date', '>=', $request->date_start);
                $total_customers_q->whereDate('cus_created_date', '>=', $request->date_start);
            }
            if ($request->has('date_end') && $request->date_end) {
                $customer_prepared->whereDate('cus_created_date', '<=', $request->date_end);
                $total_customers_q->whereDate('cus_created_date', '<=', $request->date_end);
            }

            // Filter by sales name - UPDATED FOR MULTI-SELECT
            if ($request->has('sales_name')) {
                if (is_array($request->sales_name) && count($request->sales_name) > 0) {
                    // Multi-select support
                    $customer_prepared->whereHas('cusManageBy', function ($query) use ($request) {
                        $query->whereIn('username', $request->sales_name);
                    });
                    $total_customers_q->whereHas('cusManageBy', function ($query) use ($request) {
                        $query->whereIn('username', $request->sales_name);
                    });
                } elseif (! is_array($request->sales_name) && $request->sales_name) {
                    // Backward compatibility for single value
                    $customer_prepared->whereHas('cusManageBy', function ($query) use ($request) {
                        $query->where('username', $request->sales_name);
                    });
                    $total_customers_q->whereHas('cusManageBy', function ($query) use ($request) {
                        $query->where('username', $request->sales_name);
                    });
                }
            }

            // Filter by channel - UPDATED FOR MULTI-SELECT
            if ($request->has('channel')) {
                if (is_array($request->channel) && count($request->channel) > 0) {
                    // Multi-select support
                    $customer_prepared->whereIn('cus_channel', $request->channel);
                    $total_customers_q->whereIn('cus_channel', $request->channel);
                } elseif (! is_array($request->channel) && $request->channel) {
                    // Backward compatibility for single value
                    $customer_prepared->where('cus_channel', $request->channel);
                    $total_customers_q->where('cus_channel', $request->channel);
                }
            }

            // Filter by recall days range
            if ($request->has('recall_min') || $request->has('recall_max')) {
                $customer_prepared->whereHas('customerDetail', function ($query) use ($request) {
                    $now = now();

                    if ($request->has('recall_min') && $request->recall_min) {
                        $min_date = $now->copy()->subDays($request->recall_min);
                        $query->where('cd_last_datetime', '<=', $min_date);
                    }

                    if ($request->has('recall_max') && $request->recall_max) {
                        $max_date = $now->copy()->subDays($request->recall_max);
                        $query->where('cd_last_datetime', '>=', $max_date);
                    }
                });

                $total_customers_q->whereHas('customerDetail', function ($query) use ($request) {
                    $now = now();

                    if ($request->has('recall_min') && $request->recall_min) {
                        $min_date = $now->copy()->subDays($request->recall_min);
                        $query->where('cd_last_datetime', '<=', $min_date);
                    }

                    if ($request->has('recall_max') && $request->recall_max) {
                        $max_date = $now->copy()->subDays($request->recall_max);
                        $query->where('cd_last_datetime', '>=', $max_date);
                    }
                });
            }

            $perPage    = $request->input('per_page', 10);
            $customer_q = $customer_prepared->select([ // Use array syntax for select
                'cus_id',
                'cus_mcg_id',
                'cus_no',
                'cus_channel',
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
                'cus_is_use',
            ])->orderBy('cus_no', 'desc')->paginate($perPage);
            $customer_r = CustomerResource::collection($customer_q);

            $total_customers_r = $total_customers_q->count();

            return [
                'data'        => $customer_r,
                'groups'      => $customer_group_q,
                'total_count' => $total_customers_r,
                'pagination'  => [
                    'current_page' => $customer_q->currentPage(),
                    'per_page'     => $customer_q->perPage(),
                    'total_pages'  => $customer_q->lastPage(),
                    'total_items'  => $customer_q->total(),
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Fetch customer error : ' . $e);

            return response()->json([
                'status'  => 'error',
                'message' => 'Fetch customer error : ' . $e->getMessage(),
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
        $customer        = new Customer();
        $customer_detail = new CustomerDetail();
        $rel_cus_user    = new CustomerUser();

        $request->validate([
            'cus_channel'   => 'required',
            'cus_company'   => 'required',
            'cus_firstname' => 'required',
            'cus_lastname'  => 'required',
            'cus_name'      => 'required',
            'cus_tel_1'     => 'required',
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
            $customer->cus_id           = Str::uuid();
            $customer->cus_no           = $this->customer_service->genCustomerNo($customer_q->cus_no);
            $customer->cus_manage_by    = $data_input['cus_manage_by']['user_id'] ?? null;
            $customer->cus_created_date = now();
            $customer->cus_created_by   = Auth::id();
            $customer->cus_updated_date = now();
            $customer->cus_updated_by   = Auth::id();
            $customer->save();
            $cus_id = $customer->cus_id;

            $customer_detail->fill($data_input);
            $customer_detail->cd_id            = Str::uuid();
            $customer_detail->cd_cus_id        = $cus_id;
            $customer_detail->cd_last_datetime = $this->customer_service->setRecallDatetime($group_q->mcg_recall_default);
            $customer_detail->cd_created_date  = now();
            $customer_detail->cd_created_by    = Auth::id();
            $customer_detail->cd_updated_date  = now();
            $customer_detail->cd_updated_by    = Auth::id();
            $customer_detail->save();

            $rel_cus_user->rcs_cus_id  = $cus_id;
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
                'status'  => 'error',
                'message' => 'Create customer error : ' . $e->getMessage(),
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

            if (! $query) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Customer not found',
                ]);
            }

            return CustomerResource::collection($query);
        } else {

            $customer = Customer::active()->find($id);
            if (! $customer) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Customer not found',
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
            'cus_channel'   => 'required',
            'cus_company'   => 'required',
            'cus_firstname' => 'required',
            'cus_lastname'  => 'required',
            'cus_name'      => 'required',
            'cus_tel_1'     => 'required',
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
            $customer->cus_manage_by    = $data_input['cus_manage_by']['user_id'] ?? null;
            $customer->cus_updated_date = now();
            $customer->cus_updated_by   = Auth::id();
            $customer->save();

            $customer_detail = CustomerDetail::where('cd_cus_id', $id)->first();
            if ($customer_detail) {
                $customer_detail->fill($data_input);
                $customer_detail->cd_updated_date = now();
                $customer_detail->cd_updated_by   = Auth::id();
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
                'status'  => 'error',
                'message' => 'Update customer error : ' . $e->getMessage(),
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
                'cus_is_use'       => 0,
                'cus_updated_date' => now(),
            ]);

            $customer_detail = CustomerDetail::where('cd_cus_id', $id)->first();
            if ($customer_detail) {
                $customer_detail->update([
                    'cd_is_use'       => 0,
                    'cd_updated_date' => now(),
                ]);
            }

            $rel_cus_user = CustomerUser::where('rcs_cus_id', $id)->first();
            if ($rel_cus_user) {
                $rel_cus_user->update([
                    'rcs_is_use'       => 0,
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
                'status'  => 'error',
                'message' => 'Delete customers error : ' . $e->getMessage(),
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
            $customer_detail->cd_updated_date  = now();
            $customer_detail->cd_updated_by    = Auth::id();
            $customer_detail->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
            ]);
        } catch (\Exception $e) {

            DB::rollBack();
            Log::error('recall customer error : ' . $e);

            return response()->json([
                'status'  => 'error',
                'message' => 'recall customer error : ' . $e->getMessage(),
            ]);
        }
    }
}
