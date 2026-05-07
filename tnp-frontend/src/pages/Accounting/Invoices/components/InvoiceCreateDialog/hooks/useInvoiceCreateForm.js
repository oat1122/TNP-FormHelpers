import { useEffect, useMemo, useState } from "react";

import { normalizeCustomer, pickQuotation } from "../../../../Quotations/utils/quotationUtils";

const KNOWN_TERMS = new Set(["cash", "credit_30", "credit_60", "other"]);

/**
 * Form state holder for InvoiceCreateDialog (Phase 2 of redesign).
 *
 * Owns: source quotation reference, customer, billing address override,
 * document header type, notes, due date, payment terms, deposit, special
 * discount, withholding, VAT, pricing mode. Returns nested `formState` +
 * flat `setters` shape — same contract as `useQuotationDuplicateForm`.
 *
 * Sync effects re-pull from source quotation when `quotationData` changes.
 */
export function useInvoiceCreateForm(quotationData) {
  const q = useMemo(() => pickQuotation(quotationData), [quotationData]);
  const customer = useMemo(() => normalizeCustomer(q), [q]);

  // Discount / withholding
  const [specialDiscountType, setSpecialDiscountType] = useState("percentage");
  const [specialDiscountValue, setSpecialDiscountValue] = useState(0);
  const [hasWithholdingTax, setHasWithholdingTax] = useState(false);
  const [withholdingTaxPercentage, setWithholdingTaxPercentage] = useState(0);

  // VAT
  const [hasVat, setHasVat] = useState(true);
  const [vatPercentage, setVatPercentage] = useState(7);
  const [pricingMode, setPricingMode] = useState("net");

  // Payment / deposit / due date
  const [paymentTermsType, setPaymentTermsType] = useState("cash");
  const [paymentTermsCustom, setPaymentTermsCustom] = useState("");
  const [depositMode, setDepositMode] = useState("percentage");
  const [depositPct, setDepositPct] = useState(0);
  const [depositAmountInput, setDepositAmountInput] = useState(0);
  const [selectedDueDate, setSelectedDueDate] = useState(null);

  // Billing address override
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState("");

  // Document header
  const [documentHeaderType, setDocumentHeaderType] = useState("ต้นฉบับ");
  const [customHeaderType, setCustomHeaderType] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  // Re-sync discount/withholding/vat when source quotation changes
  useEffect(() => {
    const qAmt = Number(q?.special_discount_amount || 0);
    const qPct = Number(q?.special_discount_percentage || 0);
    const nextType = qAmt > 0 && qPct === 0 ? "amount" : "percentage";
    setSpecialDiscountType(nextType);
    setSpecialDiscountValue(nextType === "amount" ? qAmt : qPct);
    setHasWithholdingTax(!!q?.has_withholding_tax);
    setWithholdingTaxPercentage(Number(q?.withholding_tax_percentage || 0));
    setHasVat(q?.has_vat !== false);
    setVatPercentage(Number(q?.vat_percentage || 7));
    setPricingMode(q?.pricing_mode || "net");
  }, [
    q?.id,
    q?.has_vat,
    q?.has_withholding_tax,
    q?.pricing_mode,
    q?.special_discount_amount,
    q?.special_discount_percentage,
    q?.vat_percentage,
    q?.withholding_tax_percentage,
  ]);

  // Re-sync payment/deposit/due-date when source quotation changes
  useEffect(() => {
    const raw = q?.payment_terms || "cash";
    const known = KNOWN_TERMS.has(raw);
    setPaymentTermsType(known ? raw : "other");
    setPaymentTermsCustom(known ? "" : raw || "");
    setDepositMode(q?.deposit_mode || "percentage");
    setDepositPct(Number(q?.deposit_percentage || 0));
    setDepositAmountInput(Number(q?.deposit_amount || 0));
    setSelectedDueDate(q?.due_date ? new Date(q.due_date) : null);
  }, [
    q?.deposit_amount,
    q?.deposit_mode,
    q?.deposit_percentage,
    q?.due_date,
    q?.id,
    q?.payment_terms,
  ]);

  // Initialize billing address from customer
  useEffect(() => {
    if (customer?.cus_address) setCustomAddress(customer.cus_address);
  }, [customer?.cus_address]);

  // Initialize notes from quotation
  useEffect(() => {
    if (q?.notes) setNotes(q.notes);
  }, [q?.notes]);

  const formState = useMemo(
    () => ({
      notes,
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
      billing: { isEditing: isEditingAddress, customAddress },
      documentHeader: { type: documentHeaderType, custom: customHeaderType },
    }),
    [
      notes,
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
      isEditingAddress,
      customAddress,
      documentHeaderType,
      customHeaderType,
    ]
  );

  const setters = useMemo(
    () => ({
      setNotes,
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
      setIsEditingAddress,
      setCustomAddress,
      setDocumentHeaderType,
      setCustomHeaderType,
    }),
    []
  );

  return { q, customer, formState, setters };
}
