import { useEffect, useMemo } from "react";

import {
  useGetAllBusinessTypesQuery,
  useGetUserByRoleQuery,
} from "../../../../../../../features/globalApi";
import { hydrateManagerUsername } from "../../../../../shared/utils/managerLogic";

const normalizeBusinessTypes = (businessTypesData) => {
  if (!businessTypesData) return [];
  const raw = Array.isArray(businessTypesData)
    ? businessTypesData
    : businessTypesData?.master_business_types ||
      businessTypesData?.master_business_type ||
      businessTypesData?.data ||
      businessTypesData?.items ||
      [];
  return (raw || [])
    .filter((bt) => bt && (bt.bt_id != null || bt.id != null) && (bt.bt_name || bt.name))
    .map((bt, index) => ({
      ...bt,
      bt_id: bt.bt_id != null ? String(bt.bt_id) : bt.id != null ? String(bt.id) : `bt-${index}`,
      bt_name: bt.bt_name || bt.name || "ไม่ทราบประเภทธุรกิจ",
    }));
};

const normalizeSalesList = (userRoleData) =>
  (userRoleData?.sale_role || [])
    .filter((u) => u && u.user_id != null)
    .map((u) => ({
      user_id: String(u.user_id),
      username: u.username || u.user_nickname || u.name || `User ${u.user_id}`,
    }));

// Provides the sales list + business types for the manager + business-type pickers.
// Hydrates the manager username on the form once the sales list resolves.
export function useCustomerCreateManagers({ managerAssignment, onManagerChange }) {
  const { data: userRoleData } = useGetUserByRoleQuery("sale");
  const { data: businessTypesData } = useGetAllBusinessTypesQuery();

  const salesList = useMemo(() => normalizeSalesList(userRoleData), [userRoleData]);
  const businessTypes = useMemo(
    () => normalizeBusinessTypes(businessTypesData),
    [businessTypesData]
  );

  useEffect(() => {
    if (!managerAssignment?.user_id || salesList.length === 0) return;
    const hydrated = hydrateManagerUsername(managerAssignment, salesList);
    if (hydrated.username !== managerAssignment.username) {
      onManagerChange(hydrated);
    }
  }, [managerAssignment, salesList, onManagerChange]);

  return { salesList, businessTypes };
}
