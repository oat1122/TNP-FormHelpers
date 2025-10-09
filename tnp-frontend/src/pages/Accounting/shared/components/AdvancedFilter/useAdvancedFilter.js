import { useState, useCallback } from "react";

/**
 * Custom Hook for managing the state and logic of the AdvancedFilter component.
 * @param {Object} initialFilters - Optional initial state for the filters.
 * @returns {Object} An object containing filter state and handler functions.
 */
export const useAdvancedFilter = (initialFilters = {}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || "");
  const [status, setStatus] = useState(initialFilters.status || "all");
  // 🔽 ADDED: New states for before/after statuses
  const [statusBefore, setStatusBefore] = useState(initialFilters.statusBefore || "all");
  const [statusAfter, setStatusAfter] = useState(initialFilters.statusAfter || "all");
  const [dateRange, setDateRange] = useState(initialFilters.dateRange || [null, null]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleStatusChange = useCallback((e) => {
    setStatus(e.target.value);
  }, []);

  // 🔽 ADDED: New handlers
  const handleStatusBeforeChange = useCallback((e) => {
    setStatusBefore(e.target.value);
  }, []);

  const handleStatusAfterChange = useCallback((e) => {
    setStatusAfter(e.target.value);
  }, []);

  const handleDateRangeChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setStatus("all");
    // 🔽 ADDED: Reset new states
    setStatusBefore("all");
    setStatusAfter("all");
    setDateRange([null, null]);
  }, []);

  // Returns a memoized object suitable for passing to RTK Query
  const getQueryArgs = useCallback(() => ({
    search: searchQuery || undefined,
    status: status !== "all" ? status : undefined,
    // 🔽 ADDED: Pass new statuses to query args
    status_before: statusBefore !== "all" ? statusBefore : undefined,
    status_after: statusAfter !== "all" ? statusAfter : undefined,
    start_date: dateRange[0] ? dateRange[0].toISOString().split('T')[0] : undefined,
    end_date: dateRange[1] ? dateRange[1].toISOString().split('T')[0] : undefined,
  }), [searchQuery, status, statusBefore, statusAfter, dateRange]);

  return {
    filters: {
      searchQuery,
      status,
      // 🔽 ADDED: Expose new states
      statusBefore,
      statusAfter,
      dateRange,
    },
    handlers: {
      handleSearchChange,
      handleStatusChange,
      // 🔽 ADDED: Expose new handlers
      handleStatusBeforeChange,
      handleStatusAfterChange,
      handleDateRangeChange,
      resetFilters,
    },
    getQueryArgs,
  };
};