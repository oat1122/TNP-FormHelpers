<?php

namespace Tests\Feature\Accounting;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Accounting\Customer;
use App\Models\Accounting\Product;
use App\Models\Accounting\Quotation;
use App\Services\Accounting\QuotationService;
use Laravel\Sanctum\Sanctum;

class QuotationServiceTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected QuotationService $quotationService;
    protected User $user;
    protected Customer $customer;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->quotationService = new QuotationService();
        
        // Create test user
        $this->user = User::factory()->create([
            'role' => 'sales'
        ]);
        
        // Create test customer
        $this->customer = Customer::factory()->create();
        
        // Create test product
        $this->product = Product::factory()->create();
        
        Sanctum::actingAs($this->user);
    }

    public function test_can_generate_quotation_number()
    {
        $quotationNo = $this->quotationService->generateQuotationNumber();
        
        $this->assertStringStartsWith('QT', $quotationNo);
        $this->assertStringContainsString(now()->format('Ym'), $quotationNo);
        $this->assertStringContainsString('-', $quotationNo);
    }

    public function test_can_create_quotation()
    {
        $data = [
            'customer_id' => $this->customer->id,
            'payment_terms' => 'Net 30',
            'deposit_amount' => 1000,
            'valid_until' => now()->addDays(30)->format('Y-m-d'),
            'remarks' => 'Test quotation',
            'tax_rate' => 7,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_name' => $this->product->name,
                    'description' => 'Test item',
                    'quantity' => 2,
                    'unit' => 'ชิ้น',
                    'unit_price' => 1000,
                    'discount_amount' => 100,
                    'notes' => 'Test item notes'
                ]
            ]
        ];

        $quotation = $this->quotationService->createQuotation($data);

        $this->assertInstanceOf(Quotation::class, $quotation);
        $this->assertEquals($this->customer->id, $quotation->customer_id);
        $this->assertEquals(Quotation::STATUS_DRAFT, $quotation->status);
        $this->assertEquals(1, $quotation->items->count());
        
        // Check calculations
        $expectedSubtotal = (2 * 1000) - 100; // 1900
        $expectedTax = $expectedSubtotal * 0.07; // 133
        $expectedTotal = $expectedSubtotal + $expectedTax; // 2033
        
        $this->assertEquals($expectedSubtotal, $quotation->subtotal);
        $this->assertEquals($expectedTax, $quotation->tax_amount);
        $this->assertEquals($expectedTotal, $quotation->total_amount);
    }

    public function test_can_update_quotation()
    {
        // Create quotation first
        $quotation = $this->quotationService->createQuotation([
            'customer_id' => $this->customer->id,
            'items' => [
                [
                    'product_name' => 'Test Product',
                    'quantity' => 1,
                    'unit_price' => 1000
                ]
            ]
        ]);

        // Update quotation
        $updateData = [
            'payment_terms' => 'Updated terms',
            'remarks' => 'Updated remarks',
            'items' => [
                [
                    'product_name' => 'Updated Product',
                    'quantity' => 2,
                    'unit_price' => 1500
                ]
            ]
        ];

        $updatedQuotation = $this->quotationService->updateQuotation($quotation, $updateData);

        $this->assertEquals('Updated terms', $updatedQuotation->payment_terms);
        $this->assertEquals('Updated remarks', $updatedQuotation->remarks);
        $this->assertEquals(2, $updatedQuotation->version_no);
        
        // Check item was updated
        $this->assertEquals(1, $updatedQuotation->items->count());
        $this->assertEquals('Updated Product', $updatedQuotation->items->first()->product_name);
        $this->assertEquals(2, $updatedQuotation->items->first()->quantity);
    }

    public function test_can_change_quotation_status()
    {
        $quotation = $this->quotationService->createQuotation([
            'customer_id' => $this->customer->id,
            'items' => [
                [
                    'product_name' => 'Test Product',
                    'quantity' => 1,
                    'unit_price' => 1000
                ]
            ]
        ]);

        // Change to pending review
        $updatedQuotation = $this->quotationService->changeStatus(
            $quotation, 
            Quotation::STATUS_PENDING_REVIEW,
            'Submitted for review'
        );

        $this->assertEquals(Quotation::STATUS_PENDING_REVIEW, $updatedQuotation->status);
        
        // Check status history was recorded
        $this->assertGreaterThan(0, $updatedQuotation->statusHistory->count());
    }

    public function test_cannot_edit_approved_quotation()
    {
        $quotation = $this->quotationService->createQuotation([
            'customer_id' => $this->customer->id,
            'items' => [
                [
                    'product_name' => 'Test Product',
                    'quantity' => 1,
                    'unit_price' => 1000
                ]
            ]
        ]);

        // Change to approved
        $quotation = $this->quotationService->changeStatus(
            $quotation, 
            Quotation::STATUS_APPROVED
        );

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Quotation cannot be edited in current status: approved');

        $this->quotationService->updateQuotation($quotation, [
            'remarks' => 'Should not be allowed'
        ]);
    }

    public function test_can_get_quotations_with_filters()
    {
        // Create multiple quotations
        $quotation1 = $this->quotationService->createQuotation([
            'customer_id' => $this->customer->id,
            'items' => [['product_name' => 'Product 1', 'quantity' => 1, 'unit_price' => 1000]]
        ]);

        $quotation2 = $this->quotationService->createQuotation([
            'customer_id' => $this->customer->id,
            'items' => [['product_name' => 'Product 2', 'quantity' => 1, 'unit_price' => 2000]]
        ]);

        // Approve one quotation
        $this->quotationService->changeStatus($quotation2, Quotation::STATUS_APPROVED);

        // Test filtering by status
        $draftQuotations = $this->quotationService->getQuotations(['status' => Quotation::STATUS_DRAFT]);
        $this->assertEquals(1, $draftQuotations->count());

        $approvedQuotations = $this->quotationService->getQuotations(['status' => Quotation::STATUS_APPROVED]);
        $this->assertEquals(1, $approvedQuotations->count());

        // Test filtering by customer
        $customerQuotations = $this->quotationService->getQuotations(['customer_id' => $this->customer->id]);
        $this->assertEquals(2, $customerQuotations->count());
    }
}
