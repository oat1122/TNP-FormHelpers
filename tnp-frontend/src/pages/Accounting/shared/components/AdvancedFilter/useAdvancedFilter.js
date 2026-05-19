import { useCallback, useEffect, useRef, useState } from "react";

// 🔄 Debounce ของ search query — กัน RTK Query ยิง request ทุก keystroke
// (rule: tnp-frontend/.claude/rules/performance.md — "Debounce: useRef + setTimeout 300–500ms")
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Custom Hook for managing the state and logic of the AdvancedFilter component.
 * @param {Object} initialFilters - Optional initial state for the filters.
 * @returns {Object} An object containing filter state and handler functions.
 */
export const useAdvancedFilter = (initialFilters = {}) => {
  const initialSearch = initialFilters.searchQuery || "";

  // searchQuery = ค่าที่ผูกกับ input (อัพเดททันที — user เห็น text ตอนพิมพ์)
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  // searchQueryDebounced = ค่าที่ใช้กับ RTK Query (อัพเดทช้ากว่า 400ms — กัน request flood)
  const [searchQueryDebounced, setSearchQueryDebounced] = useState(initialSearch);

  const [status, setStatus] = useState(initialFilters.status || "all");
  const [statusBefore, setStatusBefore] = useState(initialFilters.statusBefore || "all");
  const [statusAfter, setStatusAfter] = useState(initialFilters.statusAfter || "all");
  const [dateRange, setDateRange] = useState(initialFilters.dateRange || [null, null]);

  // เก็บ timeout id เพื่อ clear ตอน value เปลี่ยนใหม่ / unmount
  const debounceTimerRef = useRef(null);

  // sync debounced value เมื่อ searchQuery เปลี่ยน
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setSearchQueryDebounced(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // cleanup ตอน unmount (กัน setState หลัง component หายไป)
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

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
    setSearchQueryDebounced("");
    setStatus("all");
    // 🔽 ADDED: Reset new states
    setStatusBefore("all");
    setStatusAfter("all");
    setDateRange([null, null]);
  }, []);

  // Returns a memoized object suitable for passing to RTK Query
  // ใช้ searchQueryDebounced (ไม่ใช่ searchQuery) เพื่อกัน request ทุก keystroke
  const getQueryArgs = useCallback(
    () => ({
      search: searchQueryDebounced || undefined,
      status: status !== "all" ? status : undefined,

      status_before: statusBefore !== "all" ? statusBefore : undefined,
      status_after: statusAfter !== "all" ? statusAfter : undefined,
      date_from: dateRange[0] ? dateRange[0].toISOString().split("T")[0] : undefined,
      date_to: dateRange[1] ? dateRange[1].toISOString().split("T")[0] : undefined,
    }),
    [searchQueryDebounced, status, statusBefore, statusAfter, dateRange]
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
