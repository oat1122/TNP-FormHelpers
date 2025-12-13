/**
 * AddressSection.jsx - Location and address fields with cascading dropdowns
 *
 * Used in:
 * - AdditionalInfoTab (DialogForm)
 * - TelesalesQuickCreateForm
 *
 * Features:
 * - Progressive Disclosure (collapsible section)
 * - Visual Grouping with Paper wrapper
 * - Skeleton Loading for dropdown states
 * - Cascading province > district > subdistrict dropdowns
 * - Auto-fill zip code from subdistrict selection
 *
 * @module Forms/sections/AddressSection
 */
import React, { useState } from "react";
import {
  Box,
  TextField,
  Stack,
  Autocomplete,
  Grid2 as Grid,
  Paper,
  Collapse,
  Button,
  Skeleton,
  Typography,
  Chip,
} from "@mui/material";
import { MdLocationOn, MdExpandMore, MdExpandLess, MdCheckCircle } from "react-icons/md";

// Shared UI Primitives
import { StyledTextField, FORM_THEME } from "../ui/FormFields";
import { SectionHeader } from "../ui/SectionHeader";

const PRIMARY_RED = FORM_THEME.PRIMARY_RED;

/**
 * Check if address section has any data
 */
const hasAddressData = (inputList) => {
  return !!(
    inputList.cus_address_detail ||
    inputList.cus_pro_id ||
    inputList.cus_dis_id ||
    inputList.cus_sub_id ||
    inputList.cus_zip_code
  );
};

/**
 * Get address summary for collapsed state
 */
const getAddressSummary = (inputList, provincesList, districtList, subDistrictList) => {
  const parts = [];

  if (inputList.cus_address_detail) {
    parts.push(inputList.cus_address_detail);
  }

  const subdistrict = subDistrictList?.find((s) => s.sub_id === inputList.cus_sub_id);
  if (subdistrict) {
    parts.push(subdistrict.sub_name_th || subdistrict.sub_name);
  }

  const district = districtList?.find((d) => d.dis_id === inputList.cus_dis_id);
  if (district) {
    parts.push(district.dis_name_th || district.dis_name);
  }

  const province = provincesList?.find((p) => p.pro_id === inputList.cus_pro_id);
  if (province) {
    parts.push(province.pro_name_th);
  }

  if (inputList.cus_zip_code) {
    parts.push(inputList.cus_zip_code);
  }

  return parts.join(" ");
};

/**
 * AddressSection - ที่อยู่ธุรกิจ (cascading province/district/subdistrict + zip)
 *
 * @param {object} inputList - Form data object
 * @param {object} errors - Validation errors
 * @param {function} handleInputChange - Input change handler
 * @param {function} handleProvinceChange - Province change handler (cascades to district)
 * @param {function} handleDistrictChange - District change handler (cascades to subdistrict)
 * @param {function} handleSubdistrictChange - Subdistrict change handler (auto-fills zip)
 * @param {boolean} isLoadingDistricts - Loading state for districts dropdown
 * @param {boolean} isLoadingSubdistricts - Loading state for subdistricts dropdown
 * @param {string} mode - "create" | "edit" | "view"
 * @param {array} provincesList - Available provinces
 * @param {array} districtList - Available districts (filtered by province)
 * @param {array} subDistrictList - Available subdistricts (filtered by district)
 * @param {boolean} showHeader - Whether to show section header (default: true)
 * @param {boolean} optional - Whether to show optional badge (default: true)
 * @param {boolean} collapsible - Enable progressive disclosure (default: true)
 * @param {boolean} defaultExpanded - Start expanded (default: false for create, true otherwise)
 */
