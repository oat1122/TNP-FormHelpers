// filepath: d:\01oat\TNP-FormHelpers\tnp-frontend\src\pages\Customer\FilterPanel.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import ScrollContext from "./ScrollContext";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Chip,
  Checkbox,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Slider,
  Paper,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { debounce } from "lodash";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  MdExpandMore,
  MdClear,
  MdFilterList,
  MdDateRange,
  MdPerson,
  MdLanguage,
  MdBusiness,
  MdEmail,
  MdSignalCellularAlt,
} from "react-icons/md";
import { RiRefreshLine } from "react-icons/ri";
import { IoSearch } from "react-icons/io5";
import FilterTab from "./FilterTab";
import { useGetUserByRoleQuery } from "../../features/globalApi";
import {
  setFilters,
  setSalesList,
  setPaginationModel,
  resetFilters,
  fetchFilteredCustomers,
} from "../../features/Customer/customerSlice";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { formatCustomRelativeTime } from "../../features/Customer/customerUtils";

// Set up dayjs with Thai locale and Buddhist era
dayjs.extend(buddhistEra);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale("th");

// Custom Buddhist Era Adapter
class AdapterBuddhistDayjs extends AdapterDayjs {
  constructor({ locale }) {
    super({ locale });
  }

  format = (value, formatString) => {
    // Handle Buddhist year display
    const yearFormats = ["YYYY", "YY"];
    let formattedDate = value.format(formatString);

    yearFormats.forEach((yearFormat) => {
      if (formatString.includes(yearFormat)) {
        const gregorianYear = value.year();
        const buddhistYear = gregorianYear + 543;
        if (yearFormat === "YYYY") {
          formattedDate = formattedDate.replace(gregorianYear, buddhistYear);
        } else {
          const shortYear = (gregorianYear % 100).toString().padStart(2, "0");
          const shortBuddhistYear = (buddhistYear % 100)
            .toString()
            .padStart(2, "0");
          formattedDate = formattedDate.replace(shortYear, shortBuddhistYear);
        }
      }
    });

    return formattedDate;
  };

  parse = (value, format) => {
    if (!value) return null;

    // Handle Buddhist year input (e.g., "25/12/2567")
    const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const match = value.match(datePattern);

    if (match) {
      const [_, day, month, year] = match;
      const buddhistYear = parseInt(year, 10);
      const gregorianYear = buddhistYear - 543;

      // Validate the year is reasonable
      if (gregorianYear < 1900 || gregorianYear > 2100) {
        return null;
      }

      return dayjs(`${day}/${month}/${gregorianYear}`, "DD/MM/YYYY");
    }

    return dayjs(value, format);
  };
}

// Channel options
const channelOptions = [
  { value: "1", label: "Sales", icon: <MdPerson />, color: "#2196f3" },
  { value: "2", label: "Online", icon: <MdLanguage />, color: "#4caf50" },
  { value: "3", label: "Office", icon: <MdBusiness />, color: "#ff9800" },
];

