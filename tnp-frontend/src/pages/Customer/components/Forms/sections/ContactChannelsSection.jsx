/**
 * ContactChannelsSection.jsx - Phone, email, and channel fields
 *
 * Used in:
 * - EssentialInfoTab (DialogForm)
 * - TelesalesQuickCreateForm
 *
 * @module Forms/sections/ContactChannelsSection
 */
import React, { useState } from "react";
import {
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Collapse,
} from "@mui/material";
import { HiPhone } from "react-icons/hi";
import { MdAdd, MdRemove, MdEmail, MdPhone } from "react-icons/md";

// Shared UI Primitives
import { StyledTextField, FORM_THEME } from "../ui/FormFields";
import { SectionHeader } from "../ui/SectionHeader";

const PRIMARY_RED = FORM_THEME.PRIMARY_RED;

/**
 * ContactChannelsSection - ช่องทางติดต่อ (เบอร์โทร, อีเมล, ช่องทาง)
 *
 * @param {object} inputList - Form data object
 * @param {object} errors - Validation errors
 * @param {function} handleInputChange - Input change handler
 * @param {string} mode - "create" | "edit" | "view"
 * @param {function} onPhoneBlur - Phone blur handler for duplicate check
 * @param {function} onPhoneChange - Phone change handler to clear duplicate state
 * @param {object} duplicatePhoneData - Duplicate phone data (blocking)
 * @param {boolean} showHeader - Whether to show section header (default: true)
 * @param {boolean} showSecondPhone - Whether to show second phone field initially
 */
export const ContactChannelsSection = ({
  inputList = {},
  errors = {},
  handleInputChange,
  mode = "create",
  onPhoneBlur,
  onPhoneChange,
  duplicatePhoneData,
  showHeader = true,
  showSecondPhoneInitially = false,
}) => {
  const [showSecondPhone, setShowSecondPhone] = useState(
    showSecondPhoneInitially || !!inputList.cus_tel_2
  );

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

  return (
    <Box>
      {showHeader && (
        <SectionHeader
          icon={HiPhone}
          title="ช่องทางติดต่อ"
          subtitle="เบอร์โทรและอีเมลสำหรับติดต่อ"
        />
      )}

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
  );
};

export default ContactChannelsSection;
