import { useCallback } from "react";
import { useDispatch } from "react-redux";

import { useCreateStandaloneQuotationMutation } from "../../../../../../features/Accounting/accountingApi";
import { addNotification } from "../../../../../../features/Accounting/accountingSlice";
import { buildStandaloneQuotationPayload } from "../utils/quotationStandalonePayload";

// Submits the standalone-create form. Calls the validate fn first; on success,
// dispatches a success notification + invokes onSuccess/onClose. Errors are
// dispatched as notifications and the dialog stays open.
export function useQuotationStandaloneSubmit({
  formData,
  financials,
  validate,
  onSuccess,
  onClose,
}) {
  const dispatch = useDispatch();
  const [createQuotation, { isLoading, error: apiError }] = useCreateStandaloneQuotationMutation();

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      const payload = buildStandaloneQuotationPayload(formData, financials);
      const result = await createQuotation(payload).unwrap();

      dispatch(
        addNotification({
          type: "success",
          message: `สร้างใบเสนอราคา ${result.data.number} สำเร็จ`,
        })
      );

      onSuccess?.(result.data);
      onClose?.();
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to create quotation:", err);
      dispatch(
        addNotification({
          type: "error",
          message: err?.data?.message || "เกิดข้อผิดพลาดในการสร้างใบเสนอราคา",
        })
      );
    }
  }, [validate, formData, financials, createQuotation, dispatch, onSuccess, onClose]);

  return { handleSubmit, isLoading, apiError };
}
