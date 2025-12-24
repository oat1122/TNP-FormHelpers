import { Box } from "@mui/material";
import React from "react";

// Section Components
import { BusinessInfoSection, ContactPersonSection, ContactChannelsSection } from "../sections";

/**
 * EssentialInfoTab - Tab 1: ข้อมูลหลักที่จำเป็นต้องกรอก
 *
 * Composes reusable sections:
 * - BusinessInfoSection (ประเภทธุรกิจ + ชื่อบริษัท)
 * - ContactPersonSection (ชื่อ, นามสกุล, ชื่อเล่น)
 * - ContactChannelsSection (เบอร์โทร, อีเมล, ช่องทาง)
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
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* SECTION 1: ข้อมูลธุรกิจ */}
      <BusinessInfoSection
        inputList={inputList}
        errors={errors}
        handleInputChange={handleInputChange}
        businessTypesList={businessTypesList}
        handleOpenBusinessTypeManager={handleOpenBusinessTypeManager}
        businessTypesIsFetching={businessTypesIsFetching}
        mode={mode}
        companyWarning={companyWarning}
        onClearCompanyWarning={onClearCompanyWarning}
        onCompanyBlur={onCompanyBlur}
      />

      {/* SECTION 2: ข้อมูลผู้ติดต่อ */}
      <ContactPersonSection
        inputList={inputList}
        errors={errors}
        handleInputChange={handleInputChange}
        mode={mode}
      />

      {/* SECTION 3: ช่องทางติดต่อ */}
      <ContactChannelsSection
        inputList={inputList}
        errors={errors}
        handleInputChange={handleInputChange}
        mode={mode}
        onPhoneBlur={onPhoneBlur}
        onPhoneChange={onPhoneChange}
        duplicatePhoneData={duplicatePhoneData}
      />
    </Box>
  );
};

export default EssentialInfoTab;
