import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

/**
 * Custom hook for managing filter state
 * Handles draft filters, validation, and synchronization with Redux
 */
export const useFilterState = () => {
  const filters = useSelector((state) => state.customer.filters);
  const salesList = useSelector((state) => state.customer.salesList);
  const itemList = useSelector((state) => state.customer.itemList);

  // Create working draft of filter values
  const [draftFilters, setDraftFilters] = useState({
    dateRange: {
      startDate: filters.dateRange.startDate
        ? dayjs(filters.dateRange.startDate)
        : null,
      endDate: filters.dateRange.endDate
        ? dayjs(filters.dateRange.endDate)
        : null,
    },
    salesName: Array.isArray(filters.salesName) ? [...filters.salesName] : [],
    channel: Array.isArray(filters.channel) ? [...filters.channel] : [],
  });

  // Sync Redux filters to draft state when Redux filters change
  useEffect(() => {
    try {
      setDraftFilters({
        dateRange: {
          startDate: filters.dateRange.startDate
            ? dayjs(filters.dateRange.startDate)
            : null,
          endDate: filters.dateRange.endDate
            ? dayjs(filters.dateRange.endDate)
            : null,
        },
        salesName: Array.isArray(filters.salesName)
          ? [...filters.salesName]
          : [],
        channel: Array.isArray(filters.channel) ? [...filters.channel] : [],
      });
    } catch (error) {
      console.warn("Error updating draft filters from Redux state:", error);
    }
  }, [filters]);

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

  // Reset draft filters to initial state
  const resetDraftFilters = () => {
    setDraftFilters({
      dateRange: {
        startDate: null,
        endDate: null,
      },
      salesName: [],
      channel: [],
    });
  };

  return {
    // State
    filters,
    draftFilters,
    setDraftFilters,
    salesList,
    filteredCount,
    activeFilterCount,
    formattedStartDate,
    formattedEndDate,
    
    // Actions
    prepareFiltersForAPI,
    resetDraftFilters,
  };
}; 