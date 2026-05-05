<?php

namespace Tests\Unit\Accounting;

use App\Models\Accounting\Receipt;
use Carbon\Carbon;
use Tests\TestCase;

class ReceiptLegacySchemaCompatibilityTest extends TestCase
{
    public function test_receipt_model_does_not_mass_assign_missing_schema_columns(): void
    {
        $receipt = new Receipt;

        $this->assertFalse($receipt->isFillable('receipt_type'));
        $this->assertFalse($receipt->isFillable('vat_amount'));
        $this->assertFalse($receipt->isFillable('payment_amount'));
        $this->assertFalse($receipt->isFillable('payment_date'));
        $this->assertFalse($receipt->isFillable('bank_name'));
        $this->assertFalse($receipt->isFillable('created_by'));
        $this->assertFalse($receipt->isFillable('updated_by'));
        $this->assertFalse($receipt->isFillable('submitted_by'));
        $this->assertFalse($receipt->isFillable('rejected_by'));
    }

    public function test_receipt_model_exposes_legacy_aliases_via_explicit_access(): void
    {
        $receipt = new Receipt([
            'type' => 'tax_invoice',
            'tax_amount' => 7,
            'total_amount' => 107,
        ]);
        $receipt->created_at = Carbon::parse('2026-04-16 09:30:00');

        // Legacy aliases still resolve via Attribute API accessors. m7.1 audit
        // removed them from $appends to avoid 5x over-fetch on every toArray()
        // call, but the accessors themselves remain so callers that read
        // `$receipt->receipt_type` etc. continue to work.
        $this->assertSame('tax_invoice', $receipt->receipt_type);
        $this->assertSame('2026-04-16', $receipt->payment_date);
        $this->assertSame(107.0, $receipt->payment_amount);
        $this->assertSame(0.07, $receipt->vat_rate);
        $this->assertSame(7.0, $receipt->vat_amount);
    }

    public function test_legacy_aliases_are_no_longer_auto_included_in_toarray(): void
    {
        $receipt = new Receipt([
            'type' => 'tax_invoice',
            'tax_amount' => 7,
            'total_amount' => 107,
        ]);

        $array = $receipt->toArray();

        // m7.1: $appends purged — consumers that need the legacy keys must
        // call ->append([...]) explicitly or read via the accessor property.
        $this->assertArrayNotHasKey('receipt_type', $array);
        $this->assertArrayNotHasKey('payment_date', $array);
        $this->assertArrayNotHasKey('payment_amount', $array);
        $this->assertArrayNotHasKey('vat_rate', $array);
        $this->assertArrayNotHasKey('vat_amount', $array);

        // Canonical keys remain available (decimal:2 cast renders as string).
        $this->assertSame('tax_invoice', $array['type']);
        $this->assertSame('7.00', $array['tax_amount']);
        $this->assertSame('107.00', $array['total_amount']);
    }
}
