<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;

class GlobalService
{
    public function formatThaiPhoneNumber($number)
    {
        // ลบอักขระที่ไม่ใช่ตัวเลขออกทั้งหมด
        $digits = preg_replace('/\D/', '', $number);
        $is_phone_number = preg_match('/^0[689]\d{8}$/', $digits);

        // ตรวจสอบว่ามี 10 หลัก และขึ้นต้นด้วย 06, 08, 09
        if ($is_phone_number) {
            return substr($digits, 0, 3) . ' ' . substr($digits, 3, 3) . ' ' . substr($digits, 6);
        }

        // ตรวจสอบว่าเป็นเบอร์โทรศัพท์สำนักงาน
        if (strlen($digits) >= 9) {

            if (strlen($digits) > 9) {
                return substr($digits, 0, 2) . ' ' . substr($digits, 2, 3) . ' ' . substr($digits, 5, 4) . '*' . substr($digits, 9);
            }
            return substr($digits, 0, 2) . ' ' . substr($digits, 2, 3) . ' ' . substr($digits, 5);
        }

        // คืนค่าหมายเลขเดิมหากไม่ตรงตามเงื่อนไข
        return $number;
    }

    public function saveImage($sub_directory, $target_width, $images_file, $new_filename, $existing_image_q) {
        $storage_path = rtrim(storage_path('app/public/images/' . $sub_directory), '/') . '/';
        $images_path = $storage_path . $new_filename;

        // ตรวจสอบและสร้างโฟลเดอร์หากไม่มี
        if (!File::exists($storage_path)) {
            File::makeDirectory($storage_path, 0755, true);
        }

        $imageManager = new ImageManager(new GdDriver);
        $image = $imageManager->read($images_file);

        if ($image->width() > $target_width) {
            $image->scale($target_width);
        }

        $image->save($images_path);

        if (isset($existing_image_q)) {
            $existing_images_file = Storage::get('public/images/' . $sub_directory. '/' . $existing_image_q);

            // Delete old images file.
            if ($existing_images_file !== null) {
                Storage::delete('public/images/pricing_req/' . $existing_image_q);
            }
        }

    }
}
