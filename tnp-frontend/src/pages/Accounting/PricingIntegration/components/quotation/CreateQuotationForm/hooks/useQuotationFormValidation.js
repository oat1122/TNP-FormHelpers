import { useCallback, useState } from "react";

const validateManualJobErrors = (item) => {
  const errors = [];

  if (!item.name || item.name.trim() === "") {
    errors.push("กรุณากรอกชื่องาน");
  }

  const hasValidRows = item.sizeRows && item.sizeRows.length > 0;
  if (!hasValidRows) {
    errors.push("กรุณาเพิ่มอย่างน้อย 1 รายการขนาด");
    return errors;
  }

  const allRowsEmpty = item.sizeRows.every(
    (row) =>
      (!row.quantity || row.quantity === "" || row.quantity === 0) &&
      (!row.unitPrice || row.unitPrice === "" || row.unitPrice === 0)
  );
  if (allRowsEmpty) {
    errors.push("กรุณากรอกจำนวนและราคาอย่างน้อย 1 รายการ");
  }

  return errors;
};

export const useQuotationFormValidation = (formData) => {
  const [validationErrors, setValidationErrors] = useState({});

  const validateManualJob = useCallback((item) => validateManualJobErrors(item), []);

  const validateAllManualJobs = useCallback(() => {
    const errors = {};
    let hasErrors = false;

    formData.items.forEach((item) => {
      if (!item.isFromPR) {
        const itemErrors = validateManualJobErrors(item);
        if (itemErrors.length > 0) {
          errors[item.id] = itemErrors;
          hasErrors = true;
        }
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  }, [formData.items]);

  const clearItemValidationErrors = useCallback((itemId) => {
    setValidationErrors((prev) => {
      if (!prev[itemId]) return prev;
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  return {
    validationErrors,
    setValidationErrors,
    validateManualJob,
    validateAllManualJobs,
    clearItemValidationErrors,
  };
};
