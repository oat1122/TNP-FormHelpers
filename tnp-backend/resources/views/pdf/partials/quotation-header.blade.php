{{-- resources/views/pdf/partials/quotation-header.blade.php --}}
<table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0; font-family: 'thsarabun', sans-serif;">
    <tr>
        <td style="width: 55%; vertical-align: top; padding: 8pt;">
            {{-- โลโก้บริษัท --}}
            @php
                $logoPath = null;
                $logoCandidates = [
                    public_path('images/logo.png'),
                    public_path('logo.png'),
                ];
                foreach ($logoCandidates as $candidate) {
                    if (file_exists($candidate)) {
                        $logoPath = $candidate;
                        break;
                    }
                }
            @endphp
            
            @if ($logoPath)
                <img src="{{ $logoPath }}" style="height: 20mm; margin-bottom: 5pt;" />
            @endif

            {{-- ข้อมูลบริษัท --}}
            <div style="font-size: 14pt; font-weight: bold; color: #2c3e50; margin-bottom: 3pt;">
                {{ $quotation->company->legal_name ?? $quotation->company->name ?? 'บริษัทของคุณ' }}
            </div>
            
            @if (!empty($quotation->company->address))
                <div style="font-size: 11pt; color: #34495e; line-height: 1.3; margin-bottom: 3pt;">
                    {{ $quotation->company->address }}
                </div>
            @endif
            
            <div style="font-size: 10pt; color: #7f8c8d;">
                โทร: {{ $quotation->company->phone ?? '-' }} <br/>
                เลขประจำตัวผู้เสียภาษี: {{ $quotation->company->tax_id ?? '-' }}
            </div>
            <div style="font-size: 11pt; color: {{ $primaryColor }}; margin-top: 4pt;">
                {{ $quotation->company->tagline ?? 'ผู้ผลิตและจำหน่ายเสื้อคุณภาพ' }}
            </div>
        </td>
        
        <td style="width: 45%; vertical-align: top; text-align: right; padding: 8pt;">
            {{-- หัวข้อเอกสาร --}}
            <div style="font-size: 20pt; font-weight: bold; color: {{ $primaryColor }}; margin-bottom: 5pt;">
                ใบเสนอราคา
            </div>
            
            {{-- เลขที่และวันที่ --}}
            <div style="font-size: 12pt; color: #2c3e50; line-height: 1.4;">
                <div><strong>เลขที่:</strong> {{ $quotation->number ?? 'DRAFT' }}</div>
                <div><strong>วันที่:</strong> {{ now()->format('d/m/Y') }}</div>
                @if ($quotation->due_date)
                    <div><strong>กำหนดส่ง:</strong> {{ \Carbon\Carbon::parse($quotation->due_date)->format('d/m/Y') }}</div>
                @endif
                @php
                    $sellerFirst = optional($quotation->creator)->user_firstname;
                    $sellerLast = optional($quotation->creator)->user_lastname;
                    $sellerUsername = optional($quotation->creator)->username;
                    $sellerDisplay = trim(trim(($sellerFirst ?? '') . ' ' . ($sellerLast ?? '')));
                    if ($sellerDisplay === '' && !empty($sellerUsername)) {
                        $sellerDisplay = $sellerUsername;
                    }
                @endphp
                @if (!empty($sellerDisplay))
                    <div><strong>ผู้ขาย:</strong> {{ $sellerDisplay }}</div>
                @endif
            </div>
            
            {{-- สถานะเอกสาร: แสดงเฉพาะ "ร่าง" เท่านั้น --}}
            @if ($quotation->status === 'draft')
                @php
                    $status = ['label' => 'ร่าง', 'color' => '#f39c12'];
                @endphp
                <div style="margin-top: 8pt; padding: 4pt 8pt; background: {{ $status['color'] }}; color: white; border-radius: 3pt; font-size: 10pt; font-weight: bold; display: inline-block;">
                    {{ $status['label'] }}
                </div>
            @endif
        </td>
    </tr>
</table>

{{-- เส้นแบ่ง --}}
<div style="border-bottom: 2pt solid {{ $primaryColor }}; margin: 8pt 0;"></div>