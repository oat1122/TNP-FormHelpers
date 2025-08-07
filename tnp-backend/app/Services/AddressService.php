<?php

namespace App\Services;

use App\Models\MasterProvice;
use App\Models\MasterDistrict;
use App\Models\MasterSubdistrict;
use Illuminate\Support\Facades\Log;

class AddressService
{
    /**
     * สร้างที่อยู่เต็มจาก components แยกส่วน
     * รองรับรูปแบบ: "40/94 ถนนทวีวัฒนา ซอยหมู่บ้านสุชา แขวงหนองค้างพลู เขตหนองแขม กทม.10160"
     */
    public function buildFullAddress($addressDetail, $subId, $disId, $proId, $zipCode = null)
    {
        try {
            $parts = [];
            
            // รายละเอียดที่อยู่ (เลขที่, ถนน, ซอย)
            if ($addressDetail) {
                $parts[] = trim($addressDetail);
            }
            
            // ตำบล/แขวง
            if ($subId) {
                $subdistrict = MasterSubdistrict::where('sub_id', $subId)
                    ->where('sub_is_use', true)
                    ->first();
                if ($subdistrict) {
                    // ใช้รหัสไปรษณีย์จาก subdistrict ถ้าไม่ได้ส่งมา
                    if (!$zipCode && $subdistrict->sub_zip_code) {
                        $zipCode = $subdistrict->sub_zip_code;
                    }
                }
            }
            
            // เขต/อำเภอ
            if ($disId) {
                $district = MasterDistrict::where('dis_id', $disId)
                    ->where('dis_is_use', true)
                    ->first();
            }
            
            // จังหวัด
            if ($proId) {
                $province = MasterProvice::where('pro_id', $proId)
                    ->where('pro_is_use', true)
                    ->first();
                if ($province) {
                    $isBangkok = strpos($province->pro_name_th, 'กรุงเทพ') !== false;
                    
                    // เพิ่มตำบล/แขวง
                    if ($subId && $subdistrict) {
                        if ($isBangkok) {
                            $parts[] = "แขวง" . $subdistrict->sub_name_th;
                        } else {
                            $parts[] = "ตำบล" . $subdistrict->sub_name_th;
                        }
                    }
                    
                    // เพิ่มเขต/อำเภอ
                    if ($disId && $district) {
                        if ($isBangkok) {
                            $parts[] = "เขต" . $district->dis_name_th;
                        } else {
                            $parts[] = "อำเภอ" . $district->dis_name_th;
                        }
                    }
                    
                    // เพิ่มจังหวัด
                    if ($isBangkok) {
                        $parts[] = "กรุงเทพฯ";
                    } else {
                        $parts[] = "จ." . $province->pro_name_th;
                    }
                }
            }
            
            // รหัสไปรษณีย์
            if ($zipCode) {
                $parts[] = $zipCode;
            }
            
            return implode(' ', $parts);
            
        } catch (\Exception $e) {
            Log::error('Build full address error: ' . $e->getMessage());
            return $addressDetail ?? '';
        }
    }
    
