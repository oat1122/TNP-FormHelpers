/**
 * Customer Validation and Formatting Utilities
 * Note: API calls have been migrated to RTK Query (see customerApi.js)
 */

// Validation utilities
export const validateCustomerData = (data) => {
  const errors = {};

  if (!data.cus_company?.trim()) {
    errors.cus_company = "กรุณากรอกชื่อบริษัท";
  }
  if (!data.cus_firstname?.trim()) {
    errors.cus_firstname = "กรุณากรอกชื่อ";
  }
  if (!data.cus_lastname?.trim()) {
    errors.cus_lastname = "กรุณากรอกนามสกุล";
  }
  if (!data.cus_name?.trim()) {
    errors.cus_name = "กรุณากรอกชื่อเล่น";
  }
  if (!data.cus_tel_1?.trim()) {
    errors.cus_tel_1 = "กรุณากรอกเบอร์โทรศัพท์";
  }

  // Validate phone number format (allow 9-15 digits for company numbers)
  if (data.cus_tel_1 && !/^[0-9]{9,15}$/.test(data.cus_tel_1.replace(/[^0-9]/g, ""))) {
    errors.cus_tel_1 = "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง";
  }

  // Validate email format
  if (data.cus_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.cus_email)) {
    errors.cus_email = "รูปแบบอีเมลไม่ถูกต้อง";
  }

  // Validate tax ID format (13 digits)
  if (data.cus_tax_id && !/^[0-9]{13}$/.test(data.cus_tax_id.replace(/[^0-9]/g, ""))) {
    errors.cus_tax_id = "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก";
  }

  // Validate manager assignment
  if (!data.cus_manage_by || !data.cus_manage_by.user_id) {
    errors.cus_manage_by = "กรุณาเลือกผู้ดูแลลูกค้า";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Formatting utilities
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  return phone;
};

export const formatTaxId = (taxId) => {
  if (!taxId) return "";
  const cleaned = taxId.replace(/[^0-9]/g, "");
  if (cleaned.length === 13) {
    return `${cleaned.substring(0, 1)}-${cleaned.substring(1, 5)}-${cleaned.substring(5, 10)}-${cleaned.substring(10, 12)}-${cleaned.substring(12)}`;
  }
  return taxId;
};
