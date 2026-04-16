<?php

namespace Tests\Unit\Accounting;

use App\Models\Accounting\Receipt;
use Carbon\Carbon;
use Tests\TestCase;

class ReceiptLegacySchemaCompatibilityTest extends TestCase
{
    public function test_receipt_model_does_not_mass_assign_missing_schema_columns(): void
    {
        $receipt = new Receipt();

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

    public function test_receipt_model_exposes_legacy_aliases_from_existing_columns(): void
    {
        $receipt = new Receipt([
            'type' => 'tax_invoice',
            'tax_amount' => 7,
            'total_amount' => 107,
        ]);
        $receipt->created_at = Carbon::parse('2026-04-16 09:30:00');

        $this->assertSame('tax_invoice', $receipt->receipt_type);
        $this->assertSame('2026-04-16', $receipt->payment_date);
        $this->assertSame(107.0, $receipt->payment_amount);
        $this->assertSame(0.07, $receipt->vat_rate);
        $this->assertSame(7.0, $receipt->vat_amount);

        $array = $receipt->toArray();
        $this->assertSame('tax_invoice', $array['receipt_type']);
        $this->assertSame('2026-04-16', $array['payment_date']);
        $this->assertSame(107.0, $array['payment_amount']);
        $this->assertSame(0.07, $array['vat_rate']);
        $this->assertSame(7.0, $array['vat_amount']);
    }
}
