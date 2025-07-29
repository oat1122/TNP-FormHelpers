<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default VAT Rate
    |--------------------------------------------------------------------------
    |
    | This value is the default VAT rate that will be applied to products
    | and quotations when no specific rate is provided.
    |
    */

    'default_vat_rate' => env('ACCOUNTING_DEFAULT_VAT_RATE', 7),

    /*
    |--------------------------------------------------------------------------
    | Document Number Formats
    |--------------------------------------------------------------------------
    |
    | These settings control how document numbers are generated for
    | quotations, invoices, receipts, and delivery notes.
    |
    */

    'document_formats' => [
        'quotation' => [
            'prefix' => 'QT',
            'date_format' => 'Ym', // YYYYMM
            'number_length' => 4,
            'separator' => '-'
        ],
        'invoice' => [
            'prefix' => 'INV',
            'date_format' => 'Ym',
            'number_length' => 4,
            'separator' => '-'
        ],
        'receipt' => [
            'prefix' => 'REC',
            'date_format' => 'Ym',
            'number_length' => 4,
            'separator' => '-'
        ],
        'delivery_note' => [
            'prefix' => 'DN',
            'date_format' => 'Ym',
            'number_length' => 4,
            'separator' => '-'
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Credit Terms
    |--------------------------------------------------------------------------
    |
    | Default credit terms available for customers and invoices.
    |
    */

    'credit_terms' => [
        0 => 'Cash on Delivery',
        7 => '7 Days',
        15 => '15 Days',
        30 => '30 Days',
        45 => '45 Days',
        60 => '60 Days',
        90 => '90 Days'
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Terms
    |--------------------------------------------------------------------------
    |
    | Available payment terms for quotations and invoices.
    |
    */

    'payment_terms' => [
        'cash' => 'Cash',
        'bank_transfer' => 'Bank Transfer',
        'cheque' => 'Cheque',
        'credit_card' => 'Credit Card',
        'installment' => 'Installment',
        'partial_deposit' => 'Partial Deposit'
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Status Colors
    |--------------------------------------------------------------------------
    |
    | Colors for different document statuses in the frontend.
    |
    */

    'status_colors' => [
        'draft' => '#6b7280',
        'pending_review' => '#f59e0b',
        'approved' => '#10b981',
        'rejected' => '#ef4444',
        'completed' => '#3b82f6',
        'paid' => '#10b981',
        'unpaid' => '#ef4444',
        'partially_paid' => '#f59e0b',
        'overdue' => '#dc2626'
    ],

    /*
    |--------------------------------------------------------------------------
    | File Upload Settings
    |--------------------------------------------------------------------------
    |
    | Settings for document attachments.
    |
    */

    'file_upload' => [
        'max_size' => env('ACCOUNTING_MAX_FILE_SIZE', 10240), // KB
        'allowed_types' => [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'txt' => 'text/plain'
        ],
        'storage_disk' => env('ACCOUNTING_FILE_STORAGE_DISK', 'private')
    ],

    /*
    |--------------------------------------------------------------------------
    | Currency Settings
    |--------------------------------------------------------------------------
    |
    | Default currency and formatting options.
    |
    */

    'currency' => [
        'default' => 'THB',
        'symbol' => '฿',
        'decimal_places' => 2,
        'thousands_separator' => ',',
        'decimal_separator' => '.'
    ],

    /*
    |--------------------------------------------------------------------------
    | Company Information
    |--------------------------------------------------------------------------
    |
    | Default company information for documents.
    |
    */

    'company' => [
        'name' => env('COMPANY_NAME', 'TNP Company Ltd.'),
        'address' => env('COMPANY_ADDRESS', ''),
        'tax_id' => env('COMPANY_TAX_ID', ''),
        'phone' => env('COMPANY_PHONE', ''),
        'email' => env('COMPANY_EMAIL', ''),
        'website' => env('COMPANY_WEBSITE', ''),
        'logo_path' => env('COMPANY_LOGO_PATH', '')
    ],

    /*
    |--------------------------------------------------------------------------
    | E-Tax Invoice Settings
    |--------------------------------------------------------------------------
    |
    | Settings for e-Tax Invoice compliance.
    |
    */

    'etax' => [
        'enabled' => env('ETAX_ENABLED', false),
        'api_url' => env('ETAX_API_URL', ''),
        'username' => env('ETAX_USERNAME', ''),
        'password' => env('ETAX_PASSWORD', ''),
        'branch_code' => env('ETAX_BRANCH_CODE', '00000')
    ],

    /*
    |--------------------------------------------------------------------------
    | PDF Generation Settings
    |--------------------------------------------------------------------------
    |
    | Settings for PDF document generation.
    |
    */

    'pdf' => [
        'engine' => env('PDF_ENGINE', 'dompdf'), // dompdf, wkhtmltopdf
        'paper_size' => 'A4',
        'orientation' => 'portrait',
        'template_path' => resource_path('views/accounting/pdf'),
        'temp_path' => storage_path('app/temp/pdf'),
        'font_size' => 10,
        'margins' => [
            'top' => 15,
            'right' => 15,
            'bottom' => 15,
            'left' => 15
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Settings
    |--------------------------------------------------------------------------
    |
    | Settings for email and other notifications.
    |
    */

    'notifications' => [
        'quotation_approved' => [
            'enabled' => true,
            'recipients' => ['sales', 'customer']
        ],
        'invoice_overdue' => [
            'enabled' => true,
            'days_before' => [7, 3, 1],
            'recipients' => ['account', 'customer']
        ],
        'payment_received' => [
            'enabled' => true,
            'recipients' => ['account', 'sales']
        ]
    ]

];
