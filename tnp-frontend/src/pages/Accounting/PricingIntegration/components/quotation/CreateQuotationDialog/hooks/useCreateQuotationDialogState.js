import { useCallback, useEffect, useMemo, useState } from "react";

import { showError } from "../../../../../utils/accountingToast";
import { useCustomerPricingRequests } from "../../hooks/useCustomerPricingRequests";

export const useCreateQuotationDialogState = ({ open, pricingRequest, onSubmit, onClose }) => {
  const { list, isLoading, fetchForCustomer } = useCustomerPricingRequests();
  const [selectedPricingItems, setSelectedPricingItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && pricingRequest?.customer?.cus_id) {
      fetchForCustomer(pricingRequest.customer.cus_id, pricingRequest.pr_id, true).then(
        ({ defaultSelected }) => setSelectedPricingItems(defaultSelected)
      );
    }
  }, [open, pricingRequest, fetchForCustomer]);

  const toggleSelect = useCallback((prId) => {
    setSelectedPricingItems((prev) =>
      prev.includes(prId) ? prev.filter((id) => id !== prId) : [...prev, prId]
    );
  }, []);

  const selectMany = useCallback((prIds = []) => {
    setSelectedPricingItems((prev) => Array.from(new Set([...prev, ...prIds])));
  }, []);

  const clearAll = useCallback(() => setSelectedPricingItems([]), []);

  const handleSubmit = useCallback(async () => {
    if (selectedPricingItems.length === 0) {
      showError("กรุณาเลือกอย่างน้อย 1 งาน");
      return;
    }
    setIsSubmitting(true);
    try {
      const validSelections = list.filter((item) => selectedPricingItems.includes(item.pr_id));
      const selectionsWithCustomer = validSelections.map((item) => ({
        ...item,
        customer: pricingRequest?.customer || item.customer || {},
      }));
      await onSubmit?.({
        pricingRequestIds: selectedPricingItems,
        customerId: pricingRequest?.customer?.cus_id,
        selectedRequestsData: selectionsWithCustomer,
        customer: pricingRequest?.customer,
      });
      onClose();
      setSelectedPricingItems([]);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPricingItems, list, pricingRequest, onSubmit, onClose]);

  const selectedTotal = useMemo(
    () =>
      list
        .filter((x) => selectedPricingItems.includes(x.pr_id))
        .reduce((s, it) => s + (Number(it.pr_quantity) || 0), 0),
    [list, selectedPricingItems]
  );

  return {
    list,
    isLoading,
    selectedPricingItems,
    isSubmitting,
    toggleSelect,
    selectMany,
    clearAll,
    handleSubmit,
    selectedTotal,
  };
};
