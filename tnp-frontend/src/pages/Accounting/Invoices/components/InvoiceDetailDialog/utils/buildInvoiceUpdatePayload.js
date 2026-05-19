/**
 * Pure helper — รวม form/calculation/side-edit fields เป็น payload
 * พร้อมส่งให้ updateInvoice mutation.
 *
 * Extracted from InvoiceDetailDialog.jsx (`buildUpdatePayload` inline ~40 บรรทัด).
 * เก็บเป็น pure function เพื่อให้ test ง่าย + ใช้ซ้ำใน save flow + confirm modal.
 */
export const buildInvoiceUpdatePayload = ({
  invoice,
  formData,
  notes,
  isEditing,
  editableItems,
  calculation,
  customerDataSource,
  sidePayload,
}) => {
  const payload = {
    id: invoice.id,
    notes: notes || "",
    ...formData,
    items: isEditing ? editableItems : undefined,
    subtotal: calculation.subtotal,
    special_discount_amount: calculation.discountUsed,
    special_discount_percentage: formData.special_discount_percentage,
    vat_amount: calculation.vatAmount,
    // backward-compat: บาง endpoint ใช้ tax_amount
    tax_amount: calculation.vatAmount,
    withholding_tax_amount: calculation.withholdingTaxAmount,
    total_amount: calculation.totalAmount,
    final_total_amount: calculation.finalTotalAmount,
    deposit_amount: calculation.depositAmount,
    deposit_amount_before_vat: calculation.depositAmountBeforeVat,
    deposit_percentage: calculation.depositPercentage,
    customer_data_source: customerDataSource,
    ...sidePayload,
  };

  if (customerDataSource === "master") {
    payload.customer_company = null;
    payload.customer_tax_id = null;
    payload.customer_address = null;
    payload.customer_zip_code = null;
    payload.customer_tel_1 = null;
    payload.customer_email = null;
    payload.customer_firstname = null;
    payload.customer_lastname = null;
  }

  return payload;
};
