// Deprecated hook kept for backward compatibility; wraps new unified financial logic.
import { useQuotationFinancials } from "../../../../shared/hooks/useQuotationFinancials";

export default function useQuotationCalc(
  items,
  depositPercentage,
  _customDepositPercentage, // no longer used
  specialDiscountType = "percentage",
  specialDiscountValue = 0,
  hasWithholdingTax = false,
  withholdingTaxPercentage = 0
) {
  const {
    subtotal,
    vat,
    total,
    specialDiscountAmount,
    discountedSubtotal,
    withholdingTaxAmount,
    finalTotal,
    depositAmount,
    remainingAmount,
  } = useQuotationFinancials({
    items,
    depositPercentage,
    specialDiscountType,
    specialDiscountValue,
    hasWithholdingTax,
    withholdingTaxPercentage,
  });
  return {
    subtotal,
    vat,
    total,
    specialDiscountAmount,
    netAfterDiscount: discountedSubtotal,
    withholdingTaxAmount,
    finalTotal,
    depositAmount,
    remainingAmount,
    warnings: {},
  };
}
