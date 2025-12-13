import { useState, useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setFilters,
  setPaginationModel,
  resetFilters,
  fetchFilteredCustomers,
} from "../../../../features/Customer/customerSlice";
import { filterPanelConfig } from "../../constants/filterConstants";
import ScrollContext from "../../components/DataDisplay/ScrollContext";

/**
 * Custom hook for managing filter actions
 * Handles apply, reset filter operations
 */
export const useFilterActions = () => {
  const dispatch = useDispatch();
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const { scrollToTop } = useContext(ScrollContext);

  const [isFiltering, setIsFiltering] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Apply filters handler
  const handleApplyFilters = useCallback(
    (draftFilters, prepareFiltersForAPI) => {
      try {
        const filtersToApply = prepareFiltersForAPI(draftFilters);
        console.log("กำลังใช้งานตัวกรอง:", filtersToApply, "กับกลุ่มปัจจุบัน:", groupSelected);

        // Start loading state
        setIsFiltering(true);

        // Apply filters synchronously to ensure they're set before API call
        dispatch(setFilters(filtersToApply));

        // Reset to first page when applying filters
        dispatch(setPaginationModel({ page: 0, pageSize: filterPanelConfig.defaultPageSize }));

        // Dispatch API action to fetch filtered customers
        dispatch(fetchFilteredCustomers(filtersToApply))
          .unwrap()
          .then((data) => {
            // Success handling
            setIsFiltering(false);

            // Scroll to top when filters have been applied
            scrollToTop();

            // นับจำนวนข้อมูลที่ได้จากการกรอง
            console.log(`กรองข้อมูลสำเร็จ: พบ ${data?.data?.length || 0} รายการ`);

            return data;
          })
          .catch((error) => {
            console.error("Error applying filters:", error);
            setErrorMessage(
              `เกิดข้อผิดพลาดในการกรองข้อมูล: ${error.message || "โปรดลองใหม่อีกครั้ง"}`
            );
            setIsFiltering(false);
          });
      } catch (error) {
        console.error("Error applying filters:", error);
        setErrorMessage("เกิดข้อผิดพลาดในการใช้งานตัวกรอง");
        setIsFiltering(false);
      }
    },
    [dispatch, scrollToTop, groupSelected]
  );

  // Reset filters handler
  const handleResetFilters = useCallback(
    (resetDraftFilters) => {
      resetDraftFilters();
      dispatch(resetFilters());
      dispatch(setPaginationModel({ page: 0, pageSize: filterPanelConfig.defaultPageSize }));
    },
    [dispatch]
  );

  // Clear error message
  const clearErrorMessage = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    // State
    isFiltering,
    errorMessage,

    // Actions
    handleApplyFilters,
    handleResetFilters,
    clearErrorMessage,
  };
};
