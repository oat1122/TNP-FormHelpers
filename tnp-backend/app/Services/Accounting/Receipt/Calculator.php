<?php

namespace App\Services\Accounting\Receipt;

use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Services\Support\DocumentNumberService;

/**
 * Pure calculations + data shape helpers for Receipt.
 *
 * No DB mutations except `assignTaxInvoiceNumberIfNeeded()` which sets a column
 * on the in-memory Receipt model (caller is responsible for save()).
 */
class Calculator
{
    public const RECEIPT_TYPES_WITH_VAT = ['tax_invoice', 'full_tax_invoice'];

    public const VALID_RECEIPT_TYPES = ['receipt', 'tax_invoice', 'full_tax_invoice'];

    public function __construct(
        private DocumentNumberService $documentNumberService,
    ) {}

    /**
     * Resolve canonical receipt type from input, defaulting based on the
     * linked invoice's customer tax-id when no explicit type is supplied.
     *
     * @param  array<string, mixed>  $data
     */
    public function resolveReceiptType(array $data, ?Invoice $invoice = null): string
    {
        $type = $data['type'] ?? ($data['receipt_type'] ?? null);

        if (in_array($type, self::VALID_RECEIPT_TYPES, true)) {
            return $type;
        }

        if ($invoice && $invoice->customer_tax_id && strlen($invoice->customer_tax_id) === 13) {
            return 'tax_invoice';
        }

        return 'receipt';
    }

    /**
     * Convenience for the createFromPayment flow which always has the invoice.
     *
     * @param  array<string, mixed>  $paymentData
     */
    public function determineReceiptType(Invoice $invoice, array $paymentData): string
    {
        return $this->resolveReceiptType($paymentData, $invoice);
    }

    /**
     * Resolve total amount across legacy aliases (total_amount/payment_amount/amount).
     *
     * @param  array<string, mixed>  $data
     */
    public function resolveTotalAmount(array $data): float
    {
        return (float) ($data['total_amount'] ?? ($data['payment_amount'] ?? ($data['amount'] ?? 0)));
    }

    /**
     * Compute subtotal + tax breakdown from a VAT-inclusive total.
     * For non-VAT receipts the breakdown is zero-tax.
     *
     * @return array{subtotal: float, vat_rate: float, vat_amount: float, tax_amount: float}
     */
    public function calculateReceiptAmounts(float $totalAmount, string $receiptType): array
    {
        if (in_array($receiptType, self::RECEIPT_TYPES_WITH_VAT, true)) {
            $vatRate = (float) config('accounting.vat_rate', 0.07);
            $subtotal = $totalAmount / (1 + $vatRate);
            $taxAmount = $totalAmount - $subtotal;

            return [
                'subtotal' => round($subtotal, 2),
                'vat_rate' => $vatRate,
                'vat_amount' => round($taxAmount, 2),
                'tax_amount' => round($taxAmount, 2),
            ];
        }

        return [
            'subtotal' => $totalAmount,
            'vat_rate' => 0.0,
            'vat_amount' => 0.0,
            'tax_amount' => 0.0,
        ];
    }

    /**
     * Filter input down to columns the receipts table actually persists.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function copyReceiptColumns(array $data, bool $includeImmutableColumns = true): array
    {
        $columns = [
            'customer_id',
            'customer_company',
            'customer_tax_id',
            'customer_address',
            'customer_zip_code',
            'customer_tel_1',
            'customer_email',
            'customer_firstname',
            'customer_lastname',
            'work_name',
            'quantity',
            'payment_method',
            'tax_invoice_number',
            'notes',
        ];

        if ($includeImmutableColumns) {
            array_unshift($columns, 'company_id', 'invoice_id');
        }

        $payload = [];
        foreach ($columns as $column) {
            if (array_key_exists($column, $data)) {
                $payload[$column] = $data[$column];
            }
        }

        return $payload;
    }

    /**
     * Assign a fresh tax-invoice number when the receipt is a VAT type and
     * does not have one yet. Mutates the model in memory; caller must save.
     */
    public function assignTaxInvoiceNumberIfNeeded(Receipt $receipt): void
    {
        if (in_array($receipt->type, self::RECEIPT_TYPES_WITH_VAT, true) && empty($receipt->tax_invoice_number)) {
            $receipt->tax_invoice_number = $this->documentNumberService
                ->next($receipt->company_id, 'tax_invoice');
        }
    }
}
