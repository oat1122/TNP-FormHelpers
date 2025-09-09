{{-- resources/views/accounting/pdf/invoice/partials/invoice-footer.blade.php --}}
<div style="border-top: 1pt solid #bdc3c7; margin-top: 5pt; padding-top: 8pt;">
    <table style="width: 100%; border-collapse: collapse; font-family: 'thsarabun', sans-serif; font-size: 9pt; color: #7f8c8d;">
        <tr>
            <td style="width: 33%; text-align: left; vertical-align: top;">
                {{-- ข้อมูลบัญชีธนาคาร --}}
                @if(!empty($invoice->company->bank_account))
                  <div style="font-size: 8pt; color: #555;">
                    <strong>ข้อมูลบัญชีธนาคาร:</strong><br>
                    {{ $invoice->company->bank_account }}
                  </div>
                @endif
            </td>
            
            <td style="width: 33%; text-align: center; vertical-align: top;">
                {{-- สถานะเอกสาร --}}
                <div style="color: #2c3e50;">
                    {{ $invoice->document_header_type ?? 'ต้นฉบับ' }}
                    @if(!($isFinal ?? true))
                      <br><span style="color: #e74c3c; font-weight: bold;">PREVIEW - ไม่ใช่เอกสารจริง</span>
                    @endif
                </div>
            </td>
            
            <td style="width: 33%; text-align: right; vertical-align: top;">
                {{-- เลขหน้าและข้อมูลเอกสาร --}}
                <div style="font-weight: bold; color: #2c3e50;">
                    หน้า {PAGENO} จาก {nbpg}
                </div>
            </td>
        </tr>
    </table>
</div>
