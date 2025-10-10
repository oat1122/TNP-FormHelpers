<?php

namespace App\Traits;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * Trait Uploadable
 * 
 * จัดการการอัปโหลด, ลบ, และสร้าง URL ของไฟล์
 * ใช้ได้กับทุก Model ที่ต้องการจัดการไฟล์
 */
trait Uploadable
{
    /**
     * อัปโหลดไฟล์ไปยัง Storage
     * 
     * @param UploadedFile $file ไฟล์ที่ต้องการอัปโหลด
     * @param string $directory โฟลเดอร์ที่ต้องการเก็บไฟล์
     * @param string $prefix Prefix สำหรับชื่อไฟล์ (optional)
     * @param string $disk ชื่อ disk ที่ต้องการใช้ (default: 'public')
     * @return array ข้อมูลไฟล์ที่อัปโหลด ['path', 'filename', 'original_filename', 'size', 'mime_type', 'url']
     */
    public function uploadFile(UploadedFile $file, string $directory, string $prefix = '', string $disk = 'public'): array
    {
        try {
            // สร้างชื่อไฟล์
            $extension = $file->getClientOriginalExtension();
            $originalName = $file->getClientOriginalName();
            $filename = $prefix 
                ? $prefix . '_' . uniqid() . '.' . $extension 
                : uniqid() . '.' . $extension;

            // อัปโหลดไฟล์
            $path = $file->storeAs($directory, $filename, $disk);

            // สร้าง full path สำหรับตรวจสอบไฟล์
            $fullPath = Storage::disk($disk)->path($path);

            // ดึงข้อมูลไฟล์
            $size = file_exists($fullPath) ? filesize($fullPath) : null;
            $mimeType = $size ? mime_content_type($fullPath) : null;

            return [
                'path' => $path,
                'filename' => $filename,
                'original_filename' => $originalName,
                'size' => $size,
                'mime_type' => $mimeType,
                'url' => Storage::disk($disk)->url($path),
                'disk' => $disk,
            ];

        } catch (\Exception $e) {
            Log::error('Uploadable::uploadFile error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * อัปโหลดหลายไฟล์พร้อมกัน
     * 
     * @param array $files Array ของ UploadedFile
     * @param string $directory โฟลเดอร์ที่ต้องการเก็บไฟล์
     * @param string $prefix Prefix สำหรับชื่อไฟล์ (optional)
     * @param string $disk ชื่อ disk ที่ต้องการใช้ (default: 'public')
     * @return array Array ของข้อมูลไฟล์ที่อัปโหลด
     */
    public function uploadMultipleFiles(array $files, string $directory, string $prefix = '', string $disk = 'public'): array
    {
        $uploadedFiles = [];

        foreach ($files as $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            try {
                $uploadedFiles[] = $this->uploadFile($file, $directory, $prefix, $disk);
            } catch (\Exception $e) {
                Log::warning('Uploadable::uploadMultipleFiles - Failed to upload file: ' . $e->getMessage());
                // ดำเนินการต่อกับไฟล์อื่นๆ แม้จะมีไฟล์ที่อัปโหลดไม่สำเร็จ
            }
        }

        return $uploadedFiles;
    }

    /**
     * ลบไฟล์จาก Storage
     * 
     * @param string $path Path ของไฟล์ที่ต้องการลบ
     * @param string $disk ชื่อ disk ที่ต้องการใช้ (default: 'public')
     * @return bool สำเร็จหรือไม่
     */
    public function deleteFile(string $path, string $disk = 'public'): bool
    {
        try {
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->delete($path);
            }

            Log::warning("Uploadable::deleteFile - File not found: {$path}");
            return false;

        } catch (\Exception $e) {
            Log::error('Uploadable::deleteFile error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * ลบหลายไฟล์พร้อมกัน
     * 
     * @param array $paths Array ของ path ที่ต้องการลบ
     * @param string $disk ชื่อ disk ที่ต้องการใช้ (default: 'public')
     * @return array ผลลัพธ์การลบแต่ละไฟล์ ['path' => bool]
     */
    public function deleteMultipleFiles(array $paths, string $disk = 'public'): array
    {
        $results = [];

        foreach ($paths as $path) {
            $results[$path] = $this->deleteFile($path, $disk);
        }

        return $results;
    }

    /**
     * สร้าง URL ของไฟล์
     * 
     * @param string $path Path ของไฟล์
     * @param string $disk ชื่อ disk ที่ต้องการใช้ (default: 'public')
     * @return string|null URL ของไฟล์ หรือ null ถ้าไฟล์ไม่มีอยู่
     */
    public function getFileUrl(string $path, string $disk = 'public'): ?string
    {
        try {
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->url($path);
            }

            return null;

        } catch (\Exception $e) {
            Log::error('Uploadable::getFileUrl error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * ตรวจสอบว่าไฟล์มีอยู่หรือไม่
     * 
     * @param string $path Path ของไฟล์
     * @param string $disk ชื่อ disk ที่ต้องการใช้ (default: 'public')
     * @return bool มีไฟล์อยู่หรือไม่
     */
    public function fileExists(string $path, string $disk = 'public'): bool
    {
        try {
            return Storage::disk($disk)->exists($path);
        } catch (\Exception $e) {
            Log::error('Uploadable::fileExists error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * ดึงข้อมูลไฟล์
     * 
     * @param string $path Path ของไฟล์
     * @param string $disk ชื่อ disk ที่ต้องการใช้ (default: 'public')
     * @return array|null ข้อมูลไฟล์ ['size', 'mime_type', 'url', 'last_modified']
     */
    public function getFileInfo(string $path, string $disk = 'public'): ?array
    {
        try {
            if (!Storage::disk($disk)->exists($path)) {
                return null;
            }

            $fullPath = Storage::disk($disk)->path($path);

            return [
                'path' => $path,
                'size' => Storage::disk($disk)->size($path),
                'mime_type' => file_exists($fullPath) ? mime_content_type($fullPath) : null,
                'url' => Storage::disk($disk)->url($path),
                'last_modified' => Storage::disk($disk)->lastModified($path),
                'disk' => $disk,
            ];

        } catch (\Exception $e) {
            Log::error('Uploadable::getFileInfo error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * ย้ายไฟล์ไปยังโฟลเดอร์ใหม่
     * 
     * @param string $fromPath Path เดิมของไฟล์
     * @param string $toPath Path ใหม่ของไฟล์
     * @param string $disk ชื่อ disk ที่ต้องการใช้ (default: 'public')
     * @return bool สำเร็จหรือไม่
     */
    public function moveFile(string $fromPath, string $toPath, string $disk = 'public'): bool
    {
        try {
            if (!Storage::disk($disk)->exists($fromPath)) {
                Log::warning("Uploadable::moveFile - Source file not found: {$fromPath}");
                return false;
            }

            return Storage::disk($disk)->move($fromPath, $toPath);

        } catch (\Exception $e) {
            Log::error('Uploadable::moveFile error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * คัดลอกไฟล์
     * 
     * @param string $fromPath Path เดิมของไฟล์
     * @param string $toPath Path ใหม่ของไฟล์
     * @param string $disk ชื่อ disk ที่ต้องการใช้ (default: 'public')
     * @return bool สำเร็จหรือไม่
     */
    public function copyFile(string $fromPath, string $toPath, string $disk = 'public'): bool
    {
        try {
            if (!Storage::disk($disk)->exists($fromPath)) {
                Log::warning("Uploadable::copyFile - Source file not found: {$fromPath}");
                return false;
            }

            return Storage::disk($disk)->copy($fromPath, $toPath);

        } catch (\Exception $e) {
            Log::error('Uploadable::copyFile error: ' . $e->getMessage());
            return false;
        }
    }
}
