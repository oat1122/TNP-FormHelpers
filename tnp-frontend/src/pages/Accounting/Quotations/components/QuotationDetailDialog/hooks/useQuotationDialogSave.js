import { useCallback, useState } from "react";

import { useUpdateQuotationMutation } from "../../../../../../features/Accounting/accountingApi";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
} from "../../../../utils/accountingToast";
import { computeTotals } from "../../shared/utils/quotationUtils";
import { collectManualJobErrors } from "../utils/manualJobValidator";
import {
  buildQuotationItems,
  buildQuotationUpdatePayload,
  resolveDueDate,
} from "../utils/quotationUpdatePayload";

// Manages the save flow for QuotationDetailDialog: validate → build payload → call API
// → translate the response into a UI-friendly result. Owns the sync confirmation /
// progress state so the shell stays thin.
export function useQuotationDialogSave({ quotationId, formState, onSuccess }) {
  const [updateQuotation, { isLoading: isSaving, error }] = useUpdateQuotationMutation();

  // Sync orchestration state
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [syncJobId, setSyncJobId] = useState(null);
  const [pendingSaveData, setPendingSaveData] = useState(null);

  const performSave = useCallback(
    async (groups, financials, confirmSync) => {
      const validation = collectManualJobErrors(groups);
      if (validation.hasErrors) {
        showError(`กรุณาตรวจสอบข้อมูลงานที่สร้างใหม่:\n${validation.message}`);
        return { success: false, validationError: true };
      }

      const items = buildQuotationItems(groups);
      const totals = computeTotals(groups, formState.deposit.percentage);
      const dueDate = resolveDueDate(formState.payment.type, formState.dueDate);

      const payload = buildQuotationUpdatePayload({
        quotationId,
        items,
        totals,
        financials,
        specialDiscount: formState.specialDiscount,
        withholding: formState.withholding,
        vat: formState.vat,
        pricingMode: formState.pricingMode,
        deposit: formState.deposit,
        payment: formState.payment,
        dueDate,
        notes: formState.notes,
        confirmSync,
      });

      const loadingId = showLoading("กำลังบันทึกใบเสนอราคา…");
      try {
        const response = await updateQuotation(payload).unwrap();
        dismissToast(loadingId);

        const syncMode = response?.data?.sync_mode;
        const responseSyncJobId = response?.data?.sync_job_id;
        const syncCount = response?.data?.sync_count || 0;

        if (syncMode === "queued" && responseSyncJobId) {
          showSuccess(`บันทึกเรียบร้อย กำลังซิงค์ข้อมูลไปยังใบแจ้งหนี้ ${syncCount} ใบในพื้นหลัง`);
          return { success: true, syncJobId: responseSyncJobId, syncMode };
        }
        if (syncMode === "immediate") {
          showSuccess(`บันทึกและซิงค์ข้อมูลไปยังใบแจ้งหนี้ ${syncCount} ใบเรียบร้อย`);
          return { success: true, syncMode };
        }
        showSuccess("บันทึกใบเสนอราคาเรียบร้อย");
        return { success: true };
      } catch (e) {
        dismissToast(loadingId);
        const statusCode = e?.status || e?.originalStatus;
        const errorData = e?.data;

        if (statusCode === 422 && errorData?.requires_confirmation) {
          return {
            success: false,
            needsConfirmation: true,
            invoiceCount: errorData?.invoice_count || 0,
            affectedInvoices: errorData?.affected_invoices || [],
            message: errorData?.message,
          };
        }

        if (statusCode === 403) {
          const message = errorData?.message || "คุณไม่มีสิทธิ์แก้ไขใบเสนอราคานี้";
          const affectedInvoices = errorData?.affected_invoices || [];
          showError(message);
          return {
            success: false,
            permissionDenied: true,
            message,
            invoices: affectedInvoices,
            invoiceCount: errorData?.invoice_count || 0,
          };
        }

        showError(errorData?.message || e?.message || "บันทึกใบเสนอราคาไม่สำเร็จ");
        return { success: false };
      }
    },
    [updateQuotation, quotationId, formState]
  );

  // Public handler used by the dialog ActionBar / PDF preview prompt.
  // Returns a normalized result so callers can react (success / sync / permission).
  const handleSave = useCallback(
    async (groups, financials) => {
      const result = await performSave(groups, financials, false);

      if (result.permissionDenied) {
        // Caller (shell) opens PermissionErrorDialog via setPermissionError on its hook.
        return result;
      }

      if (result.needsConfirmation) {
        setPendingSaveData({
          groups,
          financials,
          invoiceCount: result.invoiceCount,
          affectedInvoices: result.affectedInvoices,
        });
        setSyncConfirmOpen(true);
        return result;
      }

      if (result.success) {
        if (result.syncJobId) setSyncJobId(result.syncJobId);
        onSuccess?.();
      }

      return result;
    },
    [performSave, onSuccess]
  );

  // Retry after the user accepts the sync warning dialog.
  const confirmSyncAndRetry = useCallback(async () => {
    if (!pendingSaveData) return { success: false };

    const result = await performSave(pendingSaveData.groups, pendingSaveData.financials, true);

    setPendingSaveData(null);
    setSyncConfirmOpen(false);

    if (result.success) {
      if (result.syncJobId) setSyncJobId(result.syncJobId);
      onSuccess?.();
    }
    return result;
  }, [pendingSaveData, performSave, onSuccess]);

  const closeSyncConfirm = useCallback(() => {
    setSyncConfirmOpen(false);
    setPendingSaveData(null);
  }, []);

  const closeSyncProgress = useCallback(() => setSyncJobId(null), []);

  return {
    handleSave,
    confirmSyncAndRetry,
    isSaving,
    error,
    syncConfirmOpen,
    pendingSaveData,
    closeSyncConfirm,
    syncJobId,
    closeSyncProgress,
  };
}
