/**
 * 🐛 Debug Utilities for CustomerEditCard
 * ใช้สำหรับตรวจสอบปัญหา React Key Warning และข้อมูล API
 */

// Add to CustomerEditCard.jsx for debugging
export const debugLocationData = {
  logProvinces: (provinces) => {
    console.group("🏢 Provinces Debug");
    console.log("Total provinces:", provinces.length);
    console.log("Sample data:", provinces.slice(0, 3));

    // Check for duplicate or empty keys
    const ids = provinces.map((p) => p.pro_id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      console.warn("⚠️ Duplicate province IDs found:", duplicates);
    }

    const emptyIds = provinces.filter((p) => !p.pro_id || p.pro_id === "");
    if (emptyIds.length > 0) {
      console.warn("⚠️ Provinces with empty IDs:", emptyIds);
    }
    console.groupEnd();
  },

  logDistricts: (districts, provinceId) => {
    console.group(`🏘️ Districts Debug (Province: ${provinceId})`);
    console.log("Total districts:", districts.length);
    console.log("Sample data:", districts.slice(0, 3));

    const ids = districts.map((d) => d.dis_id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      console.warn("⚠️ Duplicate district IDs found:", duplicates);
    }

    const emptyIds = districts.filter((d) => !d.dis_id || d.dis_id === "");
    if (emptyIds.length > 0) {
      console.warn("⚠️ Districts with empty IDs:", emptyIds);
    }
    console.groupEnd();
  },

  logSubdistricts: (subdistricts, districtId) => {
    console.group(`🏡 Subdistricts Debug (District: ${districtId})`);
    console.log("Total subdistricts:", subdistricts.length);
    console.log("Sample data:", subdistricts.slice(0, 3));

    const ids = subdistricts.map((s) => s.sub_id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      console.warn("⚠️ Duplicate subdistrict IDs found:", duplicates);
    }

    const emptyIds = subdistricts.filter((s) => !s.sub_id || s.sub_id === "");
    if (emptyIds.length > 0) {
      console.warn("⚠️ Subdistricts with empty IDs:", emptyIds);
    }
    console.groupEnd();
  },
};

// Sample API response validation
export const validateApiResponse = {
  provinces: (data) => {
    const required = ["pro_id", "pro_name_th", "pro_sort_id"];
    return data.every((item) =>
      required.every((field) => item[field] !== undefined && item[field] !== "")
    );
  },

  districts: (data) => {
    const required = ["dis_id", "dis_name", "dis_sort_id"];
    return data.every((item) =>
      required.every((field) => item[field] !== undefined && item[field] !== "")
    );
  },

  subdistricts: (data) => {
    const required = ["sub_id", "sub_name"];
    return data.every((item) =>
      required.every((field) => item[field] !== undefined && item[field] !== "")
    );
  },
};

// Debug component render issues
export const debugAutocompleteProps = {
  province: (provinces, selectedValue) => {
    console.group("🔍 Province Autocomplete Debug");
    console.log("Options count:", provinces.length);
    console.log("Selected value:", selectedValue);
    console.log(
      "Valid options:",
      provinces.filter((p) => p.pro_id && p.pro_name_th)
    );
    console.groupEnd();
  },

  district: (districts, selectedValue) => {
    console.group("🔍 District Autocomplete Debug");
    console.log("Options count:", districts.length);
    console.log("Selected value:", selectedValue);
    console.log(
      "Valid options:",
      districts.filter((d) => d.dis_id && d.dis_name)
    );
    console.groupEnd();
  },
};

/**
 * How to use in CustomerEditCard.jsx:
 *
 * import { debugLocationData } from './debug-utils';
 *
 * // In loadDistricts function:
 * setDistricts(validDistricts);
 * if (import.meta.env.VITE_DEBUG_API === 'true') {
 *     debugLocationData.logDistricts(validDistricts, provinceId);
 * }
 */
