<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Accounting\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    /**
     * Get list of products
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Product::query();

            // Search functionality
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('product_code', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Filter by category
            if ($request->has('category')) {
                $query->where('category', $request->get('category'));
            }

            // Filter by active status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // Filter by low stock
            if ($request->boolean('low_stock')) {
                $query->whereRaw('stock_quantity <= minimum_stock');
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortDirection = $request->get('sort_direction', 'desc');
            $query->orderBy($sortBy, $sortDirection);

            $products = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'message' => 'Products retrieved successfully',
                'data' => $products
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new product
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'product_code' => 'nullable|string|max:50|unique:products,product_code',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'unit' => 'required|string|max:20',
                'unit_price' => 'required|numeric|min:0',
                'cost_price' => 'nullable|numeric|min:0',
                'vat_rate' => 'nullable|numeric|min:0|max:100',
                'stock_quantity' => 'nullable|integer|min:0',
                'minimum_stock' => 'nullable|integer|min:0',
                'category' => 'nullable|string|max:100',
                'is_active' => 'boolean',
                'notes' => 'nullable|string'
            ]);

            // Generate product code if not provided
            if (empty($validatedData['product_code'])) {
                $validatedData['product_code'] = $this->generateProductCode();
            }

            // Set default VAT rate if not provided
            if (!isset($validatedData['vat_rate'])) {
                $validatedData['vat_rate'] = config('accounting.default_vat_rate', 7);
            }

            $product = Product::create($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully',
                'data' => $product
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
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get product by ID
     */
    public function show(string $id): JsonResponse
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Product retrieved successfully',
                'data' => $product
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update product
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            $validatedData = $request->validate([
                'product_code' => 'sometimes|string|max:50|unique:products,product_code,' . $id,
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'unit' => 'sometimes|required|string|max:20',
                'unit_price' => 'sometimes|required|numeric|min:0',
                'cost_price' => 'nullable|numeric|min:0',
                'vat_rate' => 'nullable|numeric|min:0|max:100',
                'stock_quantity' => 'nullable|integer|min:0',
                'minimum_stock' => 'nullable|integer|min:0',
                'category' => 'nullable|string|max:100',
                'is_active' => 'boolean',
                'notes' => 'nullable|string'
            ]);

            $product->update($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully',
                'data' => $product
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
                'message' => 'Failed to update product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete product (soft delete)
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            // Check if product is used in quotations or invoices
            $hasQuotationItems = $product->quotationItems()->exists();
            $hasInvoiceItems = $product->invoiceItems()->exists();

            if ($hasQuotationItems || $hasInvoiceItems) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete product that is used in quotations or invoices'
                ], 422);
            }

            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update product stock
     */
    public function updateStock(Request $request, string $id): JsonResponse
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            $validatedData = $request->validate([
                'stock_quantity' => 'required|integer|min:0',
                'notes' => 'nullable|string'
            ]);

            $oldStock = $product->stock_quantity;
            $product->update([
                'stock_quantity' => $validatedData['stock_quantity']
            ]);

            // Log stock change if needed
            // You can implement stock movement history here

            return response()->json([
                'success' => true,
                'message' => 'Product stock updated successfully',
                'data' => [
                    'product' => $product,
                    'old_stock' => $oldStock,
                    'new_stock' => $product->stock_quantity,
                    'difference' => $product->stock_quantity - $oldStock
                ]
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
                'message' => 'Failed to update product stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get low stock products
     */
    public function getLowStock(): JsonResponse
    {
        try {
            $products = Product::whereRaw('stock_quantity <= minimum_stock')
                              ->where('is_active', true)
                              ->orderBy('stock_quantity', 'asc')
                              ->get();

            return response()->json([
                'success' => true,
                'message' => 'Low stock products retrieved successfully',
                'data' => $products
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve low stock products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get product categories
     */
    public function getCategories(): JsonResponse
    {
        try {
            $categories = Product::whereNotNull('category')
                                ->where('category', '!=', '')
                                ->distinct()
                                ->pluck('category')
                                ->sort()
                                ->values();

            return response()->json([
                'success' => true,
                'message' => 'Product categories retrieved successfully',
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve product categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate unique product code
     */
    private function generateProductCode(): string
    {
        $prefix = 'PRD';
        $date = now()->format('y');
        
        $lastProduct = Product::where('product_code', 'like', "{$prefix}{$date}%")
                             ->orderBy('product_code', 'desc')
                             ->first();
        
        if ($lastProduct) {
            $lastNumber = intval(substr($lastProduct->product_code, -4));
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }
        
        return "{$prefix}{$date}{$newNumber}";
    }
}
