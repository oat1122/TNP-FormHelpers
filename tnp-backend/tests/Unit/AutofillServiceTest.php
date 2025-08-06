<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\Accounting\AutofillService;
use App\Models\PricingRequest;
use App\Models\MasterCustomer;
use App\Models\PricingRequestNote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

class AutofillServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $autofillService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->autofillService = new AutofillService();
    }

    /**
     * Test getting autofill data from pricing request
     */
    public function test_get_autofill_data_from_pricing_request()
    {
        // สร้าง Mock Data
        $customer = MasterCustomer::create([
            'cus_id' => 'cus-test-001',
            'cus_company' => 'Test Company Ltd.',
            'cus_tax_id' => '1234567890123',
            'cus_address' => '123 Test Street, Bangkok',
            'cus_zip_code' => '10110',
            'cus_tel_1' => '02-123-4567',
            'cus_email' => 'test@company.com',
            'cus_firstname' => 'John',
            'cus_lastname' => 'Doe',
            'cus_is_use' => true
        ]);

        $pricingRequest = PricingRequest::create([
            'pr_id' => 'pr-test-001',
            'pr_cus_id' => $customer->cus_id,
            'pr_work_name' => 'Test Work',
            'pr_pattern' => 'Test Pattern',
            'pr_fabric_type' => 'Cotton',
            'pr_color' => 'Blue',
            'pr_sizes' => 'S,M,L',
            'pr_quantity' => '100',
            'pr_due_date' => now()->addDays(30),
            'pr_is_deleted' => false,
            'pr_created_date' => now(),
            'pr_created_by' => 'user-test-001'
        ]);

        // Test the method
        $result = $this->autofillService->getAutofillDataFromPricingRequest($pricingRequest->pr_id);

        // Assert
        $this->assertIsArray($result);
        $this->assertEquals($pricingRequest->pr_id, $result['pr_id']);
        $this->assertEquals($pricingRequest->pr_work_name, $result['pr_work_name']);
        $this->assertEquals($customer->cus_company, $result['cus_company']);
        $this->assertEquals($customer->cus_tax_id, $result['cus_tax_id']);
    }

    /**
     * Test getting completed pricing requests with filters
     */
    public function test_get_completed_pricing_requests_with_filters()
    {
        // Create test data
        $customer = MasterCustomer::create([
            'cus_id' => 'cus-test-002',
            'cus_company' => 'Another Company Ltd.',
            'cus_is_use' => true
        ]);

        PricingRequest::create([
            'pr_id' => 'pr-test-002',
            'pr_cus_id' => $customer->cus_id,
            'pr_work_name' => 'Filterable Work',
            'pr_fabric_type' => 'Polyester',
            'pr_is_deleted' => false,
            'pr_created_date' => now()
        ]);

        // Test with filters
        $filters = [
            'search' => 'Filterable',
            'customer_id' => $customer->cus_id
        ];

        $result = $this->autofillService->getCompletedPricingRequests($filters, 10);

        // Assert
        $this->assertIsArray($result);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertCount(1, $result['data']);
    }

    /**
     * Test marking pricing request as used
     */
    public function test_mark_pricing_request_as_used()
    {
        // Create test data
        $customer = MasterCustomer::create([
            'cus_id' => 'cus-test-003',
            'cus_company' => 'Used Company Ltd.',
            'cus_is_use' => true
        ]);

        $pricingRequest = PricingRequest::create([
            'pr_id' => 'pr-test-003',
            'pr_cus_id' => $customer->cus_id,
            'pr_work_name' => 'Used Work',
            'pr_is_deleted' => false,
            'pr_created_date' => now()
        ]);

        // Test marking as used
        $result = $this->autofillService->markPricingRequestAsUsed($pricingRequest->pr_id, 'user-test-001');

        // Assert
        $this->assertIsArray($result);
        $this->assertEquals($pricingRequest->pr_id, $result['pr_id']);
        $this->assertArrayHasKey('marked_at', $result);
        $this->assertArrayHasKey('marked_by', $result);

        // Check if note was created
        $note = PricingRequestNote::where('prn_pr_id', $pricingRequest->pr_id)
            ->where('prn_text', 'ใช้สำหรับสร้างใบเสนอราคาแล้ว')
            ->first();
        
        $this->assertNotNull($note);
        $this->assertEquals(3, $note->prn_note_type); // manager note
    }
}
