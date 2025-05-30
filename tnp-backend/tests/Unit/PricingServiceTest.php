<?php

namespace Tests\Unit;

use App\Models\PricingRequest;
use Tests\TestCase;
use DateTime;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Services\PricingService;

class PricingServiceTest extends TestCase
{
    use DatabaseTransactions; // Rollback (ยกเลิก) การเปลี่ยนแปลงฐานข้อมูล หลังจากการทดสอบแต่ละครั้ง

    protected $pricingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pricingService = new PricingService();

        // try {
        //     DB::connection()->getPdo();
        //     echo "Database connection successful!\n";
        // } catch (\Exception $e) {
        //     echo "Database connection failed: " . $e->getMessage() . "\n";
        //     $this->markTestSkipped('Database connection failed.');
        // }
    }

    public function testGeneratePricingNoWithExistingData()
    {
        // ไม่มีข้อมูลในฐานข้อมูล
        $result = $this->pricingService->generatePricingNo();
        $year = (new DateTime())->format('Y');
        $month = (new DateTime())->format('m');
        $this->assertEquals('P' . $year . '-' . $month . '-0001', $result);
    }

    public function testGeneratePricingWithExistingData()
    {
        PricingRequest::create([
            'pr_no' => 'P2025-02-0004',
            'pr_created_date' => now(),
        ]);


        // ไม่มีข้อมูลในฐานข้อมูล
        $result = $this->pricingService->generatePricingNo();
        $year = (new DateTime())->format('Y');
        $month = (new DateTime())->format('m');
        $this->assertEquals('P' . $year . '-' . $month . '-0005', $result);
    }
}
