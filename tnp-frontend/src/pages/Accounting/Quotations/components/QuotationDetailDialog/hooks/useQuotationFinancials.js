// 📁hooks/useQuotationFinancials.js
import { useMemo } from "react";

/**
 * Unified financial calculation hook for quotations.
 * Order of operations (per business rule 2025-08):
 * 1. Subtotal = sum(items)
 * 2. Special Discount applied to subtotal (before VAT)
 * 3. Discounted Subtotal = subtotal - specialDiscountAmount (never < 0)
 * 4. VAT computed on discounted subtotal (editable rate, default 7%)
 * 5. Withholding tax (if enabled) computed on discounted subtotal (pre-VAT base)
 * 6. Total (total_amount) = discountedSubtotal + vat
 * 7. Final total (final_total_amount) = Total - withholdingTaxAmount
 * 8. Deposit / Remaining based on final total
 */
export function useQuotationFinancials({
  items = [],
  depositMode = "percentage", // 'percentage' | 'amount'
  depositPercentage = 0,
  depositAmountInput = 0,
  specialDiscountType = "percentage", // 'percentage' | 'amount'
  specialDiscountValue = 0,
  hasWithholdingTax = false,
  withholdingTaxPercentage = 0,
  hasVat = true, // NEW: Enable/disable VAT
  vatPercentage = 7, // NEW: Editable VAT rate
}) {
  return useMemo(
    () =>
      computeFinancials({
        items,
        depositMode,
        depositPercentage,
        depositAmountInput,
        specialDiscountType,
        specialDiscountValue,
        hasWithholdingTax,
        withholdingTaxPercentage,
        hasVat,
        vatPercentage,
      }),
    [
      items,
      depositMode,
      depositPercentage,
      depositAmountInput,
      specialDiscountType,
      specialDiscountValue,
      hasWithholdingTax,
      withholdingTaxPercentage,
      hasVat,
      vatPercentage,
    ]
  );
}

export function computeFinancials({
  items = [],
  depositMode = "percentage",
  depositPercentage = 0,
  depositAmountInput = 0,
  specialDiscountType = "percentage",
  specialDiscountValue = 0,
  hasWithholdingTax = false,
  withholdingTaxPercentage = 0,
  hasVat = true, // NEW: Enable/disable VAT
  vatPercentage = 7, // NEW: Editable VAT rate
}) {
  // 1. Subtotal
  const normalizedItems = (items || []).map((it) => {
    if (Array.isArray(it.sizeRows) && it.sizeRows.length > 0) {
      const rowSubtotal = it.sizeRows.reduce(
        (s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0),
        0
      );
      return { ...it, _computedSubtotal: rowSubtotal };
    }
    return { ...it, _computedSubtotal: Number(it.quantity || 0) * Number(it.unitPrice || 0) };
  });
  const subtotal = normalizedItems.reduce((s, it) => s + Number(it._computedSubtotal || 0), 0);

  // 2. Discount (on subtotal)
  let specialDiscountAmount = 0;
  if (specialDiscountType === "percentage") {
    specialDiscountAmount = subtotal * (Number(specialDiscountValue || 0) / 100);
  } else if (specialDiscountType === "amount") {
    specialDiscountAmount = Number(specialDiscountValue || 0);
  }
  if (specialDiscountAmount > subtotal) specialDiscountAmount = subtotal; // cap

  // 3. Discounted subtotal
  const discountedSubtotal = subtotal - specialDiscountAmount;

  // 4. VAT on discounted subtotal (editable rate)
  const vatRate = hasVat ? Number(vatPercentage || 0) / 100 : 0;
  const vat = +(discountedSubtotal * vatRate).toFixed(2);

  // 5. Withholding tax (on discounted subtotal pre-VAT base)
  const withholdingTaxAmount = hasWithholdingTax
    ? +(discountedSubtotal * (Number(withholdingTaxPercentage || 0) / 100)).toFixed(2)
    : 0;

  // 6. Total (after VAT, before withholding)
  const total = +(discountedSubtotal + vat).toFixed(2);

  // 7. Final total after withholding
  const finalTotal = +(total - withholdingTaxAmount).toFixed(2);

  // 8. Deposit / Remaining
  let depPct = 0;
  let depositAmount = 0;
  if (depositMode === "amount") {
    depositAmount = Math.max(0, Math.min(finalTotal, Number(depositAmountInput || 0)));
    depPct = finalTotal > 0 ? (depositAmount / finalTotal) * 100 : 0;
  } else {
    // percentage
    depPct = Math.max(0, Math.min(100, Number(depositPercentage || 0)));
    depositAmount = +(finalTotal * (depPct / 100)).toFixed(2);
  }
  const remainingAmount = +(finalTotal - depositAmount).toFixed(2);

  return {
    subtotal,
    specialDiscountAmount: +specialDiscountAmount.toFixed(2),
    discountedSubtotal: +discountedSubtotal.toFixed(2),
    vat,
    total, // total_amount (discountedSubtotal + vat)
    withholdingTaxAmount,
    finalTotal, // final_total_amount
    depositAmount,
    depositPercentage: +depPct.toFixed(4),
    remainingAmount,
    // VAT-related fields
    hasVat,
    vatPercentage: Number(vatPercentage || 0),
    vatRate,
  };
}