// 📁hooks/useQuotationDialogLogic.js
import React from "react";
import {
  useGetQuotationQuery,
  useUpdateQuotationMutation,
} from "../../../../../../features/Accounting/accountingApi";
import { pickQuotation, normalizeCustomer, toISODate, computeTotals } from "../utils/quotationUtils";
import { showSuccess, showError, showLoading, dismissToast } from "../../../../utils/accountingToast";

export function useQuotationDialogLogic(quotationId, open) {
  const { data, isLoading, error } = useGetQuotationQuery(quotationId, {
    skip: !open || !quotationId,
  });
  const q = pickQuotation(data);

  const [updateQuotation, { isLoading: isSaving }] = useUpdateQuotationMutation();

  // State for Customer
  const [customer, setCustomer] = React.useState(() => normalizeCustomer(q));
  const [editCustomerOpen, setEditCustomerOpen] = React.useState(false);

  // State for Payment Terms & Notes
  const [quotationNotes, setQuotationNotes] = React.useState(q?.notes || "");
  const [selectedDueDate, setSelectedDueDate] = React.useState(
    q?.due_date ? new Date(q.due_date) : null
  );
  
  // Payment terms: support predefined codes and a custom (อื่นๆ) value
  const initialRawTerms =
    q?.payment_terms ||
    q?.payment_method ||
    (q?.credit_days === 30 ? "credit_30" : q?.credit_days === 60 ? "credit_60" : "cash");
  const isKnownTerms = ["cash", "credit_30", "credit_60"].includes(initialRawTerms);
  
  const [paymentTermsType, setPaymentTermsType] = React.useState(
    isKnownTerms ? initialRawTerms : "other"
  );
  const [paymentTermsCustom, setPaymentTermsCustom] = React.useState(
    isKnownTerms ? "" : initialRawTerms || ""
  );

  // Deposit state (supports percentage | amount)
  const inferredDepositPct =
    q?.deposit_percentage ??
    (initialRawTerms === "cash" ? 0 : 50);
    
  const [depositMode, setDepositMode] = React.useState(q?.deposit_mode || "percentage");
  const [depositPct, setDepositPct] = React.useState(inferredDepositPct);
  const [depositAmountInput, setDepositAmountInput] = React.useState(
    q?.deposit_mode === "amount" ? (q?.deposit_amount ?? "") : ""
  );

  // Financial states (editable)
  const [specialDiscountType, setSpecialDiscountType] = React.useState(() => {
    // infer type from existing data
    if ((q.special_discount_percentage ?? 0) > 0) return "percentage";
    if ((q.special_discount_amount ?? 0) > 0) return "amount";
    return "percentage";
  });
  const [specialDiscountValue, setSpecialDiscountValue] = React.useState(() => {
    if ((q.special_discount_percentage ?? 0) > 0) return Number(q.special_discount_percentage);
    if ((q.special_discount_amount ?? 0) > 0) return Number(q.special_discount_amount);
    return 0;
  });
  const [hasWithholdingTax, setHasWithholdingTax] = React.useState(() => !!q.has_withholding_tax);
  const [withholdingTaxPercentage, setWithholdingTaxPercentage] = React.useState(() =>
    Number(q.withholding_tax_percentage || 0)
  );

  // Effect to sync state when quotation data is loaded or changed
  React.useEffect(() => {
    setCustomer(normalizeCustomer(q));
  }, [q?.id, q?.customer_name, q?.customer]);

  React.useEffect(() => {
    // Sync notes from server when quotation changes/opened
    setQuotationNotes(q?.notes || "");
    
    const raw =
      q?.payment_terms ||
      q?.payment_method ||
      (q?.credit_days === 30 ? "credit_30" : q?.credit_days === 60 ? "credit_60" : "cash");
    const known = ["cash", "credit_30", "credit_60"].includes(raw);
    setPaymentTermsType(known ? raw : "other");
    setPaymentTermsCustom(known ? "" : raw || "");
    
    setDepositPct(
      q?.deposit_percentage ??
      (raw === "cash" ? 0 : 50)
    );
    setDepositMode(q?.deposit_mode || "percentage");
    setDepositAmountInput(q?.deposit_mode === "amount" ? (q?.deposit_amount ?? "") : "");
    setSelectedDueDate(q?.due_date ? new Date(q.due_date) : null);
  }, [open, q?.id, q?.notes]);

  // Sync financial fields (special discount & withholding tax) after data fetched unless user is editing
  const [hasInitializedFinancials, setHasInitializedFinancials] = React.useState(false);
  React.useEffect(() => {
    if (!q?.id) return; // nothing yet
    if (hasInitializedFinancials) return; // don't override after initial setup

    // Re-infer special discount type/value from latest quotation data
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

    // Withholding tax
    setHasWithholdingTax(!!q.has_withholding_tax);
    setWithholdingTaxPercentage(Number(q.withholding_tax_percentage || 0));
    
    setHasInitializedFinancials(true);
  }, [
    q?.id,
    q?.special_discount_percentage,
    q?.special_discount_amount,
    q?.has_withholding_tax,
    q?.withholding_tax_percentage,
    hasInitializedFinancials,
  ]);

  // Main Save Handler
  const handleSave = async (groups, financials) => {
    // Map editable groups back to API items
    const flatItems = groups.flatMap((g) => {
      const unit = g.unit || "ชิ้น";
      const base = {
        pricing_request_id: g.prId || null,
        item_name: g.name || "ไม่ระบุชื่องาน",
        pattern: g.pattern || "",
        fabric_type: g.fabricType || "",
        color: g.color || "",
        unit,
      };
      return (g.sizeRows || []).map((r, idx) => {
        const qty =
          typeof r.quantity === "string" ? parseFloat(r.quantity || "0") : Number(r.quantity || 0);
        const price =
          typeof r.unitPrice === "string"
            ? parseFloat(r.unitPrice || "0")
            : Number(r.unitPrice || 0);
        return {
          ...base,
          size: r.size || "",
          unit_price: isNaN(price) ? 0 : price,
          quantity: isNaN(qty) ? 0 : qty,
          notes: r.notes || "",
          sequence_order: idx + 1,
        };
      });
    });

    const totals = computeTotals(groups, depositPct);
    const isCredit = paymentTermsType === "credit_30" || paymentTermsType === "credit_60";
    const dueDateForSave = isCredit ? (selectedDueDate ? toISODate(selectedDueDate) : null) : null;
    
    const loadingId = showLoading("กำลังบันทึกใบเสนอราคา…");
    
    try {
      await updateQuotation({
        id: q.id,
        items: flatItems,
        subtotal: totals.subtotal,
        // Use calculated values from financials hook
        tax_amount: financials.vat,
        total_amount: financials.total,
        // ⭐ Extended financial fields (from local editable states)
        special_discount_percentage:
          specialDiscountType === "percentage" ? Number(specialDiscountValue || 0) : 0,
        special_discount_amount:
          specialDiscountType === "amount"
            ? Number(specialDiscountValue || 0)
            : financials.specialDiscountAmount,
        has_withholding_tax: hasWithholdingTax,
        withholding_tax_percentage: hasWithholdingTax ? Number(withholdingTaxPercentage || 0) : 0,
        withholding_tax_amount: financials.withholdingTaxAmount,
        final_total_amount: financials.finalTotal,
        deposit_percentage:
          depositMode === "percentage"
            ? Number(depositPct || 0)
            : Number(financials.depositPercentage || 0),
        deposit_amount: financials.depositAmount,
        deposit_mode: depositMode,
        payment_terms: paymentTermsType === "other" ? paymentTermsCustom || "" : paymentTermsType,
        due_date: dueDateForSave,
        notes: quotationNotes || "",
      }).unwrap();

      dismissToast(loadingId);
      showSuccess("บันทึกใบเสนอราคาเรียบร้อย");
      return true;
    } catch (e) {
      dismissToast(loadingId);
      showError(e?.data?.message || e?.message || "บันทึกใบเสนอราคาไม่สำเร็จ");
      return false;
    }
  };

  return {
    q,
    isLoading,
    isSaving,
    error,
    customer,
    setCustomer,
    editCustomerOpen,
    setEditCustomerOpen,
    quotationNotes,
    setQuotationNotes,
    selectedDueDate,
    setSelectedDueDate,
    paymentTermsType,
    setPaymentTermsType,
    paymentTermsCustom,
    setPaymentTermsCustom,
    depositMode,
    setDepositMode,
    depositPct,
    setDepositPct,
    depositAmountInput,
    setDepositAmountInput,
    specialDiscountType,
    setSpecialDiscountType,
    specialDiscountValue,
    setSpecialDiscountValue,
    hasWithholdingTax,
    setHasWithholdingTax,
    withholdingTaxPercentage,
    setWithholdingTaxPercentage,
    handleSave,
  };
}