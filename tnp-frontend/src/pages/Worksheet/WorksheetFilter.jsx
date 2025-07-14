import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import { FilterList, Clear } from "@mui/icons-material";
import "./Worksheet.css";

function WorksheetFilter({
  data,
  onFilterChange,
  initialFilters = { salesName: "", status: "" },
}) {
  const [filters, setFilters] = useState(initialFilters);
  
  // Get user data to check role permissions
  const user = JSON.parse(localStorage.getItem("userData"));
  const canUseFilter = user && (user.role === 'manager' || user.role === 'admin');

  // If user doesn't have permission, don't render the filter
  if (!canUseFilter) {
    // Could optionally show a message for unauthorized users
    // return (
    //   <Card sx={{ mb: 3, boxShadow: 1 }} className="worksheet-filter">
    //     <CardContent>
    //       <Typography variant="body2" color="text.secondary" textAlign="center">
    //         Advanced filters are available for Manager and Admin roles only.
    //       </Typography>
    //     </CardContent>
    //   </Card>
    // );
    return null;
  }

  // Memoized extraction of unique sales names from data
  const uniqueSalesNames = useMemo(() => {
    if (!data?.data) return [];
    
    const salesNames = data.data
      .map((item) => item.sales_name)
      .filter((name) => name && name.trim() !== "")
      .filter((name, index, arr) => arr.indexOf(name) === index)
      .sort();
    return salesNames;
  }, [data]);

  // Memoized status options (static data)
  const statusOptions = useMemo(() => [
    { value: "Complete", label: "Complete" },
    { value: "Waiting Manager", label: "Waiting Manager" },
    { value: "Waiting Manager Approve", label: "Waiting Manager Approve" },
    { value: "Editing", label: "Editing" },
  ], []);

  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters = { salesName: "", status: "" };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  }, [onFilterChange]);

  const hasActiveFilters = useMemo(() => 
    filters.salesName !== "" || filters.status !== "", 
    [filters.salesName, filters.status]
  );

  // Update local state when initialFilters change
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return (
    <Card sx={{ mb: 3, boxShadow: 2 }} className="worksheet-filter">
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FilterList sx={{ mr: 1, color: "text.secondary" }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Filter Worksheets
          </Typography>
          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Clear />}
              onClick={handleClearFilters}
              color="error"
            >
              Clear All
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2} alignItems="center">
          {/* Sales Name Filter */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="sales-name-filter-label">Sales Name</InputLabel>
              <Select
                labelId="sales-name-filter-label"
                value={filters.salesName}
                label="Sales Name"
                onChange={(e) =>
                  handleFilterChange("salesName", e.target.value)
                }
              >
                <MenuItem value="">
                  <em>All Sales</em>
                </MenuItem>
                {uniqueSalesNames.map((salesName) => (
                  <MenuItem key={salesName} value={salesName}>
                    {salesName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <MenuItem value="">
                  <em>All Status</em>
                </MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Active Filters Display */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {filters.salesName && (
                <Chip
                  label={`Sales: ${filters.salesName}`}
                  onDelete={() => handleFilterChange("salesName", "")}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              )}
              {filters.status && (
                <Chip
                  label={`Status: ${filters.status}`}
                  onDelete={() => handleFilterChange("status", "")}
                  color="secondary"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default WorksheetFilter;
