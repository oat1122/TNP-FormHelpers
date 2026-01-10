/**
 * TaxInfoSection.jsx - Business tax information
 *
 * Used in:
 * - AdditionalInfoTab (DialogForm)
 * - TelesalesQuickCreateForm
 *
 * @module Forms/sections/TaxInfoSection
 */
import React from "react";
import { Box } from "@mui/material";
import { HiIdentification } from "react-icons/hi";

// Shared UI Primitives
import { StyledTextField } from "../ui/FormFields";
import { SectionHeader } from "../ui/SectionHeader";

/**
 * TaxInfoSection - ข้อมูลทางธุรกิจ (เลขภาษี)
 *
 * @param {object} inputList - Form data object
 * @param {object} errors - Validation errors
 * @param {function} handleInputChange - Input change handler
 * @param {string} mode - "create" | "edit" | "view"
 * @param {boolean} showHeader - Whether to show section header (default: true)
 */
export const TaxInfoSection = ({
  inputList = {},
  errors = {},
  handleInputChange,
  mode = "create",
  showHeader = true,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {showHeader && (
        <SectionHeader
          icon={HiIdentification}
          title="ข้อมูลทางธุรกิจ"
          subtitle="เลขภาษีและข้อมูลสำหรับออกใบกำกับ"
          optional
        />
      )}

      <StyledTextField
        mode={mode}
        name="cus_tax_id"
        label="เลขประจำตัวผู้เสียภาษี"
        value={inputList.cus_tax_id || ""}
        onChange={handleInputChange}
        error={!!errors.cus_tax_id}
        helperText={errors.cus_tax_id || "เลข 13 หลัก"}
        placeholder="เช่น 1234567890123"
        inputProps={{
          maxLength: 13,
          pattern: "[0-9]*",
        }}
      />
    </Box>
  );
};

export default TaxInfoSection;
