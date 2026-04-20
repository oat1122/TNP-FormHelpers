import { useCallback, useEffect, useState } from "react";

import { buildEmptyFormState, mergeInitialFromPR } from "../utils/formInitializer";

export const useCreateQuotationFormState = (selectedPricingRequests = []) => {
  const [formData, setFormData] = useState(() => ({
    ...buildEmptyFormState(),
    pricingRequests: selectedPricingRequests,
  }));

  useEffect(() => {
    if (!selectedPricingRequests?.length) return;
    setFormData((prev) => mergeInitialFromPR(prev, selectedPricingRequests));
  }, [selectedPricingRequests]);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateFields = useCallback((patch) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  return { formData, setFormData, updateField, updateFields };
};
