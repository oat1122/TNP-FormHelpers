{{-- resources/views/pdf/partials/quotation-footer.blade.php --}}
<div style="border-top: 1pt solid #bdc3c7; margin-top: 5pt; padding-top: 8pt;">
    <table style="width: 100%; border-collapse: collapse; font-family: 'thsarabun', sans-serif; font-size: 10pt; color: #7f8c8d;">
        <tr>
            <td style="width: 33%; text-align: left; vertical-align: top;">
                {{-- ข้อมูลติดต่อบริษัท --}}
                <div style="font-weight: bold; color: #2c3e50; margin-bottom: 2pt;">
                    {{ $quotation->company->name ?? 'บริษัทของคุณ' }}
                </div>
                @if (!empty($quotation->company->phone))
                    <div>โทร: {{ $quotation->company->phone }}</div>
                @endif
                @if (!empty($quotation->company->email))
                    <div>อีเมล: {{ $quotation->company->email }}</div>
                @endif
                @if (!empty($quotation->company->website))
                    <div>เว็บไซต์: {{ $quotation->company->website }}</div>
                @endif
            </td>
            
            <td style="width: 34%; text-align: center; vertical-align: top;">
                {{-- ข้อมูลลูกค้า (สำคัญ) --}}
                <div style="font-weight: bold; color: #2c3e50; margin-bottom: 2pt;">
                    ลูกค้า: {{ $customer['name'] ?: 'ไม่ระบุ' }}
                </div>
                @if (!empty($customer['tel']))
                    <div>โทร: {{ $customer['tel'] }}</div>
                @endif
                @if (!empty($customer['tax_id']))
                    <div>เลขภาษี: {{ $customer['tax_id'] }}</div>
                @endif
            </td>
            
            <td style="width: 33%; text-align: right; vertical-align: top;">
                {{-- เลขหน้าและข้อมูลเอกสาร --}}
                <div style="font-weight: bold; color: #2c3e50;">
                    หน้า {PAGENO} จาก {nbpg}
                </div>
                <div style="margin-top: 2pt;">
                    เอกสารเลขที่: {{ $quotation->number ?? 'DRAFT' }}
                </div>
                <div>
                    พิมพ์เมื่อ: {{ now()->format('d/m/Y H:i') }}
                </div>
                
                {{-- สถานะเอกสาร --}}
                @if (!$isFinal)
                    <div style="color: #e74c3c; font-weight: bold; margin-top: 3pt;">
                        เอกสารตัวอย่าง (PREVIEW)
                    </div>
                @else
                    <div style="color: #27ae60; font-weight: bold; margin-top: 3pt;">
                        เอกสารอย่างเป็นทางการ
                    </div>
                @endif
            </td>
        </tr>
    </table>
    
    {{-- ข้อความสำคัญด้านล่าง --}}
    <div style="text-align: center; margin-top: 8pt; padding-top: 5pt; border-top: 1pt solid #ecf0f1; font-size: 9pt; color: #95a5a6;">
        เอกสารนี้ถูกสร้างโดยระบบอัตโนมัติ | ใบเสนอราคามีอายุ 30 วันนับจากวันที่ออกเอกสาร
        @if (!$isFinal)
            | เอกสารนี้เป็นเพียงตัวอย่าง โปรดรอเอกสารอย่างเป็นทางการ
        @endif
    </div>
</div>