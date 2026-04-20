import { useCallback } from "react";

import { useLazyGetPricingRequestsByCustomerQuery } from "../../../../../../features/Accounting/accountingApi";

export const useCustomerPricingRequests = () => {
  const [trigger, { data, isLoading }] = useLazyGetPricingRequestsByCustomerQuery();

  const fetchForCustomer = useCallback(
    async (customerId, currentPrId, canSelectCurrent) => {
      try {
        const response = await trigger(customerId).unwrap();
        const requests = response?.success ? response?.data || [] : [];
        const current = requests.find((pr) => pr.pr_id === currentPrId);
        const defaultSelected =
          current && !current.is_quoted && canSelectCurrent ? [currentPrId] : [];
        return { requests, defaultSelected };
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error(e);
        }
        return { requests: [], defaultSelected: [] };
      }
    },
    [trigger]
  );

  return {
    list: data?.success ? data?.data || [] : [],
    isLoading,
    fetchForCustomer,
  };
};