function FilterPanel() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.customer.filters);
  const salesList = useSelector((state) => state.customer.salesList);
  const itemList = useSelector((state) => state.customer.itemList);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const userInfo = useSelector((state) => state.global.userInfo);
  const isLoading = useSelector((state) => state.customer.isLoading);
  const error = useSelector((state) => state.customer.error);
  const [expanded, setExpanded] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Get sales list from API
  const { data: salesData, isLoading: salesLoading } =
    useGetUserByRoleQuery("sale");

  // Create a ref for the debounce function to properly handle cleanup
  const debouncedApplyFiltersRef = useRef();

  // Create working draft of filter values
  const [draftFilters, setDraftFilters] = useState({
    dateRange: {
      startDate: filters.dateRange.startDate
        ? dayjs(filters.dateRange.startDate)
        : null,
      endDate: filters.dateRange.endDate
        ? dayjs(filters.dateRange.endDate)
        : null,
    },
    salesName: Array.isArray(filters.salesName) ? [...filters.salesName] : [],
    channel: Array.isArray(filters.channel) ? [...filters.channel] : [],
  });

  // Setup debounced filter function (created only once)
  useEffect(() => {
    debouncedApplyFiltersRef.current = debounce((filtersToApply) => {
      dispatch(setPaginationModel({ page: 0, pageSize: 30 }));
      dispatch(setFilters(filtersToApply));
      console.log("🔥 Applying debounced filters:", filtersToApply);
    }, 500);

    // Cleanup debounced function on unmount
    return () => {
      if (debouncedApplyFiltersRef.current?.cancel) {
        debouncedApplyFiltersRef.current.cancel();
      }
    };
  }, [dispatch]);

  // Sync Redux filters to draft state when Redux filters change
  useEffect(() => {
    try {
      setDraftFilters({
        dateRange: {
          startDate: filters.dateRange.startDate
            ? dayjs(filters.dateRange.startDate)
            : null,
          endDate: filters.dateRange.endDate
            ? dayjs(filters.dateRange.endDate)
            : null,
        },
        salesName: Array.isArray(filters.salesName)
          ? [...filters.salesName]
          : [],
        channel: Array.isArray(filters.channel) ? [...filters.channel] : [],
      });
    } catch (error) {
      console.warn("Error updating draft filters from Redux state:", error);
    }
  }, [filters]);

  // Update sales list from API (only once when data is loaded)
  useEffect(() => {
    if (salesData?.sale_role?.length > 0) {
      const salesNames = salesData.sale_role
        .map((user) => user.username)
        .filter(Boolean);
      dispatch(setSalesList(salesNames));
    }
  }, [salesData, dispatch]);

  // Count filtered items
  const filteredCount = useMemo(() => {
    return itemList?.length || 0;
  }, [itemList]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    if (filters.salesName?.length > 0) count++;
    if (filters.channel?.length > 0) count++;
    return count;
  }, [filters]);

  // Helper function to prepare filters for API
  const prepareFiltersForAPI = (draft) => {
    return {
      dateRange: {
        startDate: draft.dateRange.startDate?.isValid()
          ? draft.dateRange.startDate.format("YYYY-MM-DD")
          : null,
        endDate: draft.dateRange.endDate?.isValid()
          ? draft.dateRange.endDate.format("YYYY-MM-DD")
          : null,
      },
      salesName: Array.isArray(draft.salesName) ? [...draft.salesName] : [],
      channel: Array.isArray(draft.channel) ? [...draft.channel] : [],
    };  };
  
  const { scrollToTop } = useContext(ScrollContext); 
  
  // Apply filters handler
  const handleApplyFilters = useCallback(() => {
    try {
      const filtersToApply = prepareFiltersForAPI(draftFilters);
      console.log("กำลังใช้งานตัวกรอง:", filtersToApply, "กับกลุ่มปัจจุบัน:", groupSelected);

      // Start loading state
      setIsFiltering(true);

      // Apply filters synchronously to ensure they're set before API call
      dispatch(setFilters(filtersToApply));      // Reset to first page when applying filters
      dispatch(setPaginationModel({ page: 0, pageSize: 30 }));

      // Dispatch API action to fetch filtered customers
      dispatch(fetchFilteredCustomers(filtersToApply))
        .unwrap()
        .then((data) => {
          // Success handling
          setExpanded(false); // Collapse filter panel after applying
          setIsFiltering(false);

          // Scroll to top when filters have been applied
          scrollToTop();

          // นับจำนวนข้อมูลที่ได้จากการกรอง
          console.log(`กรองข้อมูลสำเร็จ: พบ ${data?.data?.length || 0} รายการ`);
        })
        .catch((error) => {
          console.error("Error applying filters:", error);
          setErrorMessage(
            `เกิดข้อผิดพลาดในการกรองข้อมูล: ${
              error.message || "โปรดลองใหม่อีกครั้ง"
            }`
          );
          setIsFiltering(false);
        });
    } catch (error) {
      console.error("Error applying filters:", error);
      setErrorMessage("เกิดข้อผิดพลาดในการใช้งานตัวกรอง");
      setIsFiltering(false);
    }
  }, [draftFilters, dispatch, scrollToTop, groupSelected]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setDraftFilters({
      dateRange: {
        startDate: null,
        endDate: null,
      },
      salesName: [],
      channel: [],
    });
    dispatch(resetFilters());
    dispatch(setPaginationModel({ page: 0, pageSize: 30 }));

    // Collapse filter panel after reset
    setExpanded(false);
  }, [dispatch]);

  // Quick date range buttons
  const handleQuickDateRange = useCallback((type) => {
    const today = dayjs();
    let startDate, endDate;

    switch (type) {
      case "today":
        startDate = today.startOf("day");
        endDate = today.endOf("day");
        break;
      case "yesterday":
        startDate = today.subtract(1, "day").startOf("day");
        endDate = today.subtract(1, "day").endOf("day");
        break;
      case "thisWeek":
        startDate = today.startOf("week");
        endDate = today.endOf("week");
        break;
      case "lastWeek":
        startDate = today.subtract(1, "week").startOf("week");
        endDate = today.subtract(1, "week").endOf("week");
        break;
      case "thisMonth":
        startDate = today.startOf("month");
        endDate = today.endOf("month");
        break;
      case "lastMonth":
        startDate = today.subtract(1, "month").startOf("month");
        endDate = today.subtract(1, "month").endOf("month");
        break;
      case "last3Months":
        startDate = today.subtract(3, "month").startOf("day");
        endDate = today.endOf("day");
        break;
      case "thisYear":
        startDate = today.startOf("year");
        endDate = today.endOf("year");
        break;
      default:
        startDate = null;
        endDate = null;
    }

    setDraftFilters((prev) => ({
      ...prev,
      dateRange: {
        startDate,
        endDate,
      },
    }));
  }, []);

  // Calculate formatted dates for display
  const formattedStartDate = useMemo(() => {
    return draftFilters.dateRange.startDate?.format("DD/MM/YYYY") || "";
  }, [draftFilters.dateRange.startDate]);

  const formattedEndDate = useMemo(() => {
    return draftFilters.dateRange.endDate?.format("DD/MM/YYYY") || "";
  }, [draftFilters.dateRange.endDate]);

  // Handle accordion expand/collapse
  const handleAccordionChange = (_, isExpanded) => {
    setExpanded(isExpanded);
  };

  // Handle date field clearing
  const clearStartDate = () => {
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        startDate: null,
      },
    }));
  };

  const clearEndDate = () => {
    setDraftFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        endDate: null,
      },
    }));
  };

  // Handle sales selection - we now work directly with draftFilters
  const handleSalesChange = useCallback((e) => {
    const value = e.target.value;
    setDraftFilters((prev) => ({
      ...prev,
      salesName: typeof value === "string" ? value.split(",") : value,
    }));
  }, []);

  // Handle channel selection - we now work directly with draftFilters
  const handleChannelChange = useCallback((e) => {
    const value = e.target.value;
    setDraftFilters((prev) => ({
      ...prev,
      channel: typeof value === "string" ? value.split(",") : value,
    }));
  }, []);

  // Select all sales handler
  const selectAllSales = useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      salesName: [...salesList],
    }));
  }, [salesList]);

  // Clear sales selection handler
  const clearSalesSelection = useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      salesName: [],
    }));
  }, []);
  return (
    <Box sx={{ mb: 3 }}>
      {/* Advanced filters */}
      <Accordion
        expanded={expanded}
        onChange={handleAccordionChange}
        sx={{
          bgcolor: "background.paper",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          borderRadius: 4,
          overflow: "hidden",
          "&:before": { display: "none" }, // Remove default divider
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 10px 28px rgba(148, 12, 12, 0.15)",
          },
          border: expanded
            ? "2px solid #940c0c"
            : "1px solid rgba(0, 0, 0, 0.08)",
          position: "relative",
          ...(expanded && {
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              height: "4px",
              width: "100%",
              background: "linear-gradient(90deg, #c62828 0%, #940c0c 100%)",
            },
          }),
        }}
      >
        <AccordionSummary
          expandIcon={
            <Box
              sx={{
                bgcolor: expanded ? "#940c0c" : "action.hover",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
                color: expanded ? "white" : "text.primary",
                boxShadow: expanded
                  ? "0 4px 8px rgba(148, 12, 12, 0.3)"
                  : "none",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              <MdExpandMore style={{ fontSize: 24 }} />
            </Box>
          }
          sx={{
            bgcolor: expanded ? "rgba(148, 12, 12, 0.05)" : "background.paper",
            borderBottom: expanded
              ? "1px solid rgba(148, 12, 12, 0.2)"
              : "none",
            p: 1.8,
            "&:hover": {
              bgcolor: expanded
                ? "rgba(148, 12, 12, 0.08)"
                : "rgba(0, 0, 0, 0.03)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              pr: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: expanded
                    ? "linear-gradient(135deg, #b71c1c 0%, #940c0c 100%)"
                    : "rgba(148, 12, 12, 0.1)",
                  borderRadius: "50%",
                  p: 1.2,
                  mr: 1.5,
                  boxShadow: expanded
                    ? "0 4px 10px rgba(148, 12, 12, 0.4)"
                    : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {" "}
                <MdFilterList
                  style={{
                    fontSize: 24,
                    color: expanded ? "#fff" : "#940c0c",
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    fontSize: "1.15rem",
                    color: expanded ? "#940c0c" : "text.primary",
                    letterSpacing: "0.5px",
                    fontFamily: "'Kanit', sans-serif",
                    textShadow: expanded
                      ? "0 1px 1px rgba(148, 12, 12, 0.15)"
                      : "none",
                  }}
                >
                  ตัวกรองขั้นสูง
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    mt: 0.3,
                  }}
                >
                  ค้นหาลูกค้าด้วยเงื่อนไขที่หลากหลาย
                </Typography>
              </Box>{" "}
              {activeFilterCount > 0 && (
                <Chip
                  label={`${activeFilterCount} กรอง`}
                  size="small"
                  sx={{
                    ml: 2,
                    fontWeight: 600,
                    borderRadius: "16px",
                    boxShadow: "0 3px 5px rgba(148, 12, 12, 0.25)",
                    height: "26px",
                    bgcolor: "#940c0c",
                    color: "white",
                    "& .MuiChip-label": {
                      px: 1.5,
                    },
                    animation: "pulse 1.5s infinite ease-in-out",
                    "@keyframes pulse": {
                      "0%": { boxShadow: "0 3px 5px rgba(148, 12, 12, 0.25)" },
                      "50%": { boxShadow: "0 3px 8px rgba(148, 12, 12, 0.4)" },
                      "100%": {
                        boxShadow: "0 3px 5px rgba(148, 12, 12, 0.25)",
                      },
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Chip
                label={
                  filteredCount > 0
                    ? `พบ ${filteredCount.toLocaleString("th-TH")} รายการ`
                    : "ไม่พบข้อมูล"
                }
                size="small"
                color={filteredCount > 0 ? "success" : "default"}
                sx={{
                  fontWeight: 600,
                  borderRadius: "16px",
                  px: 0.5,
                  background:
                    filteredCount > 0
                      ? "linear-gradient(135deg, #b71c1c 0%, #940c0c 100%)"
                      : "rgba(0, 0, 0, 0.08)",
                  color: filteredCount > 0 ? "white" : "text.secondary",
                  boxShadow:
                    filteredCount > 0
                      ? "0 2px 5px rgba(148, 12, 12, 0.3)"
                      : "none",
                  height: "24px",
                  "& .MuiChip-label": {
                    px: 1.5,
                  },
                }}
              />
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            p: 3.5,
            background: "linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)",
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="rgba(148, 12, 12, 0.03)" fill-opacity="0.05" fill-rule="evenodd"/%3E%3C/svg%3E\')',
          }}
        >
          {errorMessage && (
            <Alert
              severity="error"
              onClose={() => setErrorMessage(null)}
              sx={{ mb: 2, borderRadius: 1.5 }}
            >
              {errorMessage}
            </Alert>
          )}
          <LocalizationProvider dateAdapter={AdapterBuddhistDayjs}>
            <Grid container spacing={3}>
              {" "}
              {/* Date Filter */}
              <Grid xs={12} md={6} lg={4}>
                {" "}
                <Paper
                  elevation={3}
                  sx={{
                    p: 2.8,
                    borderRadius: 3,
                    height: "100%",
                    backgroundColor: "white",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      boxShadow: "0 8px 20px rgba(148, 12, 12, 0.15)",
                      transform: "translateY(-2px)",
                    },
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(148, 12, 12, 0.1)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "5px",
                      width: "100%",
                      background:
                        "linear-gradient(90deg, #b71c1c 0%, #940c0c 100%)",
                    },
                  }}
                >
                  <Stack spacing={2.5}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 1,
                      }}
                    >
                      {" "}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            "linear-gradient(135deg, #b71c1c 0%, #940c0c 100%)",
                          borderRadius: "50%",
                          p: 1.2,
                          boxShadow: "0 3px 8px rgba(148, 12, 12, 0.3)",
                        }}
                      >
                        <MdDateRange style={{ fontSize: 20, color: "white" }} />
                      </Box>
                      <Box>
                        {" "}
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: "#940c0c",
                            fontFamily: "'Kanit', sans-serif",
                            fontSize: "1.05rem",
                          }}
                        >
                          วันที่สร้างลูกค้า
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          เลือกช่วงวันที่สร้างลูกค้าที่ต้องการ
                        </Typography>
                      </Box>
                    </Box>
                    {/* Date picker fields */}{" "}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "rgba(148, 12, 12, 0.04)",
                        border: "1px solid rgba(148, 12, 12, 0.15)",
                        backdropFilter: "blur(8px)",
                        boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <DatePicker
                        label="วันที่เริ่มต้น"
                        value={draftFilters.dateRange.startDate}
                        onChange={(newValue) =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            dateRange: {
                              ...prev.dateRange,
                              startDate: newValue,
                            },
                          }))
                        }
                        slotProps={{
                          textField: {
                            size: "medium",
                            fullWidth: true,
                            InputProps: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MdDateRange
                                    style={{
                                      color: "#940c0c",
                                      fontSize: "1.2rem",
                                    }}
                                  />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  {draftFilters.dateRange.startDate && (
                                    <IconButton
                                      size="small"
                                      aria-label="clear date"
                                      onClick={clearStartDate}
                                      edge="end"
                                      sx={{
                                        color: "#940c0c",
                                        "&:hover": {
                                          bgcolor: "rgba(148, 12, 12, 0.1)",
                                        },
                                      }}
                                    >
                                      <MdClear />
                                    </IconButton>
                                  )}
                                </InputAdornment>
                              ),
                              sx: {
                                "&.Mui-focused": {
                                  boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)",
                                },
                                borderRadius: 1.5,
                                height: 48,
                              },
                            },
                            sx: {
                              "& .MuiInputLabel-root": {
                                color: "text.secondary",
                                fontSize: "0.95rem",
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: "#940c0c",
                              },
                              "& .MuiOutlinedInput-root": {
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "rgba(148, 12, 12, 0.5)",
                                },
                              },
                              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                  borderColor: "#940c0c",
                                  borderWidth: "1.5px",
                                },
                            },
                          },
                          day: {
                            sx: {
                              fontWeight: "bold",
                              "&.Mui-selected": {
                                bgcolor: "#940c0c",
                                "&:hover": {
                                  bgcolor: "#b71c1c",
                                },
                              },
                            },
                          },
                          calendarHeader: {
                            sx: { bgcolor: "rgba(148, 12, 12, 0.08)", py: 1 },
                          },
                          layout: {
                            sx: {
                              ".MuiPickersCalendarHeader-root": {
                                fontWeight: "bold",
                                color: "#940c0c",
                              },
                            },
                          },
                          popper: {
                            sx: {
                              "& .MuiPaper-root": {
                                boxShadow: "0px 5px 20px rgba(0,0,0,0.15)",
                                borderRadius: "16px",
                                border: "1px solid rgba(148, 12, 12, 0.2)",
                              },
                            },
                          },
                        }}
                        format="DD/MM/YYYY"
                      />
                      <DatePicker
                        label="วันที่สิ้นสุด"
                        value={draftFilters.dateRange.endDate}
                        onChange={(newValue) =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, endDate: newValue },
                          }))
                        }
                        slotProps={{
                          textField: {
                            size: "medium",
                            fullWidth: true,
                            InputProps: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MdDateRange
                                    style={{
                                      color: "#940c0c",
                                      fontSize: "1.2rem",
                                    }}
                                  />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  {draftFilters.dateRange.endDate && (
                                    <IconButton
                                      size="small"
                                      aria-label="clear date"
                                      onClick={clearEndDate}
                                      edge="end"
                                      sx={{
                                        color: "#940c0c",
                                        "&:hover": {
                                          bgcolor: "rgba(148, 12, 12, 0.1)",
                                        },
                                      }}
                                    >
                                      <MdClear />
                                    </IconButton>
                                  )}
                                </InputAdornment>
                              ),
                              sx: {
                                "&.Mui-focused": {
                                  boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)",
                                },
                                borderRadius: 1.5,
                                height: 48,
                              },
                            },
                            sx: {
                              "& .MuiInputLabel-root": {
                                color: "text.secondary",
                                fontSize: "0.95rem",
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: "#940c0c",
                              },
                              "& .MuiOutlinedInput-root": {
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "rgba(148, 12, 12, 0.5)",
                                },
                              },
                              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                  borderColor: "#940c0c",
                                  borderWidth: "1.5px",
                                },
                            },
                          },
                          day: {
                            sx: {
                              fontWeight: "bold",
                              "&.Mui-selected": {
                                bgcolor: "#940c0c",
                                "&:hover": {
                                  bgcolor: "#b71c1c",
                                },
                              },
                            },
                          },
                          calendarHeader: {
                            sx: { bgcolor: "rgba(148, 12, 12, 0.08)", py: 1 },
                          },
                          layout: {
                            sx: {
                              ".MuiPickersCalendarHeader-root": {
                                fontWeight: "bold",
                                color: "#940c0c",
                              },
                            },
                          },
                          popper: {
                            sx: {
                              "& .MuiPaper-root": {
                                boxShadow: "0px 5px 20px rgba(0,0,0,0.15)",
                                borderRadius: "16px",
                                border: "1px solid rgba(148, 12, 12, 0.2)",
                              },
                            },
                          },
                        }}
                        format="DD/MM/YYYY"
                      />
                    </Box>
                    {/* Quick date range buttons */}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mt: 1,
                        mb: 0.5,
                        fontWeight: 500,
                        color: "text.secondary",
                      }}
                    >
                      ช่วงเวลาที่ใช้บ่อย:
                    </Typography>{" "}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 1.5,
                        "& button": {
                          flexGrow: 1,
                          whiteSpace: "nowrap",
                        },
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange("today")}
                        sx={{
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          borderColor: "rgba(148, 12, 12, 0.5)",
                          color: "#940c0c",
                          textTransform: "none",
                          fontWeight: 600,
                          py: 0.8,
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                          border: "1.5px solid rgba(148, 12, 12, 0.4)",
                          "&:hover": {
                            backgroundColor: "rgba(148, 12, 12, 0.08)",
                            borderColor: "#940c0c",
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                          },
                        }}
                      >
                        วันนี้
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange("yesterday")}
                        sx={{
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          borderColor: "rgba(148, 12, 12, 0.5)",
                          color: "#940c0c",
                          textTransform: "none",
                          fontWeight: 600,
                          py: 0.8,
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                          border: "1.5px solid rgba(148, 12, 12, 0.4)",
                          "&:hover": {
                            backgroundColor: "rgba(148, 12, 12, 0.08)",
                            borderColor: "#940c0c",
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                          },
                        }}
                      >
                        เมื่อวาน
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange("thisWeek")}
                        sx={{
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          borderColor: "rgba(148, 12, 12, 0.5)",
                          color: "#940c0c",
                          textTransform: "none",
                          fontWeight: 600,
                          py: 0.8,
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                          border: "1.5px solid rgba(148, 12, 12, 0.4)",
                          "&:hover": {
                            backgroundColor: "rgba(148, 12, 12, 0.08)",
                            borderColor: "#940c0c",
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                          },
                        }}
                      >
                        สัปดาห์นี้
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange("lastWeek")}
                        sx={{
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          borderColor: "rgba(148, 12, 12, 0.5)",
                          color: "#940c0c",
                          textTransform: "none",
                          fontWeight: 600,
                          py: 0.8,
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                          border: "1.5px solid rgba(148, 12, 12, 0.4)",
                          "&:hover": {
                            backgroundColor: "rgba(148, 12, 12, 0.08)",
                            borderColor: "#940c0c",
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                          },
                        }}
                      >
                        สัปดาห์ที่แล้ว
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange("thisMonth")}
                        sx={{
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          borderColor: "rgba(148, 12, 12, 0.5)",
                          color: "#940c0c",
                          textTransform: "none",
                          fontWeight: 600,
                          py: 0.8,
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                          border: "1.5px solid rgba(148, 12, 12, 0.4)",
                          "&:hover": {
                            backgroundColor: "rgba(148, 12, 12, 0.08)",
                            borderColor: "#940c0c",
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                          },
                        }}
                      >
                        เดือนนี้
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickDateRange("lastMonth")}
                        sx={{
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          borderColor: "rgba(148, 12, 12, 0.5)",
                          color: "#940c0c",
                          textTransform: "none",
                          fontWeight: 600,
                          py: 0.8,
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                          border: "1.5px solid rgba(148, 12, 12, 0.4)",
                          "&:hover": {
                            backgroundColor: "rgba(148, 12, 12, 0.08)",
                            borderColor: "#940c0c",
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 8px rgba(148, 12, 12, 0.15)",
                          },
                        }}
                      >
                        เดือนที่แล้ว
                      </Button>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>{" "}
              {/* Sales Filter */}
              <Grid xs={12} md={6} lg={4}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    height: "100%",
                    backgroundColor: "white",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)",
                    "&:hover": {
                      boxShadow: "0 8px 20px rgba(148, 12, 12, 0.15)",
                      transform: "translateY(-3px)",
                    },
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(148, 12, 12, 0.1)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "5px",
                      width: "100%",
                      background:
                        "linear-gradient(90deg, #b71c1c 0%, #940c0c 100%)",
                    },
                  }}
                >
                  <Stack spacing={2.5}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            "linear-gradient(135deg, #b71c1c 0%, #940c0c 100%)",
                          borderRadius: "50%",
                          p: 1.2,
                          boxShadow: "0 3px 8px rgba(148, 12, 12, 0.3)",
                        }}
                      >
                        <MdPerson style={{ fontSize: 20, color: "white" }} />
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: "#940c0c",
                            fontFamily: "'Kanit', sans-serif",
                            fontSize: "1.05rem",
                          }}
                        >
                          พนักงานขาย (SALES)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          เลือกพนักงานขายที่ต้องการกรองข้อมูล
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "rgba(148, 12, 12, 0.04)",
                        border: "1px solid rgba(148, 12, 12, 0.15)",
                        backdropFilter: "blur(8px)",
                        boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <FormControl fullWidth size="small">
                        <InputLabel
                          sx={{
                            color: "text.secondary",
                            "&.Mui-focused": { color: "#940c0c" },
                          }}
                        >
                          {draftFilters.salesName.length > 0
                            ? `เลือกแล้ว ${draftFilters.salesName.length} คน`
                            : "เลือกพนักงานขาย"}
                        </InputLabel>
                        <Select
                          multiple
                          value={draftFilters.salesName}
                          onChange={handleSalesChange}
                          input={
                            <OutlinedInput
                              label={
                                draftFilters.salesName.length > 0
                                  ? `เลือกแล้ว ${draftFilters.salesName.length} คน`
                                  : "เลือกพนักงานขาย"
                              }
                              sx={{
                                "&.Mui-focused": {
                                  boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)",
                                },
                                borderRadius: 1.5,
                                height: 48,
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "#940c0c",
                                    borderWidth: "1.5px",
                                  },
                              }}
                            />
                          }
                          startAdornment={
                            <InputAdornment position="start">
                              <MdPerson style={{ color: "#940c0c" }} />
                            </InputAdornment>
                          }
                          renderValue={(selected) => (
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.8,
                              }}
                            >
                              {selected.slice(0, 3).map((value) => (
                                <Chip
                                  key={value}
                                  label={value}
                                  size="small"
                                  sx={{
                                    bgcolor: "rgba(148, 12, 12, 0.1)",
                                    color: "#940c0c",
                                    fontWeight: 600,
                                    borderRadius: "8px",
                                    height: "26px",
                                    "& .MuiChip-deleteIcon": {
                                      color: "#940c0c",
                                      "&:hover": {
                                        color: "#b71c1c",
                                      },
                                    },
                                  }}
                                />
                              ))}
                              {selected.length > 3 && (
                                <Chip
                                  label={`+${selected.length - 3} คน`}
                                  size="small"
                                  sx={{
                                    bgcolor: "rgba(148, 12, 12, 0.1)",
                                    color: "#940c0c",
                                    fontWeight: 600,
                                    borderRadius: "8px",
                                    height: "26px",
                                  }}
                                />
                              )}
                            </Box>
                          )}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 300,
                              },
                              sx: {
                                borderRadius: 2,
                                mt: 0.5,
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                                border: "1px solid rgba(148, 12, 12, 0.2)",
                                borderRadius: "12px",
                                "& .MuiMenuItem-root": {
                                  borderRadius: 1.5,
                                  my: 0.4,
                                  mx: 0.6,
                                  padding: "8px 16px",
                                  "&:hover": {
                                    bgcolor: "rgba(148, 12, 12, 0.08)",
                                  },
                                  "&.Mui-selected": {
                                    bgcolor: "rgba(148, 12, 12, 0.12)",
                                    "&:hover": {
                                      bgcolor: "rgba(148, 12, 12, 0.16)",
                                    },
                                  },
                                },
                                "& .MuiCheckbox-root": {
                                  color: "rgba(0, 0, 0, 0.54)",
                                  "&.Mui-checked": {
                                    color: "#940c0c",
                                  },
                                },
                              },
                            },
                          }}
                        >
                          {salesList && salesList.length > 0 ? (
                            salesList.map((name) => (
                              <MenuItem key={name} value={name}>
                                <Checkbox
                                  checked={
                                    draftFilters.salesName.indexOf(name) > -1
                                  }
                                  sx={{
                                    "&.Mui-checked": {
                                      color: "#940c0c",
                                    },
                                  }}
                                />
                                <ListItemText
                                  primary={name}
                                  primaryTypographyProps={{
                                    fontWeight:
                                      draftFilters.salesName.indexOf(name) > -1
                                        ? 600
                                        : 400,
                                  }}
                                />
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled>
                              <ListItemText primary="ไม่พบข้อมูลพนักงานขาย" />
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box
                      sx={{
                        mt: 1.5,
                        display: "flex",
                        gap: 1.5,
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        size="small"
                        variant="text"
                        onClick={selectAllSales}
                        disabled={
                          draftFilters.salesName.length === salesList.length
                        }
                        sx={{
                          color: "#940c0c",
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 2.5,
                          py: 0.8,
                          "&:hover": {
                            bgcolor: "rgba(148, 12, 12, 0.08)",
                          },
                          "&.Mui-disabled": {
                            color: "rgba(0, 0, 0, 0.26)",
                          },
                        }}
                      >
                        เลือกทั้งหมด
                      </Button>
                      <Divider orientation="vertical" flexItem />
                      <Button
                        size="small"
                        variant="text"
                        onClick={clearSalesSelection}
                        disabled={draftFilters.salesName.length === 0}
                        sx={{
                          color: "#940c0c",
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 2.5,
                          py: 0.8,
                          "&:hover": {
                            bgcolor: "rgba(148, 12, 12, 0.08)",
                          },
                          "&.Mui-disabled": {
                            color: "rgba(0, 0, 0, 0.26)",
                          },
                        }}
                      >
                        ล้างการเลือก
                      </Button>
                    </Box>

                    {draftFilters.salesName.length > 0 && (
                      <Box
                        sx={{
                          mt: 1,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "rgba(148, 12, 12, 0.06)",
                          border: "1px dashed rgba(148, 12, 12, 0.3)",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "#940c0c", fontWeight: 600 }}
                        >
                          เลือกพนักงานขายแล้ว: {draftFilters.salesName.length}{" "}
                          คน
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Grid>
              {/* Channel Filter */}{" "}
              <Grid xs={12} md={6} lg={4}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    height: "100%",
                    backgroundColor: "white",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)",
                    "&:hover": {
                      boxShadow: "0 8px 20px rgba(148, 12, 12, 0.15)",
                      transform: "translateY(-3px)",
                    },
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(148, 12, 12, 0.1)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "5px",
                      width: "100%",
                      background:
                        "linear-gradient(90deg, #b71c1c 0%, #940c0c 100%)",
                    },
                  }}
                >
                  <Stack spacing={2.5} sx={{ height: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            "linear-gradient(135deg, #b71c1c 0%, #940c0c 100%)",
                          borderRadius: "50%",
                          p: 1.2,
                          boxShadow: "0 3px 8px rgba(148, 12, 12, 0.3)",
                        }}
                      >
                        <MdSignalCellularAlt
                          style={{ fontSize: 20, color: "white" }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: "#940c0c",
                            fontFamily: "'Kanit', sans-serif",
                            fontSize: "1.05rem",
                          }}
                        >
                          ช่องทางการติดต่อ (CHANNEL)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          เลือกช่องทางการติดต่อที่ต้องการกรองข้อมูล
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "rgba(148, 12, 12, 0.04)",
                        border: "1px solid rgba(148, 12, 12, 0.15)",
                        backdropFilter: "blur(8px)",
                        boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <FormControl fullWidth size="medium">
                        <InputLabel
                          sx={{
                            color: "text.secondary",
                            "&.Mui-focused": { color: "#940c0c" },
                          }}
                        >
                          {draftFilters.channel.length > 0
                            ? `เลือกแล้ว ${draftFilters.channel.length} ช่องทาง`
                            : "เลือกช่องทางการติดต่อ"}
                        </InputLabel>
                        <Select
                          multiple
                          value={draftFilters.channel}
                          onChange={handleChannelChange}
                          input={
                            <OutlinedInput
                              label={`เลือกแล้ว ${draftFilters.channel.length} ช่องทาง`}
                              sx={{
                                borderRadius: 1.5,
                                height: 48,
                                "&.Mui-focused": {
                                  boxShadow: "0 0 0 2px rgba(148, 12, 12, 0.2)",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "#940c0c",
                                    borderWidth: "1.5px",
                                  },
                              }}
                            />
                          }
                          startAdornment={
                            <InputAdornment position="start">
                              <MdSignalCellularAlt
                                style={{ color: "#940c0c" }}
                              />
                            </InputAdornment>
                          }
                          renderValue={(selected) => (
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.8,
                              }}
                            >
                              {selected.map((value) => {
                                const channel = channelOptions.find(
                                  (c) => c.value === value
                                );
                                return (
                                  <Chip
                                    key={value}
                                    icon={channel?.icon}
                                    label={channel?.label}
                                    size="small"
                                    sx={{
                                      bgcolor: channel?.color,
                                      color: "white",
                                      fontWeight: 600,
                                      borderRadius: "8px",
                                      height: "26px",
                                      "& .MuiChip-icon": {
                                        color: "white",
                                      },
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          )}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 300,
                              },
                            },
                          }}
                        >
                          {channelOptions.map((channel) => (
                            <MenuItem key={channel.value} value={channel.value}>
                              <Checkbox
                                checked={
                                  draftFilters.channel.indexOf(channel.value) >
                                  -1
                                }
                                sx={{
                                  "&.Mui-checked": {
                                    color: "#940c0c",
                                  },
                                }}
                              />
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <Box
                                  sx={{
                                    mr: 1.5,
                                    p: 0.8,
                                    borderRadius: "50%",
                                    bgcolor: channel.color,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                                  }}
                                >
                                  {channel.icon}
                                </Box>
                                <ListItemText
                                  primary={channel.label}
                                  primaryTypographyProps={{
                                    fontWeight:
                                      draftFilters.channel.indexOf(
                                        channel.value
                                      ) > -1
                                        ? 600
                                        : 400,
                                  }}
                                />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    {draftFilters.channel.length > 0 && (
                      <Box
                        sx={{
                          mt: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "rgba(148, 12, 12, 0.06)",
                          border: "1px dashed rgba(148, 12, 12, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "#940c0c", fontWeight: 600 }}
                        >
                          เลือกช่องทางแล้ว: {draftFilters.channel.length}{" "}
                          ช่องทาง
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Grid>
              {/* Control buttons */}{" "}
              <Grid xs={12}>
                {" "}
                <Stack
                  direction="row"
                  spacing={2}
                  justifyContent="flex-end"
                  sx={{ mt: 3 }}
                >
                  {" "}
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<RiRefreshLine style={{ fontSize: "1.3rem" }} />}
                    onClick={handleResetFilters}
                    sx={{
                      minWidth: 160,
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                      borderWidth: "1.5px",
                      py: 1.2,
                      transition: "all 0.3s ease",
                      borderColor: "rgba(148, 12, 12, 0.3)",
                      color: "#940c0c",
                      "&:hover": {
                        backgroundColor: "rgba(148, 12, 12, 0.04)",
                        borderColor: "rgba(148, 12, 12, 0.6)",
                        borderWidth: "1.5px",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 8px rgba(148, 12, 12, 0.1)",
                      },
                    }}
                  >
                    รีเซ็ตตัวกรอง
                  </Button>{" "}
                  <Button
                    variant="contained"
                    style={{ backgroundColor: "#940c0c" }}
                    startIcon={
                      isFiltering ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <MdFilterList style={{ fontSize: "1.3rem" }} />
                      )
                    }
                    onClick={handleApplyFilters}
                    disabled={isFiltering}
                    sx={{
                      minWidth: 160,
                      borderRadius: 3,
                      fontWeight: 600,
                      boxShadow: "0 4px 10px rgba(148, 12, 12, 0.3)",
                      py: 1.2,
                      transition: "all 0.3s ease",
                      textTransform: "none",
                      "&:hover": {
                        boxShadow: "0 6px 14px rgba(148, 12, 12, 0.4)",
                        backgroundColor: "#b71c1c",
                        transform: "translateY(-2px)",
                      },
                      "&:disabled": {
                        backgroundColor: "rgba(148, 12, 12, 0.7)",
                        color: "white",
                      },
                    }}
                  >
                    {isFiltering ? "กำลังกรอง..." : "ใช้งานตัวกรอง"}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default FilterPanel;
