import { DEFAULT_DEPOSIT_PERCENTAGE, DEFAULT_VAT_PERCENTAGE } from "./pricingConstants";

export const buildQuotationItems = (items = []) =>
  items.flatMap((item, index) => {
    if (Array.isArray(item.sizeRows) && item.sizeRows.length > 0) {
      return item.sizeRows.map((row, rIndex) => ({
        pricing_request_id: item.isFromPR ? item.pricingRequestId || null : null,
        item_name: item.name,
        pattern: item.pattern || "",
        fabric_type: item.fabricType || "",
        color: item.color || "",
        size: row.size || "",
        unit_price: parseFloat(row.unitPrice) || 0,
        quantity: parseInt(row.quantity, 10) || 0,
        sequence_order: (index + 1) * 100 + (rIndex + 1),
        unit: item.unit ?? "",
        notes: row.notes || "",
      }));
    }
    return [
      {
        pricing_request_id: item.isFromPR ? item.pricingRequestId || null : null,
        item_name: item.name,
        pattern: item.pattern || "",
        fabric_type: item.fabricType || "",
        color: item.color || "",
        size: item.size || "",
        unit_price: parseFloat(item.unitPrice) || 0,
        quantity: parseInt(item.quantity, 10) || 0,
        sequence_order: index + 1,
        unit: item.unit ?? "",
        notes: item.notes || "",
      },
    ];
  });

export const buildCreateQuotationPayload = ({ formData, selectedPricingRequests }) => ({
  pricing_request_ids: selectedPricingRequests.map((pr) => pr.pr_id),
  customer_id: formData.customer?.cus_id || selectedPricingRequests[0]?.pr_cus_id,

  subtotal: formData.subtotal || 0,
  tax_amount: formData.vat || 0,
  total_amount: formData.total || 0,

  special_discount_percentage:
    formData.specialDiscountType === "percentage" ? formData.specialDiscountValue || 0 : 0,
  special_discount_amount:
    formData.specialDiscountType === "amount"
      ? formData.specialDiscountValue || formData.specialDiscountAmount || 0
      : formData.specialDiscountAmount || 0,
  has_withholding_tax: formData.hasWithholdingTax || false,
  withholding_tax_percentage: formData.withholdingTaxPercentage || 0,
  withholding_tax_amount: formData.withholdingTaxAmount || 0,
  final_total_amount:
    formData.finalTotal ||
    formData.total - (formData.specialDiscountAmount || 0) - (formData.withholdingTaxAmount || 0),

  has_vat: formData.hasVat !== undefined ? formData.hasVat : true,
  vat_percentage: formData.vatPercentage || DEFAULT_VAT_PERCENTAGE,
  pricing_mode: formData.pricingMode || "net",

  deposit_mode: formData.depositMode || "percentage",
  deposit_percentage:
    formData.depositMode === "percentage"
      ? parseFloat(formData.depositPercentage) || DEFAULT_DEPOSIT_PERCENTAGE
      : parseFloat(formData.depositPercentage) || 0,
  deposit_amount:
    formData.depositMode === "amount"
      ? parseFloat(formData.depositAmountInput) || 0
      : formData.depositAmount || 0,
  payment_terms: formData.paymentMethod || "credit_30",
  due_date: formData.due_date ? formData.due_date : null,

  items: buildQuotationItems(formData.items),

  notes: formData.notes || "",
  sample_images: Array.isArray(formData.sample_images) ? formData.sample_images : [],
});
