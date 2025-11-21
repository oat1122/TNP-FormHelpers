<?php

namespace Tests\Unit\Services\Accounting;

use Tests\TestCase;
use App\Services\Accounting\QuotationService;
use App\Services\Accounting\Quotation\CreationService;
use App\Services\Accounting\Quotation\ManagementService;
use App\Services\Accounting\Quotation\StatusService;
use App\Services\Accounting\Quotation\MediaService;
use App\Services\Accounting\Quotation\PdfService;
use App\Services\Accounting\Quotation\SyncService;
use App\Services\Accounting\Quotation\Calculator;

class QuotationServiceTest extends TestCase
{
    public function test_service_instantiation_and_dependency_injection()
    {
        // Attempt to resolve the service from the container
        $service = app(QuotationService::class);

        // Assert that the service is an instance of QuotationService
        $this->assertInstanceOf(QuotationService::class, $service);

        // Use reflection to check if properties are populated (since they are protected)
        $reflection = new \ReflectionClass($service);
        
        $properties = [
            'creationService' => CreationService::class,
            'managementService' => ManagementService::class,
            'statusService' => StatusService::class,
            'mediaService' => MediaService::class,
            'pdfService' => PdfService::class,
            'syncService' => SyncService::class,
            'calculator' => Calculator::class,
        ];

        foreach ($properties as $property => $class) {
            $prop = $reflection->getProperty($property);
            $prop->setAccessible(true);
            $value = $prop->getValue($service);
            
            $this->assertInstanceOf($class, $value, "Property $property should be instance of $class");
        }
    }
}
