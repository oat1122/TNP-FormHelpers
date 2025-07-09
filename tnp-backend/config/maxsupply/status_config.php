<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Status Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for statuses in the MaxSupply system.
    |
    */

    'statuses' => [
        'pending' => [
            'name' => 'Pending',
            'name_th' => 'รอดำเนินการ',
            'color' => 'warning',
            'icon' => 'hourglass_empty',
            'order' => 1,
        ],
        'in_progress' => [
            'name' => 'In Progress',
            'name_th' => 'กำลังดำเนินการ',
            'color' => 'info',
            'icon' => 'engineering',
            'order' => 2,
        ],
        'completed' => [
            'name' => 'Completed',
            'name_th' => 'เสร็จสิ้น',
            'color' => 'success',
            'icon' => 'check_circle',
            'order' => 3,
        ],
        'cancelled' => [
            'name' => 'Cancelled',
            'name_th' => 'ยกเลิก',
            'color' => 'error',
            'icon' => 'cancel',
            'order' => 4,
        ],
    ],

    'priorities' => [
        'low' => [
            'name' => 'Low',
            'name_th' => 'ต่ำ',
            'color' => 'success',
            'icon' => 'arrow_downward',
            'order' => 1,
        ],
        'normal' => [
            'name' => 'Normal',
            'name_th' => 'ปกติ',
            'color' => 'info',
            'icon' => 'remove',
            'order' => 2,
        ],
        'high' => [
            'name' => 'High',
            'name_th' => 'สูง',
            'color' => 'warning',
            'icon' => 'arrow_upward',
            'order' => 3,
        ],
        'urgent' => [
            'name' => 'Urgent',
            'name_th' => 'ด่วน',
            'color' => 'error',
            'icon' => 'priority_high',
            'order' => 4,
        ],
    ],

    'notifications' => [
        'overdue_warning_days' => 2, // Send warning notification 2 days before due date
        'daily_summary_time' => '08:00', // Send daily summary at 8:00 AM
    ],
];
