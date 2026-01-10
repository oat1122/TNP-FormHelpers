// filepath: src/pages/Customer/components/Filters/FilterPanel.jsx
import {
  Box,
  Typography,
  Stack,
  Alert,
  Button,
  Chip,
  IconButton,
  Collapse,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import React, { useState } from "react";
import {
  MdFilterList,
  MdCheck,
  MdRefresh,
  MdExpandMore,
  MdDateRange,
  MdPerson,
  MdCellTower,
} from "react-icons/md";
import "dayjs/locale/th";

// Filter section components
import { SalesFilterSection, ChannelFilterSection } from "./sections";

// Hooks
import {
  useDateRangeHelpers,
  useFilterActions,
  useFilterState,
  useSelectionHelpers,
  useFilterInitializer,
} from "../../hooks";

// Constants
import { dateRangeOptions, filterColors, filterValidation } from "../../constants/filterConstants";

/**
 * FilterPanel - Modern Minimalist Filter Panel
 * Compact design with inline layout for efficient space usage
 */
function FilterPanel({ refetchCustomers, viewMode = "my", isHead = false }) {
  const [expanded, setExpanded] = useState(false);

  // Hooks
  useFilterInitializer();
  const {
    draftFilters,
    setDraftFilters,
    salesList,
    filteredCount,
    activeFilterCount,
    prepareFiltersForAPI,
    resetDraftFilters,
  } = useFilterState();

  const { isFiltering, errorMessage, handleApplyFilters, handleResetFilters, clearErrorMessage } =
    useFilterActions(refetchCustomers);

  const dateHelpers = useDateRangeHelpers(setDraftFilters);
  const selectionHelpers = useSelectionHelpers(setDraftFilters, salesList);

  const salesOptions = (salesList || []).map((name) => ({ value: name, label: name }));

  // Apply and close
  const handleApply = () => {
    handleApplyFilters(draftFilters, prepareFiltersForAPI);
    setExpanded(false);
  };

  // Reset
  const handleReset = () => {
    handleResetFilters(resetDraftFilters);
  };

  // Format date with Buddhist year
  const formatDate = (date) => {
    if (!date) return "";
    const buddhistYear = date.year() + filterValidation.buddhistYearOffset;
    return `${date.format("DD/MM/")}${buddhistYear}`;
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Compact Header Bar */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          bgcolor: expanded ? filterColors.primaryLight : "grey.50",
          borderRadius: expanded ? "12px 12px 0 0" : 2,
          border: `1px solid ${expanded ? filterColors.primary : "transparent"}`,
          borderBottom: expanded ? "none" : undefined,
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: filterColors.primaryLight,
          },
        }}
      >
        <MdFilterList size={20} color={filterColors.primary} />
        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
          ตัวกรอง
        </Typography>

        {/* Active filter badge */}
        {activeFilterCount > 0 && (
          <Chip
            label={activeFilterCount}
            size="small"
            sx={{
              height: 20,
              minWidth: 20,
              bgcolor: filterColors.primary,
              color: "white",
              fontSize: "0.7rem",
              fontWeight: 700,
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
        )}

        <Box sx={{ flex: 1 }} />

        {/* Results count */}
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {filteredCount.toLocaleString("th-TH")} รายการ
        </Typography>

        <MdExpandMore
          size={20}
          style={{
            color: filterColors.primary,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </Box>

      {/* Collapsible Filter Content */}
      <Collapse in={expanded}>
        <Box
          sx={{
            p: 2,
            bgcolor: "white",
            border: `1px solid ${filterColors.primary}`,
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
          }}
        >
          {/* Error Alert */}
          {errorMessage && (
            <Alert severity="error" onClose={clearErrorMessage} sx={{ mb: 2, py: 0.5 }}>
              {errorMessage}
            </Alert>
          )}

          {/* All Filters in Compact Row Layout */}
          <Stack spacing={2}>
            {/* Row 1: Date Range */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <MdDateRange size={14} /> ช่วงวันที่
              </Typography>

              {/* Quick Date Buttons */}
              <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.5 }}>
                {dateRangeOptions.map((opt) => (
                  <Chip
                    key={opt.key}
                    label={opt.label}
                    size="small"
                    onClick={() => dateHelpers.handleQuickDateRange(opt.key)}
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
                    onChange={dateHelpers.setStartDate}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        sx: { "& .MuiInputBase-root": { height: 36 } },
                      },
                    }}
                  />
                  <DatePicker
                    label="สิ้นสุด"
                    value={draftFilters.dateRange.endDate}
                    onChange={dateHelpers.setEndDate}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        sx: { "& .MuiInputBase-root": { height: 36 } },
                      },
                    }}
                  />
                </Stack>
              </LocalizationProvider>
            </Box>

            {/* Row 2: Sales Filter (conditional) */}
            {!(isHead && viewMode === "my") && salesList?.length > 0 && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <MdPerson size={14} /> พนักงานขาย
                </Typography>
                <SalesFilterSection
                  draftFilters={draftFilters}
                  salesList={salesList}
                  salesOptions={salesOptions}
                  selectionHelpers={selectionHelpers}
                  compact
                />
              </Box>
            )}

            {/* Row 3: Channel Filter */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <MdCellTower size={14} /> ช่องทาง
              </Typography>
              <ChannelFilterSection
                draftFilters={draftFilters}
                selectionHelpers={selectionHelpers}
                compact
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Action Buttons */}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                variant="text"
                startIcon={<MdRefresh size={16} />}
                onClick={handleReset}
                sx={{ color: "text.secondary", textTransform: "none" }}
              >
                รีเซ็ต
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<MdCheck size={16} />}
                onClick={handleApply}
                disabled={isFiltering}
                sx={{
                  bgcolor: filterColors.primary,
                  textTransform: "none",
                  "&:hover": { bgcolor: filterColors.primaryHover },
                }}
              >
                {isFiltering ? "กำลังกรอง..." : "ใช้งาน"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

export default FilterPanel;
