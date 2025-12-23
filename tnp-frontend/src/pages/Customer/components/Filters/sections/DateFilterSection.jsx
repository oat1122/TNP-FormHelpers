import { Chip, Stack } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import React from "react";
import "dayjs/locale/th";

// Constants
import {
  dateRangeOptions,
  filterColors,
  filterValidation,
} from "../../../constants/filterConstants";

/**
 * Date Filter Section Component
 * Compact version with quick buttons and date pickers
 */
const DateFilterSection = ({ draftFilters, dateHelpers, compact = false }) => {
  const { handleQuickDateRange, setStartDate, setEndDate } = dateHelpers;

  return (
    <Stack spacing={1.5}>
      {/* Quick Date Buttons */}
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {dateRangeOptions.map((opt) => (
          <Chip
            key={opt.key}
            label={opt.label}
            size="small"
            onClick={() => handleQuickDateRange(opt.key)}
            sx={{
              fontSize: "0.7rem",
              height: 24,
              cursor: "pointer",
              bgcolor: "grey.100",
              "&:hover": { bgcolor: filterColors.primaryLight },
            }}
          />
        ))}
      </Stack>

      {/* Date Pickers */}
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <DatePicker
            label="เริ่มต้น"
            value={draftFilters.dateRange.startDate}
            onChange={setStartDate}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                sx: { "& .MuiInputBase-root": { height: 36, fontSize: "0.85rem" } },
              },
            }}
          />
          <DatePicker
            label="สิ้นสุด"
            value={draftFilters.dateRange.endDate}
            onChange={setEndDate}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                sx: { "& .MuiInputBase-root": { height: 36, fontSize: "0.85rem" } },
              },
            }}
          />
        </Stack>
      </LocalizationProvider>
    </Stack>
  );
};

export default DateFilterSection;