    /**
     * แยก components จากที่อยู่เต็ม
     * รองรับรูปแบบ: "40/94 ถนนทวีวัฒนา ซอยหมู่บ้านสุชา แขวงหนองค้างพลู เขตหนองแขม กทม.10160"
     */
    public function parseFullAddress($fullAddress)
    {
        try {
            if (!$fullAddress) {
                return [
                    'address_detail' => '',
                    'subdistrict' => '',
                    'district' => '',
                    'province' => '',
                    'zip_code' => ''
                ];
            }
            
            $parts = explode(' ', trim($fullAddress));
            $result = [
                'address_detail' => '',
                'subdistrict' => '',
                'district' => '',
                'province' => '',
                'zip_code' => ''
            ];
            
            // หารหัสไปรษณีย์ (5 หลักสุดท้าย)
            $zipCode = end($parts);
            if (preg_match('/^\d{5}$/', $zipCode)) {
                $result['zip_code'] = $zipCode;
                array_pop($parts); // ลบรหัสไปรษณีย์ออก
            }
            
            // หาจังหวัด (ขึ้นต้นด้วย "จ." หรือ "กรุงเทพฯ")
            foreach ($parts as $index => $part) {
                if (strpos($part, 'จ.') === 0) {
                    $result['province'] = str_replace('จ.', '', $part);
                    unset($parts[$index]);
                    break;
                } elseif (strpos($part, 'กรุงเทพฯ') === 0) {
                    $result['province'] = 'กรุงเทพมหานคร';
                    unset($parts[$index]);
                    break;
                }
            }
            
            // ตรวจสอบว่าเป็นกรุงเทพฯ หรือไม่
            $isBangkok = $result['province'] === 'กรุงเทพมหานคร';
            
            // หาเขต/อำเภอ (ขึ้นต้นด้วย "เขต" หรือ "อำเภอ" หรือ "อ.")
            foreach ($parts as $index => $part) {
                if (strpos($part, 'เขต') === 0) {
                    $result['district'] = str_replace('เขต', '', $part);
                    unset($parts[$index]);
                    break;
                } elseif (strpos($part, 'อำเภอ') === 0) {
                    $result['district'] = str_replace('อำเภอ', '', $part);
                    unset($parts[$index]);
                    break;
                } elseif (strpos($part, 'อ.') === 0) {
                    $result['district'] = str_replace('อ.', '', $part);
                    unset($parts[$index]);
                    break;
                }
            }
            
            // หาแขวง/ตำบล (ขึ้นต้นด้วย "แขวง" หรือ "ตำบล" หรือ "ต.")
            foreach ($parts as $index => $part) {
                if (strpos($part, 'แขวง') === 0) {
                    $result['subdistrict'] = str_replace('แขวง', '', $part);
                    unset($parts[$index]);
                    break;
                } elseif (strpos($part, 'ตำบล') === 0) {
                    $result['subdistrict'] = str_replace('ตำบล', '', $part);
                    unset($parts[$index]);
                    break;
                } elseif (strpos($part, 'ต.') === 0) {
                    $result['subdistrict'] = str_replace('ต.', '', $part);
                    unset($parts[$index]);
                    break;
                }
            }
            
            // ส่วนที่เหลือคือรายละเอียดที่อยู่
            $result['address_detail'] = implode(' ', $parts);
            
            return $result;
            
        } catch (\Exception $e) {
            Log::error('Parse full address error: ' . $e->getMessage());
            return [
                'address_detail' => $fullAddress ?? '',
                'subdistrict' => '',
                'district' => '',
                'province' => '',
                'zip_code' => ''
            ];
        }
    }
    
    /**
     * ค้นหา ID จากชื่อสถานที่
     */
    public function findLocationIds($provinceName, $districtName, $subdistrictName)
    {
        try {
            $result = [
                'pro_id' => null,
                'dis_id' => null,
                'sub_id' => null
            ];
            
            // ค้นหาจังหวัด
            if ($provinceName) {
                $province = MasterProvice::where('pro_name_th', 'like', "%{$provinceName}%")
                    ->where('pro_is_use', true)
                    ->first();
                if ($province) {
                    $result['pro_id'] = $province->pro_id;
                    
                    // ค้นหาเขต/อำเภอ
                    if ($districtName) {
                        $district = MasterDistrict::where('dis_name_th', 'like', "%{$districtName}%")
                            ->where('dis_pro_sort_id', $province->pro_sort_id)
                            ->where('dis_is_use', true)
                            ->first();
                        if ($district) {
                            $result['dis_id'] = $district->dis_id;
                            
                            // ค้นหาแขวง/ตำบล
                            if ($subdistrictName) {
                                $subdistrict = MasterSubdistrict::where('sub_name_th', 'like', "%{$subdistrictName}%")
                                    ->where('sub_dis_sort_id', $district->dis_sort_id)
                                    ->where('sub_is_use', true)
                                    ->first();
                                if ($subdistrict) {
                                    $result['sub_id'] = $subdistrict->sub_id;
                                }
                            }
                        }
                    }
                }
            }
            
            return $result;
            
        } catch (\Exception $e) {
            Log::error('Find location IDs error: ' . $e->getMessage());
            return [
                'pro_id' => null,
                'dis_id' => null,
                'sub_id' => null
            ];
        }
    }
    
    /**
     * รวมที่อยู่สำหรับการแสดงผล
     */
    public function formatDisplayAddress($customer)
    {
        try {
            // ถ้ามี cus_address แล้วใช้เลย
            if ($customer->cus_address) {
                return $customer->cus_address;
            }
            
            // ถ้าไม่มี ให้สร้างจาก components
            return $this->buildFullAddress(
                null, // ไม่มี address detail แยก
                $customer->cus_sub_id,
                $customer->cus_dis_id,
                $customer->cus_pro_id,
                $customer->cus_zip_code
            );
            
        } catch (\Exception $e) {
            Log::error('Format display address error: ' . $e->getMessage());
            return '';
        }
    }
}
