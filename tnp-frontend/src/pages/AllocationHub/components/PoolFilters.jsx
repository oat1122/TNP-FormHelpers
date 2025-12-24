import React, { useState, useCallback } from "react";
import {
  Grid,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { debounce } from "lodash";

/**
 * PoolFilters - Filter controls for pool customers (responsive)
 */
const PoolFilters = ({ filters, onFiltersChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchValue, setSearchValue] = useState(filters.search || "");

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      onFiltersChange({ ...filters, search: value });
    }, 500),
    [filters, onFiltersChange]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleSourceChange = (e) => {
    onFiltersChange({ ...filters, source: e.target.value });
  };

  // Filter content
  const filterContent = (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth>
          <InputLabel id="source-filter-label">ที่มา</InputLabel>
          <Select
            labelId="source-filter-label"
            label="ที่มา"
            value={filters.source || ""}
            onChange={handleSourceChange}
            aria-label="กรองตามที่มา"
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            <MenuItem value="telesales">Telesales</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="office">Office</MenuItem>
            <MenuItem value="sales">Sales</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={8}>
        <TextField
          fullWidth
          label="ค้นหา"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="ชื่อ, เบอร์, บริษัท"
          aria-label="ค้นหาลูกค้า"
        />
      </Grid>
    </Grid>
  );

  // Render with responsive layout
  if (isMobile) {
    return (
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="filter-content"
          id="filter-header"
        >
          <Typography>ตัวกรอง</Typography>
        </AccordionSummary>
        <AccordionDetails>{filterContent}</AccordionDetails>
      </Accordion>
    );
  }

  return <Box>{filterContent}</Box>;
};

export default PoolFilters;
