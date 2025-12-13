/**
 * Customer Form Validation Constants
 * Single Source of Truth for required fields and error messages
 */

// Essential fields ที่ต้องกรอกก่อน Submit
export const ESSENTIAL_FIELDS = [
  "cus_bt_id", // ประเภทธุรกิจ
  "cus_company", // ชื่อบริษัท
  "cus_firstname", // ชื่อจริง
  "cus_lastname", // นามสกุล
  "cus_name", // ชื่อเล่น
  "cus_tel_1", // เบอร์โทรหลัก
];

// Error messages ภาษาไทย
export const FIELD_ERROR_MESSAGES = {
  cus_bt_id: "กรุณาเลือกประเภทธุรกิจ",
  cus_company: "กรุณากรอกชื่อบริษัท",
  cus_firstname: "กรุณากรอกชื่อจริง",
  cus_lastname: "กรุณากรอกนามสกุล",
  cus_name: "กรุณากรอกชื่อเล่น",
  cus_tel_1: "กรุณากรอกเบอร์โทรหลัก",
};

// Step-based required fields (สำหรับ Stepper UI)
export const STEP_REQUIRED_FIELDS = {
  0: ["cus_company", "cus_firstname", "cus_lastname", "cus_name", "cus_bt_id", "cus_channel"],
  1: ["cus_tel_1"],
  2: [],
  3: [],
};

/**
 * Validate essential fields
 * @param {Object} inputList - Form data
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateEssentialFields = (inputList) => {
  const errors = {};

  ESSENTIAL_FIELDS.forEach((field) => {
    const value = inputList[field];
    if (!value || (typeof value === "string" && !value.trim())) {
      errors[field] = FIELD_ERROR_MESSAGES[field] || "กรุณากรอกข้อมูลนี้";
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
