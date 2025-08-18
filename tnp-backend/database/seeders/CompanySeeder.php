<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        $companies = [
            [
                'name' => 'บริษัท ธน พลัส 153 จำกัด',
                'legal_name' => 'บริษัท ธน พลัส 153 จำกัด (สำนักงานใหญ่)',
                'branch' => 'สำนักงานใหญ่',
                'address' => '503 ถนนสุโขทัย เขตดุสิต แขวงสวนจิตรลดา จ.กรุงเทพฯ 10300',
                'tax_id' => '0105553095785',
                'phone' => '081-323-4533,096-936-6311',
                'short_code' => 'TNP153',
                'is_active' => true,
            ],
            [
                'name' => 'บริษัท ทีเอ็นพี เอ็นเตอร์ไพรส์ จำกัด',
                'legal_name' => 'บริษัท ทีเอ็นพี เอ็นเตอร์ไพรส์ จำกัด (สำนักงานใหญ่)',
                'branch' => 'สำนักงานใหญ่',
                'address' => '503/1 ถนนสุโขทัย แขวงสวนจิตรลดา เขตดุสิต จังหวัดกรุงเทพมหานคร 10300',
                'tax_id' => '0105563131512',
                'phone' => '081-323-4533,096-936-6311',
                'short_code' => 'TNP',
                'is_active' => true,
            ],
        ];

        foreach ($companies as $c) {
            $exists = DB::table('companies')->where('name', $c['name'])->first();
            if ($exists) continue;
            DB::table('companies')->insert(array_merge($c, [
                'id' => (string) Str::uuid(),
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}