export const AddressSection = ({
  inputList = {},
  errors = {},
  handleInputChange,
  handleProvinceChange,
  handleDistrictChange,
  handleSubdistrictChange,
  isLoadingDistricts = false,
  isLoadingSubdistricts = false,
  mode = "create",
  provincesList = [],
  districtList = [],
  subDistrictList = [],
  showHeader = true,
  optional = true,
  collapsible = true,
  defaultExpanded,
}) => {
  // Determine if should start expanded
  const hasData = hasAddressData(inputList);
  const initialExpanded =
    defaultExpanded !== undefined ? defaultExpanded : mode !== "create" || hasData;
  const [expanded, setExpanded] = useState(initialExpanded);

  // Loading skeleton for provinces
  const isLoadingProvinces = provincesList.length === 0;

  // Address summary for collapsed view
  const addressSummary = getAddressSummary(inputList, provincesList, districtList, subDistrictList);

  return (
    <Box sx={{ mb: 4 }}>
      {showHeader && (
        <SectionHeader
          icon={MdLocationOn}
          title="ที่อยู่ธุรกิจ"
          subtitle="ที่อยู่สำหรับการติดต่อและจัดส่ง"
          optional={optional}
        />
      )}

      {/* Progressive Disclosure Toggle */}
      {collapsible && mode !== "view" && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => setExpanded(!expanded)}
            startIcon={expanded ? <MdExpandLess /> : <MdExpandMore />}
            endIcon={hasData ? <MdCheckCircle color="#4caf50" /> : null}
            sx={{
              color: PRIMARY_RED,
              fontFamily: "Kanit",
              textTransform: "none",
            }}
          >
            {expanded ? "ซ่อนรายละเอียดที่อยู่" : "กรอกที่อยู่"}
          </Button>

          {/* Address Summary when collapsed */}
          {!expanded && hasData && (
            <Chip
              label={addressSummary.substring(0, 60) + (addressSummary.length > 60 ? "..." : "")}
              size="small"
              variant="outlined"
              sx={{ ml: 1, fontFamily: "Kanit", maxWidth: 300 }}
            />
          )}
        </Box>
      )}

      {/* Collapsible Content */}
      <Collapse in={expanded || mode === "view"} timeout="auto">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            bgcolor: "#f8f9fa",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
          <Stack spacing={2.5}>
            {/* ที่อยู่ */}
            <StyledTextField
              mode={mode}
              name="cus_address_detail"
              label="บ้านเลขที่/หมู่บ้าน/ถนน"
              value={inputList.cus_address_detail || ""}
              onChange={handleInputChange}
              error={!!errors.cus_address_detail}
              helperText={errors.cus_address_detail}
              placeholder="เช่น 39/3 หมู่ 3 ถนนสุโขทัย"
            />

            {/* จังหวัด + อำเภอ + ตำบล (Autocomplete) */}
            <Grid container spacing={2}>
              {/* จังหวัด */}
              <Grid xs={12} sm={6} md={4}>
                {isLoadingProvinces ? (
                  <Skeleton variant="rounded" height={40} />
                ) : (
                  <Autocomplete
                    fullWidth
                    disabled={mode === "view"}
                    options={provincesList}
                    getOptionLabel={(option) => option.pro_name_th || ""}
                    value={provincesList.find((p) => p.pro_id === inputList.cus_pro_id) || null}
                    onChange={handleProvinceChange}
                    isOptionEqualToValue={(option, value) => option.pro_id === value?.pro_id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="จังหวัด"
                        size="small"
                        placeholder="ค้นหาจังหวัด..."
                        error={!!errors.cus_pro_id}
                        helperText={errors.cus_pro_id}
                        InputLabelProps={{ style: { fontFamily: "Kanit", fontSize: 14 } }}
                        sx={{
                          bgcolor: "white",
                          "& .MuiOutlinedInput-root": {
                            fontFamily: "Kanit",
                            fontSize: 14,
                            "&:hover fieldset": { borderColor: PRIMARY_RED },
                            "&.Mui-focused fieldset": { borderColor: PRIMARY_RED },
                          },
                          "& .MuiInputBase-input": {
                            overflow: "visible",
                            textOverflow: "clip",
                          },
                        }}
                      />
                    )}
                    sx={{
                      minWidth: 180,
                      "& .MuiAutocomplete-option": { fontFamily: "Kanit" },
                    }}
                  />
                )}
              </Grid>

              {/* อำเภอ */}
              <Grid xs={12} sm={6} md={4}>
                {isLoadingDistricts ? (
                  <Skeleton variant="rounded" height={40} />
                ) : (
                  <Autocomplete
                    fullWidth
                    disabled={mode === "view" || !inputList.cus_pro_id}
                    loading={isLoadingDistricts}
                    options={districtList}
                    getOptionLabel={(option) => option.dis_name_th || option.dis_name || ""}
                    value={districtList.find((d) => d.dis_id === inputList.cus_dis_id) || null}
                    onChange={handleDistrictChange}
                    isOptionEqualToValue={(option, value) => option.dis_id === value?.dis_id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="เขต/อำเภอ"
                        size="small"
                        placeholder={inputList.cus_pro_id ? "ค้นหาอำเภอ..." : "เลือกจังหวัดก่อน"}
                        error={!!errors.cus_dis_id}
                        helperText={errors.cus_dis_id}
                        InputLabelProps={{ style: { fontFamily: "Kanit", fontSize: 14 } }}
                        sx={{
                          bgcolor: "white",
                          "& .MuiOutlinedInput-root": {
                            fontFamily: "Kanit",
                            fontSize: 14,
                            "&:hover fieldset": { borderColor: PRIMARY_RED },
                            "&.Mui-focused fieldset": { borderColor: PRIMARY_RED },
                          },
                          "& .MuiInputBase-input": {
                            overflow: "visible",
                            textOverflow: "clip",
                          },
                        }}
                      />
                    )}
                    sx={{
                      minWidth: 180,
                      "& .MuiAutocomplete-option": { fontFamily: "Kanit" },
                    }}
                  />
                )}
              </Grid>

              {/* ตำบล */}
              <Grid xs={12} sm={6} md={4}>
                {isLoadingSubdistricts ? (
                  <Skeleton variant="rounded" height={40} />
                ) : (
                  <Autocomplete
                    fullWidth
                    disabled={mode === "view" || !inputList.cus_dis_id}
                    loading={isLoadingSubdistricts}
                    options={subDistrictList}
                    getOptionLabel={(option) => option.sub_name_th || option.sub_name || ""}
                    value={subDistrictList.find((s) => s.sub_id === inputList.cus_sub_id) || null}
                    onChange={handleSubdistrictChange}
                    isOptionEqualToValue={(option, value) => option.sub_id === value?.sub_id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="แขวง/ตำบล"
                        size="small"
                        placeholder={inputList.cus_dis_id ? "ค้นหาตำบล..." : "เลือกอำเภอก่อน"}
                        error={!!errors.cus_sub_id}
                        helperText={errors.cus_sub_id}
                        InputLabelProps={{ style: { fontFamily: "Kanit", fontSize: 14 } }}
                        sx={{
                          bgcolor: "white",
                          "& .MuiOutlinedInput-root": {
                            fontFamily: "Kanit",
                            fontSize: 14,
                            "&:hover fieldset": { borderColor: PRIMARY_RED },
                            "&.Mui-focused fieldset": { borderColor: PRIMARY_RED },
                          },
                          "& .MuiInputBase-input": {
                            overflow: "visible",
                            textOverflow: "clip",
                          },
                        }}
                      />
                    )}
                    sx={{
                      minWidth: 180,
                      "& .MuiAutocomplete-option": { fontFamily: "Kanit" },
                    }}
                  />
                )}
              </Grid>
            </Grid>

            {/* รหัสไปรษณีย์ (Auto-filled) */}
            <StyledTextField
              mode={mode}
              name="cus_zip_code"
              label="รหัสไปรษณีย์"
              value={inputList.cus_zip_code || ""}
              onChange={handleInputChange}
              error={!!errors.cus_zip_code}
              helperText={errors.cus_zip_code || "รหัสไปรษณีย์จะถูกกรอกอัตโนมัติเมื่อเลือกตำบล"}
              placeholder="เช่น 13260"
              inputProps={{
                maxLength: 5,
                pattern: "[0-9]*",
              }}
              sx={{ maxWidth: { xs: "100%", sm: "200px" } }}
            />
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default AddressSection;
