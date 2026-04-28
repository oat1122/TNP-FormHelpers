import { useCallback, useEffect, useState } from "react";

import { buildEmptyFormData } from "../utils/customerCreateDefaults";

// State holder for the create-customer form. Owns `formData` + `errors` and the
// helpers for mutating them. Re-seeds defaults when `open` flips so a reopened
// dialog never shows stale data.
export function useCustomerCreateForm({ open, isAdmin, currentUser }) {
  const [formData, setFormData] = useState(() => buildEmptyFormData(isAdmin, currentUser));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setFormData(buildEmptyFormData(isAdmin, currentUser));
    setErrors({});
  }, [open, isAdmin, currentUser]);

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const setManagerAssignment = useCallback(
    (manager) => setFormData((prev) => ({ ...prev, cus_manage_by: manager })),
    []
  );

  const resetForm = useCallback(() => {
    setFormData(buildEmptyFormData(isAdmin, currentUser));
    setErrors({});
  }, [isAdmin, currentUser]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    handleInputChange,
    setManagerAssignment,
    resetForm,
  };
}
