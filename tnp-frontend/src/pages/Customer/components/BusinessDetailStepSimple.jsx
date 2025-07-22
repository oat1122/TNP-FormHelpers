import React from "react";
import { Box, Container } from "@mui/material";
import HeaderSection from "./BusinessDetailStep/HeaderSection";
import ContactInfoSection from "./BusinessDetailStep/ContactInfoSection";
import GpsAutoFillSection from "./BusinessDetailStep/GpsAutoFillSection";
import AddressFormSection from "./BusinessDetailStep/AddressFormSection";
import { useGpsHelper } from "./BusinessDetailStep/useGpsHelper";

// สี theme ของบริษัท
const PRIMARY_RED = "#9e0000";
const SECONDARY_RED = "#d32f2f";
const BACKGROUND_COLOR = "#fffaf9";

/**
 * Enhanced BusinessDetailStepSimple with separated components
 * Main shell component that orchestrates sub-components
 */
const BusinessDetailStepSimple = ({
  inputList = {},
  errors = {},
  handleInputChange,
  mode = "create",
}) => {
  // ใช้ GPS Helper Hook
  const gpsHelperProps = useGpsHelper(inputList);

  return (
    <Box>
      <HeaderSection
        mode={mode}
        PRIMARY_RED={PRIMARY_RED}
        SECONDARY_RED={SECONDARY_RED}
      />

      <Container
        maxWidth="md"
        sx={{ pb: { xs: 10, sm: 4 }, pt: { xs: 2, sm: 0 } }}
      >
        <ContactInfoSection
          inputList={inputList}
          errors={errors}
          handleInputChange={handleInputChange}
          mode={mode}
          PRIMARY_RED={PRIMARY_RED}
          BACKGROUND_COLOR={BACKGROUND_COLOR}
        />

        <GpsAutoFillSection
          mode={mode}
          PRIMARY_RED={PRIMARY_RED}
          BACKGROUND_COLOR={BACKGROUND_COLOR}
          {...gpsHelperProps}
        />

        <AddressFormSection
          inputList={inputList}
          errors={errors}
          handleInputChange={handleInputChange}
          mode={mode}
          PRIMARY_RED={PRIMARY_RED}
          BACKGROUND_COLOR={BACKGROUND_COLOR}
        />
      </Container>
    </Box>
  );
};

// ✅ Parse Full Address Function (สำหรับ CustomerViewDialog.jsx)
export const parseFullAddress = (fullAddress) => {
  if (!fullAddress || typeof fullAddress !== "string") {
    return {
      address: "",
      subdistrict: "",
      district: "",
      province: "",
      zipCode: "",
    };
  }

  try {
    // แยกส่วนตามรูปแบบ "39/3 หมู่ 3 ต.บ่อโพง อ.นครหลวง จ.พระนครศรีอยุธยา 13260"
    const parts = fullAddress.trim().split(" ");

    // หารหัสไปรษณีย์ (5 หลักสุดท้าย)
    const zipCode = parts[parts.length - 1];
    const isZipCode = /^\d{5}$/.test(zipCode);

    if (isZipCode) {
      const addressParts = parts.slice(0, -1);

      // หาจังหวัด (ขึ้นต้นด้วย "จ.")
      const provinceIndex = addressParts.findIndex((part) =>
        part.startsWith("จ.")
      );
      const province =
        provinceIndex >= 0 ? addressParts[provinceIndex].replace("จ.", "") : "";

      // หาอำเภอ (ขึ้นต้นด้วย "อ.")
      const districtIndex = addressParts.findIndex((part) =>
        part.startsWith("อ.")
      );
      const district =
        districtIndex >= 0 ? addressParts[districtIndex].replace("อ.", "") : "";

      // หาตำบล (ขึ้นต้นด้วย "ต.")
      const subdistrictIndex = addressParts.findIndex((part) =>
        part.startsWith("ต.")
      );
      const subdistrict =
        subdistrictIndex >= 0
          ? addressParts[subdistrictIndex].replace("ต.", "")
          : "";

      // ที่อยู่คือส่วนที่เหลือก่อนตำบล (ถ้ามี)
      const addressEndIndex =
        subdistrictIndex >= 0
          ? subdistrictIndex
          : districtIndex >= 0
          ? districtIndex
          : provinceIndex >= 0
          ? provinceIndex
          : addressParts.length;
      const address = addressParts.slice(0, addressEndIndex).join(" ") || "";

      return {
        address: address.trim(),
        subdistrict: subdistrict.trim(),
        district: district.trim(),
        province: province.trim(),
        zipCode: zipCode.trim(),
      };
    } else {
      // ถ้าไม่มีรหัสไปรษณีย์ ให้คืนข้อมูลเดิม
      return {
        address: fullAddress.trim(),
        subdistrict: "",
        district: "",
        province: "",
        zipCode: "",
      };
    }
  } catch (error) {
    console.warn("Error parsing address:", error);
    return {
      address: fullAddress.trim(),
      subdistrict: "",
      district: "",
      province: "",
      zipCode: "",
    };
  }
};

export default BusinessDetailStepSimple;
