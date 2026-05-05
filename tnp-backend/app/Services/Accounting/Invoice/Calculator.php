<?php

namespace App\Services\Accounting\Invoice;

use App\Models\Accounting\Invoice;

/**
 * Pure calculations + UI-state derivation for Invoice.
 *
 * No DB mutations: all methods either compute new values or read-only
 * project an Invoice instance into UI-friendly shape.
 */
class Calculator
{
    /**
     * Compute subtotal_before_vat / net_subtotal / deposit_amount_before_vat
     * given the raw form/payload values.
     *
     * @param  array<string, mixed>  $data
     * @return array{subtotal_before_vat: float, net_subtotal: float, deposit_amount_before_vat: float}
     */
    public function calculateBeforeVatFields(array $data): array
    {
        $subtotal = round(floatval($data['subtotal'] ?? 0), 2);
        $hasVat = $data['has_vat'] ?? true;
        $vatRate = $hasVat ? floatval($data['vat_percentage'] ?? 7) : 0;
        $pricingMode = $data['pricing_mode'] ?? 'net';

        // Calculate net_subtotal based on pricing_mode.
        $netSubtotal = $subtotal;
        if ($pricingMode === 'vat_included' && $hasVat && $vatRate > 0) {
            // Reverse calculation: extract VAT from VAT-included price.
            $vatMultiplier = 1 + ($vatRate / 100);
            $netSubtotal = round($subtotal / $vatMultiplier, 2);
        }

        // subtotal_before_vat = subtotal (by definition, subtotal is before VAT).
        $subtotalBeforeVat = $subtotal;

        // Calculate deposit_amount_before_vat.
        $depositMode = $data['deposit_mode'] ?? 'percentage';
        $depositPct = floatval($data['deposit_percentage'] ?? 0);
        $depositAmount = round(floatval($data['deposit_amount'] ?? 0), 2);

        if ($depositMode === 'percentage') {
            $depositBeforeVat = round($subtotalBeforeVat * ($depositPct / 100), 2);
        } else {
            // 'amount' mode — assume deposit_amount is supplied as before-VAT value.
            $depositBeforeVat = $depositAmount;
        }

        return [
            'subtotal_before_vat' => $subtotalBeforeVat,
            'net_subtotal' => $netSubtotal,
            'deposit_amount_before_vat' => $depositBeforeVat,
        ];
    }

    /**
     * Calculate due-date (string YYYY-MM-DD) from a payment_terms string like
     * "Net 30" or "30 days". Defaults to 30 days when no number is found.
     */
    public function calculateDueDate(string $paymentTerms): string
    {
        $days = 30;

        if (preg_match('/(\d+)/', $paymentTerms, $matches)) {
            $days = intval($matches[1]);
        }

        return now()->addDays($days)->format('Y-m-d');
    }

    /**
     * Build the items array used by the PDF body table, branching on $invoice->type.
     *
     * Replaces the inline @php block in invoice-master.blade.php (audit C2).
     * For 'deposit'/'remaining'/'partial' types this synthesises a single descriptive
     * line item; for any other type the caller's $items array is returned unchanged.
     *
     * @param  array<int, array<string, mixed>>  $items  Item array used for non-deposit types
     * @return array<int, array<string, mixed>>
     */
    public function buildPdfItemsForType(Invoice $invoice, array $items): array
    {
        $type = $invoice->type;
        $quotation = $invoice->quotation ?? null;

        if ($type === 'deposit' && $quotation) {
            return [$this->buildDepositLineItem($invoice, $quotation)];
        }

        if ($type === 'remaining' && $quotation) {
            return [$this->buildRemainingLineItem($invoice, $quotation)];
        }

        if ($type === 'partial' && $quotation) {
            return [$this->buildPartialLineItem($invoice, $quotation)];
        }

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildDepositLineItem(Invoice $invoice, $quotation): array
    {
        $description = 'รับมัดจำ';
        if (! empty($quotation->number)) {
            $description .= "\nอ้างอิงจากใบเสนอราคาเลขที่ ".$quotation->number;
            if (! empty($quotation->final_total_amount)) {
                $description .= "\nใบเสนอราคาดังกล่าวมีมูลค่า ".number_format($quotation->final_total_amount, 2).' บาท';
            }
        }

        // For percentage mode, base on pre-VAT amount; otherwise use the explicit deposit_amount.
        $depositMode = $invoice->deposit_mode ?? 'percentage';
        if ($depositMode === 'percentage') {
            $subtotal = (float) ($quotation->subtotal ?? 0);
            $special = (float) ($quotation->special_discount_amount ?? 0);
            $preVatBase = max(0, round($subtotal - $special, 2));
            if ($preVatBase <= 0) {
                $total = (float) ($quotation->total_amount ?? 0);
                $vat = (float) ($quotation->vat_amount ?? 0);
                $preVatBase = max(0, round($total - $vat - $special, 2));
            }
            $pct = max(0, min(100, (float) ($invoice->deposit_percentage ?? 0)));
            $amount = round($preVatBase * ($pct / 100), 2);
        } else {
            $amount = (float) ($invoice->deposit_amount ?? $invoice->final_total_amount ?? 0);
        }

        return [
            'description' => $description,
            'quantity' => 1,
            'unit' => 'รายการ',
            'unit_price' => $amount,
            'amount' => $amount,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildRemainingLineItem(Invoice $invoice, $quotation): array
    {
        $description = 'รับเงินส่วนที่เหลือ';
        if (! empty($quotation->number)) {
            $description .= "\nอ้างอิงจากใบเสนอราคาเลขที่ ".$quotation->number;
            if (! empty($quotation->final_total_amount)) {
                $description .= "\nใบเสนอราคามูลค่า ".number_format($quotation->final_total_amount, 2).' บาท';
            }
            if (! empty($invoice->paid_amount)) {
                $description .= "\nหักเงินมัดจำที่รับแล้ว ".number_format($invoice->paid_amount, 2).' บาท';
            }
        }

        return [
            'description' => $description,
            'quantity' => 1,
            'unit' => 'รายการ',
            'unit_price' => $invoice->final_total_amount,
            'amount' => $invoice->final_total_amount,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPartialLineItem(Invoice $invoice, $quotation): array
    {
        $description = 'รับชำระบางส่วน';
        if (! empty($quotation->number)) {
            $description .= "\nอ้างอิงจากใบเสนอราคาเลขที่ ".$quotation->number;
            if (! empty($quotation->final_total_amount)) {
                $description .= "\nใบเสนอราคามูลค่า ".number_format($quotation->final_total_amount, 2).' บาท';
            }
        }

        return [
            'description' => $description,
            'quantity' => 1,
            'unit' => 'รายการ',
            'unit_price' => $invoice->final_total_amount,
            'amount' => $invoice->final_total_amount,
        ];
    }

    /**
     * Project an Invoice into the array shape the UI expects, with extra
     * permission/state booleans for the deposit before/after sides.
     *
     * @return array<string, mixed>
     */
    public function getInvoiceWithUiStatus(Invoice $invoice): array
    {
        $data = $invoice->toArray();

        $data['ui_status'] = $invoice->ui_status;
        $data['can_submit_before'] = $invoice->canSubmitForSide('before');
        $data['can_approve_before'] = $invoice->canApproveForSide('before');
        $data['can_reject_before'] = $invoice->canRejectForSide('before');
        $data['can_submit_after'] = $invoice->canSubmitForSide('after');
        $data['can_approve_after'] = $invoice->canApproveForSide('after');
        $data['can_reject_after'] = $invoice->canRejectForSide('after');

        return $data;
    }
}
