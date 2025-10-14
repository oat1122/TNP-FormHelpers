{{-- resources/views/accounting/pdf/quotation/partials/quotation-footer.blade.php --}}
<div class="pdf-footer" style="border-top:1pt solid #bdc3c7; margin-top:6pt; padding-top:6pt;">
    <table class="footer-table" role="presentation" style="width:100%; border-collapse:collapse; font-family:'thsarabun',sans-serif; font-size:8.5pt; color:#555;">
        <tr>
            <td style="width:34%; text-align:left; vertical-align:top;">
                @if(!empty($quotation->company->bank_account))
                    <div><strong>บัญชีธนาคาร:</strong><br>{{ $quotation->company->bank_account }}</div>
                @endif
            </td>
            <td style="width:32%; text-align:center; vertical-align:top;">
                <div>
                    @if(!($isFinal ?? true))
                        <span style="color:#e74c3c; font-weight:bold;">PREVIEW - ไม่ใช่เอกสารจริง</span>
                    @endif
                </div>
            </td>
            <td style="width:34%; text-align:right; vertical-align:top;">
                <div style="font-weight:600; color:#2c3e50;">หน้า {PAGENO} จาก {nbpg}</div>
            </td>
        </tr>
    </table>
</div>
