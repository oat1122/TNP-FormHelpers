import { Box } from "@mui/material";
import React from "react";

// Section Components
import { AddressSection, TaxInfoSection, ManagerSection, NotesSection } from "../sections";

/**
 * AdditionalInfoTab - Tab 2: ที่อยู่และข้อมูลเพิ่มเติม (ไม่บังคับ)
 *
 * Composes reusable sections:
 * - AddressSection (ที่อยู่ + จังหวัด/อำเภอ/ตำบล)
 * - TaxInfoSection (เลขภาษี)
 * - ManagerSection (ผู้ดูแลลูกค้า)
 * - NotesSection (หมายเหตุ)
 */
const AdditionalInfoTab = ({
  inputList = {},
  errors = {},
  handleInputChange,
  // Location handlers (Autocomplete)
  handleProvinceChange,
  handleDistrictChange,
  handleSubdistrictChange,
  isLoadingDistricts = false,
  isLoadingSubdistricts = false,
  mode = "create",
  salesList = [],
  provincesList = [],
  districtList = [],
  subDistrictList = [],
}) => {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* SECTION 1: ที่อยู่ธุรกิจ */}
      <AddressSection
        inputList={inputList}
        errors={errors}
        handleInputChange={handleInputChange}
        handleProvinceChange={handleProvinceChange}
        handleDistrictChange={handleDistrictChange}
        handleSubdistrictChange={handleSubdistrictChange}
        isLoadingDistricts={isLoadingDistricts}
        isLoadingSubdistricts={isLoadingSubdistricts}
        mode={mode}
        provincesList={provincesList}
        districtList={districtList}
        subDistrictList={subDistrictList}
      />

      {/* SECTION 2: ข้อมูลทางธุรกิจ */}
      <TaxInfoSection
        inputList={inputList}
        errors={errors}
        handleInputChange={handleInputChange}
        mode={mode}
      />

      {/* SECTION 3: ผู้ดูแลลูกค้า */}
      <ManagerSection
        inputList={inputList}
        errors={errors}
        handleInputChange={handleInputChange}
        mode={mode}
        salesList={salesList}
      />

      {/* SECTION 4: หมายเหตุ */}
      <NotesSection
        inputList={inputList}
        errors={errors}
        handleInputChange={handleInputChange}
        mode={mode}
      />
    </Box>
  );
};

export default AdditionalInfoTab;
