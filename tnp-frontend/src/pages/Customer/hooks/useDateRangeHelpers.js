import { useCallback } from "react";

import { dateRangeCalculators } from "../utils/dateAdapters";

/**
 * Custom hook for date range helper functions
 * Provides quick date range selection and date manipulation utilities
 */
export const useDateRangeHelpers = (setDraftFilters) => {
  // Quick date range buttons handler
  const handleQuickDateRange = useCallback(
    (type) => {
      const dateRange = dateRangeCalculators[type];

      if (!dateRange) {
        console.warn(`Unknown date range type: ${type}`);
        return;
      }

      const { startDate, endDate } = dateRange();

      setDraftFilters((prev) => ({
        ...prev,
        dateRange: {
          startDate,
          endDate,
        },
      }));
    },
    [setDraftFilters]
  );

  // Handle date field clearing
  const clearStartDate = useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        startDate: null,
      },
    }));
  }, [setDraftFilters]);

  const clearEndDate = useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        endDate: null,
      },
    }));
  }, [setDraftFilters]);

  // Set start date
  const setStartDate = useCallback(
    (newValue) => {
      setDraftFilters((prev) => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          startDate: newValue,
        },
      }));
    },
    [setDraftFilters]
  );

  // Set end date
  const setEndDate = useCallback(
    (newValue) => {
      setDraftFilters((prev) => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          endDate: newValue,
        },
      }));
    },
    [setDraftFilters]
  );

  // Clear both dates
  const clearDateRange = useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: {
        startDate: null,
        endDate: null,
      },
    }));
  }, [setDraftFilters]);

  return {
    handleQuickDateRange,
    clearStartDate,
    clearEndDate,
    setStartDate,
    setEndDate,
    clearDateRange,
  };
};
