import { FilterList, Clear, ExpandMore } from "@mui/icons-material";
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Box,
  Chip,
  ButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import moment from "moment";
import "./Worksheet.css";
import { useGetUsersByRoleQuery } from "../../features/UserManagement/userManagementApi";

const DEFAULT_FILTERS = {
  salesName: "",
  dueDateFrom: null,
  dueDateTo: null,
  examDateFrom: null,
  examDateTo: null,
  createdDateFrom: null,
  createdDateTo: null,
};

// Date preset helpers
const DATE_PRESETS = [
  {
    label: "อาทิตย์นี้",
    getRange: () => ({
      from: moment().startOf("isoWeek"),
      to: moment().endOf("isoWeek"),
    }),
  },
  {
    label: "อาทิตย์ที่แล้ว",
    getRange: () => ({
      from: moment().subtract(1, "week").startOf("isoWeek"),
      to: moment().subtract(1, "week").endOf("isoWeek"),
    }),
  },
  {
    label: "เดือนนี้",
    getRange: () => ({
      from: moment().startOf("month"),
      to: moment().endOf("month"),
    }),
  },
  {
    label: "เดือนที่แล้ว",
    getRange: () => ({
      from: moment().subtract(1, "month").startOf("month"),
      to: moment().subtract(1, "month").endOf("month"),
    }),
  },
];

// Date filter field config
const DATE_FILTER_FIELDS = [
  {
    key: "dueDate",
    label: "Due Date",
    subLabel: "(วันนัดส่งงาน)",
    fromKey: "dueDateFrom",
    toKey: "dueDateTo",
  },
  {
    key: "examDate",
    label: "Ex Date",
    subLabel: "(วันนัดส่งตัวอย่าง)",
    fromKey: "examDateFrom",
    toKey: "examDateTo",
  },
  {
    key: "createdDate",
    label: "วันที่สร้าง",
    subLabel: "(วันสร้างใบงาน)",
    fromKey: "createdDateFrom",
    toKey: "createdDateTo",
  },
];

function WorksheetFilter({ onFilterChange, initialFilters = DEFAULT_FILTERS }) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });

  // Fetch all sales users for the dropdown
  const { data: usersByRole } = useGetUsersByRoleQuery("sale");
  const salesUsers = useMemo(() => {
    if (!usersByRole?.sale_role) return [];
    return usersByRole.sale_role
      .filter((u) => u.username && u.username.trim() !== "")
      .map((u) => ({
        value: u.username,
        label: u.username.charAt(0).toUpperCase() + u.username.slice(1),
      }))
      .filter((item, index, arr) => arr.findIndex((x) => x.value === item.value) === index)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [usersByRole]);

  const handleFilterChange = useCallback(
    (filterType, value) => {
      const newFilters = { ...filters, [filterType]: value };
      setFilters(newFilters);
      onFilterChange(newFilters);
    },
    [filters, onFilterChange]
  );

  // Batch update for date presets (sets both from and to at once)
  const handleDatePreset = useCallback(
    (fromKey, toKey, from, to) => {
      const newFilters = { ...filters, [fromKey]: from, [toKey]: to };
      setFilters(newFilters);
      onFilterChange(newFilters);
    },
    [filters, onFilterChange]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    onFilterChange({ ...DEFAULT_FILTERS });
  }, [onFilterChange]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.salesName !== "" ||
      filters.dueDateFrom !== null ||
      filters.dueDateTo !== null ||
      filters.examDateFrom !== null ||
      filters.examDateTo !== null ||
      filters.createdDateFrom !== null ||
      filters.createdDateTo !== null
    );
  }, [filters]);

  // Update local state when initialFilters change
  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS, ...initialFilters });
  }, [initialFilters]);

  // Build active filter chips
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.salesName) {
      chips.push({
        key: "salesName",
        label: `Sales: ${filters.salesName.charAt(0).toUpperCase() + filters.salesName.slice(1)}`,
        color: "primary",
        onDelete: () => handleFilterChange("salesName", ""),
      });
    }
    DATE_FILTER_FIELDS.forEach(({ label, fromKey, toKey }) => {
      const from = filters[fromKey];
      const to = filters[toKey];
      if (from || to) {
        const fromStr = from ? moment(from).format("DD/MM/YY") : "...";
        const toStr = to ? moment(to).format("DD/MM/YY") : "...";
        chips.push({
          key: fromKey,
          label: `${label}: ${fromStr} - ${toStr}`,
          color: "info",
          onDelete: () => handleDatePreset(fromKey, toKey, null, null),
        });
      }
    });
    return chips;
  }, [filters, handleFilterChange, handleDatePreset]);

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Accordion
        defaultExpanded={false}
        sx={{ mb: 3, boxShadow: 2, borderRadius: 1, "&:before": { display: "none" } }}
        className="worksheet-filter"
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{ "& .MuiAccordionSummary-content": { alignItems: "center" } }}
        >
          <FilterList sx={{ mr: 1, color: "text.secondary" }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Filter Worksheets
          </Typography>
          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Clear />}
              onClick={(e) => {
                e.stopPropagation();
                handleClearFilters();
              }}
              color="error"
              sx={{ mr: 1 }}
            >
              Clear All
            </Button>
          )}
        </AccordionSummary>
        <AccordionDetails>
          {/* Sales Name Filter */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="sales-name-filter-label">Sales Name</InputLabel>
                <Select
                  labelId="sales-name-filter-label"
                  value={filters.salesName}
                  label="Sales Name"
                  onChange={(e) => handleFilterChange("salesName", e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Sales</em>
                  </MenuItem>
                  {salesUsers.map((sales) => (
                    <MenuItem key={sales.value} value={sales.value}>
                      {sales.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Date Filters */}
          {DATE_FILTER_FIELDS.map(({ key, label, subLabel, fromKey, toKey }) => (
            <Grid container spacing={1} alignItems="center" sx={{ mb: 1.5 }} key={key}>
              {/* Label */}
              <Grid item xs={12} sm={2} md={1.5}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  {label}{" "}
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ fontSize: "0.75rem", fontWeight: 400 }}
                  >
                    {subLabel}
                  </Typography>
                </Typography>
              </Grid>

              {/* Preset Buttons */}
              <Grid item xs={12} sm={5} md={4.5}>
                <ButtonGroup size="small" variant="outlined" color="inherit">
                  {DATE_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      onClick={() => {
                        const { from, to } = preset.getRange();
                        handleDatePreset(fromKey, toKey, from, to);
                      }}
                      sx={{ textTransform: "none", fontSize: "0.75rem" }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </Grid>

              {/* DatePicker From */}
              <Grid item xs={6} sm={2.5} md={3}>
                <DatePicker
                  label="จาก"
                  value={filters[fromKey]}
                  onChange={(val) => handleFilterChange(fromKey, val)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { size: "small", fullWidth: true },
                    field: { clearable: true },
                  }}
                />
              </Grid>

              {/* DatePicker To */}
              <Grid item xs={6} sm={2.5} md={3}>
                <DatePicker
                  label="ถึง"
                  value={filters[toKey]}
                  onChange={(val) => handleFilterChange(toKey, val)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: { size: "small", fullWidth: true },
                    field: { clearable: true },
                  }}
                />
              </Grid>
            </Grid>
          ))}

          {/* Active Filter Chips */}
          {activeChips.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
              {activeChips.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  onDelete={chip.onDelete}
                  color={chip.color}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </LocalizationProvider>
  );
}

export default WorksheetFilter;
