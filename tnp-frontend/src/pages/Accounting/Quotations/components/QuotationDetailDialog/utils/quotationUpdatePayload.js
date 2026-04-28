// Pure payload builders for QuotationDetailDialog save flow.
// No side-effects, no hooks, no API calls.
import { PAYMENT_TERMS } from "../../../../shared/constants/paymentTerms";
import { toISODate } from "../../shared/utils/quotationUtils";

// Flatten editable groups into the API items shape.
// Uses a global sequence counter to guarantee unique sequence_order across rows.
export function buildQuotationItems(groups = []) {
  let globalSequence = 0;

  return groups.flatMap((g) => {
    const unit = g.unit || "ชิ้น";
    const base = {
      pricing_request_id: g.prId || null,
      item_name: g.name || "ไม่ระบุชื่องาน",
      item_description: "",
      pattern: g.pattern || "",
      fabric_type: g.fabricType || "",
      color: g.color || "",
      unit,
    };

    return (g.sizeRows || []).map((r) => {
      globalSequence += 1;
      const qty =
        typeof r.quantity === "string" ? parseFloat(r.quantity || "0") : Number(r.quantity || 0);
      const price =
        typeof r.unitPrice === "string" ? parseFloat(r.unitPrice || "0") : Number(r.unitPrice || 0);
      return {
        ...base,
        size: r.size || "",
        unit_price: Number.isNaN(price) ? 0 : price,
        quantity: Number.isNaN(qty) ? 0 : qty,
        notes: r.notes || "",
        sequence_order: globalSequence,
      };
    });
  });
}

// Resolve due_date to ISO string for credit terms, otherwise null.
export function resolveDueDate(paymentTermsType, selectedDueDate) {
  const isCredit =
    paymentTermsType === PAYMENT_TERMS.CREDIT_30 || paymentTermsType === PAYMENT_TERMS.CREDIT_60;
  if (!isCredit) return null;
  return selectedDueDate ? toISODate(selectedDueDate) : null;
}

// Build the full update-quotation payload accepted by `useUpdateQuotationMutation`.
// Caller is responsible for `id` and for unwrapping/awaiting the mutation.
export function buildQuotationUpdatePayload({
  quotationId,
  items,
  totals,
  financials,
  specialDiscount,
  withholding,
  vat,
  pricingMode,
  deposit,
  payment,
  dueDate,
  notes,
  confirmSync,
}) {
  return {
    id: quotationId,
    items,
    subtotal: totals.subtotal,
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
    confirm_sync: !!confirmSync,
  };
}
