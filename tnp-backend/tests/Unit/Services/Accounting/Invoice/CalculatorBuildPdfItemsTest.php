<?php

namespace Tests\Unit\Services\Accounting\Invoice;

use App\Models\Accounting\Invoice;
use App\Services\Accounting\Invoice\Calculator;
use Mockery;
use Tests\TestCase;

/**
 * Unit tests for Calculator::buildPdfItemsForType() — extracted from inline @php
 * block in invoice-master.blade.php during audit C2 (accounting-pdf-views-2026-05-05).
 *
 * The behaviour matrix per $invoice->type:
 *   - deposit   → 1-row deposit description (percentage or fixed amount)
 *   - remaining → 1-row remaining-balance description
 *   - partial   → 1-row partial-payment description
 *   - other     → caller's $items returned unchanged
 *
 * For deposit/remaining/partial without a quotation relation, $items is returned
 * (degenerate guard).
 */
class CalculatorBuildPdfItemsTest extends TestCase
{
    private Calculator $calc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calc = new Calculator;
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    private function makeInvoice(array $attributes, ?object $quotation = null): Invoice
    {
        // Use new Invoice(...) without persisting — buildPdfItemsForType only reads
        // attributes + ->quotation relation, no DB.
        $invoice = new Invoice;
        foreach ($attributes as $key => $value) {
            $invoice->{$key} = $value;
        }
        if ($quotation !== null) {
            $invoice->setRelation('quotation', $quotation);
        }

        return $invoice;
    }

    public function test_other_type_returns_items_unchanged(): void
    {
        $items = [['description' => 'Foo', 'amount' => 100]];
        $invoice = $this->makeInvoice(['type' => 'normal']);

        $this->assertSame($items, $this->calc->buildPdfItemsForType($invoice, $items));
    }

    public function test_deposit_without_quotation_returns_items_unchanged(): void
    {
        $items = [['description' => 'Foo']];
        $invoice = $this->makeInvoice(['type' => 'deposit']);

        $this->assertSame($items, $this->calc->buildPdfItemsForType($invoice, $items));
    }

    public function test_deposit_percentage_uses_pre_vat_base(): void
    {
        // subtotal 1000, special discount 100, deposit 30% → 0.30 * (1000 - 100) = 270
        $quotation = (object) [
            'number' => 'QU-2026-0001',
            'subtotal' => 1000,
            'special_discount_amount' => 100,
            'final_total_amount' => 963,
        ];
        $invoice = $this->makeInvoice([
            'type' => 'deposit',
            'deposit_mode' => 'percentage',
            'deposit_percentage' => 30,
        ], $quotation);

        $result = $this->calc->buildPdfItemsForType($invoice, []);
        $this->assertCount(1, $result);
        $this->assertSame(270.0, $result[0]['amount']);
        $this->assertSame(270.0, $result[0]['unit_price']);
        $this->assertSame(1, $result[0]['quantity']);
        $this->assertStringContainsString('รับมัดจำ', $result[0]['description']);
        $this->assertStringContainsString('QU-2026-0001', $result[0]['description']);
    }

    public function test_deposit_percentage_falls_back_to_total_minus_vat_when_subtotal_zero(): void
    {
        // No subtotal but total 1070 / vat 70 → preVatBase = 1000, deposit 25% → 250
        $quotation = (object) [
            'number' => 'QU-2026-0002',
            'subtotal' => 0,
            'special_discount_amount' => 0,
            'total_amount' => 1070,
            'vat_amount' => 70,
            'final_total_amount' => 1070,
        ];
        $invoice = $this->makeInvoice([
            'type' => 'deposit',
            'deposit_mode' => 'percentage',
            'deposit_percentage' => 25,
        ], $quotation);

        $this->assertSame(250.0, $this->calc->buildPdfItemsForType($invoice, [])[0]['amount']);
    }

    public function test_deposit_amount_mode_uses_explicit_deposit_amount(): void
    {
        $invoice = $this->makeInvoice([
            'type' => 'deposit',
            'deposit_mode' => 'amount',
            'deposit_amount' => 555.55,
            'final_total_amount' => 999,
        ], (object) ['number' => 'QU-X']);

        $this->assertSame(555.55, $this->calc->buildPdfItemsForType($invoice, [])[0]['amount']);
    }

    public function test_deposit_percentage_clamps_above_100(): void
    {
        $quotation = (object) [
            'number' => 'QU-3',
            'subtotal' => 1000,
            'special_discount_amount' => 0,
            'final_total_amount' => 1000,
        ];
        $invoice = $this->makeInvoice([
            'type' => 'deposit',
            'deposit_mode' => 'percentage',
            'deposit_percentage' => 150, // clamped to 100
        ], $quotation);

        $this->assertSame(1000.0, $this->calc->buildPdfItemsForType($invoice, [])[0]['amount']);
    }

    public function test_remaining_uses_final_total_and_includes_paid_amount_in_description(): void
    {
        $quotation = (object) [
            'number' => 'QU-4',
            'final_total_amount' => 5000,
        ];
        $invoice = $this->makeInvoice([
            'type' => 'remaining',
            'final_total_amount' => 3500,
            'paid_amount' => 1500,
        ], $quotation);

        $result = $this->calc->buildPdfItemsForType($invoice, []);
        // final_total_amount is cast to decimal:2 — comes back as string '3500.00'
        $this->assertSame('3500.00', $result[0]['amount']);
        $this->assertStringContainsString('รับเงินส่วนที่เหลือ', $result[0]['description']);
        $this->assertStringContainsString('1,500.00', $result[0]['description']);
    }

    public function test_partial_uses_final_total_amount(): void
    {
        $quotation = (object) [
            'number' => 'QU-5',
            'final_total_amount' => 10000,
        ];
        $invoice = $this->makeInvoice([
            'type' => 'partial',
            'final_total_amount' => 2500,
        ], $quotation);

        $result = $this->calc->buildPdfItemsForType($invoice, []);
        $this->assertSame('2500.00', $result[0]['amount']);
        $this->assertStringContainsString('รับชำระบางส่วน', $result[0]['description']);
    }
}
