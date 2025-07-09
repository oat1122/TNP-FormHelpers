<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Production Types
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for production types in the MaxSupply system.
    |
    */

    'types' => [
        'screen' => [
            'name' => 'Screen',
            'name_th' => 'งานสกรีน',
            'base_points' => 2,
            'avg_hours_per_point' => 3, // Average hours per point
            'description' => 'Screen printing process',
        ],
        'dtf' => [
            'name' => 'DTF',
            'name_th' => 'งาน DTF',
            'base_points' => 1,
            'avg_hours_per_point' => 1.5, // Average hours per point
            'description' => 'Direct to Film printing',
        ],
        'sublimation' => [
            'name' => 'Sublimation',
            'name_th' => 'งานซับลิเมชัน',
            'base_points' => 3,
            'avg_hours_per_point' => 2, // Average hours per point
            'description' => 'Sublimation printing process',
        ],
    ],

    'points_calculation' => [
        'size_factor' => 0.5, // Additional points per size
        'color_factor' => 1.0, // Additional points per color
    ],
];
