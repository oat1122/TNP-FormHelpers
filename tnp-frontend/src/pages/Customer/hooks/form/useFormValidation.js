import { useState } from "react";

import { tabFieldMapping } from "../../constants/dialogConstants";

export const useFormValidation = () => {
  const [errors, setErrors] = useState({});

  // Helper function to determine which tab contains a specific field
  const getTabForField = (fieldName) => {
    if (tabFieldMapping.basicInfo.includes(fieldName)) return 0;
    if (tabFieldMapping.contactInfo.includes(fieldName)) return 1;
    if (tabFieldMapping.addressInfo.includes(fieldName)) return 2;
    return 3; // Notes tab for any other fields
  };

  // Validate form and return validation result
  const validateForm = (formRef, inputList, setTabValue) => {
    const form = formRef.current;

    // Validate business type manually (required field check)
    const newErrors = {};
    if (!inputList.cus_bt_id) {
      newErrors.cus_bt_id = "กรุณาเลือกประเภทธุรกิจ";
    }

    if (form.checkValidity() && !newErrors.cus_bt_id) {
      return true;
    } else {
      // Update error state based on invalid inputs
      form.querySelectorAll(":invalid").forEach((input) => {
        newErrors[input.name] = input.validationMessage;
      });
      setErrors(newErrors);

      const firstErrorField = Object.keys(newErrors)[0];

      if (firstErrorField && formRef.current[firstErrorField]) {
        // Find which tab contains the error field
        const errorFieldTab = getTabForField(firstErrorField);
        setTabValue(errorFieldTab);

        // Wait for tab to render then scroll to field
        setTimeout(() => {
          formRef.current[firstErrorField].scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          formRef.current[firstErrorField].focus();
        }, 100);
      }

      return false;
    }
  };

  // Clear specific field error
  const clearFieldError = (fieldName) => {
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };

  // Clear all errors
  const clearAllErrors = () => {
    setErrors({});
  };

  return {
    errors,
    setErrors,
    validateForm,
    clearFieldError,
    clearAllErrors,
    getTabForField,
  };
};
