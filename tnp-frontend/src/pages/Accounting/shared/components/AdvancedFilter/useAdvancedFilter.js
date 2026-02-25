import { useState, useCallback } from "react";

/**
 * Custom Hook for managing the state and logic of the AdvancedFilter component.
 * @param {Object} initialFilters - Optional initial state for the filters.
 * @returns {Object} An object containing filter state and handler functions.
 */
export const useAdvancedFilter = (initialFilters = {}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || "");
  const [status, setStatus] = useState(initialFilters.status || "all");

  const [statusBefore, setStatusBefore] = useState(initialFilters.statusBefore || "all");
  const [statusAfter, setStatusAfter] = useState(initialFilters.statusAfter || "all");
  const [dateRange, setDateRange] = useState(initialFilters.dateRange || [null, null]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleStatusChange = useCallback((e) => {
    setStatus(e.target.value);
  }, []);

  const handleStatusBeforeChange = useCallback((e) => {
    const newValue = e.target.value;
    setStatusBefore(newValue);

    // เมื่อเลือกสถานะ "ก่อนมัดจำ" ให้รีเซ็ต "หลังมัดจำ" เป็น "all"
    if (newValue !== "all") {
      setStatusAfter("all");
    }
  }, []);

  const handleStatusAfterChange = useCallback((e) => {
    const newValue = e.target.value;
    setStatusAfter(newValue);

    // เมื่อเลือกสถานะ "หลังมัดจำ" ให้รีเซ็ต "ก่อนมัดจำ" เป็น "all"
    if (newValue !== "all") {
      setStatusBefore("all");
    }
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
  const getQueryArgs = useCallback(
    () => ({
      search: searchQuery || undefined,
      status: status !== "all" ? status : undefined,

      status_before: statusBefore !== "all" ? statusBefore : undefined,
      status_after: statusAfter !== "all" ? statusAfter : undefined,
      date_from: dateRange[0] ? dateRange[0].toISOString().split("T")[0] : undefined,
      date_to: dateRange[1] ? dateRange[1].toISOString().split("T")[0] : undefined,
    }),
    [searchQuery, status, statusBefore, statusAfter, dateRange]
  );

  return {
    filters: {
      searchQuery,
      status,

      statusBefore,
      statusAfter,
      dateRange,
    },
    handlers: {
      handleSearchChange,
      handleStatusChange,

      handleStatusBeforeChange,
      handleStatusAfterChange,
      handleDateRangeChange,
      resetFilters,
    },
    getQueryArgs,
  };
};
