import { useState, useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setFilters,
  setPaginationModel,
  resetFilters,
} from "../../../../features/Customer/customerSlice";
import { filterPanelConfig } from "../../constants/filterConstants";
import ScrollContext from "../../components/DataDisplay/ScrollContext";

/**
 * Custom hook for managing filter actions
 * Handles apply, reset filter operations
 *
 * UX-Optimized: Uses refetch callback pattern instead of cache invalidation
 * - Data stays visible while new data is loading
 * - No flash of empty state
 * - Subtle loading indicator via isFetching
 *
 * @param {Function} refetchCustomers - Callback to trigger refetch (from RTK Query)
 */
export const useFilterActions = (refetchCustomers) => {
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

        // Apply filters synchronously to ensure they're set before refetch
        dispatch(setFilters(filtersToApply));

        // Reset to first page when applying filters
        dispatch(setPaginationModel({ page: 0, pageSize: filterPanelConfig.defaultPageSize }));

        // Trigger refetch through callback (passed from CustomerList)
        // This keeps existing data visible while loading new data (better UX)
        if (refetchCustomers) {
          refetchCustomers();
        }

        // End loading state and scroll to top
        setIsFiltering(false);
        scrollToTop();

        console.log("กรองข้อมูลสำเร็จ");
      } catch (error) {
        console.error("Error applying filters:", error);
        setErrorMessage("เกิดข้อผิดพลาดในการใช้งานตัวกรอง");
        setIsFiltering(false);
      }
    },
    [dispatch, scrollToTop, groupSelected, refetchCustomers]
  );

  // Reset filters handler
  const handleResetFilters = useCallback(
    (resetDraftFilters) => {
      resetDraftFilters();
      dispatch(resetFilters());
      dispatch(setPaginationModel({ page: 0, pageSize: filterPanelConfig.defaultPageSize }));

      // Trigger refetch after resetting filters
      if (refetchCustomers) {
        refetchCustomers();
      }
    },
    [dispatch, refetchCustomers]
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
