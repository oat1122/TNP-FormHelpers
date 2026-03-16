import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  Alert,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Menu,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { th } from "date-fns/locale";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  addMonths,
  subMonths,
} from "date-fns";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import BarChartIcon from "@mui/icons-material/BarChart";
import TodayIcon from "@mui/icons-material/Today";
import DateRangeIcon from "@mui/icons-material/DateRange";
import EventIcon from "@mui/icons-material/Event";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import MenuIcon from "@mui/icons-material/Menu";

import accountingTheme from "../../theme/accountingTheme";
import {
  useGetQuotationReportQuery,
  useGetCompaniesQuery,
} from "../../../../features/Accounting/accountingApi";
import ReportStatusTabs from "./components/ReportStatusTabs";
import ReportSummaryCards from "./components/ReportSummaryCards";
import ReportTableView from "./components/ReportTableView";
import ReportExportButton from "./components/ReportExportButton";

import { useOutletContext } from "react-router-dom";

const QuotationReport = () => {
  // Navigation context to open drawer
  const context = useOutletContext();

  // Filters
  const [activeTab, setActiveTab] = useState("all");

  // New Date Filters
  const [dateFilterTab, setDateFilterTab] = useState("month");
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const [dateFrom, setDateFrom] = useState(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState(endOfMonth(new Date()));
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Custom Date Range Popover State
  const [anchorEl, setAnchorEl] = useState(null);
  const [tempStart, setTempStart] = useState(startOfMonth(new Date()));
  const [tempEnd, setTempEnd] = useState(endOfMonth(new Date()));

  const handleDateTabChange = (event, newValue) => {
    if (newValue === "custom") return;
    setDateFilterTab(newValue);
    const now = new Date();
    switch (newValue) {
      case "today":
        setDateFrom(startOfDay(now));
        setDateTo(endOfDay(now));
        break;
      case "week":
        setDateFrom(startOfWeek(now, { weekStartsOn: 1 }));
        setDateTo(endOfWeek(now, { weekStartsOn: 1 }));
        break;
      case "month":
        setDateFrom(startOfMonth(currentMonth));
        setDateTo(endOfMonth(currentMonth));
        break;
      case "quarter":
        setDateFrom(startOfQuarter(now));
        setDateTo(endOfQuarter(now));
        break;
      case "year":
        setDateFrom(startOfYear(now));
        setDateTo(endOfYear(now));
        break;
      default:
        break;
    }
  };

  const handlePrevPeriod = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    if (dateFilterTab === "month") {
      setDateFrom(startOfMonth(newMonth));
      setDateTo(endOfMonth(newMonth));
    } else {
      setDateFilterTab("month");
      setDateFrom(startOfMonth(newMonth));
      setDateTo(endOfMonth(newMonth));
    }
  };

  const handleNextPeriod = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    if (dateFilterTab === "month") {
      setDateFrom(startOfMonth(newMonth));
      setDateTo(endOfMonth(newMonth));
    } else {
      setDateFilterTab("month");
      setDateFrom(startOfMonth(newMonth));
      setDateTo(endOfMonth(newMonth));
    }
  };

  const openCustomDatePicker = (event) => {
    setTempStart(dateFrom || new Date());
    setTempEnd(dateTo || new Date());
    setAnchorEl(event.currentTarget);
  };

  const closeCustomDatePicker = () => {
    setAnchorEl(null);
  };

  const applyCustomDateRange = () => {
    if (tempStart && tempEnd) {
      let finalStart = tempStart;
      let finalEnd = tempEnd;
      // Ensure start is before end
      if (tempStart > tempEnd) {
        finalStart = tempEnd;
        finalEnd = tempStart;
      }
      setDateFrom(finalStart);
      setDateTo(finalEnd);
      setDateFilterTab("custom");
      closeCustomDatePicker();
    }
  };

  // Helper to format the label shown between the arrows
  const getDisplayLabel = () => {
    if (!dateFrom || !dateTo) return "กำลังโหลด...";
    const start = dateFrom;
    const end = dateTo;

    const isSameDay =
      start.getDate() === end.getDate() &&
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();
    const isSameMonth =
      start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const isSameYear = start.getFullYear() === end.getFullYear();

    if (isSameDay) {
      return format(start, "d MMM yyyy", { locale: th });
    } else if (
      isSameMonth &&
      start.getDate() === 1 &&
      end.getDate() === endOfMonth(start).getDate()
    ) {
      return format(start, "MMMM yyyy", { locale: th });
    } else if (isSameYear) {
      return `${format(start, "d MMM", { locale: th })} - ${format(end, "d MMM yyyy", { locale: th })}`;
    } else {
      return `${format(start, "d MMM yyyy", { locale: th })} - ${format(end, "d MMM yyyy", { locale: th })}`;
    }
  };

  // Build query params — NEVER include status (tabs filter client-side only)
  const queryParams = useMemo(() => {
    const p = {};
    if (dateFrom) p.date_from = format(dateFrom, "yyyy-MM-dd");
    if (dateTo) p.date_to = format(dateTo, "yyyy-MM-dd");
    if (search) p.search = search;
    if (companyId) p.company_id = companyId;
    return p;
  }, [dateFrom, dateTo, search, companyId]);

  const { data, error, isLoading, isFetching, refetch } = useGetQuotationReportQuery(queryParams);
  const { data: companiesData } = useGetCompaniesQuery();

  // Full data from API (all statuses)
  const allReportData = data?.data?.data ?? data?.data ?? [];
  const summary = data?.data?.summary ?? data?.summary ?? {};
  const companies = Array.isArray(companiesData?.data) ? companiesData.data : (companiesData ?? []);

  // Counts always from FULL data — never affected by active tab
  const countsByStatus = useMemo(() => {
    const counts = {};
    allReportData.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [allReportData]);

  // Table data filtered client-side by active tab
  const displayData = useMemo(() => {
    if (activeTab === "all") return allReportData;
    return allReportData.filter((r) => r.status === activeTab);
  }, [allReportData, activeTab]);

  // Dynamically calculate summary based on the currently displayed data
  const dynamicSummary = useMemo(() => {
    // For counting, we include all items in the current view
    const count = displayData.length;

    // For totals, we exclude rejected items (same logic as table footer)
    const activeRows = displayData.filter((r) => r.status !== "rejected");
    const subtotal = activeRows.reduce((sum, r) => sum + Number(r.subtotal || 0), 0);
    const tax_amount = activeRows.reduce((sum, r) => sum + Number(r.tax_amount || 0), 0);
    const total_amount = activeRows.reduce((sum, r) => sum + Number(r.final_total_amount || 0), 0);

    return {
      count,
      subtotal,
      tax_amount,
      total_amount,
    };
  }, [displayData]);

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setSearch(searchInput);
    },
    [searchInput]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <ThemeProvider theme={accountingTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
          {/* Header */}
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "white",
              px: { xs: 2, md: 4 },
              py: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 1 }}
                onClick={context?.onMenuClick}
              >
                <MenuIcon fontSize="large" />
              </IconButton>
              <BarChartIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  รายงานใบเสนอราคา
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  Sales Report — Quotation Summary
                </Typography>
              </Box>
            </Stack>
            <Tooltip title="รีเฟรชข้อมูล">
              <IconButton onClick={handleRefresh} sx={{ color: "white" }} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 4 } }}>
            {/* Filter Bar */}
            <Paper
              elevation={0}
              sx={{ p: 2, mb: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
            >
              {/* Top Row: Date Tabs & Source & Navigator */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Tabs
                  value={dateFilterTab !== "custom" ? dateFilterTab : false}
                  onChange={handleDateTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ minHeight: "40px", "& .MuiTab-root": { minHeight: "40px", py: 0 } }}
                >
                  <Tab
                    icon={<TodayIcon fontSize="small" />}
                    iconPosition="start"
                    label="วันนี้"
                    value="today"
                  />
                  <Tab
                    icon={<DateRangeIcon fontSize="small" />}
                    iconPosition="start"
                    label="สัปดาห์นี้"
                    value="week"
                  />
                  <Tab
                    icon={<EventIcon fontSize="small" />}
                    iconPosition="start"
                    label="เดือนนี้"
                    value="month"
                  />
                  <Tab
                    icon={<EventNoteIcon fontSize="small" />}
                    iconPosition="start"
                    label="ไตรมาสนี้"
                    value="quarter"
                  />
                  <Tab
                    icon={<CalendarTodayIcon fontSize="small" />}
                    iconPosition="start"
                    label="ปีนี้"
                    value="year"
                  />
                </Tabs>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      bgcolor: "background.paper",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      px: 1,
                      height: "40px",
                    }}
                  >
                    <IconButton size="small" onClick={handlePrevPeriod}>
                      <KeyboardArrowLeftIcon fontSize="small" />
                    </IconButton>
                    <Typography
                      variant="body2"
                      sx={{ minWidth: 100, textAlign: "center", fontWeight: 500 }}
                    >
                      {getDisplayLabel()}
                    </Typography>
                    <IconButton size="small" onClick={handleNextPeriod}>
                      <KeyboardArrowRightIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Button
                    variant={dateFilterTab === "custom" ? "contained" : "outlined"}
                    startIcon={<DateRangeIcon />}
                    onClick={openCustomDatePicker}
                    sx={{ height: "40px" }}
                  >
                    ระบุวันที่
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
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold" }}>
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
                      <Button onClick={closeCustomDatePicker} size="small">
                        ยกเลิก
                      </Button>
                      <Button onClick={applyCustomDateRange} variant="contained" size="small">
                        นำไปใช้
                      </Button>
                    </Box>
                  </Menu>
                </Box>
              </Box>

              <Divider sx={{ mb: 2, borderColor: "divider" }} />

              {/* Bottom Row: Specific filters (Company, Search, Export) */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                flexWrap="wrap"
                gap={2}
                alignItems="center"
              >
                {/* Company */}
                {companies.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>บริษัท</InputLabel>
                    <Select
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                      label="บริษัท"
                    >
                      <MenuItem value="">ทั้งหมด</MenuItem>
                      {companies.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name || c.company_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* Search */}
                <Box component="form" onSubmit={handleSearchSubmit}>
                  <TextField
                    size="small"
                    placeholder="ค้นหาเลขที่, ลูกค้า, โปรเจ็ค..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ minWidth: 240 }}
                  />
                </Box>

                <Box sx={{ ml: "auto" }}>
                  <ReportExportButton filters={queryParams} disabled={isLoading || isFetching} />
                </Box>
              </Stack>
            </Paper>

            {/* Error */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
              </Alert>
            )}

            {/* Summary Cards */}
            <ReportSummaryCards summary={dynamicSummary} />

            {/* Status Tabs + Table */}
            <Box>
              <ReportStatusTabs value={activeTab} counts={countsByStatus} onChange={setActiveTab} />
              <ReportTableView data={displayData} isLoading={isLoading || isFetching} />
            </Box>

            {/* Total count */}
            <Box sx={{ mt: 1.5, textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary">
                แสดง {displayData.length} รายการ
                {isLoading || isFetching ? " (กำลังโหลด...)" : ""}
              </Typography>
            </Box>
          </Container>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default QuotationReport;
