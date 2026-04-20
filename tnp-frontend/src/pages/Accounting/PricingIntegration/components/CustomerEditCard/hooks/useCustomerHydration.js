import { useEffect, useRef } from "react";

import { useGetCustomerByIdQuery } from "../../../../../../features/Accounting/accountingApi";
import { mergeHydratedCustomer } from "../utils/customerFormDefaults";

export const useCustomerHydration = (customer, { setEditData, setDisplayCustomer }) => {
  const customerId = customer?.cus_id;
  const { data, isFetching } = useGetCustomerByIdQuery(customerId, {
    skip: !customerId,
  });

  const lastHydratedId = useRef(null);

  useEffect(() => {
    if (!customerId) return;
    if (!data?.data) return;
    if (lastHydratedId.current === customerId) return;

    lastHydratedId.current = customerId;
    const merged = { ...customer, ...data.data };
    setDisplayCustomer(merged);
    setEditData((prev) => mergeHydratedCustomer(prev, merged));
  }, [customerId, data, customer, setDisplayCustomer, setEditData]);

  return { isHydrating: isFetching };
};
