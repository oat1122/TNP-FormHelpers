<?php

return [
    'mode'                   => 'utf-8',
    'format'                 => 'A4',
    'default_font_size'      => 12,
    'default_font'           => 'thsarabun', // ตั้งค่า default font เป็น Sarabun
    'margin_left'            => 10,
    'margin_right'           => 10,
    'margin_top'             => 35,   // เว้น header
    'margin_bottom'          => 20,   // เว้น footer
    'margin_header'          => 0,
    'margin_footer'          => 0,
    'orientation'            => 'P',

    'title'                  => 'Laravel mPDF',
    'author'                 => 'YourApp',
    'watermark'              => '',
    'show_watermark'         => false,
    'show_watermark_image'   => false,
    'watermark_font'         => 'sans-serif',
    'display_mode'           => 'fullpage',
    'watermark_text_alpha'   => 0.1,
    'watermark_image_path'   => '',
    'watermark_image_alpha'  => 0.2,
    'watermark_image_size'   => 'D',
    'watermark_image_position' => 'P',

    // ฟอนต์ไทย
    'custom_font_dir'  => public_path('fonts/thsarabun/'),
    'custom_font_data'       => [
        'thsarabun' => [
            'R'  => 'Sarabun-Regular.ttf',
            'B'  => 'Sarabun-Bold.ttf',
            'I'  => 'Sarabun-Italic.ttf',
            'BI' => 'Sarabun-BoldItalic.ttf',
        ],
    ],
    'default_font' => 'thsarabun',

    // Temp dir สำหรับ production
    'temp_dir'               => storage_path('app/mpdf-temp'),

    'pdfa'                   => false,
    'pdfaauto'               => false,
    'use_active_forms'       => false,
    'autoScriptToLang'       => true,
    'autoLangToFont'         => true,

    // Image Optimization Configuration
    'image_optimization' => [
        'enabled'         => env('PDF_IMAGE_OPTIMIZATION_ENABLED', true),
        'max_width'       => env('PDF_IMAGE_MAX_WIDTH', 800),
            'max_height'      => env('PDF_IMAGE_MAX_HEIGHT', 800),
            'jpeg_quality'    => env('PDF_IMAGE_JPEG_QUALITY', 85),
        'cache_enabled'   => env('PDF_IMAGE_CACHE_ENABLED', true),
        'cache_duration'  => env('PDF_IMAGE_CACHE_DURATION', 30), // days
        'cache_path'      => storage_path('app/pdf-images-cache'),
        'supported_formats' => ['jpg', 'jpeg', 'png', 'webp'],
        'output_format'   => 'jpg', // Format for PDF output (jpg or png)
    ],

];
