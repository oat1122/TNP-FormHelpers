import { useMemo } from "react";

/**
 * Invoice-specific financial calculation hook.
 * Order of operations (per business rule 2025-08):
 * 1. lineTotal = qty * unitPrice (for each item/row)
 * 2. subtotal = Σ lineTotal
 * 3. discount_used = (special_discount_amount > 0 ? amount : subtotal * pct / 100)
 * 4. effective_subtotal = subtotal - discount_used
 * 5. VAT calculation based on pricing_mode:
 *    - 'net': vat_amount = has_vat ? effective_subtotal * vat_pct / 100 : 0; total = effective_subtotal + vat
 *    - 'vat_included': net_subtotal = effective_subtotal / (1 + vat_pct/100); vat = effective_subtotal - net_subtotal; total = effective_subtotal
 * 6. wht_base: 'subtotal' (default) | 'total_after_vat'
 * 7. wht_amount = has_wht ? (wht_base === 'subtotal' ? net_subtotal : total_amount) * wht_pct / 100 : 0 (ALWAYS use net_subtotal)
 * 8. final_total_amount = total_amount - wht_amount
 * 9. deposit: mode 'percentage' | 'amount' | null; keep deposit_amount_before_vat; deposit_display_order 'before' | 'after'
 */
export function useInvoiceCalculation({
  items = [],
  pricingMode = "net", // 'net' | 'vat_included'
  specialDiscountType = "percentage", // 'percentage' | 'amount'
  specialDiscountValue = 0,
  hasVat = true,
  vatPercentage = 7.0,
  hasWithholdingTax = false,
  withholdingTaxPercentage = 0,
  withholdingTaxBase = "subtotal", // 'subtotal' | 'total_after_vat'
  depositMode = "percentage", // 'percentage' | 'amount' | null
  depositPercentage = 0,
  depositAmountInput = 0,
  depositDisplayOrder = "before", // 'before' | 'after'
}) {
  return useMemo(
    () =>
      computeInvoiceFinancials({
        items,
        pricingMode,
        specialDiscountType,
        specialDiscountValue,
        hasVat,
        vatPercentage,
        hasWithholdingTax,
        withholdingTaxPercentage,
        withholdingTaxBase,
        depositMode,
        depositPercentage,
        depositAmountInput,
        depositDisplayOrder,
      }),
    [
      items,
      pricingMode,
      specialDiscountType,
      specialDiscountValue,
      hasVat,
      vatPercentage,
      hasWithholdingTax,
      withholdingTaxPercentage,
      withholdingTaxBase,
      depositMode,
      depositPercentage,
      depositAmountInput,
      depositDisplayOrder,
    ]
  );
}

