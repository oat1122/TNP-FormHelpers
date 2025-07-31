<?php

namespace App\Services\Accounting;

use App\Models\Accounting\Quotation;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Receipt;
use App\Models\Accounting\DeliveryNote;
use Illuminate\Support\Facades\DB;
use DateTime;

class DocumentNumberService
{
    /**
     * Generate document number based on document type
     *
     * @param string $type quotation, invoice, receipt, delivery_note
     * @param string|null $customPrefix Override the default prefix
     * @param string|null $customDateFormat Override the default date format
     * @return string Generated document number
     */
    public function generateNumber(string $type, ?string $customPrefix = null, ?string $customDateFormat = null): string
    {
        $config = config("accounting.document_formats.{$type}");
        
        if (!$config) {
            throw new \InvalidArgumentException("Unknown document type: {$type}");
        }
        
        $prefix = $customPrefix ?? $config['prefix'];
        $dateFormat = $customDateFormat ?? $config['date_format'];
        $numberLength = $config['number_length'];
        $separator = $config['separator'];
        
        $date = new DateTime();
        $dateStr = $date->format($dateFormat);
        $fullPrefix = $prefix . $dateStr;
        
        $model = $this->getModelForType($type);
        $columnName = $this->getColumnNameForType($type);
        
        $searchPattern = $prefix . $dateStr . $separator . '%';
        
        $maxId = $model::where($columnName, 'LIKE', $searchPattern)
            ->orderBy('created_at', 'desc')
            ->max(DB::raw("CAST(SUBSTRING({$columnName}, " . (strlen($fullPrefix) + strlen($separator) + 1) . ") AS UNSIGNED)"));

        $nextId = $maxId ? $maxId + 1 : 1;
        
        return $fullPrefix . $separator . str_pad($nextId, $numberLength, '0', STR_PAD_LEFT);
    }
    
    /**
     * Get model class based on document type
     *
     * @param string $type Document type
     * @return string Model class
     */
    private function getModelForType(string $type): string
    {
        $types = [
            'quotation' => Quotation::class,
            'invoice' => Invoice::class,
            'receipt' => Receipt::class,
            'delivery_note' => DeliveryNote::class
        ];
        
        if (!isset($types[$type])) {
            throw new \InvalidArgumentException("Unknown document type: {$type}");
        }
        
        return $types[$type];
    }
    
    /**
     * Get column name for document number based on type
     *
     * @param string $type Document type
     * @return string Column name
     */
    private function getColumnNameForType(string $type): string
    {
        $columns = [
            'quotation' => 'quotation_no',
            'invoice' => 'invoice_no',
            'receipt' => 'receipt_no',
            'delivery_note' => 'delivery_no'
        ];
        
        if (!isset($columns[$type])) {
            throw new \InvalidArgumentException("Unknown document type: {$type}");
        }
        
        return $columns[$type];
    }
}
