import { useMemo, useState } from "react";

import { PAYMENT_TERMS } from "../../../../shared/constants/paymentTerms";
import { normalizeCustomer, pickQuotation } from "../../shared/utils/quotationUtils";

// State holder for QuotationDuplicateDialog. Mirrors useQuotationDialogLogic but
// seeds from the `initialData` prop (no fetch). Returns nested `formState` +
// `setters` objects so the shell + Phase 4 sections can consume the same shape.
//
// Effects (re-syncing on `open` / `initialData` change) live in
// `useQuotationDialogFinancialsInit` (reused from Phase 4).
export function useQuotationDuplicateDialogLogic(initialData) {
  const q = useMemo(() => pickQuotation(initialData), [initialData]);

  // Customer
  const [customer, setCustomer] = useState(() => normalizeCustomer(q));
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);

  // Notes + due date
  const [quotationNotes, setQuotationNotes] = useState(q?.notes || "");
  const [selectedDueDate, setSelectedDueDate] = useState(q?.due_date ? new Date(q.due_date) : null);

  // Payment terms — predefined codes vs custom string
  const initialRawTerms =
    q?.payment_terms ||
    q?.payment_method ||
    (q?.credit_days === 30
      ? PAYMENT_TERMS.CREDIT_30
      : q?.credit_days === 60
        ? PAYMENT_TERMS.CREDIT_60
        : PAYMENT_TERMS.CASH);
  const isKnownTerms = [
    PAYMENT_TERMS.CASH,
    PAYMENT_TERMS.CREDIT_30,
    PAYMENT_TERMS.CREDIT_60,
  ].includes(initialRawTerms);

  const [paymentTermsType, setPaymentTermsType] = useState(
    isKnownTerms ? initialRawTerms : PAYMENT_TERMS.OTHER
  );
  const [paymentTermsCustom, setPaymentTermsCustom] = useState(
    isKnownTerms ? "" : initialRawTerms || ""
  );

  // Deposit (percentage | amount)
  const inferredDepositPct =
    q?.deposit_percentage ?? (initialRawTerms === PAYMENT_TERMS.CASH ? 0 : 50);

  const [depositMode, setDepositMode] = useState(q?.deposit_mode || "percentage");
  const [depositPct, setDepositPct] = useState(inferredDepositPct);
  const [depositAmountInput, setDepositAmountInput] = useState(
    q?.deposit_mode === "amount" ? (q?.deposit_amount ?? "") : ""
  );

  // Financial states
  const [specialDiscountType, setSpecialDiscountType] = useState(() => {
    if ((q?.special_discount_percentage ?? 0) > 0) return "percentage";
    if ((q?.special_discount_amount ?? 0) > 0) return "amount";
    return "percentage";
  });
  const [specialDiscountValue, setSpecialDiscountValue] = useState(() => {
    if ((q?.special_discount_percentage ?? 0) > 0) return Number(q.special_discount_percentage);
    if ((q?.special_discount_amount ?? 0) > 0) return Number(q.special_discount_amount);
    return 0;
  });
  const [hasWithholdingTax, setHasWithholdingTax] = useState(() => !!q?.has_withholding_tax);
  const [withholdingTaxPercentage, setWithholdingTaxPercentage] = useState(() =>
    Number(q?.withholding_tax_percentage || 0)
  );
  const [hasVat, setHasVat] = useState(() => q?.has_vat ?? true);
  const [vatPercentage, setVatPercentage] = useState(() => Number(q?.vat_percentage || 7));
  const [pricingMode, setPricingMode] = useState(() => q?.pricing_mode || "net");

  const formState = useMemo(
    () => ({
      notes: quotationNotes,
      dueDate: selectedDueDate,
      payment: { type: paymentTermsType, custom: paymentTermsCustom },
      deposit: {
        mode: depositMode,
        percentage: depositPct,
        amountInput: depositAmountInput,
      },
      specialDiscount: { type: specialDiscountType, value: specialDiscountValue },
      withholding: { enabled: hasWithholdingTax, percentage: withholdingTaxPercentage },
      vat: { enabled: hasVat, percentage: vatPercentage },
      pricingMode,
    }),
    [
      quotationNotes,
      selectedDueDate,
      paymentTermsType,
      paymentTermsCustom,
      depositMode,
      depositPct,
      depositAmountInput,
      specialDiscountType,
      specialDiscountValue,
      hasWithholdingTax,
      withholdingTaxPercentage,
      hasVat,
      vatPercentage,
      pricingMode,
    ]
  );

  const setters = useMemo(
    () => ({
      setCustomer,
      setEditCustomerOpen,
      setQuotationNotes,
      setSelectedDueDate,
      setPaymentTermsType,
      setPaymentTermsCustom,
      setDepositMode,
      setDepositPct,
      setDepositAmountInput,
      setSpecialDiscountType,
      setSpecialDiscountValue,
      setHasWithholdingTax,
      setWithholdingTaxPercentage,
      setHasVat,
      setVatPercentage,
      setPricingMode,
    }),
    []
  );

  return {
    q,
    customer,
    editCustomerOpen,
    formState,
    setters,
  };
}
