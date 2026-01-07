import { useGetCustomerGroupCountsQuery } from "../../../../features/Customer/customerApi";

/**
 * useFilterGroupCounts - Hook สำหรับจัดการการดึงจำนวนข้อมูลในแต่ละกลุ่มตาม Filter
 * แยก Logic การดึง group counts ออกจาก FilterTab
 *
 * Uses RTK Query instead of raw fetch for:
 * - Automatic caching
 * - Consistent token handling via axiosBaseQuery
 * - Better loading state management
 *
 * @param {Object} filters - Current active filters from Redux
 * @param {boolean} hasActiveFilters - Whether any filter is currently active (from useFilterState)
 */
export const useFilterGroupCounts = (filters, hasActiveFilters) => {
  const userData = JSON.parse(localStorage.getItem("userData"));

  const queryParams = {
    user_id: userData?.user_id,
    filters: filters,
  };

  // Use RTK Query hook - skip if no active filters
  // This prevents unnecessary API calls when filters are empty
  const { data, isFetching } = useGetCustomerGroupCountsQuery(queryParams, {
    skip: !hasActiveFilters,
  });

  return {
    allGroupCounts: hasActiveFilters ? data?.group_counts || {} : {},
    isLoadingCounts: isFetching,
    hasActiveFilters,
  };
};
