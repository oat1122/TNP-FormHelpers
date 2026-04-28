import { useEffect, useState } from "react";

import { PAYMENT_TERMS } from "../../../../shared/constants/paymentTerms";
import { normalizeCustomer } from "../../shared/utils/quotationUtils";

const inferRawPaymentTerms = (paymentTerms, paymentMethod, creditDays) =>
  paymentTerms ||
  paymentMethod ||
  (creditDays === 30
    ? PAYMENT_TERMS.CREDIT_30
    : creditDays === 60
      ? PAYMENT_TERMS.CREDIT_60
      : PAYMENT_TERMS.CASH);

const isKnownTerm = (raw) =>
  [PAYMENT_TERMS.CASH, PAYMENT_TERMS.CREDIT_30, PAYMENT_TERMS.CREDIT_60].includes(raw);

// Side-effect hook: re-syncs customer / payment / deposit / financial state from the
// latest quotation payload. The financial portion (special discount, WHT, VAT, pricing
// mode) only runs once per quotation id to avoid trampling on user edits.
export function useQuotationDialogFinancialsInit({ quotation: q, open, setters }) {
  const {
    setCustomer,
    setQuotationNotes,
    setPaymentTermsType,
    setPaymentTermsCustom,
    setDepositMode,
    setDepositPct,
    setDepositAmountInput,
    setSelectedDueDate,
    setSpecialDiscountType,
    setSpecialDiscountValue,
    setHasWithholdingTax,
    setWithholdingTaxPercentage,
    setHasVat,
    setVatPercentage,
    setPricingMode,
  } = setters;

  // Customer sync — always follows quotation
  useEffect(() => {
    setCustomer(normalizeCustomer(q));
    // q is referenced as a whole object in normalizeCustomer; intentional dep
  }, [q, setCustomer]);

  // Payment + deposit + notes + due date — re-sync whenever quotation payload changes
  useEffect(() => {
    setQuotationNotes(q?.notes || "");

    const raw = inferRawPaymentTerms(q?.payment_terms, q?.payment_method, q?.credit_days);
    const known = isKnownTerm(raw);
    setPaymentTermsType(known ? raw : PAYMENT_TERMS.OTHER);
    setPaymentTermsCustom(known ? "" : raw || "");

    setDepositPct(q?.deposit_percentage ?? (raw === PAYMENT_TERMS.CASH ? 0 : 50));
    setDepositMode(q?.deposit_mode || "percentage");
    setDepositAmountInput(q?.deposit_mode === "amount" ? (q?.deposit_amount ?? "") : "");
    setSelectedDueDate(q?.due_date ? new Date(q.due_date) : null);
  }, [
    open,
    q?.credit_days,
    q?.deposit_amount,
    q?.deposit_mode,
    q?.deposit_percentage,
    q?.due_date,
    q?.id,
    q?.notes,
    q?.payment_method,
    q?.payment_terms,
    setQuotationNotes,
    setPaymentTermsType,
    setPaymentTermsCustom,
    setDepositPct,
    setDepositMode,
    setDepositAmountInput,
    setSelectedDueDate,
  ]);

  // Financials — initialize once per quotation id; user edits afterwards must stick
  const [hasInitializedFinancials, setHasInitializedFinancials] = useState(false);

  useEffect(() => {
    setHasInitializedFinancials(false);
  }, [q?.id]);

  useEffect(() => {
    if (!q?.id) return;
    if (hasInitializedFinancials) return;

    if ((q.special_discount_percentage ?? 0) > 0) {
      setSpecialDiscountType("percentage");
      setSpecialDiscountValue(Number(q.special_discount_percentage));
    } else if ((q.special_discount_amount ?? 0) > 0) {
      setSpecialDiscountType("amount");
      setSpecialDiscountValue(Number(q.special_discount_amount));
    } else {
      setSpecialDiscountType("percentage");
      setSpecialDiscountValue(0);
    }

    setHasWithholdingTax(!!q.has_withholding_tax);
    setWithholdingTaxPercentage(Number(q.withholding_tax_percentage || 0));

    setHasVat(q?.has_vat ?? true);
    setVatPercentage(Number(q?.vat_percentage || 7));
    setPricingMode(q?.pricing_mode || "net");

    setHasInitializedFinancials(true);
  }, [
    q?.id,
    q?.special_discount_percentage,
    q?.special_discount_amount,
    q?.has_withholding_tax,
    q?.withholding_tax_percentage,
    q?.has_vat,
    q?.vat_percentage,
    q?.pricing_mode,
    hasInitializedFinancials,
    setSpecialDiscountType,
    setSpecialDiscountValue,
    setHasWithholdingTax,
    setWithholdingTaxPercentage,
    setHasVat,
    setVatPercentage,
    setPricingMode,
  ]);
}
