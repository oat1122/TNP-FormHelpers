// 📁hooks/useQuotationDialogLogic.js
import React from "react";
import {
  useGetQuotationQuery,
  useUpdateQuotationMutation,
} from "../../../../../../features/Accounting/accountingApi";
import {
  pickQuotation,
  normalizeCustomer,
  toISODate,
  computeTotals,
} from "../utils/quotationUtils";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../../../../utils/accountingToast";

// Validation helper for manual jobs
function validateManualJob(group) {
  const errors = [];

  if (!group.name || group.name.trim() === "") {
    errors.push("กรุณากรอกชื่องาน");
  }

  const hasValidRows = group.sizeRows && group.sizeRows.length > 0;
  if (!hasValidRows) {
    errors.push("กรุณาเพิ่มอย่างน้อย 1 รายการขนาด");
  } else {
    const allRowsEmpty = group.sizeRows.every(
      (row) =>
        (!row.quantity || row.quantity === "" || row.quantity === 0) &&
        (!row.unitPrice || row.unitPrice === "" || row.unitPrice === 0)
    );
    if (allRowsEmpty) {
      errors.push("กรุณากรอกจำนวนและราคาอย่างน้อย 1 รายการ");
    }
  }

  return errors;
}

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
  const inferredDepositPct = q?.deposit_percentage ?? (initialRawTerms === "cash" ? 0 : 50);

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

  // VAT states (NEW)
  const [hasVat, setHasVat] = React.useState(() => q?.has_vat ?? true);
  const [vatPercentage, setVatPercentage] = React.useState(() => Number(q?.vat_percentage || 7));
  const [pricingMode, setPricingMode] = React.useState(() => q?.pricing_mode || "net");

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

    setDepositPct(q?.deposit_percentage ?? (raw === "cash" ? 0 : 50));
    setDepositMode(q?.deposit_mode || "percentage");
    setDepositAmountInput(q?.deposit_mode === "amount" ? (q?.deposit_amount ?? "") : "");
    setSelectedDueDate(q?.due_date ? new Date(q.due_date) : null);
  }, [open, q?.id, q?.notes]);

  // Sync financial fields (special discount & withholding tax) after data fetched unless user is editing
  const [hasInitializedFinancials, setHasInitializedFinancials] = React.useState(false);

  // Reset initialization flag when quotation ID changes
  React.useEffect(() => {
    setHasInitializedFinancials(false);
  }, [q?.id]);

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

    // VAT settings (NEW)
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
  ]);

  // Main Save Handler with sync support
  const handleSave = async (groups, financials, confirmSync = false) => {
    // Validate manual jobs before saving
    const manualJobErrors = {};
    let hasValidationErrors = false;

    groups.forEach((group, index) => {
      if (group.isManual) {
        const errors = validateManualJob(group);
        if (errors.length > 0) {
          manualJobErrors[group.id] = errors;
          hasValidationErrors = true;
        }
      }
    });

    if (hasValidationErrors) {
      // Show validation errors
      const errorMessages = Object.entries(manualJobErrors)
        .map(([groupId, errors]) => {
          const groupIndex = groups.findIndex((g) => g.id === groupId);
          const groupName = groups[groupIndex]?.name || `งานที่ ${groupIndex + 1}`;
          return `${groupName}: ${errors.join(", ")}`;
        })
        .join("\n");

      showError(`กรุณาตรวจสอบข้อมูลงานที่สร้างใหม่:\n${errorMessages}`);
      return { success: false, validationError: true };
    }

    // ใช้ global sequence counter เพื่อป้องกัน duplicate sequence_order
    let globalSequence = 0;

    // Map editable groups back to API items
    const flatItems = groups.flatMap((g) => {
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
        globalSequence++; // ใช้ global counter
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
          sequence_order: globalSequence, // ใช้ global sequence
        };
      });
    });

    const totals = computeTotals(groups, depositPct);
    const isCredit = paymentTermsType === "credit_30" || paymentTermsType === "credit_60";
    const dueDateForSave = isCredit ? (selectedDueDate ? toISODate(selectedDueDate) : null) : null;

    const loadingId = showLoading("กำลังบันทึกใบเสนอราคา…");

    try {
      const response = await updateQuotation({
        id: q.id,
        items: flatItems,
        subtotal: totals.subtotal,
        // Use calculated values from financials hook
        net_subtotal: financials.netSubtotal,
        tax_amount: financials.vat,
        total_amount: financials.total,
        // Extended financial fields (from local editable states)
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
        // Sync confirmation flag
        confirm_sync: confirmSync,
      }).unwrap();

      dismissToast(loadingId);

      // Check if sync is needed (response contains sync info)
      const syncMode = response?.data?.sync_mode;
      const syncJobId = response?.data?.sync_job_id;
      const syncCount = response?.data?.sync_count || 0;

      if (syncMode === "queued" && syncJobId) {
        // Background sync - return syncJobId to parent
        showSuccess(`บันทึกเรียบร้อย กำลังซิงค์ข้อมูลไปยังใบแจ้งหนี้ ${syncCount} ใบในพื้นหลัง`);
        return { success: true, syncJobId, syncMode };
      } else if (syncMode === "immediate") {
        // Immediate sync completed
        showSuccess(`บันทึกและซิงค์ข้อมูลไปยังใบแจ้งหนี้ ${syncCount} ใบเรียบร้อย`);
        return { success: true, syncMode };
      } else {
        // No sync needed (no invoices)
        showSuccess("บันทึกใบเสนอราคาเรียบร้อย");
        return { success: true };
      }
    } catch (e) {
      dismissToast(loadingId);

      // Debug: Log error structure to understand RTK Query error format
      console.log("Save Error Details:", {
        status: e?.status,
        originalStatus: e?.originalStatus,
        data: e?.data,
        fullError: e,
      });

      // Handle 422 - needs confirmation
      // RTK Query can return status in e.status or e.originalStatus
      const statusCode = e?.status || e?.originalStatus;
      const errorData = e?.data;

      if (statusCode === 422 && errorData?.requires_confirmation) {
        console.log("Detected sync confirmation needed", errorData);
        return {
          success: false,
          needsConfirmation: true,
          invoiceCount: errorData?.invoice_count || 0,
          affectedInvoices: errorData?.affected_invoices || [],
          message: errorData?.message,
        };
      }

      // Handle 403 - permission denied
      if (statusCode === 403) {
        const errorMessage = errorData?.message || "คุณไม่มีสิทธิ์แก้ไขใบเสนอราคานี้";
        const affectedInvoices = errorData?.affected_invoices || [];

        showError(errorMessage);

        return {
          success: false,
          permissionDenied: true,
          message: errorMessage,
          invoices: affectedInvoices,
          invoiceCount: errorData?.invoice_count || 0,
        };
      }

      // Other errors
      showError(errorData?.message || e?.message || "บันทึกใบเสนอราคาไม่สำเร็จ");
      return { success: false };
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
