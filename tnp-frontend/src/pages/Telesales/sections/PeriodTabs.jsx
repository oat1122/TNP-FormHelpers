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
  CircularProgress,
  IconButton,
  Typography,
  Menu,
  Button,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import "dayjs/locale/th";
import { PERIOD_TABS } from "../constants/index.jsx";

dayjs.locale("th");

const CUSTOM_MODE = "custom";
const QUARTER_MONTH_COUNT = 3;

const getQuarterRange = (baseDate) => {
  const quarterStartMonth =
    Math.floor(baseDate.month() / QUARTER_MONTH_COUNT) * QUARTER_MONTH_COUNT;
  const start = baseDate.month(quarterStartMonth).startOf("month");

  return {
    start,
    end: start.add(QUARTER_MONTH_COUNT - 1, "month").endOf("month"),
  };
};

const getPresetRange = (baseDate, unit) => {
  switch (unit) {
    case "today":
      return {
        start: baseDate.startOf("day"),
        end: baseDate.endOf("day"),
      };
    case "week":
      return {
        start: baseDate.startOf("week"),
        end: baseDate.endOf("week"),
      };
    case "month":
      return {
        start: baseDate.startOf("month"),
        end: baseDate.endOf("month"),
      };
    case "quarter":
      return getQuarterRange(baseDate);
    case "year":
      return {
        start: baseDate.startOf("year"),
        end: baseDate.endOf("year"),
      };
    default:
      return {
        start: baseDate.startOf("month"),
        end: baseDate.endOf("month"),
      };
  }
};

const getShiftedRange = ({ referenceDate, effectiveUnit, amount, startDate, endDate }) => {
  if (effectiveUnit === CUSTOM_MODE) {
    const diffInDays = dayjs(endDate).diff(dayjs(startDate), "day") + 1;
    const nextStart = referenceDate.add(amount * diffInDays, "day");

    return {
      referenceDate: nextStart,
      start: nextStart,
      end: dayjs(endDate).add(amount * diffInDays, "day"),
      mode: CUSTOM_MODE,
      shiftUnit: CUSTOM_MODE,
    };
  }

  if (effectiveUnit === "quarter") {
    const nextReferenceDate = referenceDate.add(amount * QUARTER_MONTH_COUNT, "month");
    const range = getPresetRange(nextReferenceDate, "quarter");

    return {
      referenceDate: nextReferenceDate,
      start: range.start,
      end: range.end,
      mode: "quarter",
      shiftUnit: "quarter",
    };
  }

  const addUnitMap = {
    today: "day",
    week: "week",
    month: "month",
    year: "year",
  };

  const nextReferenceDate = referenceDate.add(amount, addUnitMap[effectiveUnit] || "month");
  const range = getPresetRange(nextReferenceDate, effectiveUnit);

  return {
    referenceDate: nextReferenceDate,
    start: range.start,
    end: range.end,
    mode: effectiveUnit,
    shiftUnit: effectiveUnit,
  };
};

const PeriodTabs = ({ periodFilter, onPeriodChange, filters = [], isLoading = false }) => {
  const { mode, shiftUnit, startDate, endDate } = periodFilter;
  const [referenceDate, setReferenceDate] = useState(dayjs());
  const [anchorEl, setAnchorEl] = useState(null);
  const [tempStart, setTempStart] = useState(startDate ? dayjs(startDate) : dayjs());
  const [tempEnd, setTempEnd] = useState(endDate ? dayjs(endDate) : dayjs());

  const activeTabValue =
    mode === CUSTOM_MODE ? (shiftUnit && shiftUnit !== CUSTOM_MODE ? shiftUnit : false) : mode;
  const isManualCustomRange = mode === CUSTOM_MODE && shiftUnit === CUSTOM_MODE;

  useEffect(() => {
    if (!startDate) {
      return;
    }

    setReferenceDate(dayjs(startDate));
  }, [startDate]);

  const handleTabChange = (_, newValue) => {
    if (!newValue) {
      return;
    }

    const { start, end } = getPresetRange(dayjs(), newValue);

    setReferenceDate(start);
    onPeriodChange({
      mode: newValue,
      shiftUnit: newValue,
      startDate: start.format("YYYY-MM-DD"),
      endDate: end.format("YYYY-MM-DD"),
    });
  };

  const shiftDate = (direction) => {
    const amount = direction === "prev" ? -1 : 1;
    const effectiveUnit = mode === CUSTOM_MODE ? shiftUnit || CUSTOM_MODE : mode;

    if (!effectiveUnit) {
      return;
    }

    const nextRange = getShiftedRange({
      referenceDate,
      effectiveUnit,
      amount,
      startDate,
      endDate,
    });

    setReferenceDate(nextRange.referenceDate);
    onPeriodChange({
      mode: nextRange.mode,
      shiftUnit: nextRange.shiftUnit,
      startDate: nextRange.start.format("YYYY-MM-DD"),
      endDate: nextRange.end.format("YYYY-MM-DD"),
    });
  };

  const getDisplayLabel = () => {
    if (!startDate || !endDate) return "กำลังโหลด...";

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const isSameDay = start.isSame(end, "day");
    const isSameMonth = start.isSame(end, "month") && start.isSame(end, "year");
    const isSameYear = start.isSame(end, "year");

    if (isSameDay) {
      return start.format("D MMM YYYY");
    }

    if (isSameMonth && start.date() === 1 && end.date() === end.daysInMonth()) {
      return start.format("MMMM YYYY");
    }

    if (isSameYear) {
      return `${start.format("D MMM")} - ${end.format("D MMM YYYY")}`;
    }

    return `${start.format("D MMM YYYY")} - ${end.format("D MMM YYYY")}`;
  };

  const openCustomDatePicker = (event) => {
    setTempStart(startDate ? dayjs(startDate) : dayjs());
    setTempEnd(endDate ? dayjs(endDate) : dayjs());
    setAnchorEl(event.currentTarget);
  };

  const closeCustomDatePicker = () => {
    setAnchorEl(null);
  };

  const applyCustomDateRange = () => {
    if (!tempStart || !tempEnd) {
      return;
    }

    let finalStart = tempStart;
    let finalEnd = tempEnd;

    if (tempStart.isAfter(tempEnd)) {
      finalStart = tempEnd;
      finalEnd = tempStart;
    }

    setReferenceDate(finalStart);
    onPeriodChange({
      mode: CUSTOM_MODE,
      shiftUnit: CUSTOM_MODE,
      startDate: finalStart.format("YYYY-MM-DD"),
      endDate: finalEnd.format("YYYY-MM-DD"),
    });
    closeCustomDatePicker();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Paper elevation={1} sx={{ mb: 1 }}>
        <Tabs
          value={activeTabValue}
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

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={2}
          flexWrap="wrap"
          gap={2}
        >
          <Box display="flex" gap={2}>
            {filters.map((filter, index) => (
              <FormControl key={index} size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ fontFamily: "Kanit" }}>{filter.label}</InputLabel>
                <Select
                  value={filter.value}
                  onChange={(event) => filter.onChange(event.target.value)}
                  label={filter.label}
                  sx={{ fontFamily: "Kanit" }}
                >
                  {filter.options.map((option) => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontFamily: "Kanit" }}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
            {isLoading ? <CircularProgress size={24} sx={{ ml: 1 }} /> : null}
          </Box>

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
            {isManualCustomRange ? "กำหนดช่วงเวลาเอง" : "ระบุวันที่"}
          </Button>

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
