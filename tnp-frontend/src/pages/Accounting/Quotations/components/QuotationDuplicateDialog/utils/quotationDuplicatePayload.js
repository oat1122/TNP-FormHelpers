// Pure payload builder for QuotationDuplicateDialog save flow.
// No side-effects, no hooks, no API calls.
import { PAYMENT_TERMS } from "../../../../shared/constants/paymentTerms";

// Build save payload from the source quotation + edited form state.
//
// `mode` controls whether image fields are included:
//   - "duplicate" (default) → include sample_images (carries over to new doc)
//   - "edit"                → exclude sample_images / signature_images
//                             (managed by dedicated upload + toggle endpoints —
//                             including stale snapshot here would overwrite
//                             newly-uploaded images)
//
// Caller awaits the mutation.
export function buildQuotationDuplicatePayload({
  sourceQuotation,
  customer,
  items,
  financials,
  formState,
  dueDate,
  mode = "duplicate",
}) {
  const { specialDiscount, withholding, vat, pricingMode, deposit, payment, notes } = formState;
  const isEdit = mode === "edit";

  const payload = {
    company_id: sourceQuotation.company_id,
    customer_id: customer?.cus_id || sourceQuotation.customer_id,
    work_name: sourceQuotation.work_name,

    primary_pricing_request_id: sourceQuotation.primary_pricing_request_id || null,
    primary_pricing_request_ids: sourceQuotation.primary_pricing_request_ids || [],

    items,

    subtotal: financials.subtotal,
    net_subtotal: financials.netSubtotal,
    tax_amount: financials.vat,
    total_amount: financials.total,

    special_discount_percentage:
      specialDiscount.type === "percentage" ? Number(specialDiscount.value || 0) : 0,
    special_discount_amount:
      specialDiscount.type === "amount"
        ? Number(specialDiscount.value || 0)
        : financials.specialDiscountAmount,

    has_vat: vat.enabled,
    vat_percentage: Number(vat.percentage || 0),
    pricing_mode: pricingMode,

    has_withholding_tax: withholding.enabled,
    withholding_tax_percentage: withholding.enabled ? Number(withholding.percentage || 0) : 0,
    withholding_tax_amount: financials.withholdingTaxAmount,
    final_total_amount: financials.finalTotal,

    deposit_percentage:
      deposit.mode === "percentage"
        ? Number(deposit.percentage || 0)
        : Number(financials.depositPercentage || 0),
    deposit_amount: financials.depositAmount,
    deposit_mode: deposit.mode,

    payment_terms: payment.type === PAYMENT_TERMS.OTHER ? payment.custom || "" : payment.type,
    due_date: dueDate,
    notes: notes || "",
  };

  // Carry over images only on duplicate; in edit mode, omit so BE preserves
  // whatever was uploaded via the dedicated endpoints.
  if (!isEdit) {
    payload.sample_images = sourceQuotation?.sample_images || [];
  }

  return payload;
}
