import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { setSalesList } from "../../../../features/Customer/customerSlice";
import { useGetUserByRoleQuery } from "../../../../features/globalApi";
import { useGetSalesBySubRoleQuery } from "../../../../features/Customer/customerApi";

/**
 * Map HEAD sub_role to subordinate sub_role code
 */
const HEAD_TO_SUBORDINATE = {
  HEAD_ONLINE: "SALES_ONLINE",
  HEAD_OFFLINE: "SALES_OFFLINE",
};

/**
 * useFilterInitializer - Hook สำหรับจัดการการโหลดข้อมูลเริ่มต้นสำหรับ Filter
 *
 * For HEAD users, fetches only their subordinate sales team:
 * - HEAD_ONLINE → SALES_ONLINE
 * - HEAD_OFFLINE → SALES_OFFLINE
 * For other users (admin, etc.), fetches all sales
 */
export const useFilterInitializer = () => {
  const dispatch = useDispatch();

  // Get current user from localStorage
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData"));
    } catch {
      return null;
    }
  }, []);

  // Determine user's sub_role and subordinate code
  const userSubRole = user?.sub_roles?.[0]?.msr_code || null;
  const subordinateCode = HEAD_TO_SUBORDINATE[userSubRole] || null;
  const isHead = !!subordinateCode;

  // Query for HEAD users - fetch by sub_role
  const { data: subRoleSalesData, isLoading: subRoleLoading } = useGetSalesBySubRoleQuery(
    subordinateCode,
    { skip: !isHead }
  );

  // Query for non-HEAD users - fetch all sales by role
  const { data: allSalesData, isLoading: allSalesLoading } = useGetUserByRoleQuery("sale", {
    skip: isHead,
  });

  // Combine loading states
  const salesLoading = isHead ? subRoleLoading : allSalesLoading;

  // Update sales list in Redux when data is loaded
  useEffect(() => {
    let salesNames = [];

    if (isHead && subRoleSalesData?.data?.length > 0) {
      // HEAD user - use sub_role filtered data
      salesNames = subRoleSalesData.data.map((user) => user.username).filter(Boolean);
    } else if (!isHead && allSalesData?.sale_role?.length > 0) {
      // Non-HEAD user - use all sales data
      salesNames = allSalesData.sale_role.map((user) => user.username).filter(Boolean);
    }

    if (salesNames.length > 0) {
      dispatch(setSalesList(salesNames));
    }
  }, [subRoleSalesData, allSalesData, isHead, dispatch]);

  return { salesLoading, isHead, userSubRole };
};
