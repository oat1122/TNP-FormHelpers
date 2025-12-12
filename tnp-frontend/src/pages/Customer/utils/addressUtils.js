/**
 * Address Utilities
 *
 * Utility functions for parsing and formatting Thai addresses
 */

/**
 * Parse full Thai address string into components
 * Format: "ที่อยู่ ต.ตำบล อ.อำเภอ จ.จังหวัด รหัสไปรษณีย์"
 *
 * @param {string} fullAddress - Full address string
 * @returns {Object} Parsed address components
 */
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
      const provinceIndex = addressParts.findIndex((part) => part.startsWith("จ."));
      const province = provinceIndex >= 0 ? addressParts[provinceIndex].replace("จ.", "") : "";

      // หาอำเภอ (ขึ้นต้นด้วย "อ.")
      const districtIndex = addressParts.findIndex((part) => part.startsWith("อ."));
      const district = districtIndex >= 0 ? addressParts[districtIndex].replace("อ.", "") : "";

      // หาตำบล (ขึ้นต้นด้วย "ต.")
      const subdistrictIndex = addressParts.findIndex((part) => part.startsWith("ต."));
      const subdistrict =
        subdistrictIndex >= 0 ? addressParts[subdistrictIndex].replace("ต.", "") : "";

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

/**
 * Build full address string from components
 *
 * @param {Object} components - Address components
 * @returns {string} Full address string
 */
export const buildFullAddress = (components) => {
  const { address, subdistrict, district, province, zipCode } = components || {};

  const parts = [
    address || "",
    subdistrict ? `ต.${subdistrict}` : "",
    district ? `อ.${district}` : "",
    province ? `จ.${province}` : "",
    zipCode || "",
  ].filter(Boolean);

  return parts.join(" ");
};
