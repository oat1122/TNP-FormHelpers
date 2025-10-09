import { useState, useCallback } from "react";

/**
 * Custom Hook for managing the state and logic of the AdvancedFilter component.
 * @param {Object} initialFilters - Optional initial state for the filters.
 * @returns {Object} An object containing filter state and handler functions.
 */
export const useAdvancedFilter = (initialFilters = {}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || "");
  const [status, setStatus] = useState(initialFilters.status || "all");
  const [dateRange, setDateRange] = useState(initialFilters.dateRange || [null, null]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleStatusChange = useCallback((e) => {
    setStatus(e.target.value);
  }, []);

  const handleDateRangeChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setStatus("all");
    setDateRange([null, null]);
  }, []);

  // Returns a memoized object suitable for passing to RTK Query
  const getQueryArgs = useCallback(() => ({
    search: searchQuery || undefined,
    status: status !== "all" ? status : undefined,
    start_date: dateRange[0] ? dateRange[0].toISOString().split('T')[0] : undefined,
    end_date: dateRange[1] ? dateRange[1].toISOString().split('T')[0] : undefined,
  }), [searchQuery, status, dateRange]);

  return {
    filters: {
      searchQuery,
      status,
      dateRange,
    },
    handlers: {
      handleSearchChange,
      handleStatusChange,
      handleDateRangeChange,
      resetFilters,
    },
    getQueryArgs,
  };
};