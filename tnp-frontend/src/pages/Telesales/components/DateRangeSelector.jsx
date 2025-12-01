import React from "react";
import {
  Paper,
  Box,
  ButtonGroup,
  Button,
  Divider,
  Typography,
  Chip,
  FormHelperText,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterBuddhistDayjs } from "../../Customer/utils/dateAdapters";

/**
 * Date Range Selector with preset buttons and custom date pickers
 *
 * @param {Object} props
 * @param {Object} props.dateRange Current date range state
 * @param {Function} props.setPreset Function to set preset date range
 * @param {Function} props.setCustomRange Function to set custom date range
 * @param {dayjs.Dayjs} props.startDate Start date as dayjs object
 * @param {dayjs.Dayjs} props.endDate End date as dayjs object
 * @param {boolean} props.isValid Whether current range is valid
 * @param {string} props.displayLabel Formatted display label for current range
 * @param {string} props.roleLabel User role label to display
 */
const DateRangeSelector = ({
  dateRange,
  setPreset,
  setCustomRange,
  startDate,
  endDate,
  isValid,
  displayLabel,
  roleLabel,
}) => {
  const presetButtons = [
    { key: "today", label: "วันนี้" },
    { key: "thisWeek", label: "สัปดาห์นี้" },
    { key: "thisMonth", label: "เดือนนี้" },
  ];

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        gap={2}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        {/* Preset Buttons */}
        <ButtonGroup variant="outlined" size="small" fullWidth={{ xs: true, md: false }}>
          {presetButtons.map(({ key, label }) => (
            <Button
              key={key}
              onClick={() => setPreset(key)}
              variant={
                dateRange.mode === "preset" && dateRange.value === key ? "contained" : "outlined"
              }
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>

        {/* Divider */}
        <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />

        {/* Custom Date Pickers */}
        <LocalizationProvider dateAdapter={AdapterBuddhistDayjs} adapterLocale="th">
          <Box display="flex" gap={1} flexGrow={1} flexDirection={{ xs: "column", sm: "row" }}>
            <DatePicker
              label="วันที่เริ่มต้น"
              value={startDate}
              onChange={(newValue) => {
                if (newValue && endDate) {
                  setCustomRange(newValue, endDate);
                }
              }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !isValid,
                  helperText: !isValid ? "วันที่ไม่ถูกต้อง" : "",
                },
              }}
            />

            <DatePicker
              label="วันที่สิ้นสุด"
              value={endDate}
              onChange={(newValue) => {
                if (startDate && newValue) {
                  setCustomRange(startDate, newValue);
                }
              }}
              minDate={startDate}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
          </Box>
        </LocalizationProvider>

        {/* Role Badge */}
        {roleLabel && <Chip size="small" label={roleLabel} color="primary" variant="outlined" />}
      </Box>

      {/* Display Label and Error Message */}
      <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary">
          ข้อมูลช่วง: {displayLabel}
        </Typography>

        {!isValid && <FormHelperText error>กรุณาเลือกวันสิ้นสุดหลังจากวันเริ่มต้น</FormHelperText>}
      </Box>
    </Paper>
  );
};

export default DateRangeSelector;
