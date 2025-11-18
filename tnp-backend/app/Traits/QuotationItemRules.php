<?php

namespace App\Traits;

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
