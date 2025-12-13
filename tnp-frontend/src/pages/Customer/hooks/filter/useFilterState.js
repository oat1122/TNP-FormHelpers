import dayjs from "dayjs";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";

/**
 * Initial state for draft filters - ใช้เป็น single source of truth
 */
const INITIAL_DRAFT_FILTERS = {
  dateRange: {
    startDate: null,
    endDate: null,
  },
  salesName: [],
  channel: [],
};

/**
 * Custom hook for managing filter state
 * Handles draft filters, validation, and synchronization with Redux
 */
export const useFilterState = () => {
  const filters = useSelector((state) => state.customer.filters);
  const salesList = useSelector((state) => state.customer.salesList);
  const itemList = useSelector((state) => state.customer.itemList);

  // Create working draft of filter values - ใช้ factory function เพื่อสร้าง initial state
  const createDraftFromFilters = useCallback(
    (sourceFilters) => ({
      dateRange: {
        startDate: sourceFilters.dateRange.startDate
          ? dayjs(sourceFilters.dateRange.startDate)
          : null,
        endDate: sourceFilters.dateRange.endDate ? dayjs(sourceFilters.dateRange.endDate) : null,
      },
      salesName: Array.isArray(sourceFilters.salesName) ? [...sourceFilters.salesName] : [],
      channel: Array.isArray(sourceFilters.channel) ? [...sourceFilters.channel] : [],
    }),
    []
  );

  const [draftFilters, setDraftFilters] = useState(() => createDraftFromFilters(filters));

  // Sync Redux filters to draft state when Redux filters change
  useEffect(() => {
    try {
      setDraftFilters(createDraftFromFilters(filters));
    } catch (error) {
      console.warn("Error updating draft filters from Redux state:", error);
    }
  }, [filters, createDraftFromFilters]);

  // Count filtered items
  const filteredCount = useMemo(() => {
    return itemList?.length || 0;
  }, [itemList]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    if (filters.salesName?.length > 0) count++;
    if (filters.channel?.length > 0) count++;
    return count;
  }, [filters]);

  // Check if any filter is active - centralized logic for other hooks to use
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.dateRange.startDate ||
      filters.dateRange.endDate ||
      (filters.salesName && filters.salesName.length > 0) ||
      (filters.channel && filters.channel.length > 0)
    );
  }, [filters]);

  // Helper function to prepare filters for API
  const prepareFiltersForAPI = (draft) => {
    return {
      dateRange: {
        startDate: draft.dateRange.startDate?.isValid()
          ? draft.dateRange.startDate.format("YYYY-MM-DD")
          : null,
        endDate: draft.dateRange.endDate?.isValid()
          ? draft.dateRange.endDate.format("YYYY-MM-DD")
          : null,
      },
      salesName: Array.isArray(draft.salesName) ? [...draft.salesName] : [],
      channel: Array.isArray(draft.channel) ? [...draft.channel] : [],
    };
  };

  // Calculate formatted dates for display
  const formattedStartDate = useMemo(() => {
    return draftFilters.dateRange.startDate?.format("DD/MM/YYYY") || "";
  }, [draftFilters.dateRange.startDate]);

  const formattedEndDate = useMemo(() => {
    return draftFilters.dateRange.endDate?.format("DD/MM/YYYY") || "";
  }, [draftFilters.dateRange.endDate]);

  // Reset draft filters to initial state - ใช้ INITIAL_DRAFT_FILTERS constant
  const resetDraftFilters = useCallback(() => {
    setDraftFilters({ ...INITIAL_DRAFT_FILTERS });
  }, []);

  return {
    // State
    filters,
    draftFilters,
    setDraftFilters,
    salesList,
    filteredCount,
    activeFilterCount,
    hasActiveFilters,
    formattedStartDate,
    formattedEndDate,

    // Actions
    prepareFiltersForAPI,
    resetDraftFilters,
  };
};
