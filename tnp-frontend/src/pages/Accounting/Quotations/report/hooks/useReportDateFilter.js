import { startOfMonth, endOfMonth } from "date-fns";
import { useCallback, useMemo, useState } from "react";

import { formatDisplayLabel, presetRange, shiftMonth } from "../utils/reportDateRanges";

const initialMonthRange = () => {
  const now = new Date();
  return { start: startOfMonth(now), end: endOfMonth(now) };
};

// Owns date-tab state + month navigator + custom popover state.
// Returns the current `{ dateFrom, dateTo }` range that downstream queries consume.
export function useReportDateFilter() {
  const initial = initialMonthRange();
  const [dateFilterTab, setDateFilterTab] = useState("month");
  const [currentMonth, setCurrentMonth] = useState(initial.start);
  const [dateFrom, setDateFrom] = useState(initial.start);
  const [dateTo, setDateTo] = useState(initial.end);

  const [anchorEl, setAnchorEl] = useState(null);
  const [tempStart, setTempStart] = useState(initial.start);
  const [tempEnd, setTempEnd] = useState(initial.end);

  const applyPreset = useCallback((preset, refDate) => {
    const range = presetRange(preset, refDate);
    if (!range) return;
    setDateFrom(range.start);
    setDateTo(range.end);
  }, []);

  const handleDateTabChange = useCallback(
    (_event, newValue) => {
      if (!newValue || newValue === "custom") return;
      setDateFilterTab(newValue);
      applyPreset(newValue, currentMonth);
    },
    [applyPreset, currentMonth]
  );

  const shiftToMonth = useCallback(
    (delta) => {
      const next = shiftMonth(currentMonth, delta);
      setCurrentMonth(next);
      setDateFilterTab("month");
      applyPreset("month", next);
    },
    [applyPreset, currentMonth]
  );

  const handlePrevPeriod = useCallback(() => shiftToMonth(-1), [shiftToMonth]);
  const handleNextPeriod = useCallback(() => shiftToMonth(1), [shiftToMonth]);

  const openCustomPicker = useCallback(
    (event) => {
      setTempStart(dateFrom || new Date());
      setTempEnd(dateTo || new Date());
      setAnchorEl(event.currentTarget);
    },
    [dateFrom, dateTo]
  );

  const closeCustomPicker = useCallback(() => setAnchorEl(null), []);

  const applyCustomRange = useCallback(() => {
    if (!tempStart || !tempEnd) return;
    const [s, e] = tempStart > tempEnd ? [tempEnd, tempStart] : [tempStart, tempEnd];
    setDateFrom(s);
    setDateTo(e);
    setDateFilterTab("custom");
    setAnchorEl(null);
  }, [tempStart, tempEnd]);

  const displayLabel = useMemo(() => formatDisplayLabel(dateFrom, dateTo), [dateFrom, dateTo]);

  return {
    dateFilterTab,
    dateFrom,
    dateTo,
    displayLabel,
    handleDateTabChange,
    handlePrevPeriod,
    handleNextPeriod,
    customPicker: {
      anchorEl,
      tempStart,
      tempEnd,
      setTempStart,
      setTempEnd,
      open: openCustomPicker,
      close: closeCustomPicker,
      apply: applyCustomRange,
    },
  };
}
