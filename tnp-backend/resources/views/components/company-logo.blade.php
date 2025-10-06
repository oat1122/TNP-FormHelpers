@props([
    'companyId' => null,
    'logoPath' => null,
    'logoUrl' => null,
    'cssClass' => 'logo-img',
    'alt' => 'Company Logo',
    'forPdf' => false,
    'height' => 40
])

@php
    use App\Services\CompanyLogoService;
    
    // ดึงข้อมูลโลโก้จาก CompanyLogoService
    $logoInfo = app(CompanyLogoService::class)->getLogoInfo($companyId);
    
    // เลือกโลโก้ตาม priority: ที่ส่งมา > service > default
    if ($forPdf) {
        $resolvedPath = $logoPath ?? $logoInfo['path'] ?? public_path('images/logo.png');
        
        // สำหรับ mPDF ใช้ data URI เพื่อให้อ่านไฟล์ได้แน่นอน
        $src = $resolvedPath;
        if (is_string($resolvedPath) && is_file($resolvedPath)) {
            $mime = mime_content_type($resolvedPath) ?: 'image/png';
            $src = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($resolvedPath));
        }
    } else {
        $src = $logoUrl ?? $logoInfo['url'] ?? asset('images/logo.png');
    }
@endphp

@if($src)
    <div class="logo-wrap">
        <img class="{{ $cssClass }}" src="{{ $src }}" alt="{{ $alt }}" height="{{ $height }}" />
    </div>
@else
    {{-- No logo available --}}
@endif
