import { useCallback, useState } from "react";

import { makeInitialEditData } from "../utils/customerFormDefaults";

export const useCustomerEditForm = (customer, { isAdmin, currentUser }) => {
  const [editData, setEditData] = useState(() =>
    makeInitialEditData(customer, { isAdmin, currentUser })
  );
  const [errors, setErrors] = useState({});

  const handleInputChange = useCallback((field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: undefined };
    });
  }, []);

  const resetForm = useCallback(
    (base) => {
      const source = base || customer;
      setEditData(makeInitialEditData(source, { isAdmin, currentUser }));
      setErrors({});
    },
    [customer, isAdmin, currentUser]
  );

  return {
    editData,
    setEditData,
    errors,
    setErrors,
    handleInputChange,
    resetForm,
  };
};
