<?php

namespace App\Services;

/**
 * บริการจัดการโลโก้ของบริษัทสำหรับ PDF และเอกสาร
 * ป้องกันการทำงานซ้ำซ้อนและจัดการโลโก้ให้เป็นระบบ
 */
class CompanyLogoService
{
    /**
     * กำหนดการจับคู่ Company ID กับไฟล์โลโก้
     */
    private const COMPANY_LOGO_MAP = [
        '2f5cd087-a00e-42eb-b041-2da71f6bb73c' => 'logo.png',
        '3310259c-1a88-461b-97ec-991acb2e78ae' => 'logo_2.png',
    ];

    /**
     * โลโก้เริ่มต้น
     */
    private const DEFAULT_LOGO = 'logo.png';

    /**
     * โฟลเดอร์ที่เก็บโลโก้
     */
    private const LOGO_DIRECTORIES = [
        'images/', // หลัก: public/images/
        ''         // สำรอง: public/ (root)
    ];

    /**
     * ดึงเส้นทางโลโก้ที่เหมาะสมตาม Company ID
     *
     * @param string|null $companyId
     * @return string|null Path ของโลโก้ หรือ null ถ้าไม่พบ
     */
    public static function getLogoPath(?string $companyId): ?string
    {
        // กำหนดชื่อไฟล์โลโก้ตาม Company ID
        $logoFileName = self::getLogoFileName($companyId);

        // ค้นหาไฟล์โลโก้ในโฟลเดอร์ต่างๆ
        foreach (self::LOGO_DIRECTORIES as $directory) {
            $logoPath = public_path($directory . $logoFileName);
            if (file_exists($logoPath)) {
                return $logoPath;
            }
        }

        return null;
    }

    /**
     * ดึงชื่อไฟล์โลโก้ตาม Company ID
     *
     * @param string|null $companyId
     * @return string
     */
    public static function getLogoFileName(?string $companyId): string
    {
        return self::COMPANY_LOGO_MAP[$companyId] ?? self::DEFAULT_LOGO;
    }

    /**
     * ดึง URL โลโก้สำหรับใช้ใน web browser
     *
     * @param string|null $companyId
     * @return string|null
     */
    public static function getLogoUrl(?string $companyId): ?string
    {
        $logoFileName = self::getLogoFileName($companyId);

        // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
        foreach (self::LOGO_DIRECTORIES as $directory) {
            $logoPath = public_path($directory . $logoFileName);
            if (file_exists($logoPath)) {
                return asset($directory . $logoFileName);
            }
        }

        return null;
    }

    /**
     * ดึงรายการ Company ID ทั้งหมดที่มีโลโก้กำหนดไว้
     *
     * @return array
     */
    public static function getConfiguredCompanyIds(): array
    {
        return array_keys(self::COMPANY_LOGO_MAP);
    }

    /**
     * ตรวจสอบว่า Company ID นี้มีโลโก้เฉพาะหรือไม่
     *
     * @param string|null $companyId
     * @return bool
     */
    public static function hasCustomLogo(?string $companyId): bool
    {
        return isset(self::COMPANY_LOGO_MAP[$companyId]);
    }

    /**
     * ดึงข้อมูลโลโก้แบบละเอียด (สำหรับ debugging)
     *
     * @param string|null $companyId
     * @return array
     */
    public static function getLogoInfo(?string $companyId): array
    {
        $fileName = self::getLogoFileName($companyId);
        $path = self::getLogoPath($companyId);
        $url = self::getLogoUrl($companyId);

        return [
            'company_id' => $companyId,
            'filename' => $fileName,
            'path' => $path,
            'url' => $url,
            'exists' => $path !== null,
            'has_custom_logo' => self::hasCustomLogo($companyId),
            'is_default' => $fileName === self::DEFAULT_LOGO,
        ];
    }
}
