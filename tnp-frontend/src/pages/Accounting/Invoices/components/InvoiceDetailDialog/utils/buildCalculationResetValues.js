/**
 * คืน object ของ formData fields ที่ต้องรีเซ็ตกลับเป็นค่า original ของ invoice
 * (ใช้กับปุ่ม "รีเซ็ตการคำนวณ" ใน edit mode).
 *
 * Pure — ไม่แตะ state เพื่อให้ test ง่าย.
 */
export const buildCalculationResetValues = (invoice) => ({
  special_discount_percentage: Number(invoice.special_discount_percentage || 0),
  special_discount_amount: Number(invoice.special_discount_amount || 0),
  has_vat: Boolean(invoice.has_vat ?? true),
  vat_percentage: Number(invoice.vat_percentage || 7.0),
  has_withholding_tax: Boolean(invoice.has_withholding_tax),
  withholding_tax_percentage: Number(invoice.withholding_tax_percentage || 0),
  withholding_tax_base: invoice.withholding_tax_base || "subtotal",
  deposit_percentage: Number(invoice.deposit_percentage || 0),
  deposit_amount: Number(invoice.deposit_amount || 0),
  deposit_mode: invoice.deposit_mode || "percentage",
  deposit_display_order: invoice.deposit_display_order || "before",
});
