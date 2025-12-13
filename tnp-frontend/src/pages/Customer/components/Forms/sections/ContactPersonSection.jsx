/**
 * ContactPersonSection.jsx - Contact person name fields
 *
 * Used in:
 * - EssentialInfoTab (DialogForm)
 * - TelesalesQuickCreateForm
 *
 * @module Forms/sections/ContactPersonSection
 */
import React from "react";
import { Box, Stack } from "@mui/material";
import { HiUser } from "react-icons/hi";

// Shared UI Primitives
import { StyledTextField } from "../ui/FormFields";
import { SectionHeader } from "../ui/SectionHeader";

/**
 * ContactPersonSection - ข้อมูลผู้ติดต่อ (ชื่อจริง, นามสกุล, ชื่อเล่น)
 *
 * @param {object} inputList - Form data object
 * @param {object} errors - Validation errors
 * @param {function} handleInputChange - Input change handler
 * @param {string} mode - "create" | "edit" | "view"
 * @param {boolean} showHeader - Whether to show section header (default: true)
 * @param {React.Ref} nameFieldRef - Ref for the nickname field (for auto-focus)
 */
export const ContactPersonSection = ({
  inputList = {},
  errors = {},
  handleInputChange,
  mode = "create",
  showHeader = true,
  nameFieldRef,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {showHeader && (
        <SectionHeader icon={HiUser} title="ข้อมูลผู้ติดต่อ" subtitle="ชื่อและนามสกุลของลูกค้า" />
      )}

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
          inputRef={nameFieldRef}
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
  );
};

export default ContactPersonSection;
