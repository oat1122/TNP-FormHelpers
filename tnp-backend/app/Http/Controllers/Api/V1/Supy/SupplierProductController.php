<?php

namespace App\Http\Controllers\Api\V1\Supy;

use App\Http\Controllers\Controller;
use App\Models\Supy\SupplierProduct;
use App\Models\Supy\SupplierProductImage;
use App\Models\Supy\SupplierProductTag;
use App\Models\Supy\SupplierProductTagRelation;
use App\Models\Supy\SupplierPriceTier;
use App\Models\Supy\SupplierProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class SupplierProductController extends Controller
{
    /**
     * List products with filters, search, pagination
     */
    public function index(Request $request)
    {
        try {
            $query = SupplierProduct::with(['category', 'images', 'tags', 'priceTiers', 'createdByUser'])
                ->where('sp_is_deleted', false);

            // Search by name or SKU
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('sp_name', 'like', "%{$search}%")
                      ->orWhere('sp_sku', 'like', "%{$search}%")
                      ->orWhere('sp_supplier_name', 'like', "%{$search}%");
                });
            }

            // Filter by category
            if ($request->filled('category')) {
                $query->where('sp_spc_id', $request->category);
            }

            // Filter by tags
            if ($request->filled('tags')) {
                $tagIds = is_array($request->tags) ? $request->tags : explode(',', $request->tags);
                $query->whereHas('tags', function ($q) use ($tagIds) {
                    $q->whereIn('supplier_product_tags.spt_id', $tagIds);
                });
            }

            // Filter by price range (THB)
            if ($request->filled('min_price')) {
                $query->where('sp_price_thb', '>=', $request->min_price);
            }
            if ($request->filled('max_price')) {
                $query->where('sp_price_thb', '<=', $request->max_price);
            }

            // Filter by origin country (from Seller)
            if ($request->filled('country')) {
                $query->whereHas('seller', function ($q) use ($request) {
                    $q->where('ss_country', $request->country);
                });
            }

            // Filter by currency
            if ($request->filled('currency')) {
                $query->where('sp_currency', $request->currency);
            }

            // Filter by active status
            if ($request->filled('is_active')) {
                $query->where('sp_is_active', $request->is_active);
            }

            // Sorting
            $sortField = $request->get('sort_by', 'created_at');
            $sortDir = $request->get('sort_dir', 'desc');
            $allowedSorts = ['sp_name', 'sp_base_price', 'sp_price_thb', 'created_at', 'sp_sku'];
            if (in_array($sortField, $allowedSorts)) {
                $query->orderBy($sortField, $sortDir);
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Pagination
            $perPage = $request->get('per_page', 20);
            $products = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $products->items(),
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierProduct index error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }



    /**
     * Store a new product
     */
    public function store(Request $request)
    {
        $request->validate([
            'sp_name' => 'required|string|max:255',
            'sp_base_price' => 'required|numeric|min:0',
            'sp_spc_id' => 'required|exists:supplier_product_categories,spc_id',
        ]);

        try {
            DB::beginTransaction();

            $user = $request->user();
            $productId = Str::uuid()->toString();

            // Generate SKU
            $category = SupplierProductCategory::findOrFail($request->sp_spc_id);
            $prefix = $category->spc_sku_prefix; // e.g. "TNP"
            $ym = now()->format('Ym'); // e.g. "202402"
            $skuPrefix = "{$prefix}-{$ym}-"; // "TNP-202402-"

            // Find last running number for this prefix + month
            $lastProduct = SupplierProduct::where('sp_sku', 'like', "{$skuPrefix}%")
                ->orderByRaw('LENGTH(sp_sku) DESC') // Make sure to get longest string if length varies
                ->orderBy('sp_sku', 'desc')
                ->first();

            $nextNum = 1;
            if ($lastProduct && preg_match('/-(\d+)$/', $lastProduct->sp_sku, $matches)) {
                $nextNum = intval($matches[1]) + 1;
            }

            $sp_sku = $skuPrefix . str_pad($nextNum, 2, '0', STR_PAD_LEFT);

            // Create product
            $product = SupplierProduct::create([
                'sp_id' => $productId,
                'sp_mpc_id' => null, // Deprecated
                'sp_spc_id' => $request->sp_spc_id,
                'sp_ss_id' => $request->sp_ss_id,
                'sp_name' => $request->sp_name,
                'sp_description' => $request->sp_description,
                'sp_sku' => $sp_sku,
                'sp_origin_country' => $request->sp_origin_country,
                'sp_supplier_name' => $request->sp_supplier_name,
                'sp_supplier_contact' => $request->sp_supplier_contact,
                'sp_base_price' => $request->sp_base_price,
                'sp_currency' => $request->sp_currency ?? 'THB',
                'sp_price_thb' => $request->sp_price_thb,
                'sp_exchange_rate' => $request->sp_exchange_rate,
                'sp_exchange_date' => $request->sp_exchange_date,
                'sp_unit' => $request->sp_unit ?? 'ชิ้น',
                'sp_created_by' => $user?->user_uuid,
                'sp_updated_by' => $user?->user_uuid,
            ]);

            // Attach tags
            if ($request->filled('tag_ids')) {
                $tagIds = is_array($request->tag_ids) ? $request->tag_ids : explode(',', $request->tag_ids);
                foreach ($tagIds as $tagId) {
                    SupplierProductTagRelation::create([
                        'sptr_id' => Str::uuid()->toString(),
                        'sptr_sp_id' => $productId,
                        'sptr_spt_id' => $tagId,
                    ]);
                }
            }

            // Create price tiers
            if ($request->filled('price_tiers')) {
                foreach ($request->price_tiers as $index => $tier) {
                    SupplierPriceTier::create([
                        'sptier_id' => Str::uuid()->toString(),
                        'sptier_sp_id' => $productId,
                        'sptier_min_qty' => $tier['min_qty'],
                        'sptier_max_qty' => $tier['max_qty'] ?? null,
                        'sptier_price' => $tier['price'],
                        'sptier_is_auto' => $tier['is_auto'] ?? true,
                        'sptier_sort_order' => $index,
                    ]);
                }
            }

            DB::commit();

            $product->load(['category', 'images', 'tags', 'priceTiers', 'createdByUser']);

            return response()->json([
                'status' => 'success',
                'data' => $product,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('SupplierProduct store error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Show a single product
     */
    public function show($id)
    {
        try {
            $product = SupplierProduct::with(['category', 'images', 'tags', 'priceTiers', 'createdByUser', 'updatedByUser'])
                ->where('sp_is_deleted', false)
                ->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $product,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierProduct show error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Product not found'], 404);
        }
    }

    /**
     * Update a product
     */
    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $product = SupplierProduct::where('sp_is_deleted', false)->findOrFail($id);
            $user = $request->user();

            $product->update([
                'sp_spc_id' => $request->sp_spc_id ?? $product->sp_spc_id,
                'sp_ss_id' => $request->has('sp_ss_id') ? $request->sp_ss_id : $product->sp_ss_id,
                'sp_name' => $request->sp_name ?? $product->sp_name,
                'sp_description' => $request->sp_description ?? $product->sp_description,
                'sp_sku' => $request->sp_sku ?? $product->sp_sku,
                'sp_origin_country' => $request->sp_origin_country ?? $product->sp_origin_country,
                'sp_supplier_name' => $request->sp_supplier_name ?? $product->sp_supplier_name,
                'sp_supplier_contact' => $request->sp_supplier_contact ?? $product->sp_supplier_contact,
                'sp_base_price' => $request->sp_base_price ?? $product->sp_base_price,
                'sp_currency' => $request->sp_currency ?? $product->sp_currency,
                'sp_price_thb' => $request->sp_price_thb ?? $product->sp_price_thb,
                'sp_exchange_rate' => $request->sp_exchange_rate ?? $product->sp_exchange_rate,
                'sp_exchange_date' => $request->sp_exchange_date ?? $product->sp_exchange_date,
                'sp_unit' => $request->sp_unit ?? $product->sp_unit,
                'sp_updated_by' => $user?->user_uuid,
            ]);

            // Update tags if provided
            if ($request->has('tag_ids')) {
                // Remove old relations
                SupplierProductTagRelation::where('sptr_sp_id', $id)->delete();

                // Add new relations
                $tagIds = is_array($request->tag_ids) ? $request->tag_ids : explode(',', $request->tag_ids);
                foreach ($tagIds as $tagId) {
                    if (!empty($tagId)) {
                        SupplierProductTagRelation::create([
                            'sptr_id' => Str::uuid()->toString(),
                            'sptr_sp_id' => $id,
                            'sptr_spt_id' => $tagId,
                        ]);
                    }
                }
            }

            // Update price tiers if provided
            if ($request->has('price_tiers')) {
                // Remove old tiers
                SupplierPriceTier::where('sptier_sp_id', $id)->delete();

                // Add new tiers
                foreach ($request->price_tiers as $index => $tier) {
                    SupplierPriceTier::create([
                        'sptier_id' => Str::uuid()->toString(),
                        'sptier_sp_id' => $id,
                        'sptier_min_qty' => $tier['min_qty'],
                        'sptier_max_qty' => $tier['max_qty'] ?? null,
                        'sptier_price' => $tier['price'],
                        'sptier_is_auto' => $tier['is_auto'] ?? true,
                        'sptier_sort_order' => $index,
                    ]);
                }
            }

            DB::commit();

            $product->load(['category', 'images', 'tags', 'priceTiers', 'createdByUser', 'updatedByUser']);

            return response()->json([
                'status' => 'success',
                'data' => $product,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('SupplierProduct update error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Soft delete a product
     */
    public function destroy(Request $request, $id)
    {
        try {
            $product = SupplierProduct::where('sp_is_deleted', false)->findOrFail($id);
            $user = $request->user();

            $product->update([
                'sp_is_deleted' => true,
                'sp_updated_by' => $user?->user_uuid,
            ]);

            return response()->json(['status' => 'success', 'message' => 'Product deleted']);
        } catch (\Exception $e) {
            Log::error('SupplierProduct destroy error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Upload images for a product
     */
    public function uploadImages(Request $request, $id)
    {
        $request->validate([
            'images' => 'required',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        try {
            $product = SupplierProduct::where('sp_is_deleted', false)->findOrFail($id);
            $user = $request->user();
            $uploaded = [];

            $maxSort = SupplierProductImage::where('spi_sp_id', $id)->max('spi_sort_order') ?? 0;

            foreach ($request->file('images') as $index => $file) {
                $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('supplier-products/' . $id, $filename, 'public');

                $image = SupplierProductImage::create([
                    'spi_id' => Str::uuid()->toString(),
                    'spi_sp_id' => $id,
                    'spi_file_path' => $path,
                    'spi_original_name' => $file->getClientOriginalName(),
                    'spi_is_cover' => false,
                    'spi_sort_order' => $maxSort + $index + 1,
                    'spi_uploaded_by' => $user?->user_uuid,
                    'created_at' => now(),
                ]);

                $uploaded[] = $image;
            }

            // If this is the first image, set it as cover
            $totalImages = SupplierProductImage::where('spi_sp_id', $id)->count();
            if ($totalImages === count($uploaded)) {
                $first = $uploaded[0];
                $first->update(['spi_is_cover' => true]);
                $product->update(['sp_cover_image' => $first->spi_file_path]);
            }

            return response()->json([
                'status' => 'success',
                'data' => $uploaded,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierProduct uploadImages error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Set cover image
     */
    public function setCoverImage(Request $request, $id, $imageId)
    {
        try {
            $product = SupplierProduct::where('sp_is_deleted', false)->findOrFail($id);

            // Unset all covers for this product
            SupplierProductImage::where('spi_sp_id', $id)->update(['spi_is_cover' => false]);

            // Set new cover
            $image = SupplierProductImage::where('spi_sp_id', $id)->where('spi_id', $imageId)->firstOrFail();
            $image->update(['spi_is_cover' => true]);

            // Update product cover_image field
            $product->update(['sp_cover_image' => $image->spi_file_path]);

            return response()->json([
                'status' => 'success',
                'data' => $image,
            ]);
        } catch (\Exception $e) {
            Log::error('SupplierProduct setCoverImage error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete an image
     */
    public function deleteImage(Request $request, $id, $imageId)
    {
        try {
            $image = SupplierProductImage::where('spi_sp_id', $id)->where('spi_id', $imageId)->firstOrFail();

            $wasCover = $image->spi_is_cover;
            $filePath = $image->spi_file_path;

            $image->delete();

            // Delete file from storage
            if (\Storage::disk('public')->exists($filePath)) {
                \Storage::disk('public')->delete($filePath);
            }

            // If deleted image was cover, set the first remaining image as cover
            if ($wasCover) {
                $firstImage = SupplierProductImage::where('spi_sp_id', $id)
                    ->orderBy('spi_sort_order')
                    ->first();

                if ($firstImage) {
                    $firstImage->update(['spi_is_cover' => true]);
                    SupplierProduct::where('sp_id', $id)->update(['sp_cover_image' => $firstImage->spi_file_path]);
                } else {
                    SupplierProduct::where('sp_id', $id)->update(['sp_cover_image' => null]);
                }
            }

            return response()->json(['status' => 'success', 'message' => 'Image deleted']);
        } catch (\Exception $e) {
            Log::error('SupplierProduct deleteImage error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Convert currency using Frankfurter API
     */
    public function convertCurrency(Request $request)
    {
        $request->validate([
            'from' => 'required|string|size:3',
            'amount' => 'required|numeric|min:0',
        ]);

        $from = strtoupper($request->from);
        $amount = $request->amount;
        $to = 'THB';

        // If already THB, no conversion needed
        if ($from === 'THB') {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'from' => 'THB',
                    'to' => 'THB',
                    'amount' => $amount,
                    'rate' => 1.0,
                    'converted' => $amount,
                    'date' => now()->toDateString(),
                ],
            ]);
        }

        try {
            // Cache rate for 1 hour
            $cacheKey = "frankfurter_rate_{$from}_{$to}";
            $rateData = Cache::remember($cacheKey, 3600, function () use ($from, $to) {
                $response = Http::timeout(10)->get("https://api.frankfurter.app/latest", [
                    'from' => $from,
                    'to' => $to,
                ]);

                if (!$response->successful()) {
                    throw new \Exception('Frankfurter API error: ' . $response->status());
                }

                return $response->json();
            });

            $rate = $rateData['rates'][$to] ?? null;

            if (!$rate) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Cannot convert from {$from} to {$to}",
                ], 400);
            }

            $converted = round($amount * $rate, 2);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'from' => $from,
                    'to' => $to,
                    'amount' => $amount,
                    'rate' => $rate,
                    'converted' => $converted,
                    'date' => $rateData['date'] ?? now()->toDateString(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Currency conversion error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Currency conversion failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
