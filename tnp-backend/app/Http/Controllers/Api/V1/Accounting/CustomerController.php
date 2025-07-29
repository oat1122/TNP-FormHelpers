<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Accounting\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class CustomerController extends Controller
{
    /**
     * Get list of customers
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Customer::query();

            // Search functionality
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('cus_firstname', 'like', "%{$search}%")
                      ->orWhere('cus_lastname', 'like', "%{$search}%")
                      ->orWhere('cus_company', 'like', "%{$search}%")
                      ->orWhere('cus_no', 'like', "%{$search}%")
                      ->orWhere('cus_email', 'like', "%{$search}%");
                });
            }

            // Filter by active status
            if ($request->has('is_active')) {
                $query->where('cus_is_use', $request->boolean('is_active'));
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'cus_created_date');
            $sortDirection = $request->get('sort_direction', 'desc');
            $query->orderBy($sortBy, $sortDirection);

            $customers = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'message' => 'Customers retrieved successfully',
                'data' => $customers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new customer
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'cus_no' => 'nullable|string|max:50|unique:master_customers,cus_no',
                'cus_firstname' => 'required|string|max:255',
                'cus_lastname' => 'nullable|string|max:255',
                'cus_company' => 'nullable|string|max:255',
                'cus_tax_id' => 'nullable|string|max:20|unique:master_customers,cus_tax_id',
                'cus_address' => 'nullable|string',
                'cus_tel_1' => 'nullable|string|max:20',
                'cus_tel_2' => 'nullable|string|max:20',
                'cus_email' => 'nullable|email|max:255|unique:master_customers,cus_email',
                'cus_name' => 'nullable|string|max:255',
                'cus_depart' => 'nullable|string|max:255',
                'cus_pro_id' => 'nullable|string',
                'cus_dis_id' => 'nullable|string',
                'cus_sub_id' => 'nullable|string',
                'cus_zip_code' => 'nullable|string|max:10',
                'cus_manage_by' => 'nullable|integer',
                'cus_is_use' => 'boolean'
            ]);

            // Generate customer code if not provided
            if (empty($validatedData['cus_no'])) {
                $validatedData['cus_no'] = $this->generateCustomerCode();
            }

            // Set timestamps
            $validatedData['cus_created_date'] = now();
            $validatedData['cus_created_by'] = auth()->id() ?? 1;
            $validatedData['cus_id'] = \Illuminate\Support\Str::uuid();

            $customer = Customer::create($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Customer created successfully',
                'data' => $customer
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer by ID
     */
    public function show(string $id): JsonResponse
    {
        try {
            $customer = Customer::with(['quotations', 'invoices'])->find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Customer retrieved successfully',
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update customer
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $customer = Customer::find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            $validatedData = $request->validate([
                'cus_no' => 'sometimes|string|max:50|unique:master_customers,cus_no,' . $id,
                'cus_firstname' => 'sometimes|required|string|max:255',
                'cus_lastname' => 'nullable|string|max:255',
                'cus_company' => 'nullable|string|max:255',
                'cus_tax_id' => 'nullable|string|max:20|unique:master_customers,cus_tax_id,' . $id,
                'cus_address' => 'nullable|string',
                'cus_tel_1' => 'nullable|string|max:20',
                'cus_tel_2' => 'nullable|string|max:20',
                'cus_email' => 'nullable|email|max:255|unique:master_customers,cus_email,' . $id,
                'cus_name' => 'nullable|string|max:255',
                'cus_depart' => 'nullable|string|max:255',
                'cus_pro_id' => 'nullable|string',
                'cus_dis_id' => 'nullable|string',
                'cus_sub_id' => 'nullable|string',
                'cus_zip_code' => 'nullable|string|max:10',
                'cus_manage_by' => 'nullable|integer',
                'cus_is_use' => 'boolean'
            ]);

            // Set update timestamp
            $validatedData['cus_updated_date'] = now();
            $validatedData['cus_updated_by'] = auth()->id() ?? 1;

            $customer->update($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Customer updated successfully',
                'data' => $customer
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete customer (soft delete)
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $customer = Customer::find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            // Check if customer has related documents
            $hasQuotations = $customer->quotations()->exists();
            $hasInvoices = $customer->invoices()->exists();

            if ($hasQuotations || $hasInvoices) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete customer with existing quotations or invoices'
                ], 422);
            }

            $customer->delete();

            return response()->json([
                'success' => true,
                'message' => 'Customer deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer summary (total quotations, invoices, etc.)
     */
    public function getSummary(string $id): JsonResponse
    {
        try {
            $customer = Customer::with([
                'quotations' => function ($query) {
                    $query->selectRaw('customer_id, count(*) as total_quotations, sum(total_amount) as total_quotation_amount')
                          ->groupBy('customer_id');
                },
                'invoices' => function ($query) {
                    $query->selectRaw('customer_id, count(*) as total_invoices, sum(total_amount) as total_invoice_amount, sum(remaining_amount) as outstanding_amount')
                          ->groupBy('customer_id');
                }
            ])->find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Customer summary retrieved successfully',
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customer summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate unique customer code
     */
    private function generateCustomerCode(): string
    {
        $prefix = 'CUS';
        $date = now()->format('y');
        
        $lastCustomer = Customer::where('cus_no', 'like', "{$prefix}{$date}%")
                               ->orderBy('cus_no', 'desc')
                               ->first();
        
        if ($lastCustomer) {
            $lastNumber = intval(substr($lastCustomer->cus_no, -4));
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }
        
        return "{$prefix}{$date}{$newNumber}";
    }
}
