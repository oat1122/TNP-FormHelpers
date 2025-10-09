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
 * @param {Array} [props.statusBeforeOptions=[]] - Options for the 'Status Before' dropdown.
 * @param {Array} [props.statusAfterOptions=[]] - Options for the 'Status After' dropdown.
 */
const AdvancedFilter = ({ 
  filters, 
  handlers, 
  onRefresh, 
  statusOptions = [], 
  // 🔽 ADDED: New props for before/after options
  statusBeforeOptions = [], 
  statusAfterOptions = [] 
}) => {
  const showStatusBefore = statusBeforeOptions.length > 0;
  const showStatusAfter = statusAfterOptions.length > 0;
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Text Search */}
          <Grid item xs={12} md={showStatusBefore || showStatusAfter ? 6 : 4} lg={4}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="ค้นหา..."
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
          
          {/* Status Before Filter */}
          {showStatusBefore && (
            <Grid item xs={12} sm={4} md={3} lg={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="สถานะ (ก่อนมัดจำ)"
                value={filters.statusBefore}
                onChange={handlers.handleStatusBeforeChange}
              >
                <MenuItem value="all"><em>ทั้งหมด</em></MenuItem>
                {statusBeforeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Status After Filter */}
          {showStatusAfter && (
            <Grid item xs={12} sm={4} md={3} lg={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="สถานะ (หลังมัดจำ)"
                value={filters.statusAfter}
                onChange={handlers.handleStatusAfterChange}
              >
                <MenuItem value="all"><em>ทั้งหมด</em></MenuItem>
                {statusAfterOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          
          {/* Main Status Filter (optional) */}
          {statusOptions.length > 0 && (
            <Grid item xs={12} sm={4} md={3} lg={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="สถานะหลัก"
                value={filters.status}
                onChange={handlers.handleStatusChange}
              >
                <MenuItem value="all"><em>ทุกสถานะ</em></MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Date Range Filter */}
          <Grid item xs={12} sm={3} md={2} lg={1.5}>
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
          <Grid item xs={12} sm={3} md={2} lg={1.5}>
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
          <Grid item xs={12} sm={6} md={2} lg={3} container justifyContent="flex-end">
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={handlers.resetFilters} startIcon={<ClearIcon />}>
                ล้าง
              </Button>
              <Button variant="contained" onClick={onRefresh} startIcon={<RefreshIcon />}>
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