export function computeInvoiceFinancials({
  items = [],
  pricingMode = "net", // 'net' | 'vat_included'
  specialDiscountType = "percentage",
  specialDiscountValue = 0,
  hasVat = true,
  vatPercentage = 7.0,
  hasWithholdingTax = false,
  withholdingTaxPercentage = 0,
  withholdingTaxBase = "subtotal",
  depositMode = "percentage",
  depositPercentage = 0,
  depositAmountInput = 0,
  depositDisplayOrder = "before",
}) {
  // Helper function to round to 2 decimal places
  const toMoney = (n) => +Number(n || 0).toFixed(2);

  // 1. Calculate line totals and subtotal
  const normalizedItems = (items || []).map((item) => {
    if (Array.isArray(item.sizeRows) && item.sizeRows.length > 0) {
      // For items with size rows, sum all rows
      const rowSubtotal = item.sizeRows.reduce((sum, row) => {
        const qty = Math.max(0, Number(row.quantity || 0));
        const unitPrice = Math.max(0, Number(row.unitPrice || 0));
        return sum + qty * unitPrice;
      }, 0);
      return { ...item, _computedSubtotal: toMoney(rowSubtotal) };
    } else {
      // For simple items
      const qty = Math.max(0, Number(item.quantity || 0));
      const unitPrice = Math.max(0, Number(item.unit_price || item.unitPrice || 0));
      return { ...item, _computedSubtotal: toMoney(qty * unitPrice) };
    }
  });

  // 2. Subtotal = Σ lineTotal
  const subtotal = toMoney(normalizedItems.reduce((sum, item) => sum + item._computedSubtotal, 0));

  // 3. Special discount calculation
  let discountUsed = 0;
  if (specialDiscountType === "amount" && Number(specialDiscountValue || 0) > 0) {
    discountUsed = Math.min(Number(specialDiscountValue || 0), subtotal);
  } else if (specialDiscountType === "percentage" && Number(specialDiscountValue || 0) > 0) {
    discountUsed = subtotal * (Number(specialDiscountValue || 0) / 100);
  }
  discountUsed = toMoney(discountUsed);

  // 4. Effective subtotal after discount
  const effectiveSubtotal = toMoney(Math.max(0, subtotal - discountUsed));

  // 5. VAT calculation based on pricing mode
  let vatAmount = 0;
  let netSubtotal = effectiveSubtotal;
  let totalAmount = 0;

  if (pricingMode === "vat_included" && hasVat) {
    // Reverse calculation: Extract VAT from included price
    // Formula: netPrice = totalPrice / (1 + vatRate/100)
    const vatRate = Number(vatPercentage || 0) / 100;
    const vatMultiplier = 1 + vatRate;
    netSubtotal = toMoney(effectiveSubtotal / vatMultiplier);
    vatAmount = toMoney(effectiveSubtotal - netSubtotal);
    totalAmount = effectiveSubtotal; // Total is the subtotal itself (already includes VAT)
  } else {
    // Net mode: Standard forward calculation
    vatAmount = hasVat ? toMoney(effectiveSubtotal * (Number(vatPercentage || 0) / 100)) : 0;
    totalAmount = toMoney(effectiveSubtotal + vatAmount);
  }

  // 6. Withholding tax calculation (ALWAYS use net subtotal)
  let withholdingTaxAmount = 0;
  if (hasWithholdingTax) {
    // Withholding tax should ALWAYS be calculated on net amount (before VAT)
    withholdingTaxAmount = toMoney(netSubtotal * (Number(withholdingTaxPercentage || 0) / 100));
  }

  // 7. Final total amount
  const finalTotalAmount = toMoney(Math.max(0, totalAmount - withholdingTaxAmount));

  // 8. Deposit calculation
  let depositAmount = 0;
  let depositAmountBeforeVat = 0;
  let calculatedDepositPercentage = 0;

  if (depositMode === "amount" && Number(depositAmountInput || 0) > 0) {
    depositAmount = Math.min(Number(depositAmountInput || 0), finalTotalAmount);
    calculatedDepositPercentage =
      finalTotalAmount > 0 ? (depositAmount / finalTotalAmount) * 100 : 0;
  } else if (depositMode === "percentage" && Number(depositPercentage || 0) > 0) {
    calculatedDepositPercentage = Math.max(0, Math.min(100, Number(depositPercentage || 0)));
    depositAmount = finalTotalAmount * (calculatedDepositPercentage / 100);
  }

  depositAmount = toMoney(depositAmount);
  calculatedDepositPercentage = toMoney(calculatedDepositPercentage);

  // Calculate deposit before VAT (for display purposes)
  if (depositAmount > 0 && hasVat && vatAmount > 0) {
    depositAmountBeforeVat = toMoney(depositAmount / (1 + Number(vatPercentage || 0) / 100));
  } else {
    depositAmountBeforeVat = depositAmount;
  }

  // 9. Remaining amount
  const remainingAmount = toMoney(Math.max(0, finalTotalAmount - depositAmount));

  return {
    // Input normalization
    normalizedItems,

    // Core calculations
    subtotal,
    discountUsed,
    effectiveSubtotal,
    netSubtotal, // NEW: Net amount before VAT (for vat_included mode)
    vatAmount,
    totalAmount,
    withholdingTaxAmount,
    finalTotalAmount,

    // Deposit calculations
    depositAmount,
    depositAmountBeforeVat,
    depositPercentage: calculatedDepositPercentage,
    remainingAmount,

    // Configuration
    pricingMode, // NEW: Pricing mode
    hasVat,
    vatPercentage: Number(vatPercentage || 0),
    hasWithholdingTax,
    withholdingTaxPercentage: Number(withholdingTaxPercentage || 0),
    withholdingTaxBase,
    depositMode,
    depositDisplayOrder,

    // Helper
    toMoney,
  };
}
