{{-- resources/views/accounting/pdf/quotation/partials/quotation-signature.blade.php --}}
{{-- โครงสร้างตั้งใจให้กินความกว้างเต็ม 100%, page-break-inside: avoid; --}}
<div class="signature-fixed-wrapper signature-inline">
  <table class="signature-table fixed" role="presentation">
    <tr>
      <td class="signature-cell">
        <div class="signature-box" aria-label="พื้นที่ลายเซ็นผู้สั่งซื้อ"></div>
        <div class="signature-role">ผู้สั่งซื้อสินค้า</div><br/>
        <div class="signature-name-placeholder">( ........................................... )</div><br/>
        <div class="signature-date-line">วันที่ ...........................................</div>
      </td>
      <td class="signature-cell">
        <div class="signature-box" aria-label="พื้นที่ลายเซ็นผู้อนุมัติ"></div>
        <div class="signature-role">ผู้อนุมัติ</div><br/>
        <div class="signature-name-placeholder">( ........................................... )</div><br/>
        <div class="signature-date-line">วันที่ ...........................................</div>
      </td>
    </tr>
  </table>
</div>
