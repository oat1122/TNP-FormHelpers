/**
 * BusinessInfoSection.jsx - Business type and company name fields
 *
 * Used in:
 * - EssentialInfoTab (DialogForm)
 * - TelesalesQuickCreateForm
 *
 * @module Forms/sections/BusinessInfoSection
 */
import React from "react";
import {
  Box,
  Typography,
  TextField,
  Stack,
  Autocomplete,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Skeleton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { HiOfficeBuilding } from "react-icons/hi";
import { MdSettings, MdWarning } from "react-icons/md";

// Shared UI Primitives
import { StyledTextField, FORM_THEME } from "../ui/FormFields";
import { SectionHeader } from "../ui/SectionHeader";

const PRIMARY_RED = FORM_THEME.PRIMARY_RED;

/**
 * BusinessInfoSection - ข้อมูลธุรกิจ (ประเภทธุรกิจ + ชื่อบริษัท)
 *
 * @param {object} inputList - Form data object
 * @param {object} errors - Validation errors
 * @param {function} handleInputChange - Input change handler
 * @param {array} businessTypesList - Available business types
 * @param {function} handleOpenBusinessTypeManager - Opens business type manager modal
 * @param {boolean} businessTypesIsFetching - Loading state for business types
 * @param {string} mode - "create" | "edit" | "view"
 * @param {object} companyWarning - Company duplicate warning data
 * @param {function} onClearCompanyWarning - Clear company warning handler
 * @param {function} onCompanyBlur - Company field blur handler
 * @param {boolean} showHeader - Whether to show section header (default: true)
 */
export const BusinessInfoSection = ({
  inputList = {},
  errors = {},
  handleInputChange,
  businessTypesList = [],
  handleOpenBusinessTypeManager,
  businessTypesIsFetching = false,
  mode = "create",
  companyWarning,
  onClearCompanyWarning,
  onCompanyBlur,
  showHeader = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Handle company blur with duplicate check
  const handleCompanyBlur = () => {
    if (onCompanyBlur && inputList.cus_company) {
      onCompanyBlur(inputList.cus_company);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      {showHeader && (
        <SectionHeader
          icon={HiOfficeBuilding}
          title="ข้อมูลธุรกิจ"
          subtitle="ประเภทธุรกิจและชื่อบริษัท"
        />
      )}

      <Stack spacing={2.5}>
        {/* ประเภทธุรกิจ */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          {businessTypesIsFetching && businessTypesList.length === 0 ? (
            <Skeleton variant="rounded" height={40} sx={{ flex: 1, minWidth: 200 }} />
          ) : (
            <Autocomplete
              fullWidth
              loading={businessTypesIsFetching}
              disabled={mode === "view"}
              options={businessTypesList}
              getOptionLabel={(option) => option.bt_name || ""}
              value={businessTypesList.find((type) => type.bt_id === inputList.cus_bt_id) || null}
              onChange={(event, newValue) => {
                const syntheticEvent = {
                  target: {
                    name: "cus_bt_id",
                    value: newValue ? newValue.bt_id : "",
                  },
                };
                handleInputChange(syntheticEvent);
              }}
              isOptionEqualToValue={(option, value) => option.bt_id === value.bt_id}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  sx={{
                    fontFamily: "Kanit",
                    fontSize: "0.875rem",
                    padding: "12px 16px",
                    "&:hover": {
                      bgcolor: `${PRIMARY_RED}08`,
                    },
                  }}
                >
                  {option.bt_name}
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="เลือกประเภทธุรกิจ *"
                  placeholder="ค้นหาและเลือกประเภทธุรกิจ..."
                  error={!!errors.cus_bt_id}
                  helperText={errors.cus_bt_id}
                  size="small"
                  sx={{
                    bgcolor: "white",
                    "& .MuiInputBase-input": {
                      fontFamily: "Kanit",
                      fontSize: 14,
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Kanit",
                      fontSize: 14,
                    },
                  }}
                />
              )}
              ListboxProps={{
                sx: {
                  maxHeight: 300,
                  "& .MuiAutocomplete-option": {
                    fontFamily: "Kanit",
                  },
                },
              }}
            />
          )}

          {mode !== "view" && !isMobile && (
            <Tooltip title="จัดการประเภทธุรกิจ" arrow>
              <IconButton
                onClick={handleOpenBusinessTypeManager}
                sx={{
                  color: PRIMARY_RED,
                  border: `1px solid ${PRIMARY_RED}`,
                  width: 40,
                  height: 40,
                  bgcolor: "white",
                  "&:hover": {
                    backgroundColor: `${PRIMARY_RED}10`,
                  },
                }}
              >
                <MdSettings />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Mobile: Settings button as chip */}
        {mode !== "view" && isMobile && (
          <Chip
            icon={<MdSettings />}
            label="จัดการประเภทธุรกิจ"
            onClick={handleOpenBusinessTypeManager}
            variant="outlined"
            size="small"
            sx={{
              color: PRIMARY_RED,
              borderColor: PRIMARY_RED,
              fontFamily: "Kanit",
              alignSelf: "flex-start",
            }}
          />
        )}

        {/* ชื่อบริษัท */}
        <StyledTextField
          mode={mode}
          name="cus_company"
          label="ชื่อบริษัท"
          required
          value={inputList.cus_company || ""}
          onChange={handleInputChange}
          onBlur={handleCompanyBlur}
          error={!!errors.cus_company}
          helperText={errors.cus_company}
          placeholder="เช่น บริษัท ABC จำกัด"
        />

        {/* Company Warning Alert */}
        {companyWarning && (
          <Box
            sx={{
              p: 2,
              bgcolor: "#fff3e0",
              borderRadius: 1,
              border: "1px solid #ff9800",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <MdWarning size={20} color="#e65100" style={{ marginTop: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "Kanit", fontWeight: 600, color: "#e65100" }}
                >
                  พบชื่อบริษัทคล้ายกันในระบบ ({companyWarning.count} รายการ)
                </Typography>
                {companyWarning.examples.map((ex, idx) => (
                  <Typography
                    key={idx}
                    variant="caption"
                    sx={{
                      fontFamily: "Kanit",
                      color: "text.secondary",
                      display: "block",
                      mt: 0.5,
                    }}
                  >
                    • {ex.cus_company} ({ex.cus_name}) - ผู้ดูแล: {ex.sales_name || "ไม่มี"}
                  </Typography>
                ))}
                <Typography
                  variant="caption"
                  sx={{ fontFamily: "Kanit", color: "text.secondary", display: "block", mt: 1 }}
                >
                  คุณสามารถบันทึกต่อได้ (ระบบจะ Flag เป็น Possible Duplicate)
                </Typography>
                {onClearCompanyWarning && (
                  <Button
                    size="small"
                    onClick={onClearCompanyWarning}
                    sx={{ mt: 1, fontFamily: "Kanit", textTransform: "none" }}
                  >
                    ปิดคำเตือน
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default BusinessInfoSection;
