<?php

namespace App\Services\Accounting\Quotation;

use App\Models\Accounting\DocumentHistory;
use App\Models\Accounting\Quotation;
use App\Services\Accounting\Pdf\QuotationPdfMasterService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PdfService
{
    public function __construct(
        private QuotationPdfMasterService $masterService,
    ) {}

    /**
     * สร้าง PDF ใบเสนอราคา (ใหม่ - ใช้ Master Service with Caching)
     *
     * @param  mixed  $quotationId
     * @param  mixed  $options
     * @param  bool  $useCache  Whether to use cache (default: true)
     * @return array<string,mixed>
     */
    public function generatePdf($quotationId, $options = [], bool $useCache = true): array
    {
        try {
            $quotation = Quotation::with(['customer', 'pricingRequest', 'company', 'items', 'creator'])
                ->findOrFail($quotationId);

            // Use Master PDF Service with caching support
            $result = $this->masterService->generatePdf($quotation, $options, $useCache);

            // Log action only if PDF was actually generated (not from cache)
            if (! ($result['from_cache'] ?? false)) {
                DocumentHistory::logAction(
                    'quotation',
                    $quotationId,
                    'generate_pdf',
                    auth()->user()->user_uuid ?? null,
                    "สร้าง PDF: {$result['filename']} ({$result['type']})"
                );
            }

            return $result;

        } catch (\Exception $e) {
            Log::error('QuotationService::generatePdf error: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Stream PDF สำหรับดู/ดาวน์โหลดทันที
     *
     * @param  mixed  $quotationId
     * @param  mixed  $options
     */
    public function streamPdf($quotationId, $options = []): \Symfony\Component\HttpFoundation\Response
    {
        $quotation = Quotation::with(['customer', 'company', 'items'])
            ->findOrFail($quotationId);

        return $this->masterService->streamPdf($quotation, $options);
    }

    /**
     * ตรวจสอบสถานะระบบ PDF
     *
     * @return array<string,mixed>
     */
    public function checkPdfSystemStatus(): array
    {
        try {
            $status = $this->masterService->checkSystemStatus();

            return [
                'system_ready' => $status['all_ready'],
                'components' => $status,
                'recommendations' => $this->getPdfRecommendations($status),
                'preferred_engine' => $status['all_ready'] ? 'mPDF' : 'FPDF',
            ];

        } catch (\Exception $e) {
            Log::error('QuotationService::checkPdfSystemStatus error: '.$e->getMessage());

            return [
                'system_ready' => false,
                'components' => ['error' => $e->getMessage()],
                'recommendations' => ['ติดตั้ง mPDF package และ dependencies ที่จำเป็น'],
                'preferred_engine' => 'FPDF',
            ];
        }
    }

    /**
     * ให้คำแนะนำสำหรับการแก้ไขระบบ PDF
     *
     * @param  mixed  $status
     * @return array<int,string>
     */
    private function getPdfRecommendations($status): array
    {
        $recommendations = [];

        if (empty($status['mpdf_available'])) {
            $recommendations[] = 'ติดตั้ง mPDF: composer require carlos-meneses/laravel-mpdf';
        }

        if (empty($status['thai_fonts_available'])) {
            $recommendations[] = 'ดาวน์โหลดและติดตั้งฟอนต์ Sarabun ในโฟลเดอร์ public/fonts/thsarabun/';
            $recommendations[] = 'ตรวจสอบไฟล์: Sarabun-Regular.ttf และ Sarabun-Bold.ttf';
        }

        if (empty($status['storage_writable'])) {
            $recommendations[] = 'ตรวจสอบสิทธิ์การเขียนในโฟลเดอร์ storage/app/public';
        }

        if (empty($status['views_exist'])) {
            $recommendations[] = 'สร้างไฟล์ view templates ตามที่ระบุในคู่มือ';
            $recommendations[] = 'ตรวจสอบไฟล์: accounting.pdf.quotation.quotation-master, accounting.pdf.quotation.partials.quotation-header, accounting.pdf.quotation.partials.quotation-footer';
        }

        if (empty($recommendations)) {
            $recommendations[] = 'ระบบพร้อมใช้งาน mPDF แล้ว!';
        }

        return $recommendations;
    }

    /**
     * ส่งอีเมลใบเสนอราคา
     *
     * @param  mixed  $quotationId
     * @param  mixed  $emailData
     * @param  mixed  $sentBy
     * @return array<string,mixed>
     */
    public function sendEmail($quotationId, $emailData, $sentBy = null): array
    {
        try {
            DB::beginTransaction();

            $quotation = Quotation::with(['customer'])->findOrFail($quotationId);

            // ตรวจสอบสถานะ
            if ($quotation->status !== 'approved') {
                throw new \Exception('Quotation must be approved before sending email');
            }

            // สร้าง PDF ก่อนส่ง (ถ้าต้องการ)
            $pdfData = null;
            if ($emailData['include_pdf'] ?? true) {
                $pdfData = $this->generatePdf($quotationId);
            }

            // TODO: Implement actual email sending
            // For now, just log the email data
            $emailDetails = [
                'to' => $emailData['recipient_email'],
                'subject' => $emailData['subject'] ?? "ใบเสนอราคา {$quotation->number} จาก TNP Group",
                'message' => $emailData['message'] ?? "เรียน คุณลูกค้า\n\nได้แนบใบเสนอราคาตามที่ร้องขอ...",
                'pdf_attachment' => $pdfData['path'] ?? null,
                'sent_at' => now(),
                'sent_by' => $sentBy,
            ];

            Log::info('QuotationService::sendEmail - Email details:', $emailDetails);

            // บันทึก History
            DocumentHistory::logAction(
                'quotation',
                $quotationId,
                'send_email',
                $sentBy,
                "ส่งอีเมลถึง: {$emailData['recipient_email']}"
            );

            DB::commit();

            return [
                'email_sent' => true,
                'recipient' => $emailData['recipient_email'],
                'sent_at' => now()->format('Y-m-d\TH:i:s\Z'),
                'pdf_included' => ! empty($pdfData),
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QuotationService::sendEmail error: '.$e->getMessage());
            throw $e;
        }
    }
}
