import React from "react";
import {
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  InputAdornment,
  Box,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { th } from "date-fns/locale";

/**
 * A reusable advanced filter component for searching, filtering by status, and date range.
 * @param {Object} props
 * @param {Object} props.filters - The current filter state from the useAdvancedFilter hook.
 * @param {Object} props.handlers - The handler functions from the useAdvancedFilter hook.
 * @param {Function} props.onRefresh - Function to trigger a data refresh.
 * @param {Array} [props.statusOptions=[]] - An array of { value, label } for the status dropdown.
 */
const AdvancedFilter = ({ filters, handlers, onRefresh, statusOptions = [] }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Text Search */}
          <Grid item xs={12} md={5}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="ค้นหาด้วยชื่องาน, ชื่อบริษัท, หรือเลขที่เอกสาร..."
            value={filters.searchQuery}
            onChange={handlers.handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            select
            size="small"
            label="สถานะ"
            value={filters.status}
            onChange={handlers.handleStatusChange}
          >
            <MenuItem value="all">
              <em>ทุกสถานะ</em>
            </MenuItem>
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

          {/* Date Range Filter */}
          <Grid item xs={12} sm={3} md={1.5}>
          <DatePicker
            label="วันที่เริ่มต้น"
            value={filters.dateRange[0]}
            onChange={(newValue) => {
              handlers.handleDateRangeChange([newValue, filters.dateRange[1]]);
            }}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
              },
            }}
          />
          </Grid>
          <Grid item xs={12} sm={3} md={1.5}>
          <DatePicker
            label="วันที่สิ้นสุด"
            value={filters.dateRange[1]}
            onChange={(newValue) => {
              handlers.handleDateRangeChange([filters.dateRange[0], newValue]);
            }}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
              },
            }}
          />
        </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} md={2}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={handlers.resetFilters}
              startIcon={<ClearIcon />}
              size="medium"
            >
              ล้าง
            </Button>
            <Button
              variant="contained"
              onClick={onRefresh}
              startIcon={<RefreshIcon />}
              size="medium"
            >
              รีเฟรช
            </Button>
          </Stack>
          </Grid>
        </Grid>
      </Paper>
    </LocalizationProvider>
  );
};

export default AdvancedFilter;