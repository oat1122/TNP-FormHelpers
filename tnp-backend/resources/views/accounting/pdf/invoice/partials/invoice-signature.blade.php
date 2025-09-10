{{-- resources/views/accounting/pdf/invoice/partials/invoice-signature.blade.php --}}
{{-- NOTE: ใช้ร่วมกับ adaptive placement ใน InvoicePdfMasterService::renderSignatureAdaptive() --}}
{{-- โครงสร้างตั้งใจให้กินความกว้างเต็ม 100%, page-break-inside: avoid; และมี class เดียวกับ Quotation เพื่อง่ายต่อการ reuse CSS --}}
<div class="signature-fixed-wrapper signature-inline">
  <table class="signature-table fixed" role="presentation">
    <tr>
      <td class="signature-cell">
        <div class="signature-box" aria-label="พื้นที่ลายเซ็นผู้สั่งซื้อ"></div>
        <div class="signature-role">ผู้สั่งซื้อสินค้า</div><br/>
        <div class="signature-name-placeholder">( ........................................... )</div><br/>
        <div class="signature-date-line">วันที่ ...........................................</div><br/>
      </td>
      <td class="signature-cell">
        <div class="signature-box" aria-label="พื้นที่ลายเซ็นผู้อนุมัติ"></div>
        <div class="signature-role">ผู้อนุมัติ</div><br/>
        <div class="signature-name-placeholder">( ........................................... )</div><br/>
        <div class="signature-date-line">วันที่ ...........................................</div><br/>
      </td>
    </tr>
  </table>
</div>
