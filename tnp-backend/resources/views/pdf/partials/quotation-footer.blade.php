{{-- resources/views/pdf/partials/quotation-footer.blade.php --}}
<div style="border-top: 2pt solid {{ $primaryColor }}; margin-top: 5pt; padding-top: 8pt;">
    <table style="width: 100%; border-collapse: collapse; font-family: 'thsarabun', sans-serif; font-size: 10pt; color: #7f8c8d;">
        <tr>
            <td style="width: 50%; text-align: left; vertical-align: top;">
                {{ $quotation->company->name ?? 'บริษัทของคุณ' }} | โทร: {{ $quotation->company->phone ?? '-' }}
            </td>
            <td style="width: 50%; text-align: right; vertical-align: top;">
                <div style="font-weight: bold; color: {{ $primaryColor }};">
                    หน้า {PAGENO} จาก {nbpg}
                </div>
            </td>
        </tr>
    </table>
</div>
