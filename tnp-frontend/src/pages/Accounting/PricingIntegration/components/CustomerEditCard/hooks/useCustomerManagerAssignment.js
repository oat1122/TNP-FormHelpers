import { useEffect, useMemo, useRef } from "react";

import { useGetUserByRoleQuery } from "../../../../../../features/globalApi";
import { hydrateManagerUsername } from "../../managerLogic";

export const useCustomerManagerAssignment = ({ editData, setEditData, setDisplayCustomer }) => {
  const { data: userRoleData } = useGetUserByRoleQuery("sale");

  const salesList = useMemo(
    () =>
      (userRoleData?.sale_role || [])
        .filter((u) => u && u.user_id != null)
        .map((u) => ({
          user_id: String(u.user_id),
          username: u.username || u.user_nickname || u.name || `User ${u.user_id}`,
        })),
    [userRoleData]
  );

  const managerUserIdRef = useRef(editData?.cus_manage_by?.user_id);
  managerUserIdRef.current = editData?.cus_manage_by?.user_id;

  useEffect(() => {
    const userId = managerUserIdRef.current;
    if (!userId || !salesList.length) return;

    const hydrated = hydrateManagerUsername(editData.cus_manage_by, salesList);
    if (hydrated.username !== editData.cus_manage_by.username) {
      setEditData((prev) => ({ ...prev, cus_manage_by: hydrated }));
      setDisplayCustomer((prev) =>
        prev ? { ...prev, cus_manage_by: hydrated, sales_name: hydrated.username } : prev
      );
    }
  }, [salesList, editData.cus_manage_by, setEditData, setDisplayCustomer]);

  return { salesList };
};
