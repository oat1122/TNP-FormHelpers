import { useCallback, useEffect, useMemo, useState } from "react";

import { useCustomerPricingRequests } from "../../hooks/useCustomerPricingRequests";

export const useCreateQuotationDialogState = ({ open, pricingRequest, onSubmit, onClose }) => {
  const { list, isLoading, fetchForCustomer } = useCustomerPricingRequests();
  const [selectedPricingItems, setSelectedPricingItems] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
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

  const handleSubmit = useCallback(async () => {
    if (selectedPricingItems.length === 0) {
      alert("กรุณาเลือกอย่างน้อย 1 งาน");
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
        notes: additionalNotes,
        selectedRequestsData: selectionsWithCustomer,
        customer: pricingRequest?.customer,
      });
      onClose();
      setAdditionalNotes("");
      setSelectedPricingItems([]);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPricingItems, list, pricingRequest, additionalNotes, onSubmit, onClose]);

  const selectedTotal = useMemo(
    () =>
      list
        .filter((x) => selectedPricingItems.includes(x.pr_id))
        .reduce((s, it) => s + (it.pr_quantity || 0), 0),
    [list, selectedPricingItems]
  );

  return {
    list,
    isLoading,
    selectedPricingItems,
    additionalNotes,
    setAdditionalNotes,
    isSubmitting,
    toggleSelect,
    handleSubmit,
    selectedTotal,
  };
};
