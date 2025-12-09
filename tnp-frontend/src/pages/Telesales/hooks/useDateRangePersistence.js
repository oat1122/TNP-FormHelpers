import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { dateRangeCalculators, isValidDateRange } from "../../Customer/utils/dateAdapters";

const STORAGE_KEY = "telesalesDashboard_dateRange";

/**
 * Custom hook for persistent date range management
 * Stores date range preferences in localStorage with support for both presets and custom ranges
 *
 * Storage structure:
 * {
 *   mode: 'preset' | 'custom',
 *   value: 'today' | 'thisWeek' | 'thisMonth' | null,
 *   start: 'YYYY-MM-DD' | null,
 *   end: 'YYYY-MM-DD' | null
 * }
 *
 * @returns {Object} Date range state and control functions
 */
export const useDateRangePersistence = () => {
  // Initialize from localStorage or default to thisMonth
  const [dateRange, setDateRange] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Validate stored data structure
        if (parsed.mode === "preset" && parsed.value) {
          // Recalculate preset dates (important for "today", "thisWeek", etc.)
          const calculator = dateRangeCalculators[parsed.value];
          if (calculator) {
            const range = calculator();
            return {
              mode: "preset",
              value: parsed.value,
              start: range.startDate.format("YYYY-MM-DD"),
              end: range.endDate.format("YYYY-MM-DD"),
            };
          }
        } else if (parsed.mode === "custom" && parsed.start && parsed.end) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn("Failed to load date range from localStorage:", error);
    }

    // Default to thisMonth
    const defaultRange = dateRangeCalculators.thisMonth();
    return {
      mode: "preset",
      value: "thisMonth",
      start: defaultRange.startDate.format("YYYY-MM-DD"),
      end: defaultRange.endDate.format("YYYY-MM-DD"),
    };
  });

  // Sync to localStorage whenever dateRange changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dateRange));
    } catch (error) {
      console.error("Failed to save date range to localStorage:", error);
    }
  }, [dateRange]);

  // Convert string dates to dayjs objects
  const startDate = useMemo(() => {
    return dateRange.start ? dayjs(dateRange.start) : null;
  }, [dateRange.start]);

  const endDate = useMemo(() => {
    return dateRange.end ? dayjs(dateRange.end) : null;
  }, [dateRange.end]);

  // Validate date range
  const isValid = useMemo(() => {
    if (!startDate || !endDate) return false;
    return isValidDateRange(startDate, endDate);
  }, [startDate, endDate]);

  // Display label for current range
  const displayLabel = useMemo(() => {
    if (!startDate || !endDate) return "";

    if (dateRange.mode === "preset") {
      const labels = {
        today: "วันนี้",
        thisWeek: "สัปดาห์นี้",
        thisMonth: "เดือนนี้",
      };
      return labels[dateRange.value] || "";
    }

    // Custom range - show formatted dates with Buddhist year
    const startFormatted = startDate.add(543, "year").format("D MMM YYYY");
    const endFormatted = endDate.add(543, "year").format("D MMM YYYY");
    return `${startFormatted} - ${endFormatted}`;
  }, [dateRange, startDate, endDate]);

  // Set preset date range
  const setPreset = (presetKey) => {
    const calculator = dateRangeCalculators[presetKey];
    if (!calculator) {
      console.error(`Invalid preset key: ${presetKey}`);
      return;
    }

    const range = calculator();
    setDateRange({
      mode: "preset",
      value: presetKey,
      start: range.startDate.format("YYYY-MM-DD"),
      end: range.endDate.format("YYYY-MM-DD"),
    });
  };

  // Set custom date range
  const setCustomRange = (start, end) => {
    if (!start || !end) {
      console.error("Both start and end dates are required for custom range");
      return;
    }

    setDateRange({
      mode: "custom",
      value: null,
      start: dayjs(start).format("YYYY-MM-DD"),
      end: dayjs(end).format("YYYY-MM-DD"),
    });
  };

  // Reset to default (thisMonth)
  const reset = () => {
    const defaultRange = dateRangeCalculators.thisMonth();
    setDateRange({
      mode: "preset",
      value: "thisMonth",
      start: defaultRange.startDate.format("YYYY-MM-DD"),
      end: defaultRange.endDate.format("YYYY-MM-DD"),
    });
  };

  return {
    dateRange,
    startDate,
    endDate,
    isValid,
    displayLabel,
    setPreset,
    setCustomRange,
    reset,
  };
};
