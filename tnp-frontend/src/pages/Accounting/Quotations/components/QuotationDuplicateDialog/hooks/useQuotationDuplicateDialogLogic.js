// 📁hooks/useQuotationDuplicateDialogLogic.js
import React from "react";
import { useCreateStandaloneQuotationMutation } from "../../../../../../features/Accounting/accountingApi";
import { pickQuotation, normalizeCustomer, toISODate } from "../utils/quotationUtils";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../../../../utils/accountingToast";

/**
 * Hook สำหรับ Dialog การทำสำเนาใบเสนอราคา
 * ใช้ initialData แทนการ fetch และใช้ create แทน update
 */
export function useQuotationDuplicateDialogLogic(initialData, open) {
  // ไม่มี isLoading เพราะข้อมูลมาจาก props
  const q = pickQuotation(initialData);
  const isLoading = false;
  const error = null;

  const [createQuotation, { isLoading: isSaving }] = useCreateStandaloneQuotationMutation();

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
  const inferredDepositPct = q?.deposit_percentage ?? (initialRawTerms === "cash" ? 0 : 50);

  const [depositMode, setDepositMode] = React.useState(q?.deposit_mode || "percentage");
  const [depositPct, setDepositPct] = React.useState(inferredDepositPct);
  const [depositAmountInput, setDepositAmountInput] = React.useState(
    q?.deposit_mode === "amount" ? (q?.deposit_amount ?? "") : ""
  );

  // Financial states (editable)
  const [specialDiscountType, setSpecialDiscountType] = React.useState(() => {
    // infer type from existing data
    if ((q?.special_discount_percentage ?? 0) > 0) return "percentage";
    if ((q?.special_discount_amount ?? 0) > 0) return "amount";
    return "percentage";
  });
  const [specialDiscountValue, setSpecialDiscountValue] = React.useState(() => {
    if ((q?.special_discount_percentage ?? 0) > 0) return Number(q.special_discount_percentage);
    if ((q?.special_discount_amount ?? 0) > 0) return Number(q.special_discount_amount);
    return 0;
  });
  const [hasWithholdingTax, setHasWithholdingTax] = React.useState(() => !!q?.has_withholding_tax);
  const [withholdingTaxPercentage, setWithholdingTaxPercentage] = React.useState(() =>
    Number(q?.withholding_tax_percentage || 0)
  );

  // VAT states (NEW)
  const [hasVat, setHasVat] = React.useState(() => q?.has_vat ?? true);
  const [vatPercentage, setVatPercentage] = React.useState(() => Number(q?.vat_percentage || 7));
  const [pricingMode, setPricingMode] = React.useState(() => q?.pricing_mode || "net");

  // Effect to sync state when initialData changes
  React.useEffect(() => {
    if (!open) return;
    const freshQ = pickQuotation(initialData);
    setCustomer(normalizeCustomer(freshQ));
    setQuotationNotes(freshQ?.notes || "");

    const raw =
      freshQ?.payment_terms ||
      freshQ?.payment_method ||
      (freshQ?.credit_days === 30
        ? "credit_30"
        : freshQ?.credit_days === 60
          ? "credit_60"
          : "cash");
    const known = ["cash", "credit_30", "credit_60"].includes(raw);
    setPaymentTermsType(known ? raw : "other");
    setPaymentTermsCustom(known ? "" : raw || "");

    setDepositPct(freshQ?.deposit_percentage ?? (raw === "cash" ? 0 : 50));
    setDepositMode(freshQ?.deposit_mode || "percentage");
    setDepositAmountInput(freshQ?.deposit_mode === "amount" ? (freshQ?.deposit_amount ?? "") : "");
    setSelectedDueDate(freshQ?.due_date ? new Date(freshQ.due_date) : null);

    // Financial fields
    if ((freshQ?.special_discount_percentage ?? 0) > 0) {
      setSpecialDiscountType("percentage");
      setSpecialDiscountValue(Number(freshQ.special_discount_percentage));
    } else if ((freshQ?.special_discount_amount ?? 0) > 0) {
      setSpecialDiscountType("amount");
      setSpecialDiscountValue(Number(freshQ.special_discount_amount));
    } else {
      setSpecialDiscountType("percentage");
      setSpecialDiscountValue(0);
    }

    setHasWithholdingTax(!!freshQ?.has_withholding_tax);
    setWithholdingTaxPercentage(Number(freshQ?.withholding_tax_percentage || 0));

    // VAT settings (NEW)
    setHasVat(freshQ?.has_vat ?? true);
    setVatPercentage(Number(freshQ?.vat_percentage || 7));
    setPricingMode(freshQ?.pricing_mode || "net");
  }, [open, initialData]);

  // Main Save Handler (สร้างใบใหม่)
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

    const isCredit = paymentTermsType === "credit_30" || paymentTermsType === "credit_60";
    const dueDateForSave = isCredit ? (selectedDueDate ? toISODate(selectedDueDate) : null) : null;

    const loadingId = showLoading("กำลังสร้างใบเสนอราคา (สำเนา)…");

    try {
      await createQuotation({
        // ข้อมูลที่ createStandalone ต้องการ
        company_id: q.company_id,
        customer_id: customer.cus_id || q.customer_id,
        work_name: q.work_name,

        // ✅ เพิ่ม primary_pricing_request_id และ primary_pricing_request_ids
        primary_pricing_request_id: q.primary_pricing_request_id || null,
        primary_pricing_request_ids: q.primary_pricing_request_ids || [],

        items: flatItems,

        // Financials
        subtotal: financials.subtotal,
        net_subtotal: financials.netSubtotal,
        tax_amount: financials.vat,
        total_amount: financials.total,
        special_discount_percentage:
          specialDiscountType === "percentage" ? Number(specialDiscountValue || 0) : 0,
        special_discount_amount:
          specialDiscountType === "amount"
            ? Number(specialDiscountValue || 0)
            : financials.specialDiscountAmount,
        has_vat: hasVat,
        vat_percentage: Number(vatPercentage || 0),
        pricing_mode: pricingMode,
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

        // Sample images (ถ้ามี)
        sample_images: q?.sample_images || [],
      }).unwrap();

      dismissToast(loadingId);
      showSuccess("สร้างใบเสนอราคา (สำเนา) เรียบร้อย");
      return true;
    } catch (e) {
      dismissToast(loadingId);
      showError(e?.data?.message || e?.message || "สร้างใบเสนอราคาไม่สำเร็จ");
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
    hasVat,
    setHasVat,
    vatPercentage,
    setVatPercentage,
    pricingMode,
    setPricingMode,
    handleSave,
  };
}
