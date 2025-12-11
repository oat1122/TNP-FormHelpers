import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Autocomplete,
  Paper,
  Collapse,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import React, { useState } from "react";
import { HiOfficeBuilding, HiUser, HiPhone } from "react-icons/hi";
import { MdSettings, MdAdd, MdRemove, MdEmail, MdPhone, MdWarning } from "react-icons/md";

// สี theme ของบริษัท
const PRIMARY_RED = "#9e0000";
const SECONDARY_RED = "#d32f2f";
const BACKGROUND_COLOR = "#fffaf9";

// Section Header Component (outside main component to prevent re-creation)
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      mb: 2,
      pb: 1,
      borderBottom: `2px solid ${PRIMARY_RED}20`,
    }}
  >
    <Box
      sx={{
        p: 1,
        borderRadius: 1,
        bgcolor: `${PRIMARY_RED}10`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={20} color={PRIMARY_RED} />
    </Box>
    <Box>
      <Typography
        variant="subtitle1"
        sx={{
          fontFamily: "Kanit",
          fontWeight: 600,
          color: PRIMARY_RED,
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="caption"
          sx={{
            fontFamily: "Kanit",
            color: "text.secondary",
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

// Styled TextField Component (outside main component to prevent re-creation)
const StyledTextField = ({ label, required, mode, onBlur, ...props }) => (
  <TextField
    {...props}
    label={required ? `${label} *` : label}
    size="small"
    fullWidth
    disabled={mode === "view"}
    onBlur={onBlur}
    sx={{
      bgcolor: "white",
      "& .MuiOutlinedInput-root": {
        "&:hover fieldset": {
          borderColor: PRIMARY_RED,
        },
        "&.Mui-focused fieldset": {
          borderColor: PRIMARY_RED,
        },
      },
      "& .MuiInputLabel-root": {
        "&:hover": {
          color: PRIMARY_RED,
        },
        "&.Mui-focused": {
          color: PRIMARY_RED,
        },
      },
      ...props.sx,
    }}
    InputProps={{
      style: { fontFamily: "Kanit", fontSize: 14 },
      ...props.InputProps,
    }}
    InputLabelProps={{
      style: { fontFamily: "Kanit", fontSize: 14 },
      ...props.InputLabelProps,
    }}
  />
);

/**
 * EssentialInfoTab - Tab 1: ข้อมูลหลักที่จำเป็นต้องกรอก
 * รวมฟิลด์: ประเภทธุรกิจ, ชื่อบริษัท, ชื่อผู้ติดต่อ, เบอร์โทร, อีเมล, ช่องทางติดต่อ
 */
const EssentialInfoTab = ({
  inputList = {},
  errors = {},
  handleInputChange,
  businessTypesList = [],
  handleOpenBusinessTypeManager,
  businessTypesIsFetching = false,
  mode = "create",
  // Duplicate check props
  onPhoneBlur,
  onPhoneChange,
  onCompanyBlur,
  companyWarning,
  onClearCompanyWarning,
  duplicatePhoneData,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [showSecondPhone, setShowSecondPhone] = useState(!!inputList.cus_tel_2);

  // Handle phone blur with duplicate check
  const handlePhoneBlur = () => {
    if (onPhoneBlur && inputList.cus_tel_1) {
      onPhoneBlur(inputList.cus_tel_1);
    }
  };

  // Handle phone change - clear duplicate data to re-enable save button
  const handlePhoneInputChange = (e) => {
    // Clear duplicate state when user starts typing new phone
    if (onPhoneChange && duplicatePhoneData) {
      onPhoneChange();
    }
    handleInputChange(e);
  };

  // Handle company blur with duplicate check
  const handleCompanyBlur = () => {
    if (onCompanyBlur && inputList.cus_company) {
      onCompanyBlur(inputList.cus_company);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* SECTION 1: ข้อมูลธุรกิจ */}
      <Box sx={{ mb: 4 }}>
        <SectionHeader
          icon={HiOfficeBuilding}
          title="ข้อมูลธุรกิจ"
          subtitle="ประเภทธุรกิจและชื่อบริษัท"
        />

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

      {/* SECTION 2: ข้อมูลผู้ติดต่อ */}
      <Box sx={{ mb: 4 }}>
        <SectionHeader icon={HiUser} title="ข้อมูลผู้ติดต่อ" subtitle="ชื่อและนามสกุลของลูกค้า" />

        <Stack spacing={2.5}>
          {/* ชื่อ-นามสกุล */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <StyledTextField
              mode={mode}
              name="cus_firstname"
              label="ชื่อจริง"
              required
              value={inputList.cus_firstname || ""}
              onChange={handleInputChange}
              error={!!errors.cus_firstname}
              helperText={errors.cus_firstname}
              placeholder="เช่น สมชาย"
            />
            <StyledTextField
              mode={mode}
              name="cus_lastname"
              label="นามสกุล"
              required
              value={inputList.cus_lastname || ""}
              onChange={handleInputChange}
              error={!!errors.cus_lastname}
              helperText={errors.cus_lastname}
              placeholder="เช่น ใจดี"
            />
          </Box>

          {/* ชื่อเล่น */}
          <StyledTextField
            mode={mode}
            name="cus_name"
            label="ชื่อเล่น/ชื่อย่อ (สำหรับค้นหา)"
            required
            value={inputList.cus_name || ""}
            onChange={handleInputChange}
            error={!!errors.cus_name}
            helperText={errors.cus_name || "ชื่อสั้นๆ สำหรับค้นหาลูกค้าได้ง่าย"}
            placeholder="เช่น ABC, ร้านสมชาย"
            inputProps={{ maxLength: 50 }}
          />
        </Stack>
      </Box>

      {/* SECTION 3: ช่องทางติดต่อ */}
      <Box>
        <SectionHeader
          icon={HiPhone}
          title="ช่องทางติดต่อ"
          subtitle="เบอร์โทรและอีเมลสำหรับติดต่อ"
        />

        <Stack spacing={2.5}>
          {/* เบอร์โทรและอีเมล */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <StyledTextField
              mode={mode}
              name="cus_tel_1"
              label="เบอร์โทรหลัก"
              required
              value={inputList.cus_tel_1 || ""}
              onChange={handlePhoneInputChange}
              onBlur={handlePhoneBlur}
              error={!!errors.cus_tel_1 || !!duplicatePhoneData}
              helperText={
                errors.cus_tel_1 ||
                (duplicatePhoneData
                  ? `⚠️ เบอร์ซ้ำกับ ${duplicatePhoneData.cus_name} (แก้ไขเบอร์เพื่อบันทึกต่อ)`
                  : "ตรวจสอบเบอร์ซ้ำอัตโนมัติ")
              }
              placeholder="เช่น 0812345678"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
                startAdornment: (
                  <Box
                    sx={{
                      mr: 1,
                      display: "flex",
                      color: duplicatePhoneData ? "error.main" : "text.secondary",
                    }}
                  >
                    <MdPhone size={18} />
                  </Box>
                ),
              }}
            />
            <StyledTextField
              mode={mode}
              name="cus_email"
              label="อีเมล"
              type="email"
              value={inputList.cus_email || ""}
              onChange={handleInputChange}
              error={!!errors.cus_email}
              helperText={errors.cus_email}
              placeholder="example@email.com"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex", color: "text.secondary" }}>
                    <MdEmail size={18} />
                  </Box>
                ),
              }}
            />
          </Box>

          {/* เบอร์โทรสำรอง - Collapsible */}
          {mode !== "view" && (
            <Button
              variant="text"
              size="small"
              startIcon={showSecondPhone ? <MdRemove /> : <MdAdd />}
              onClick={() => setShowSecondPhone(!showSecondPhone)}
              sx={{
                color: PRIMARY_RED,
                fontFamily: "Kanit",
                alignSelf: "flex-start",
                textTransform: "none",
              }}
            >
              {showSecondPhone ? "ซ่อนเบอร์สำรอง" : "เพิ่มเบอร์สำรอง"}
            </Button>
          )}

          <Collapse in={showSecondPhone || !!inputList.cus_tel_2}>
            <StyledTextField
              mode={mode}
              name="cus_tel_2"
              label="เบอร์โทรสำรอง"
              value={inputList.cus_tel_2 || ""}
              onChange={handleInputChange}
              error={!!errors.cus_tel_2}
              helperText={errors.cus_tel_2}
              placeholder="เบอร์สำรองสำหรับติดต่อ"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex", color: "text.secondary" }}>
                    <MdPhone size={18} />
                  </Box>
                ),
              }}
            />
          </Collapse>

          {/* ช่องทางการติดต่อ */}
          <FormControl fullWidth disabled={mode === "view"} size="small">
            <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>ช่องทางการติดต่อ</InputLabel>
            <Select
              name="cus_channel"
              value={inputList.cus_channel || 1}
              onChange={handleInputChange}
              label="ช่องทางการติดต่อ"
              sx={{
                fontFamily: "Kanit",
                fontSize: 14,
                bgcolor: "white",
              }}
            >
              <MenuItem value={1} sx={{ fontFamily: "Kanit" }}>
                Sales
              </MenuItem>
              <MenuItem value={2} sx={{ fontFamily: "Kanit" }}>
                Online
              </MenuItem>
              <MenuItem value={3} sx={{ fontFamily: "Kanit" }}>
                Office
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>
    </Box>
  );
};

export default EssentialInfoTab;
