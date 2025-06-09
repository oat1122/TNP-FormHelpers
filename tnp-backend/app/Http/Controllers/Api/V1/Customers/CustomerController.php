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
            // Enhanced validation for required parameters
            $validationErrors = $this->validateIndexRequest($request);
            if (!empty($validationErrors)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validationErrors,
                    'validation_details' => [
                        'failed_fields' => array_keys($validationErrors),
                        'total_errors' => count($validationErrors)
                    ]
                ], 422);
            }

            // Query user with enhanced validation
            $user_q = User::where('enable', 'Y')->where('user_id', $request->user)->select('user_id', 'role')->first();
            
            if (!$user_q) {
                Log::error('Invalid user ID provided', [
                    'user_id' => $request->user,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);
                
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user credentials',
                    'error_code' => 'USER_NOT_FOUND'
                ], 401);
            }

            // Performance monitoring setup
            $startTime = microtime(true);
            $startMemory = memory_get_usage(true);
            $performanceData = [
                'request_id' => Str::uuid(),
                'user_id' => $user_q->user_id,
                'user_role' => $user_q->role,
                'ip_address' => $request->ip(),
                'request_size' => strlen(json_encode($request->all())),
                'start_time' => $startTime,
                'start_memory' => $startMemory
            ];

            Log::info('Customer index request started', $performanceData);

            // Enhanced array parameter extraction with validation
            $extractionResult = $this->extractAndValidateArrayParameters($request);
            if ($extractionResult['has_errors']) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Parameter validation failed',
                    'errors' => $extractionResult['errors'],
                    'invalid_parameters' => $extractionResult['invalid_params']
                ], 422);
            }

            $salesNames = $extractionResult['sales_names'];
            $channels = $extractionResult['channels'];

            Log::info('Enhanced parameter extraction completed', [
                'sales_names' => $salesNames,
                'channels' => $channels,
                'raw_input' => $request->all(),
                'user_id' => $user_q->user_id,
                'user_role' => $user_q->role,
                'extraction_method' => $extractionResult['extraction_method'],
                'validation_passed' => true
            ]);

            // Get customer groups with counts
            $customer_group_q = CustomerGroup::active()
                ->select('mcg_id', 'mcg_name', 'mcg_remark', 'mcg_recall_default', 'mcg_sort')
                ->orderBy('mcg_sort', 'asc')
                ->withCount(['customerGroup' => function ($query) use ($user_q, $request, $salesNames, $channels) {
                    $query->where('cus_is_use', true);

                    if ($user_q->role !== 'admin') {
                        $query->where('cus_manage_by', $user_q->user_id);
                    }

                    // Search filter
                    if ($request->has('search') && $request->search) {
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

                    // Date filters
                    if ($request->has('date_start') && $request->date_start) {
                        $query->whereDate('cus_created_date', '>=', $request->date_start);
                    }
                    if ($request->has('date_end') && $request->date_end) {
                        $query->whereDate('cus_created_date', '<=', $request->date_end);
                    }

                    // Multi-select sales name filter
                    if (! empty($salesNames)) {
                        $query->whereHas('cusManageBy', function ($q) use ($salesNames) {
                            $q->whereIn('username', $salesNames);
                        });
                    }

                    // Multi-select channel filter
                    if (! empty($channels)) {
                        $query->whereIn('cus_channel', $channels);
                    }

                    // Recall days filter
                    if ($request->has('recall_min') || $request->has('recall_max')) {
                        $query->whereHas('customerDetail', function ($q) use ($request) {
                            $now = now();

                            if ($request->has('recall_min') && $request->recall_min !== null) {
                                // Days since last contact >= min_days
                                $min_date = $now->copy()->subDays($request->recall_min)->endOfDay();
                                $q->where('cd_last_datetime', '<=', $min_date);
                            }

                            if ($request->has('recall_max') && $request->recall_max !== null) {
                                // Days since last contact <= max_days
                                $max_date = $now->copy()->subDays($request->recall_max)->startOfDay();
                                $q->where('cd_last_datetime', '>=', $max_date);
                            }
                        });
                    }
                }])
                ->get();

            // Main customer query
            $customer_prepared = Customer::active()->with('customerDetail');
            $total_customers_q = Customer::active();

            // Group filter
            if ($request->has('group') && $request->group !== "all") {
                $customer_prepared->where('cus_mcg_id', $request->group);
                $total_customers_q->where('cus_mcg_id', $request->group);
            }

            // User role filter
            if ($user_q->role !== 'admin') {
                $customer_prepared->where('cus_manage_by', $user_q->user_id);
                $total_customers_q->where('cus_manage_by', $user_q->user_id);
            }

            // Search filter
            if ($request->has('search') && $request->search) {
                $search_term = '%' . trim($request->search) . '%';
                $search_sql  = function ($query) use ($search_term) {
                    $query->where(function ($q) use ($search_term) {
                        $q->orWhere('cus_name', 'like', $search_term)
                            ->orWhere('cus_company', 'like', $search_term)
                            ->orWhere('cus_no', 'like', $search_term)
                            ->orWhere('cus_tel_1', 'like', $search_term)
                            ->orWhereHas('cusManageBy', function ($user_q) use ($search_term) {
                                $user_q->where('username', 'like', $search_term);
                            });
                    });
                };

                $customer_prepared->where($search_sql);
                $total_customers_q->where($search_sql);
            }

            // Date range filter
            if ($request->has('date_start') && $request->date_start) {
                $customer_prepared->whereDate('cus_created_date', '>=', $request->date_start);
                $total_customers_q->whereDate('cus_created_date', '>=', $request->date_start);
            }
            if ($request->has('date_end') && $request->date_end) {
                $customer_prepared->whereDate('cus_created_date', '<=', $request->date_end);
                $total_customers_q->whereDate('cus_created_date', '<=', $request->date_end);
            }

            // Multi-select sales name filter
            if (! empty($salesNames)) {
                $customer_prepared->whereHas('cusManageBy', function ($query) use ($salesNames) {
                    $query->whereIn('username', $salesNames);
                });
                $total_customers_q->whereHas('cusManageBy', function ($query) use ($salesNames) {
                    $query->whereIn('username', $salesNames);
                });
            }

            // Multi-select channel filter
            if (! empty($channels)) {
                $customer_prepared->whereIn('cus_channel', $channels);
                $total_customers_q->whereIn('cus_channel', $channels);
            }

            // Recall days filter
            if ($request->has('recall_min') || $request->has('recall_max')) {
                $recallFilter = function ($query) use ($request) {
                    $now = now();

                    if ($request->has('recall_min') && $request->recall_min !== null) {
                        $min_date = $now->copy()->subDays($request->recall_min)->endOfDay();
                        $query->where('cd_last_datetime', '<=', $min_date);
                    }

                    if ($request->has('recall_max') && $request->recall_max !== null) {
                        $max_date = $now->copy()->subDays($request->recall_max)->startOfDay();
                        $query->where('cd_last_datetime', '>=', $max_date);
                    }
                };

                $customer_prepared->whereHas('customerDetail', $recallFilter);
                $total_customers_q->whereHas('customerDetail', $recallFilter);
            }

            $perPage = $request->input('per_page', 30);

            // Debug logging
            Log::info('Customer Query Debug', [
                'per_page'  => $perPage,
                'group'     => $request->group,
                'user_role' => $user_q->role,
                'filters'   => [
                    'search'      => $request->search,
                    'date_start'  => $request->date_start,
                    'date_end'    => $request->date_end,
                    'sales_names' => $salesNames,
                    'channels'    => $channels,
                    'recall_min'  => $request->recall_min,
                    'recall_max'  => $request->recall_max,
                ],
            ]);

            // Handle large datasets
            if ($perPage > 1000) {
                $customer_collection = $customer_prepared->select([
                    'cus_id',
                    'cus_mcg_id',
                    'cus_no',
                    'cus_channel',
                    'cus_company',
                    'cus_firstname',
                    'cus_lastname',
                    'cus_name',
                    'cus_depart',
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
                ])->orderBy('cus_no', 'desc')->get();

                $customer_r        = CustomerResource::collection($customer_collection);
                $total_customers_r = $total_customers_q->count();

                // Performance monitoring for large dataset
                $endTime = microtime(true);
                $endMemory = memory_get_usage(true);
                $executionTime = $endTime - $startTime;
                $memoryUsed = $endMemory - $startMemory;

                Log::info('Customer index request completed (large dataset)', [
                    'request_id' => $performanceData['request_id'],
                    'execution_time' => round($executionTime, 4),
                    'memory_used' => $memoryUsed,
                    'peak_memory' => memory_get_peak_usage(true),
                    'total_customers' => $total_customers_r,
                    'returned_customers' => $customer_collection->count(),
                    'query_type' => 'large_dataset_fetch'
                ]);

                return [
                    'data'        => $customer_r,
                    'groups'      => $customer_group_q,
                    'total_count' => $total_customers_r,
                    'pagination'  => [
                        'current_page' => 1,
                        'per_page'     => $customer_collection->count(),
                        'total_pages'  => 1,
                        'total_items'  => $customer_collection->count(),
                    ],
                    'performance' => [
                        'execution_time' => round($executionTime, 4),
                        'memory_used' => round($memoryUsed / 1024 / 1024, 2) . 'MB',
                        'query_type' => 'large_dataset'
                    ]
                ];
            } else {
                // Normal pagination
                $customer_q = $customer_prepared->select([
                    'cus_id',
                    'cus_mcg_id',
                    'cus_no',
                    'cus_channel',
                    'cus_company',
                    'cus_firstname',
                    'cus_lastname',
                    'cus_name',
                    'cus_depart',
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

                $customer_r        = CustomerResource::collection($customer_q);
                $total_customers_r = $total_customers_q->count();

                // Performance monitoring for paginated results
                $endTime = microtime(true);
                $endMemory = memory_get_usage(true);
                $executionTime = $endTime - $startTime;
                $memoryUsed = $endMemory - $startMemory;

                Log::info('Customer index request completed (paginated)', [
                    'request_id' => $performanceData['request_id'],
                    'execution_time' => round($executionTime, 4),
                    'memory_used' => $memoryUsed,
                    'peak_memory' => memory_get_peak_usage(true),
                    'total_customers' => $total_customers_r,
                    'returned_customers' => $customer_q->count(),
                    'current_page' => $customer_q->currentPage(),
                    'per_page' => $customer_q->perPage(),
                    'query_type' => 'paginated_fetch'
                ]);

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
                    'performance' => [
                        'execution_time' => round($executionTime, 4),
                        'memory_used' => round($memoryUsed / 1024 / 1024, 2) . 'MB',
                        'query_type' => 'paginated'
                    ]
                ];
            }
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Database query error in customer index', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'sql' => $e->getSql() ?? 'N/A',
                'bindings' => $e->getBindings() ?? [],
                'user_id' => $request->user ?? 'unknown',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_params' => $request->all(),
                'stack_trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Database query failed while fetching customers',
                'error_code' => 'DATABASE_QUERY_ERROR',
                'error_details' => [
                    'type' => 'database_error',
                    'timestamp' => now()->toISOString(),
                    'reference_id' => Str::uuid()
                ]
            ], 500);

        } catch (\PDOException $e) {
            Log::critical('Database connection error in customer index', [
                'error' => $e->getMessage(),
                'user_id' => $request->user ?? 'unknown',
                'ip_address' => $request->ip(),
                'timestamp' => now()->toISOString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Database connection temporarily unavailable',
                'error_code' => 'DATABASE_CONNECTION_ERROR',
                'error_details' => [
                    'type' => 'connection_error',
                    'timestamp' => now()->toISOString(),
                    'reference_id' => Str::uuid()
                ]
            ], 503);

        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            Log::warning('Authorization error in customer index', [
                'error' => $e->getMessage(),
                'user_id' => $request->user ?? 'unknown',
                'ip_address' => $request->ip(),
                'timestamp' => now()->toISOString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Insufficient permissions to access customer data',
                'error_code' => 'AUTHORIZATION_ERROR',
                'error_details' => [
                    'type' => 'authorization_error',
                    'timestamp' => now()->toISOString(),
                    'reference_id' => Str::uuid()
                ]
            ], 403);

        } catch (\Exception $e) {
            $errorId = Str::uuid();
            
            Log::error('Unexpected error in customer index', [
                'error_id' => $errorId,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'user_id' => $request->user ?? 'unknown',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_params' => $request->all(),
                'memory_usage' => memory_get_usage(true),
                'peak_memory' => memory_get_peak_usage(true),
                'execution_time' => microtime(true) - (defined('LARAVEL_START') ? LARAVEL_START : 0),
                'stack_trace' => $e->getTraceAsString(),
                'timestamp' => now()->toISOString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'An unexpected error occurred while fetching customers',
                'error_code' => 'UNEXPECTED_ERROR',
                'error_details' => [
                    'type' => 'system_error',
                    'error_id' => $errorId,
                    'timestamp' => now()->toISOString(),
                    'support_message' => 'Please contact support with error ID: ' . $errorId
                ]
            ], 500);
        }
    }

    /**
     * Enhanced validation for index request parameters
     */
    private function validateIndexRequest(Request $request)
    {
        $errors = [];

        // Validate user parameter
        if (!$request->has('user') || empty($request->user)) {
            $errors['user'] = 'User parameter is required and cannot be empty';
        } elseif (!is_numeric($request->user)) {
            $errors['user'] = 'User parameter must be a valid numeric user ID';
        }

        // Validate pagination parameters
        if ($request->has('per_page')) {
            $perPage = $request->per_page;
            if (!is_numeric($perPage) || $perPage < 1 || $perPage > 10000) {
                $errors['per_page'] = 'Per page parameter must be a number between 1 and 10000';
            }
        }

        // Validate date parameters
        if ($request->has('date_start') && !empty($request->date_start)) {
            if (!$this->isValidDate($request->date_start)) {
                $errors['date_start'] = 'Start date must be a valid date in YYYY-MM-DD format';
            }
        }

        if ($request->has('date_end') && !empty($request->date_end)) {
            if (!$this->isValidDate($request->date_end)) {
                $errors['date_end'] = 'End date must be a valid date in YYYY-MM-DD format';
            }
        }

        // Validate date range
        if ($request->has('date_start') && $request->has('date_end') && 
            !empty($request->date_start) && !empty($request->date_end)) {
            if (strtotime($request->date_start) > strtotime($request->date_end)) {
                $errors['date_range'] = 'Start date cannot be later than end date';
            }
        }

        // Validate recall parameters
        if ($request->has('recall_min') && !empty($request->recall_min)) {
            if (!is_numeric($request->recall_min) || $request->recall_min < 0) {
                $errors['recall_min'] = 'Minimum recall days must be a non-negative number';
            }
        }

        if ($request->has('recall_max') && !empty($request->recall_max)) {
            if (!is_numeric($request->recall_max) || $request->recall_max < 0) {
                $errors['recall_max'] = 'Maximum recall days must be a non-negative number';
            }
        }

        // Validate recall range
        if ($request->has('recall_min') && $request->has('recall_max') && 
            !empty($request->recall_min) && !empty($request->recall_max)) {
            if ($request->recall_min > $request->recall_max) {
                $errors['recall_range'] = 'Minimum recall days cannot be greater than maximum recall days';
            }
        }

        return $errors;
    }

    /**
     * Enhanced array parameter extraction with comprehensive validation
     */
    private function extractAndValidateArrayParameters(Request $request)
    {
        $result = [
            'sales_names' => [],
            'channels' => [],
            'has_errors' => false,
            'errors' => [],
            'invalid_params' => [],
            'extraction_method' => []
        ];

        // Extract and validate sales_name parameter
        $salesExtraction = $this->extractArrayParameterEnhanced($request, 'sales_name');
        $result['sales_names'] = $salesExtraction['values'];
        $result['extraction_method']['sales_name'] = $salesExtraction['method'];

        // Validate sales names
        if (!empty($salesExtraction['values'])) {
            foreach ($salesExtraction['values'] as $index => $salesName) {
                $salesName = trim($salesName);
                if (empty($salesName)) {
                    $result['has_errors'] = true;
                    $result['errors']['sales_name'][] = "Sales name at index {$index} cannot be empty";
                    $result['invalid_params'][] = "sales_name[{$index}]";
                }
                if (strlen($salesName) > 100) {
                    $result['has_errors'] = true;
                    $result['errors']['sales_name'][] = "Sales name at index {$index} exceeds maximum length of 100 characters";
                    $result['invalid_params'][] = "sales_name[{$index}]";
                }
                // Validate against SQL injection patterns
                if ($this->containsSqlInjectionPatterns($salesName)) {
                    $result['has_errors'] = true;
                    $result['errors']['sales_name'][] = "Sales name at index {$index} contains invalid characters";
                    $result['invalid_params'][] = "sales_name[{$index}]";
                }
            }
        }

        // Extract and validate channel parameter
        $channelExtraction = $this->extractArrayParameterEnhanced($request, 'channel');
        $result['channels'] = $channelExtraction['values'];
        $result['extraction_method']['channel'] = $channelExtraction['method'];

        // Validate channels
        if (!empty($channelExtraction['values'])) {
            $validChannels = [1, 2, 3]; // Valid channel values: 1=sales, 2=online, 3=office
            foreach ($channelExtraction['values'] as $index => $channel) {
                if (!is_numeric($channel)) {
                    $result['has_errors'] = true;
                    $result['errors']['channel'][] = "Channel at index {$index} must be numeric";
                    $result['invalid_params'][] = "channel[{$index}]";
                } elseif (!in_array((int)$channel, $validChannels)) {
                    $result['has_errors'] = true;
                    $result['errors']['channel'][] = "Channel at index {$index} must be one of: " . implode(', ', $validChannels) . " (1=sales, 2=online, 3=office)";
                    $result['invalid_params'][] = "channel[{$index}]";
                }
            }
        }

        return $result;
    }

    /**
     * Enhanced array parameter extraction with multiple format support
     */
    private function extractArrayParameterEnhanced(Request $request, $paramName)
    {
        $result = [
            'values' => [],
            'method' => 'none',
            'raw_value' => null
        ];

        // Method 1: Check for param[] format (Laravel array syntax)
        if ($request->has($paramName . '[]')) {
            $value = $request->input($paramName . '[]');
            $result['raw_value'] = $value;
            $result['method'] = 'array_brackets';
            
            if (is_array($value)) {
                $result['values'] = array_filter($value, function($item) {
                    return !is_null($item) && $item !== '';
                });
            } else {
                $result['values'] = !empty($value) ? [$value] : [];
            }
            return $result;
        }

        // Method 2: Check for param format (standard parameter)
        if ($request->has($paramName)) {
            $value = $request->input($paramName);
            $result['raw_value'] = $value;
            
            if (is_array($value)) {
                $result['method'] = 'array_direct';
                $result['values'] = array_filter($value, function($item) {
                    return !is_null($item) && $item !== '';
                });
            } elseif (is_string($value) && !empty($value)) {
                // Method 3: Check if string contains JSON format
                if ($this->isJsonString($value)) {
                    $result['method'] = 'json_string';
                    $decoded = json_decode($value, true);
                    if (is_array($decoded)) {
                        $result['values'] = array_filter($decoded, function($item) {
                            return !is_null($item) && $item !== '';
                        });
                    }
                }
                // Method 4: Check if string contains comma-separated values
                elseif (strpos($value, ',') !== false) {
                    $result['method'] = 'comma_separated';
                    $result['values'] = array_filter(
                        array_map('trim', explode(',', $value)),
                        function($item) {
                            return !empty($item);
                        }
                    );
                }
                // Method 5: Single value
                else {
                    $result['method'] = 'single_value';
                    $result['values'] = [$value];
                }
            }
            return $result;
        }

        // No parameter found
        $result['method'] = 'not_found';
        return $result;
    }

    /**
     * Check if a string is valid JSON
     */
    private function isJsonString($string)
    {
        json_decode($string);
        return (json_last_error() == JSON_ERROR_NONE);
    }

    /**
     * Check for SQL injection patterns
     */
    private function containsSqlInjectionPatterns($value)
    {
        $patterns = [
            '/(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i',
            '/(\bUNION\b|\bJOIN\b)/i',
            "/(--|#|\/\*|\*\/)/",
            "/(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i",
            "/['\";\\\\]/",
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Validate date format
     */
    private function isValidDate($date, $format = 'Y-m-d')
    {
        $d = \DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }

    /**
     * Extract array parameter from request (handles both param[] and param formats)
     * @deprecated Use extractArrayParameterEnhanced instead
     */
    private function extractArrayParameter(Request $request, $paramName)
    {
        // Check for param[] format first
        if ($request->has($paramName . '[]')) {
            $value = $request->input($paramName . '[]');
            return is_array($value) ? $value : [$value];
        }

        // Check for param format
        if ($request->has($paramName)) {
            $value = $request->input($paramName);
            return is_array($value) ? $value : (empty($value) ? [] : [$value]);
        }

        return [];
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

        // Enhanced validation with detailed error messages
        try {
            $validatedData = $request->validate([
                'cus_channel'   => ['required', 'integer', 'in:1,2,3'],
                'cus_company'   => ['required', 'string', 'max:255'],
                'cus_firstname' => ['required', 'string', 'max:100'],
                'cus_lastname'  => ['required', 'string', 'max:100'],
                'cus_name'      => ['required', 'string', 'max:200'],
                'cus_tel_1'     => ['required', 'string', 'max:20'],
                'cus_tel_2'     => ['nullable', 'string', 'max:20'],
                'cus_email'     => ['nullable', 'email', 'max:100'],
                'cus_tax_id'    => ['nullable', 'string', 'max:13'],
            ], [
                'cus_channel.required' => 'Channel is required',
                'cus_channel.integer' => 'Channel must be a number',
                'cus_channel.in' => 'Channel must be one of: 1 (sales), 2 (online), 3 (office)',
                'cus_company.required' => 'Company name is required',
                'cus_company.max' => 'Company name cannot exceed 255 characters',
                'cus_firstname.required' => 'First name is required',
                'cus_firstname.max' => 'First name cannot exceed 100 characters',
                'cus_lastname.required' => 'Last name is required',
                'cus_lastname.max' => 'Last name cannot exceed 100 characters',
                'cus_name.required' => 'Customer name is required',
                'cus_name.max' => 'Customer name cannot exceed 200 characters',
                'cus_tel_1.required' => 'Primary phone number is required',
                'cus_tel_1.max' => 'Primary phone number cannot exceed 20 characters',
                'cus_tel_2.max' => 'Secondary phone number cannot exceed 20 characters',
                'cus_email.email' => 'Email must be a valid email address',
                'cus_email.max' => 'Email cannot exceed 100 characters',
                'cus_tax_id.max' => 'Tax ID cannot exceed 13 characters',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Customer creation validation failed', [
                'errors' => $e->errors(),
                'input' => $request->except(['password', 'token']),
                'user_id' => $request->user(),
                'ip_address' => $request->ip()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed. Please check your input data.',
                'errors' => $e->errors(),
                'validation_summary' => [
                    'total_errors' => count($e->errors()),
                    'failed_fields' => array_keys($e->errors())
                ]
            ], 422);
        }

        $data_input = $request->all();

        try {
            DB::beginTransaction();

            // Enhanced input sanitization and validation
            $sanitizedData = $this->sanitizeCustomerInput($data_input);
            if ($sanitizedData['has_errors']) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data sanitization failed',
                    'errors' => $sanitizedData['errors']
                ], 422);
            }

            $data_input = $sanitizedData['data'];

            // Get customer group with error handling
            $group_q = CustomerGroup::where('mcg_is_use', true)
                ->select('mcg_id', 'mcg_name', 'mcg_recall_default', 'mcg_sort')
                ->orderBy('mcg_sort', 'desc')
                ->first();

            if (!$group_q) {
                Log::error('No active customer group found during customer creation');
                throw new \Exception('No active customer groups available. Please contact administrator.');
            }

            // Get master customer with enhanced error handling
            $customer_q = Customer::select('cus_id', 'cus_no', 'cus_created_date')
                ->orderByDesc('cus_no')
                ->first();

            // Enhanced customer creation with detailed logging
            Log::info('Creating new customer', [
                'customer_data' => array_merge($data_input, ['password' => '***hidden***']),
                'group_id' => $group_q->mcg_id,
                'group_name' => $group_q->mcg_name,
                'last_customer_no' => $customer_q?->cus_no,
                'user_id' => Auth::id()
            ]);

            // Clean phone numbers & Tax ID
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
            
            // Enhanced error logging with context
            Log::error('Create customer error occurred', [
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'stack_trace' => $e->getTraceAsString(),
                'input_data' => array_merge($request->except(['password', 'token']), ['sanitized' => true]),
                'user_id' => Auth::id(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now()->toISOString()
            ]);

            // Determine error type and provide appropriate response
            $errorResponse = $this->handleCustomerCreationError($e, $request);
            
            return response()->json([
                'status' => 'error',
                'message' => $errorResponse['message'],
                'error_code' => $errorResponse['code'],
                'debug_info' => config('app.debug') ? [
                    'exception_type' => get_class($e),
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine()
                ] : null
            ], $errorResponse['http_code']);
        }
    }

    /**
     * Enhanced customer input sanitization
     */
    private function sanitizeCustomerInput($data)
    {
        $result = [
            'data' => $data,
            'has_errors' => false,
            'errors' => []
        ];

        // Clean phone numbers & Tax ID
        $fieldsToClean = ['cus_tel_1', 'cus_tel_2', 'cus_tax_id'];
        foreach ($fieldsToClean as $field) {
            if (isset($data[$field]) && !empty($data[$field])) {
                $original = $data[$field];
                $cleaned = preg_replace('/[^0-9]/', '', $data[$field]);
                
                // Validate phone number length
                if (in_array($field, ['cus_tel_1', 'cus_tel_2']) && !empty($cleaned)) {
                    if (strlen($cleaned) < 9 || strlen($cleaned) > 15) {
                        $result['has_errors'] = true;
                        $result['errors'][$field] = "Phone number must be between 9 and 15 digits";
                    }
                }
                
                // Validate tax ID length
                if ($field === 'cus_tax_id' && !empty($cleaned)) {
                    if (strlen($cleaned) !== 13) {
                        $result['has_errors'] = true;
                        $result['errors'][$field] = "Tax ID must be exactly 13 digits";
                    }
                }
                
                $result['data'][$field] = $cleaned;
                
                Log::debug("Sanitized field {$field}", [
                    'original' => $original,
                    'cleaned' => $cleaned
                ]);
            }
        }

        // Sanitize text fields
        $textFields = ['cus_firstname', 'cus_lastname', 'cus_name', 'cus_company', 'cus_depart', 'cus_address'];
        foreach ($textFields as $field) {
            if (isset($data[$field])) {
                $original = $data[$field];
                
                // Basic XSS protection
                $cleaned = strip_tags(trim($data[$field]));
                
                // Check for potential SQL injection patterns
                if ($this->containsSqlInjectionPatterns($cleaned)) {
                    $result['has_errors'] = true;
                    $result['errors'][$field] = "Field contains invalid characters";
                }
                
                $result['data'][$field] = $cleaned;
                
                if ($original !== $cleaned) {
                    Log::debug("Sanitized text field {$field}", [
                        'original' => $original,
                        'cleaned' => $cleaned
                    ]);
                }
            }
        }

        // Validate email format if provided
        if (isset($data['cus_email']) && !empty($data['cus_email'])) {
            if (!filter_var($data['cus_email'], FILTER_VALIDATE_EMAIL)) {
                $result['has_errors'] = true;
                $result['errors']['cus_email'] = "Invalid email format";
            }
        }

        return $result;
    }

    /**
     * Handle customer creation errors with specific error types
     */
    private function handleCustomerCreationError(\Exception $e, Request $request)
    {
        // Database connection errors
        if (strpos($e->getMessage(), 'database') !== false || 
            strpos($e->getMessage(), 'connection') !== false) {
            return [
                'message' => 'Database connection error. Please try again later.',
                'code' => 'DATABASE_ERROR',
                'http_code' => 503
            ];
        }

        // Duplicate entry errors
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            return [
                'message' => 'Customer with this information already exists.',
                'code' => 'DUPLICATE_CUSTOMER',
                'http_code' => 409
            ];
        }

        // Foreign key constraint errors
        if (strpos($e->getMessage(), 'foreign key constraint') !== false) {
            return [
                'message' => 'Invalid reference data. Please check customer group and user assignments.',
                'code' => 'INVALID_REFERENCE',
                'http_code' => 422
            ];
        }

        // Default error
        return [
            'message' => 'An unexpected error occurred while creating the customer. Please try again.',
            'code' => 'CREATION_ERROR',
            'http_code' => 500
        ];
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
        // Enhanced validation with detailed error messages
        try {
            $validatedData = $request->validate([
                'cus_channel'   => ['required', 'integer', 'in:1,2,3'],
                'cus_company'   => ['required', 'string', 'max:255'],
                'cus_firstname' => ['required', 'string', 'max:100'],
                'cus_lastname'  => ['required', 'string', 'max:100'],
                'cus_name'      => ['required', 'string', 'max:200'],
                'cus_tel_1'     => ['required', 'string', 'max:20'],
                'cus_tel_2'     => ['nullable', 'string', 'max:20'],
                'cus_email'     => ['nullable', 'email', 'max:100'],
                'cus_tax_id'    => ['nullable', 'string', 'max:13'],
            ], [
                'cus_channel.required' => 'Channel is required',
                'cus_channel.integer' => 'Channel must be a number',
                'cus_channel.in' => 'Channel must be one of: 1 (sales), 2 (online), 3 (office)',
                'cus_company.required' => 'Company name is required',
                'cus_company.max' => 'Company name cannot exceed 255 characters',
                'cus_firstname.required' => 'First name is required',
                'cus_firstname.max' => 'First name cannot exceed 100 characters',
                'cus_lastname.required' => 'Last name is required',
                'cus_lastname.max' => 'Last name cannot exceed 100 characters',
                'cus_name.required' => 'Customer name is required',
                'cus_name.max' => 'Customer name cannot exceed 200 characters',
                'cus_tel_1.required' => 'Primary phone number is required',
                'cus_tel_1.max' => 'Primary phone number cannot exceed 20 characters',
                'cus_tel_2.max' => 'Secondary phone number cannot exceed 20 characters',
                'cus_email.email' => 'Email must be a valid email address',
                'cus_email.max' => 'Email cannot exceed 100 characters',
                'cus_tax_id.max' => 'Tax ID cannot exceed 13 characters',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Customer update validation failed', [
                'customer_id' => $id,
                'errors' => $e->errors(),
                'input' => $request->except(['password', 'token']),
                'user_id' => Auth::id(),
                'ip_address' => $request->ip()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed. Please check your input data.',
                'errors' => $e->errors(),
                'validation_summary' => [
                    'total_errors' => count($e->errors()),
                    'failed_fields' => array_keys($e->errors())
                ]
            ], 422);
        }

        // Validate customer ID format
        if (!$this->isValidUuid($id)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid customer ID format',
                'error_code' => 'INVALID_ID_FORMAT'
            ], 422);
        }

        $data_input = $request->all();

        try {
            DB::beginTransaction();

            // Check if customer exists
            $customer = Customer::find($id);
            if (!$customer) {
                Log::warning('Attempt to update non-existent customer', [
                    'customer_id' => $id,
                    'user_id' => Auth::id(),
                    'ip_address' => $request->ip()
                ]);
                
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer not found',
                    'error_code' => 'CUSTOMER_NOT_FOUND'
                ], 404);
            }

            // Enhanced input sanitization
            $sanitizedData = $this->sanitizeCustomerInput($data_input);
            if ($sanitizedData['has_errors']) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data sanitization failed',
                    'errors' => $sanitizedData['errors']
                ], 422);
            }

            $data_input = $sanitizedData['data'];

            Log::info('Updating customer', [
                'customer_id' => $id,
                'original_data' => $customer->toArray(),
                'new_data' => array_merge($data_input, ['password' => '***hidden***']),
                'user_id' => Auth::id()
            ]);
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
            
            Log::error('Update customer error occurred', [
                'customer_id' => $id,
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'stack_trace' => $e->getTraceAsString(),
                'input_data' => array_merge($request->except(['password', 'token']), ['sanitized' => true]),
                'user_id' => Auth::id(),
                'ip_address' => $request->ip(),
                'timestamp' => now()->toISOString()
            ]);

            // Handle specific error types
            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer not found',
                    'error_code' => 'CUSTOMER_NOT_FOUND'
                ], 404);
            }

            $errorResponse = $this->handleCustomerUpdateError($e);
            
            return response()->json([
                'status' => 'error',
                'message' => $errorResponse['message'],
                'error_code' => $errorResponse['code'],
                'debug_info' => config('app.debug') ? [
                    'exception_type' => get_class($e),
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine()
                ] : null
            ], $errorResponse['http_code']);
        }
    }

    /**
     * Handle customer update errors with specific error types
     */
    private function handleCustomerUpdateError(\Exception $e)
    {
        // Database connection errors
        if (strpos($e->getMessage(), 'database') !== false || 
            strpos($e->getMessage(), 'connection') !== false) {
            return [
                'message' => 'Database connection error. Please try again later.',
                'code' => 'DATABASE_ERROR',
                'http_code' => 503
            ];
        }

        // Duplicate entry errors
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            return [
                'message' => 'Another customer with this information already exists.',
                'code' => 'DUPLICATE_CUSTOMER',
                'http_code' => 409
            ];
        }

        // Foreign key constraint errors
        if (strpos($e->getMessage(), 'foreign key constraint') !== false) {
            return [
                'message' => 'Invalid reference data. Please check customer group and user assignments.',
                'code' => 'INVALID_REFERENCE',
                'http_code' => 422
            ];
        }

        // Default error
        return [
            'message' => 'An unexpected error occurred while updating the customer. Please try again.',
            'code' => 'UPDATE_ERROR',
            'http_code' => 500
        ];
    }

    /**
     * Validate UUID format
     */
    private function isValidUuid($uuid)
    {
        return preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i', $uuid);
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

    /**
     * Update recall datetime with enhanced validation and error handling
     */
    public function recall(Request $request, string $id)
    {
        // Enhanced validation for recall request
        try {
            $validatedData = $request->validate([
                'cus_mcg_id' => ['required', 'string', 'max:36'],
                'cd_updated_by' => ['required', 'integer'],
            ], [
                'cus_mcg_id.required' => 'Customer group ID is required',
                'cus_mcg_id.string' => 'Customer group ID must be a string',
                'cus_mcg_id.max' => 'Customer group ID cannot exceed 36 characters',
                'cd_updated_by.required' => 'Updated by user ID is required',
                'cd_updated_by.integer' => 'Updated by user ID must be a number',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Customer recall validation failed', [
                'customer_detail_id' => $id,
                'errors' => $e->errors(),
                'input' => $request->except(['password', 'token']),
                'user_id' => Auth::id(),
                'ip_address' => $request->ip()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed for recall operation',
                'errors' => $e->errors(),
                'validation_summary' => [
                    'total_errors' => count($e->errors()),
                    'failed_fields' => array_keys($e->errors())
                ]
            ], 422);
        }

        // Validate customer detail ID format
        if (!$this->isValidUuid($id)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid customer detail ID format',
                'error_code' => 'INVALID_ID_FORMAT'
            ], 422);
        }

        $update_input = $request->all();

        try {
            DB::beginTransaction();

            // Validate customer group exists and is active
            $group_q = CustomerGroup::where('mcg_is_use', true)
                ->where('mcg_id', $request->cus_mcg_id)
                ->select('mcg_id', 'mcg_name', 'mcg_recall_default')
                ->first();

            if (!$group_q) {
                Log::warning('Customer group not found during recall operation', [
                    'group_id' => $request->cus_mcg_id,
                    'customer_detail_id' => $id,
                    'user_id' => Auth::id()
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer group not found or inactive',
                    'error_code' => 'GROUP_NOT_FOUND'
                ], 404);
            }

            // Check if customer detail exists
            $customer_detail = CustomerDetail::find($id);
            if (!$customer_detail) {
                Log::warning('Customer detail not found during recall operation', [
                    'customer_detail_id' => $id,
                    'user_id' => Auth::id(),
                    'ip_address' => $request->ip()
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer detail record not found',
                    'error_code' => 'CUSTOMER_DETAIL_NOT_FOUND'
                ], 404);
            }

            // Store original values for logging
            $originalLastDateTime = $customer_detail->cd_last_datetime;
            
            // Calculate new recall datetime
            $newRecallDateTime = $this->customer_service->setRecallDatetime($group_q->mcg_recall_default);

            Log::info('Processing customer recall operation', [
                'customer_detail_id' => $id,
                'customer_id' => $customer_detail->cd_cus_id,
                'group_id' => $group_q->mcg_id,
                'group_name' => $group_q->mcg_name,
                'recall_default_days' => $group_q->mcg_recall_default,
                'original_last_datetime' => $originalLastDateTime,
                'new_recall_datetime' => $newRecallDateTime,
                'user_id' => Auth::id()
            ]);

            // Update customer detail with enhanced error handling
            $customer_detail->fill($update_input);
            $customer_detail->cd_last_datetime = $newRecallDateTime;
            $customer_detail->cd_updated_date  = now();
            $customer_detail->cd_updated_by    = Auth::id();
            
            if (!$customer_detail->save()) {
                throw new \Exception('Failed to save customer detail updates');
            }

            DB::commit();

            Log::info('Customer recall operation completed successfully', [
                'customer_detail_id' => $id,
                'customer_id' => $customer_detail->cd_cus_id,
                'recall_datetime_updated' => $newRecallDateTime,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Customer recall time updated successfully',
                'data' => [
                    'customer_detail_id' => $id,
                    'new_recall_datetime' => $newRecallDateTime,
                    'group_name' => $group_q->mcg_name,
                    'updated_at' => now()
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Customer recall operation failed', [
                'customer_detail_id' => $id,
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'stack_trace' => $e->getTraceAsString(),
                'input_data' => $request->except(['password', 'token']),
                'user_id' => Auth::id(),
                'ip_address' => $request->ip(),
                'timestamp' => now()->toISOString()
            ]);

            $errorResponse = $this->handleRecallError($e);
            
            return response()->json([
                'status' => 'error',
                'message' => $errorResponse['message'],
                'error_code' => $errorResponse['code'],
                'debug_info' => config('app.debug') ? [
                    'exception_type' => get_class($e),
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine()
                ] : null
            ], $errorResponse['http_code']);
        }
    }

    /**
     * Handle recall operation errors
     */
    private function handleRecallError(\Exception $e)
    {
        // Database connection errors
        if (strpos($e->getMessage(), 'database') !== false || 
            strpos($e->getMessage(), 'connection') !== false) {
            return [
                'message' => 'Database connection error during recall operation. Please try again later.',
                'code' => 'DATABASE_ERROR',
                'http_code' => 503
            ];
        }

        // Foreign key constraint errors
        if (strpos($e->getMessage(), 'foreign key constraint') !== false) {
            return [
                'message' => 'Data integrity error during recall operation. Please verify customer group assignment.',
                'code' => 'INTEGRITY_ERROR',
                'http_code' => 422
            ];
        }

        // Default error
        return [
            'message' => 'An unexpected error occurred during recall operation. Please try again.',
            'code' => 'RECALL_ERROR',
            'http_code' => 500
        ];
    }    /**
     * Get all sales names for filter dropdown with enhanced validation
     */
    public function getSales(Request $request)
    {
        try {
            Log::info('getSales endpoint called', [
                'request_data' => $request->all(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now()->toISOString()
            ]);

            // Enhanced validation for user parameter
            if (!$request->has('user') || empty($request->user)) {
                Log::error('getSales: User parameter missing or empty', [
                    'request_data' => $request->all(),
                    'ip_address' => $request->ip()
                ]);
                
                return response()->json([
                    'status' => 'error',
                    'message' => 'User parameter is required and cannot be empty',
                    'error_code' => 'USER_PARAMETER_REQUIRED'
                ], 422);
            }

            if (!is_numeric($request->user)) {
                Log::error('getSales: Invalid user parameter format', [
                    'user_parameter' => $request->user,
                    'ip_address' => $request->ip()
                ]);
                
                return response()->json([
                    'status' => 'error',
                    'message' => 'User parameter must be a valid numeric user ID',
                    'error_code' => 'INVALID_USER_FORMAT'
                ], 422);
            }

            // Query user with enhanced validation
            $user_q = User::where('enable', 'Y')
                ->where('user_id', $request->user)
                ->select('user_id', 'role', 'username')
                ->first();

            if (!$user_q) {
                Log::error('getSales: User not found', [
                    'user_id' => $request->user,
                    'ip_address' => $request->ip()
                ]);
                
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found or inactive',
                    'error_code' => 'USER_NOT_FOUND'
                ], 404);
            }

            Log::info('getSales: User validated', [
                'user_id' => $user_q->user_id,
                'user_role' => $user_q->role,
                'username' => $user_q->username
            ]);

            // Get all unique sales names with enhanced query and validation
            $sales_query = Customer::active()
                ->join('users', 'master_customers.cus_manage_by', '=', 'users.user_id')
                ->where('users.enable', 'Y')
                ->select('users.username', 'users.user_id')
                ->distinct();

            // Role-based filtering with detailed logging
            if ($user_q->role !== 'admin') {
                $sales_query->where('master_customers.cus_manage_by', $user_q->user_id);
                Log::info('getSales: Applied non-admin user filter', [
                    'user_id' => $user_q->user_id,
                    'role' => $user_q->role
                ]);
            } else {
                Log::info('getSales: Admin user - no filtering applied', [
                    'user_id' => $user_q->user_id
                ]);
            }

            $sales_results = $sales_query->orderBy('users.username')->get();

            // Validate and process results
            $sales_list = [];
            $invalid_sales = [];

            foreach ($sales_results as $sale) {
                $username = trim($sale->username);
                
                // Validate username format
                if (empty($username)) {
                    $invalid_sales[] = [
                        'user_id' => $sale->user_id,
                        'reason' => 'Empty username'
                    ];
                    continue;
                }

                if (strlen($username) > 100) {
                    $invalid_sales[] = [
                        'user_id' => $sale->user_id,
                        'username' => $username,
                        'reason' => 'Username exceeds maximum length'
                    ];
                    continue;
                }

                // Check for potential security issues
                if ($this->containsSqlInjectionPatterns($username)) {
                    $invalid_sales[] = [
                        'user_id' => $sale->user_id,
                        'username' => $username,
                        'reason' => 'Username contains invalid characters'
                    ];
                    continue;
                }

                $sales_list[] = $username;
            }

            // Log invalid sales if any
            if (!empty($invalid_sales)) {
                Log::warning('getSales: Found invalid sales usernames', [
                    'invalid_sales' => $invalid_sales,
                    'total_invalid' => count($invalid_sales)
                ]);
            }

            Log::info('getSales: Query completed successfully', [
                'total_sales_found' => count($sales_results),
                'valid_sales_count' => count($sales_list),
                'invalid_sales_count' => count($invalid_sales),
                'user_role' => $user_q->role,
                'user_id' => $user_q->user_id,
                'processing_time' => microtime(true) - LARAVEL_START
            ]);

            return response()->json([
                'status' => 'success',
                'sales_list' => $sales_list,
                'total_count' => count($sales_list),
                'metadata' => [
                    'user_role' => $user_q->role,
                    'filtering_applied' => $user_q->role !== 'admin',
                    'data_quality' => [
                        'valid_entries' => count($sales_list),
                        'invalid_entries' => count($invalid_sales)
                    ],
                    'generated_at' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('getSales: Fatal error occurred', [
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'stack_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now()->toISOString()
            ]);

            $errorResponse = $this->handleGetSalesError($e);

            return response()->json([
                'status' => 'error',
                'message' => $errorResponse['message'],
                'error_code' => $errorResponse['code'],
                'debug_info' => config('app.debug') ? [
                    'exception_type' => get_class($e),
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine()
                ] : null
            ], $errorResponse['http_code']);
        }
    }

    /**
     * Handle getSales operation errors
     */
    private function handleGetSalesError(\Exception $e)
    {
        // Database connection errors
        if (strpos($e->getMessage(), 'database') !== false || 
            strpos($e->getMessage(), 'connection') !== false) {
            return [
                'message' => 'Database connection error while fetching sales list. Please try again later.',
                'code' => 'DATABASE_ERROR',
                'http_code' => 503
            ];
        }

        // Query timeout errors
        if (strpos($e->getMessage(), 'timeout') !== false) {
            return [
                'message' => 'Request timeout while fetching sales list. Please try again.',
                'code' => 'TIMEOUT_ERROR',
                'http_code' => 504
            ];
        }

        // Memory errors
        if (strpos($e->getMessage(), 'memory') !== false) {
            return [
                'message' => 'Server memory error while processing sales list. Please contact administrator.',
                'code' => 'MEMORY_ERROR',
                'http_code' => 507
            ];
        }

        // Default error
        return [
            'message' => 'An unexpected error occurred while fetching sales list. Please try again.',
            'code' => 'SALES_FETCH_ERROR',
            'http_code' => 500
        ];
    }

    /**
     * Generate cache key for customer data
     * 
     * @param Request $request
     * @param string $userId
     * @param string $userRole
     * @return string
     */
    private function generateCustomerCacheKey(Request $request, string $userId, string $userRole): string
    {
        $keyParts = [
            'customers',
            $userId,
            $userRole,
            $request->input('group', 'all'),
            $request->input('search', ''),
            $request->input('date_start', ''),
            $request->input('date_end', ''),
            $request->input('page', 1),
            $request->input('per_page', 30),
            implode(',', $this->extractArrayParameterEnhanced($request, 'sales_name')),
            implode(',', $this->extractArrayParameterEnhanced($request, 'channel')),
            $request->input('recall_min', ''),
            $request->input('recall_max', '')
        ];

        return 'customer_index_' . md5(implode('_', array_filter($keyParts)));
    }

    /**
     * Check if request should use cache
     * 
     * @param Request $request
     * @return bool
     */
    private function shouldUseCache(Request $request): bool
    {
        // Don't cache for real-time operations
        if ($request->has('real_time') && $request->real_time) {
            return false;
        }

        // Don't cache for admin users to ensure fresh data
        $user = User::where('user_id', $request->user)->first();
        if ($user && $user->role === 'admin') {
            return false;
        }

        // Don't cache for searches (dynamic content)
        if ($request->has('search') && !empty($request->search)) {
            return false;
        }

        // Cache only for standard pagination requests
        $perPage = $request->input('per_page', 30);
        return $perPage <= 100;
    }

    /**
     * Log performance metrics for optimization analysis
     * 
     * @param array $metrics
     * @return void
     */
    private function logPerformanceMetrics(array $metrics): void
    {
        // Log performance warnings for slow queries
        if ($metrics['execution_time'] > 5.0) {
            Log::warning('Slow customer query detected', [
                'execution_time' => $metrics['execution_time'],
                'memory_used' => $metrics['memory_used'],
                'query_parameters' => $metrics['query_parameters'] ?? [],
                'optimization_suggestion' => 'Consider adding database indexes or implementing caching'
            ]);
        }

        // Log memory usage warnings
        if ($metrics['memory_used'] > 50 * 1024 * 1024) { // 50MB
            Log::warning('High memory usage in customer query', [
                'memory_used' => round($metrics['memory_used'] / 1024 / 1024, 2) . 'MB',
                'peak_memory' => round(memory_get_peak_usage(true) / 1024 / 1024, 2) . 'MB',
                'optimization_suggestion' => 'Consider implementing result streaming or pagination'
            ]);
        }

        // Weekly performance summary (you could implement this with a scheduled job)
        if (rand(1, 1000) === 1) { // 0.1% chance to log summary
            Log::info('Customer controller performance summary trigger', [
                'note' => 'Implement weekly performance analysis job',
                'metrics_to_track' => [
                    'average_response_time',
                    'peak_memory_usage',
                    'most_common_queries',
                    'slowest_queries'
                ]
            ]);
        }
    }

    /**
     * Validate request for performance optimization
     * 
     * @param Request $request
     * @return array
     */
    private function validatePerformanceParameters(Request $request): array
    {
        $issues = [];

        // Check for potentially expensive operations
        $perPage = $request->input('per_page', 30);
        if ($perPage > 1000) {
            $issues[] = [
                'type' => 'performance_warning',
                'message' => 'Large page size may impact performance',
                'suggestion' => 'Consider using smaller page sizes with pagination'
            ];
        }

        // Check for broad date ranges
        if ($request->has('date_start') && $request->has('date_end')) {
            $startDate = new \DateTime($request->date_start);
            $endDate = new \DateTime($request->date_end);
            $daysDiff = $endDate->diff($startDate)->days;

            if ($daysDiff > 365) {
                $issues[] = [
                    'type' => 'performance_warning',
                    'message' => 'Large date range may impact performance',
                    'suggestion' => 'Consider narrowing the date range for better performance'
                ];
            }
        }

        // Check for complex filtering combinations
        $filterCount = 0;
        $filters = ['search', 'sales_name', 'channel', 'recall_min', 'recall_max'];
        foreach ($filters as $filter) {
            if ($request->has($filter) && !empty($request->input($filter))) {
                $filterCount++;
            }
        }

        if ($filterCount > 3) {
            $issues[] = [
                'type' => 'performance_info',
                'message' => 'Multiple filters applied',
                'suggestion' => 'Consider using saved searches for frequently used filter combinations'
            ];
        }

        return $issues;
    }

    /**
     * Test enhanced validation methods (for development/testing purposes)
     * This method can be called via a route during development to validate all enhancements
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function testValidationEnhancements(Request $request)
    {
        if (app()->environment() !== 'local') {
            return response()->json([
                'status' => 'error', 
                'message' => 'Test endpoints only available in local environment'
            ], 403);
        }

        $testResults = [];

        // Test 1: Array parameter extraction
        $testResults['array_parameter_extraction'] = [
            'test_name' => 'Enhanced Array Parameter Extraction',
            'results' => []
        ];

        $testCases = [
            ['sales_name' => ['John', 'Jane']],
            ['sales_name' => 'John,Jane'],
            ['sales_name' => '["John", "Jane"]'],
            ['sales_name' => 'John'],
            ['channel' => [1, 2, 3]],
            ['channel' => '1,2,3'],
            ['channel' => '[1,2,3]']
        ];

        foreach ($testCases as $index => $testCase) {
            $testRequest = new Request($testCase);
            foreach ($testCase as $key => $value) {
                $extracted = $this->extractArrayParameterEnhanced($testRequest, $key);
                $testResults['array_parameter_extraction']['results'][] = [
                    'test_case' => $index + 1,
                    'input' => $value,
                    'parameter' => $key,
                    'extracted' => $extracted,
                    'status' => is_array($extracted) ? 'success' : 'failed'
                ];
            }
        }

        // Test 2: SQL Injection Detection
        $testResults['sql_injection_detection'] = [
            'test_name' => 'SQL Injection Pattern Detection',
            'results' => []
        ];

        $sqlTestCases = [
            'normal text' => false,
            'SELECT * FROM users' => true,
            '; DROP TABLE users;' => true,
            'UNION SELECT password' => true,
            "' OR '1'='1" => true,
            'legitimate search term' => false,
            '<script>alert("xss")</script>' => false // This should be handled by XSS protection
        ];

        foreach ($sqlTestCases as $input => $expectedResult) {
            $result = $this->containsSqlInjectionPatterns($input);
            $testResults['sql_injection_detection']['results'][] = [
                'input' => $input,
                'expected' => $expectedResult,
                'actual' => $result,
                'status' => ($result === $expectedResult) ? 'pass' : 'fail'
            ];
        }

        // Test 3: Input Sanitization
        $testResults['input_sanitization'] = [
            'test_name' => 'Input Sanitization Test',
            'results' => []
        ];

        $sanitizationTestCases = [
            'normal text' => 'normal text',
            '<script>alert("xss")</script>' => 'alert("xss")',
            'Text with "quotes"' => 'Text with "quotes"',
            'Text with <b>tags</b>' => 'Text with tags',
        ];

        foreach ($sanitizationTestCases as $input => $expected) {
            $sanitized = strip_tags(trim($input));
            $testResults['input_sanitization']['results'][] = [
                'input' => $input,
                'expected' => $expected,
                'actual' => $sanitized,
                'status' => ($sanitized === $expected) ? 'pass' : 'fail'
            ];
        }

        // Test 4: Validation Methods
        $testResults['validation_methods'] = [
            'test_name' => 'Validation Helper Methods',
            'results' => []
        ];

        $validationTests = [
            'uuid_validation' => [
                ['550e8400-e29b-41d4-a716-446655440000', true],
                ['invalid-uuid', false],
                ['', false]
            ],
            'date_validation' => [
                ['2024-01-01', true],
                ['invalid-date', false],
                ['2024-13-45', false]
            ],
            'json_validation' => [
                ['{"key": "value"}', true],
                ['[1,2,3]', true],
                ['invalid json', false],
                ['', false]
            ]
        ];

        foreach ($validationTests as $testType => $tests) {
            foreach ($tests as $test) {
                [$input, $expected] = $test;
                
                switch ($testType) {
                    case 'uuid_validation':
                        $result = $this->isValidUuid($input);
                        break;
                    case 'date_validation':
                        $result = $this->isValidDate($input);
                        break;
                    case 'json_validation':
                        $result = $this->isJsonString($input);
                        break;
                    default:
                        $result = false;
                }

                $testResults['validation_methods']['results'][] = [
                    'type' => $testType,
                    'input' => $input,
                    'expected' => $expected,
                    'actual' => $result,
                    'status' => ($result === $expected) ? 'pass' : 'fail'
                ];
            }
        }

        // Calculate overall test results
        $totalTests = 0;
        $passedTests = 0;
        
        foreach ($testResults as $category => $categoryData) {
            foreach ($categoryData['results'] as $result) {
                $totalTests++;
                if (isset($result['status']) && in_array($result['status'], ['pass', 'success'])) {
                    $passedTests++;
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Validation enhancement tests completed',
            'summary' => [
                'total_tests' => $totalTests,
                'passed_tests' => $passedTests,
                'failed_tests' => $totalTests - $passedTests,
                'success_rate' => round(($passedTests / $totalTests) * 100, 2) . '%'
            ],
            'detailed_results' => $testResults,
            'timestamp' => now()->toISOString()
        ]);
    }
}
