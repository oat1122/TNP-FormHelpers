// Pure payload builder for InvoiceCreateDialog save flow.
// No side-effects, no hooks, no API calls.
import { toISODate } from "../../../../Quotations/utils/quotationUtils";

const CREDIT_TERMS = new Set(["credit_30", "credit_60"]);

/**
 * Map editor groups → flat invoice_items array (one row per size).
 * Sequence_order is global across all groups, starting at 1.
 */
export function buildInvoiceItems(groups) {
  let seq = 0;
  return groups.flatMap((g) => {
    const unit = g.unit || "ชิ้น";
    const base = {
      pricing_request_id: g.prId || null,
      item_name: g.name || "-",
      pattern: g.pattern || "",
      fabric_type: g.fabricType || "",
      color: g.color || "",
      unit,
    };
    return (g.sizeRows || []).map((r) => {
      seq++;
      const qty =
        typeof r.quantity === "string" ? parseFloat(r.quantity || "0") : Number(r.quantity || 0);
      const price =
        typeof r.unitPrice === "string" ? parseFloat(r.unitPrice || "0") : Number(r.unitPrice || 0);
      return {
        ...base,
        size: r.size || "",
        unit_price: isNaN(price) ? 0 : price,
        quantity: isNaN(qty) ? 0 : qty,
        notes: r.notes || "",
        sequence_order: seq,
      };
    });
  });
}

/**
 * Build POST body for `/invoices/create-from-quotation`.
 * Returns a plain object — caller awaits the mutation.
 */
export function buildInvoiceCreatePayload({
  sourceQuotation,
  customer,
  items,
  financials,
  formState,
  invoiceType = "deposit",
  attachments = [],
}) {
  const {
    specialDiscount,
    withholding,
    vat,
    pricingMode,
    deposit,
    payment,
    notes,
    dueDate,
    billing,
    documentHeader,
  } = formState;

  const isCredit = CREDIT_TERMS.has(payment.type);
  const dueDateForSave = isCredit && dueDate ? toISODate(dueDate) : null;
  const payTerms = payment.type === "other" ? payment.custom || "" : payment.type;
  const headerType = documentHeader.type === "อื่นๆ" ? documentHeader.custom : documentHeader.type;
  const billingAddress = billing.isEditing ? billing.customAddress : customer?.cus_address;

  const payload = {
    quotationId: sourceQuotation.id,
    type: invoiceType,
    payment_terms: payTerms,
    payment_method: sourceQuotation?.payment_method || null,
    notes: notes || sourceQuotation?.notes || "",
    custom_billing_address: billingAddress,
    document_header_type: headerType,

    subtotal: financials.subtotal,
    special_discount_percentage:
      specialDiscount.type === "percentage" ? Number(specialDiscount.value || 0) : 0,
    special_discount_amount:
      specialDiscount.type === "amount"
        ? Number(specialDiscount.value || 0)
        : financials.specialDiscountAmount,

    has_vat: vat.enabled,
    vat_percentage: Number(vat.percentage || 0),
    pricing_mode: pricingMode,
    vat_amount: financials.vat,

    has_withholding_tax: withholding.enabled,
    withholding_tax_percentage: Number(withholding.percentage || 0),
    withholding_tax_amount: financials.withholdingTaxAmount,

    total_amount: financials.total,
    final_total_amount: financials.finalTotal,

    deposit_mode: deposit.mode,
    deposit_percentage: financials.depositPercentage,
    deposit_amount: financials.depositAmount,
    deposit_display_order: "before",

    signature_images: sourceQuotation?.signature_images || null,
    sample_images: sourceQuotation?.sample_images || null,

    summary: {
      subtotal: financials.subtotal,
      discount_amount: financials.specialDiscountAmount,
      discounted_base: financials.discountedSubtotal,
      vat: financials.vat,
      total_after_vat: financials.total,
      withholding_amount: financials.withholdingTaxAmount,
      final_total: financials.finalTotal,
      deposit_mode: deposit.mode,
      deposit_percentage: financials.depositPercentage,
      deposit_amount: financials.depositAmount,
      remaining_amount: financials.remainingAmount,
      has_vat: vat.enabled,
      vat_percentage: Number(vat.percentage || 0),
      pricing_mode: pricingMode,
      vat_amount: financials.vat,
    },

    invoice_items: items,
  };

  if (dueDateForSave) payload.due_date = dueDateForSave;

  if (attachments?.length) {
    payload.images = attachments.map((f) => ({ name: f.name, size: f.size, type: f.type }));
  }

  return payload;
}
