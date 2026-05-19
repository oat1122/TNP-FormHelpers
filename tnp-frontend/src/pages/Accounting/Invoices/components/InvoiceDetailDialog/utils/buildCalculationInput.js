/**
 * Pure builder — รวม inputs ของ `useInvoiceCalculation` จาก state ปัจจุบัน.
 * แยกออกจาก shell เพื่อให้ shell ไม่ต้องประกอบ 14 fields ด้วยตัวเอง.
 */
export const buildCalculationInput = ({
  isEditing,
  editableItems,
  invoice,
  formData,
  discountTypeState,
}) => ({
  items: isEditing ? editableItems : invoice?.items || [],
  pricingMode: formData.pricing_mode,
  specialDiscountType: discountTypeState,
  specialDiscountValue:
    discountTypeState === "percentage"
      ? formData.special_discount_percentage
      : formData.special_discount_amount,
  hasVat: formData.has_vat,
  vatPercentage: formData.vat_percentage,
  hasWithholdingTax: formData.has_withholding_tax,
  withholdingTaxPercentage: formData.withholding_tax_percentage,
  withholdingTaxBase: formData.withholding_tax_base,
  depositMode: formData.deposit_mode,
  depositPercentage: formData.deposit_percentage,
  depositAmountInput: formData.deposit_amount,
  depositDisplayOrder: formData.deposit_display_order,
});
