<?php

namespace App\Traits;

use Illuminate\Contracts\Validation\Validator;

/**
 * Trait QuotationItemRules
 * 
 * Provides reusable validation rules for quotation items
 * Shared across StoreQuotationRequest, UpdateQuotationRequest, and CreateStandaloneQuotationRequest
 */
trait QuotationItemRules
{
    /**
     * Get common quotation item validation rules
     * 
     * @return array
     */
    public static function itemRules(): array
    {
        return [
            'items' => 'nullable|array',
            'items.*.pricing_request_id' => 'nullable|string|exists:pricing_requests,pr_id',
            'items.*.item_name' => 'required_with:items|string|max:255',
            'items.*.item_description' => 'nullable|string',
            'items.*.pattern' => 'nullable|string|max:255',
            'items.*.fabric_type' => 'nullable|string|max:255',
            'items.*.color' => 'nullable|string|max:255',
            'items.*.size' => 'nullable|string|max:255',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
            'items.*.quantity' => 'required_with:items|integer|min:0',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string',
            'items.*.sequence_order' => 'nullable|integer|min:1',
        ];
    }

    /**
     * Add custom validation for duplicate sequence orders
     * Call this in the withValidator method of your FormRequest
     * 
     * This method AUTO-NORMALIZES sequence orders instead of rejecting them.
     * This prevents false positives when duplicating quotations.
     * 
     * @param Validator $validator
     * @return void
     */
    public static function validateUniqueSequenceOrder(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $data = $validator->getData();
            $items = $data['items'] ?? [];
            
            if (!is_array($items) || empty($items)) {
                return;
            }

            // ✅ DEFENSE-IN-DEPTH: Auto-normalize sequence orders during validation
            // This prevents false positives from frontend sending duplicate sequences
            $normalizedItems = [];
            $seqSeen = [];
            $needsNormalization = false;
            
            foreach ($items as $index => $item) {
                // Calculate normalized sequence
                $originalSeq = $item['sequence_order'] ?? ($index + 1);
                $seq = intval($originalSeq);
                
                // Auto-correct duplicates by bumping to next available
                if (isset($seqSeen[$seq])) {
                    $needsNormalization = true;
                    while (isset($seqSeen[$seq])) {
                        $seq++;
                    }
                }
                $seqSeen[$seq] = true;
                
                // Update the item with normalized sequence
                $item['sequence_order'] = $seq;
                $normalizedItems[] = $item;
            }
            
            // Only update if normalization was needed
            if ($needsNormalization) {
                // Replace the items array with normalized version
                $data['items'] = $normalizedItems;
                $validator->setData($data);
                
                \Illuminate\Support\Facades\Log::info('Validator auto-normalized duplicate sequences', [
                    'original_count' => count($items),
                    'normalized_sequences' => array_keys($seqSeen)
                ]);
            }
        });
    }

    /**
     * Merge item rules with base rules
     * 
     * @param array $baseRules Base validation rules
     * @return array Merged rules
     */
    public static function mergeItemRules(array $baseRules): array
    {
        return array_merge($baseRules, static::itemRules());
    }
}
