<?php

return [

    /*
    |--------------------------------------------------------------------------
    | VAT Rate
    |--------------------------------------------------------------------------
    |
    | Default Thailand VAT rate used by Receipt and Invoice calculations.
    | Override via the ACCOUNTING_VAT_RATE env var if the rate changes
    | (e.g. temporary 7%→6.3% reductions issued by the Revenue Department).
    |
    | Stored as a decimal fraction: 0.07 = 7%.
    |
    */

    'vat_rate' => (float) env('ACCOUNTING_VAT_RATE', 0.07),

    /*
    |--------------------------------------------------------------------------
    | Strict receipt-driven payment guards (M3.2)
    |--------------------------------------------------------------------------
    |
    | When TRUE, `InvoiceService::applyReceiptPayment()` enforces:
    |   1. Invoice status must be in ['sent', 'partial_paid'] (parity with
    |      manual `recordPayment`)
    |   2. Payment amount + paid_amount must NOT exceed invoice total_amount
    |
    | When FALSE (default — preserves legacy behavior), violations are
    | logged at warning level but processing continues. Flip to TRUE in
    | staging to surface anomalies before enforcing in production.
    |
    | Why default false: production may contain legacy invoices in 'draft'
    | with linked approved receipts. Enabling guards there blocks receipt
    | approval until data audit + cleanup is done.
    |
    */

    'strict_receipt_payment_guards' => (bool) env('ACCOUNTING_STRICT_RECEIPT_PAYMENT_GUARDS', false),

];
