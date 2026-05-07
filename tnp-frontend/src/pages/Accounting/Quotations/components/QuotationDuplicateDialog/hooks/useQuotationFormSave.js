import { useCallback } from "react";

import {
  useCreateStandaloneQuotationMutation,
  useUpdateQuotationMutation,
} from "../../../../../../features/Accounting/accountingApi";
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

/**
 * Mode-aware save hook for QuotationDuplicateDialog (Edit-Phase 2 of redesign).
 *
 * Handles both flows from a single hook:
 *   - mode="duplicate" → POST /quotations/create-standalone (new record)
 *   - mode="edit"      → PUT  /quotations/{id}             (update existing)
 *
 * Renamed from `useQuotationDuplicateSave` to reflect dual-mode purpose.
 *
 * Validation, payload builder, and toast/error UX are shared between modes.
 * Only the mutation call + payload `id` field + toast message differ.
 */
export function useQuotationFormSave({
  mode = "duplicate",
  sourceQuotation,
  customer,
  formState,
  quotationId,
  onSuccess,
}) {
  const [createQuotation, { isLoading: isCreating, error: createError }] =
    useCreateStandaloneQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating, error: updateError }] =
    useUpdateQuotationMutation();

  const isEdit = mode === "edit";
  const isSaving = isEdit ? isUpdating : isCreating;
  const error = isEdit ? updateError : createError;

  const handleSave = useCallback(
    async (groups, financials) => {
      const validation = collectManualJobErrors(groups);
      if (validation.hasErrors) {
        showError(`กรุณาตรวจสอบข้อมูลงานที่สร้างใหม่:\n${validation.message}`);
        return { success: false, validationError: true };
      }

      const items = buildQuotationItems(groups);
      const dueDate = resolveDueDate(formState.payment.type, formState.dueDate);

      const basePayload = buildQuotationDuplicatePayload({
        sourceQuotation,
        customer,
        items,
        financials,
        formState,
        dueDate,
      });

      const loadingMsg = isEdit ? "กำลังบันทึกใบเสนอราคา…" : "กำลังสร้างใบเสนอราคา (สำเนา)…";
      const successMsg = isEdit ? "บันทึกใบเสนอราคาเรียบร้อย" : "สร้างใบเสนอราคา (สำเนา) เรียบร้อย";
      const errorFallback = isEdit ? "บันทึกใบเสนอราคาไม่สำเร็จ" : "สร้างใบเสนอราคาไม่สำเร็จ";

      const loadingId = showLoading(loadingMsg);
      try {
        let response;
        if (isEdit) {
          if (!quotationId) {
            throw new Error("quotationId is required in edit mode");
          }
          response = await updateQuotation({ id: quotationId, ...basePayload }).unwrap();
        } else {
          response = await createQuotation(basePayload).unwrap();
        }
        dismissToast(loadingId);
        showSuccess(successMsg);
        onSuccess?.(response);
        return { success: true, response };
      } catch (e) {
        dismissToast(loadingId);
        const message = e?.data?.message || e?.message || errorFallback;
        if (import.meta.env.DEV) {
          console.error(`Failed to ${isEdit ? "update" : "duplicate"} quotation:`, e);
        }
        showError(message);
        return { success: false };
      }
    },
    [
      isEdit,
      quotationId,
      createQuotation,
      updateQuotation,
      sourceQuotation,
      customer,
      formState,
      onSuccess,
    ]
  );

  return { handleSave, isSaving, error };
}
