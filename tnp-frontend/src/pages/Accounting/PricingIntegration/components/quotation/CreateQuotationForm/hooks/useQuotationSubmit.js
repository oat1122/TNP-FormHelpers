import { useCallback, useState } from "react";

import { buildFormSubmitPayload } from "../utils/quotationSubmitPayload";

export const useQuotationSubmit = ({
  formData,
  financials,
  validateAllManualJobs,
  onSave,
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (action) => {
      if (!validateAllManualJobs()) return;
      setIsSubmitting(true);
      try {
        const payload = buildFormSubmitPayload({ formData, financials, action });
        if (action === "draft") {
          await onSave?.(payload);
        } else {
          await onSubmit?.(payload);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, financials, validateAllManualJobs, onSave, onSubmit]
  );

  return { isSubmitting, handleSubmit };
};
