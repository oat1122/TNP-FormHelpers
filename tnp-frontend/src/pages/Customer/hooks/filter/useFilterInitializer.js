import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setSalesList } from "../../../../features/Customer/customerSlice";
import { useGetUserByRoleQuery } from "../../../../features/globalApi";

/**
 * useFilterInitializer - Hook สำหรับจัดการการโหลดข้อมูลเริ่มต้นสำหรับ Filter
 * แยก Logic การดึง Sales list ออกจาก FilterPanel
 */
export const useFilterInitializer = () => {
  const dispatch = useDispatch();

  // Get sales list from API
  const { data: salesData, isLoading: salesLoading } = useGetUserByRoleQuery("sale");

  // Update sales list in Redux when data is loaded
  useEffect(() => {
    if (salesData?.sale_role?.length > 0) {
      const salesNames = salesData.sale_role.map((user) => user.username).filter(Boolean);
      dispatch(setSalesList(salesNames));
    }
  }, [salesData, dispatch]);

  return { salesLoading };
};
