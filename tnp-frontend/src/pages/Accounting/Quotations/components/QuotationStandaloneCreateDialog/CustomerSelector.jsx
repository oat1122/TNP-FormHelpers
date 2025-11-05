import React, { useState, useCallback, useMemo } from "react";
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Chip,
} from "@mui/material";
import { Business, Phone, Email, LocationOn } from "@mui/icons-material";
import { useGetCustomersQuery } from "../../../../../features/Accounting/accountingApi";

/**
 * CustomerSelector Component
 * Modified to accept and return the full customer object.
 */
const CustomerSelector = ({ value, onChange, error, helperText, required = true }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Query customers with search term
  const { data, isLoading } = useGetCustomersQuery({
    search: searchTerm,
    per_page: 50,
    is_use: 1, // เฉพาะลูกค้าที่ active
  });

  const customers = useMemo(() => data?.data?.data || data?.data || [], [data]);

  const handleChange = useCallback(
    (event, newValue) => {
      onChange(newValue || null); // <-- Return the full object
    },
    [onChange]
  );

  const handleInputChange = useCallback((event, newInputValue) => {
    setSearchTerm(newInputValue);
  }, []);

  // Custom option label formatter
  const getOptionLabel = useCallback((option) => {
    if (typeof option === "string") return option; // Handle initial value
    if (!option) return "";
    const company = option.cus_company || "";
    const name = [option.cus_firstname, option.cus_lastname].filter(Boolean).join(" ");
    return company || name || option.cus_id;
  }, []);

  // Check if two options are equal
  const isOptionEqualToValue = useCallback((option, value) => {
    return option.cus_id === value?.cus_id; // <-- Compare objects by ID
  }, []);

  // Custom rendering for dropdown options
  const renderOption = useCallback(
    (props, option) => (
      <Box component="li" {...props} key={option.cus_id}>
        <Box sx={{ width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Business fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {option.cus_company || "ไม่ระบุชื่อบริษัท"}
            </Typography>
          </Box>

          {(option.cus_firstname || option.cus_lastname) && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 3.5 }}>
              ผู้ติดต่อ: {option.cus_firstname} {option.cus_lastname}
              {option.cus_depart && ` (${option.cus_depart})`}
            </Typography>
          )}

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5, ml: 3.5 }}>
            {option.cus_tax_id && (
              <Chip
                label={`เลขประจำตัวผู้เสียภาษี: ${option.cus_tax_id}`}
                size="small"
                variant="outlined"
              />
            )}
            {option.cus_tel_1 && (
              <Chip
                icon={<Phone fontSize="small" />}
                label={option.cus_tel_1}
                size="small"
                variant="outlined"
              />
            )}
            {option.cus_email && (
              <Chip
                icon={<Email fontSize="small" />}
                label={option.cus_email}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {option.cus_address && (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mt: 0.5, ml: 3.5 }}>
              <LocationOn fontSize="small" sx={{ mt: 0.2, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {option.cus_address}
                {option.cus_zip_code && ` ${option.cus_zip_code}`}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    ),
    []
  );

  return (
    <Autocomplete
      value={value} // <-- Value is now the object
      onChange={handleChange}
      onInputChange={handleInputChange}
      options={customers}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      renderOption={renderOption}
      loading={isLoading}
      loadingText="กำลังโหลดข้อมูลลูกค้า..."
      noOptionsText="ไม่พบลูกค้า"
      PaperComponent={(props) => <Paper {...props} elevation={8} />}
      renderInput={(params) => (
        <TextField
          {...params}
          label="เลือกลูกค้า"
          required={required}
          error={error}
          helperText={helperText}
          placeholder="ค้นหาชื่อบริษัท, ชื่อผู้ติดต่อ, เลขประจำตัวผู้เสียภาษี..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default CustomerSelector;
