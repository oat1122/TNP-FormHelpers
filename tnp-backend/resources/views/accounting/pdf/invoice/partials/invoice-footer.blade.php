{{-- resources/views/accounting/pdf/invoice/partials/invoice-footer.blade.php --}}
<div style="border-top: 1pt solid #d5dadd; margin-top: 4pt; padding-top: 6pt;">
    <table style="width: 100%; border-collapse: collapse; font-family: 'thsarabun', sans-serif; font-size: 8pt; color: #6b7b83; line-height:1.25;">
        <tr>
                        <td style="width: 33%; text-align: left; vertical-align: top;">
                {{-- ข้อมูลบัญชีธนาคาร --}}
                @if(!empty($invoice->company->bank_account))
                                    <div style="font-size: 7.2pt; color: #566;">
                                        <strong style="font-weight:600; color:#2c3e50;">บัญชีธนาคาร</strong><br>
                                        {!! nl2br(e($invoice->company->bank_account)) !!}
                                    </div>
                @endif
            </td>
            
                        <td style="width: 33%; text-align: center; vertical-align: top;">
                {{-- สถานะเอกสาร --}}
                                <div style="color: #2c3e50; font-size:7.4pt; font-weight:600;">
                                        {{ $invoice->document_header_type ?? 'ต้นฉบับ' }}
                                        @if(!($isFinal ?? true))
                                            <br><span style="color: #e74c3c; font-weight:600;">PREVIEW</span>
                                        @endif
                                </div>
            </td>
            
            <td style="width: 33%; text-align: right; vertical-align: top;">
                <div style="font-weight:600; color:#2c3e50; font-size:7.2pt;">
                    หน้า {PAGENO}/{nbpg}
                </div>
            </td>
        </tr>
    </table>
</div>
