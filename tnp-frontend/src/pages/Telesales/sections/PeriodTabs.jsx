import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Menu,
  Button,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useState, useEffect } from "react";

import "dayjs/locale/th";
import { PERIOD_TABS, SOURCE_OPTIONS } from "../constants/index.jsx";

// Set default locale for dayjs
dayjs.locale("th");

/**
 * Period Tabs component
 * Displays period selection tabs, custom date picker, navigation arrows, and source filter dropdown
 */
const PeriodTabs = ({ periodFilter, onPeriodChange, sourceFilter, onSourceFilterChange }) => {
  const { mode, startDate, endDate } = periodFilter;

  // Internal state for the reference date when navigating using arrows
  const [referenceDate, setReferenceDate] = useState(dayjs());

  // State for the custom date range picker popover
  const [anchorEl, setAnchorEl] = useState(null);
  const [tempStart, setTempStart] = useState(startDate ? dayjs(startDate) : dayjs());
  const [tempEnd, setTempEnd] = useState(endDate ? dayjs(endDate) : dayjs());

  // Initialize dates base on mode
  useEffect(() => {
    if (mode === "custom" && startDate && endDate) {
      setReferenceDate(dayjs(startDate));
    }
  }, [mode, startDate, endDate]);

  const handleTabChange = (_, newValue) => {
    const today = dayjs();
    let newStart = today;
    let newEnd = today;

    switch (newValue) {
      case "today":
        newStart = today.startOf("day");
        newEnd = today.endOf("day");
        break;
      case "week":
        newStart = today.startOf("week");
        newEnd = today.endOf("week");
        break;
      case "month":
        newStart = today.startOf("month");
        newEnd = today.endOf("month");
        break;
      case "quarter":
        newStart = today.startOf("quarter");
        newEnd = today.endOf("quarter");
        break;
      case "year":
        newStart = today.startOf("year");
        newEnd = today.endOf("year");
        break;
      default:
        newStart = today.startOf("month");
        newEnd = today.endOf("month");
    }

    setReferenceDate(newStart);
    onPeriodChange({
      mode: newValue,
      startDate: newStart.format("YYYY-MM-DD"),
      endDate: newEnd.format("YYYY-MM-DD"),
    });
  };

  const shiftDate = (direction) => {
    let newRefDate = referenceDate;
    let newStart = referenceDate;
    let newEnd = referenceDate;
    const amount = direction === "prev" ? -1 : 1;

    switch (mode) {
      case "today":
        newRefDate = referenceDate.add(amount, "day");
        newStart = newRefDate.startOf("day");
        newEnd = newRefDate.endOf("day");
        break;
      case "week":
        newRefDate = referenceDate.add(amount, "week");
        newStart = newRefDate.startOf("week");
        newEnd = newRefDate.endOf("week");
        break;
      case "month":
        newRefDate = referenceDate.add(amount, "month");
        newStart = newRefDate.startOf("month");
        newEnd = newRefDate.endOf("month");
        break;
      case "quarter":
        newRefDate = referenceDate.add(amount, "quarter");
        newStart = newRefDate.startOf("quarter");
        newEnd = newRefDate.endOf("quarter");
        break;
      case "year":
        newRefDate = referenceDate.add(amount, "year");
        newStart = newRefDate.startOf("year");
        newEnd = newRefDate.endOf("year");
        break;
      case "custom": {
        // For custom, shift by the exact difference in days
        const diff = dayjs(endDate).diff(dayjs(startDate), "day") + 1;
        newRefDate = referenceDate.add(amount * diff, "day");
        newStart = newRefDate;
        newEnd = dayjs(endDate).add(amount * diff, "day");
        break;
      }
      default:
        return;
    }

    setReferenceDate(newRefDate);
    // When shifting, we switch to 'custom' mode because it's no longer the "current" month/week
    onPeriodChange({
      mode: "custom",
      startDate: newStart.format("YYYY-MM-DD"),
      endDate: newEnd.format("YYYY-MM-DD"),
    });
  };

  // Helper to format the label shown between the arrows
  const getDisplayLabel = () => {
    if (!startDate || !endDate) return "กำลังโหลด...";
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    const isSameDay = start.isSame(end, "day");
    const isSameMonth = start.isSame(end, "month") && start.isSame(end, "year");
    const isSameYear = start.isSame(end, "year");

    if (isSameDay) {
      return start.format("D MMM YYYY");
    } else if (isSameMonth && start.date() === 1 && end.date() === end.daysInMonth()) {
      return start.format("MMMM YYYY");
    } else if (isSameYear) {
      return `${start.format("D MMM")} - ${end.format("D MMM YYYY")}`;
    } else {
      return `${start.format("D MMM YYYY")} - ${end.format("D MMM YYYY")}`;
    }
  };

  // Date Range Picker Handlers
  const openCustomDatePicker = (event) => {
    setTempStart(startDate ? dayjs(startDate) : dayjs());
    setTempEnd(endDate ? dayjs(endDate) : dayjs());
    setAnchorEl(event.currentTarget);
  };

  const closeCustomDatePicker = () => {
    setAnchorEl(null);
  };

  const applyCustomDateRange = () => {
    if (tempStart && tempEnd) {
      // Ensure start is before end
      let finalStart = tempStart;
      let finalEnd = tempEnd;
      if (tempStart.isAfter(tempEnd)) {
        finalStart = tempEnd;
        finalEnd = tempStart;
      }

      setReferenceDate(finalStart);
      onPeriodChange({
        mode: "custom",
        startDate: finalStart.format("YYYY-MM-DD"),
        endDate: finalEnd.format("YYYY-MM-DD"),
      });
      closeCustomDatePicker();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Paper elevation={1} sx={{ mb: 3 }}>
        {/* Top Tabs */}
        <Tabs
          value={mode !== "custom" ? mode : false} // If custom, no tab is "active"
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTabs-flexContainer": {
              justifyContent: "center",
            },
          }}
        >
          {PERIOD_TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{ minHeight: 48, fontFamily: "Kanit" }}
            />
          ))}
        </Tabs>

        {/* Filters and Navigation Row */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={2}
          flexWrap="wrap"
          gap={2}
        >
          {/* Left Side: Source Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontFamily: "Kanit" }}>แหล่งที่มา</InputLabel>
            <Select
              value={sourceFilter}
              onChange={(e) => onSourceFilterChange(e.target.value)}
              label="แหล่งที่มา"
              sx={{ fontFamily: "Kanit" }}
            >
              {SOURCE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: "Kanit" }}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Center: Date Navigation Arrows */}
          <Box
            display="flex"
            alignItems="center"
            sx={{
              backgroundColor: "#f5f5f5",
              borderRadius: "24px",
              px: 1,
              py: 0.5,
            }}
          >
            <IconButton onClick={() => shiftDate("prev")} size="small">
              <KeyboardArrowLeft fontSize="small" />
            </IconButton>

            <Typography
              variant="body2"
              sx={{
                mx: 2,
                minWidth: "140px",
                textAlign: "center",
                fontFamily: "Kanit",
                fontWeight: 500,
              }}
            >
              {getDisplayLabel()}
            </Typography>

            <IconButton onClick={() => shiftDate("next")} size="small">
              <KeyboardArrowRight fontSize="small" />
            </IconButton>
          </Box>

          {/* Right Side: Custom Date Range Trigger */}
          <Button
            variant="outlined"
            startIcon={<DateRangeIcon />}
            onClick={openCustomDatePicker}
            sx={{
              fontFamily: "Kanit",
              color: "text.secondary",
              borderColor: "divider",
              borderRadius: "20px",
              textTransform: "none",
              "&:hover": {
                borderColor: "primary.main",
                color: "primary.main",
              },
            }}
          >
            {mode === "custom" ? "กำหนดช่วงเวลาเอง" : "ระบุวันที่"}
          </Button>

          {/* The Custom Date Range Popover */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={closeCustomDatePicker}
            PaperProps={{
              sx: { p: 2, borderRadius: 2, mt: 1 },
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, fontFamily: "Kanit", fontWeight: "bold" }}>
              กำหนดช่วงเวลา
            </Typography>
            <Box display="flex" gap={2} mb={2}>
              <DatePicker
                label="วันที่เริ่มต้น"
                value={tempStart}
                onChange={(newValue) => setTempStart(newValue)}
                slotProps={{ textField: { size: "small" } }}
              />
              <DatePicker
                label="วันที่สิ้นสุด"
                value={tempEnd}
                minDate={tempStart}
                onChange={(newValue) => setTempEnd(newValue)}
                slotProps={{ textField: { size: "small" } }}
              />
            </Box>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={closeCustomDatePicker} size="small" sx={{ fontFamily: "Kanit" }}>
                ยกเลิก
              </Button>
              <Button
                onClick={applyCustomDateRange}
                variant="contained"
                size="small"
                sx={{ fontFamily: "Kanit" }}
              >
                นำไปใช้
              </Button>
            </Box>
          </Menu>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default PeriodTabs;
