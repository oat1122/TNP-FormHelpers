import { useCallback } from "react";

import { useCreateStandaloneQuotationMutation } from "../../../../../../features/Accounting/accountingApi";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../../../../utils/accountingToast";
import { collectManualJobErrors } from "../../QuotationDetailDialog/utils/manualJobValidator";
import {
  buildQuotationItems,
  resolveDueDate,
} from "../../QuotationDetailDialog/utils/quotationUpdatePayload";
import { buildQuotationDuplicatePayload } from "../utils/quotationDuplicatePayload";

// Manages the create-from-duplicate flow: validate → build payload → call create
// mutation → translate the response into a UI-friendly result. Stateless beyond
// the mutation's `isLoading` / `error`.
export function useQuotationDuplicateSave({ sourceQuotation, customer, formState, onSuccess }) {
  const [createQuotation, { isLoading: isSaving, error }] = useCreateStandaloneQuotationMutation();

  const handleSave = useCallback(
    async (groups, financials) => {
      const validation = collectManualJobErrors(groups);
      if (validation.hasErrors) {
        showError(`กรุณาตรวจสอบข้อมูลงานที่สร้างใหม่:\n${validation.message}`);
        return { success: false, validationError: true };
      }

      const items = buildQuotationItems(groups);
      const dueDate = resolveDueDate(formState.payment.type, formState.dueDate);

      const payload = buildQuotationDuplicatePayload({
        sourceQuotation,
        customer,
        items,
        financials,
        formState,
        dueDate,
      });

      const loadingId = showLoading("กำลังสร้างใบเสนอราคา (สำเนา)…");
      try {
        const response = await createQuotation(payload).unwrap();
        dismissToast(loadingId);
        showSuccess("สร้างใบเสนอราคา (สำเนา) เรียบร้อย");
        onSuccess?.(response);
        return { success: true, response };
      } catch (e) {
        dismissToast(loadingId);
        const message = e?.data?.message || e?.message || "สร้างใบเสนอราคาไม่สำเร็จ";
        if (import.meta.env.DEV) console.error("Failed to duplicate quotation:", e);
        showError(message);
        return { success: false };
      }
    },
    [createQuotation, sourceQuotation, customer, formState, onSuccess]
  );

  return { handleSave, isSaving, error };
}
