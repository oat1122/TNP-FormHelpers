/**
 * Hook สำหรับ Sanitize/ตัดตัวอักษรพิเศษก่อนบันทึกลง Database
 * ป้องกัน SQL Injection และ XSS Attack
 */

/**
 * ตัวอักษรพิเศษที่ต้องการลบออก
 * รวมถึง: angle brackets, quotes, semicolon, dashes, slashes, braces, pipes, caret, tilde, brackets
 */
const SPECIAL_CHARS_REGEX = /[<>"'`;\\{}|^~\[\]]/g;

/**
 * Pattern สำหรับ SQL Injection
 */
const SQL_INJECTION_PATTERNS = [
  /--/g, // SQL comment
  /\/\*/g, // SQL block comment start
  /\*\//g, // SQL block comment end
  /;/g, // SQL statement terminator
  /\\x00/g, // Null byte
  /\\n/g, // Newline injection
  /\\r/g, // Carriage return injection
];

/**
 * Pattern สำหรับ XSS Prevention
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onClick, onLoad, etc.
  /expression\s*\(/gi,
];

export const useSanitizeInput = () => {
  /**
   * ลบตัวอักษรพิเศษออกจาก string
   * @param {string} value - ค่าที่ต้องการ sanitize
   * @returns {string} - ค่าที่ถูก sanitize แล้ว
   */
  const removeSpecialChars = (value) => {
    if (typeof value !== "string") return value;
    return value.replace(SPECIAL_CHARS_REGEX, "").trim();
  };

  /**
   * ลบ SQL Injection patterns ออก
   * @param {string} value - ค่าที่ต้องการ sanitize
   * @returns {string} - ค่าที่ถูก sanitize แล้ว
   */
  const removeSqlInjection = (value) => {
    if (typeof value !== "string") return value;
    let sanitized = value;
    SQL_INJECTION_PATTERNS.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "");
    });
    return sanitized;
  };

  /**
   * ลบ XSS patterns ออก
   * @param {string} value - ค่าที่ต้องการ sanitize
   * @returns {string} - ค่าที่ถูก sanitize แล้ว
   */
  const removeXss = (value) => {
    if (typeof value !== "string") return value;
    let sanitized = value;
    XSS_PATTERNS.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "");
    });
    return sanitized;
  };

  /**
   * Sanitize แบบครบวงจร (รวมทุก pattern)
   * @param {string} value - ค่าที่ต้องการ sanitize
   * @returns {string} - ค่าที่ถูก sanitize แล้ว
   */
  const sanitizeString = (value) => {
    if (typeof value !== "string") return value;
    let sanitized = value;
    sanitized = removeSpecialChars(sanitized);
    sanitized = removeSqlInjection(sanitized);
    sanitized = removeXss(sanitized);
    return sanitized.trim();
  };

  /**
   * Sanitize เฉพาะตัวอักษรพิเศษพื้นฐาน (เบาๆ)
   * สำหรับ field ที่อาจต้องการเก็บ format บางอย่าง
   * @param {string} value - ค่าที่ต้องการ sanitize
   * @returns {string} - ค่าที่ถูก sanitize แล้ว
   */
  const sanitizeLight = (value) => {
    if (typeof value !== "string") return value;
    // ลบเฉพาะตัวอักษรอันตราย: < > " ' ` \
    return value.replace(/[<>"'`\\]/g, "").trim();
  };

  /**
   * Sanitize สำหรับ field เบอร์โทรศัพท์
   * อนุญาตเฉพาะตัวเลข, +, -, และช่องว่าง
   * @param {string} value - เบอร์โทรศัพท์
   * @returns {string} - เบอร์โทรศัพท์ที่ถูก sanitize
   */
  const sanitizePhone = (value) => {
    if (typeof value !== "string") return value;
    return value.replace(/[^\d+\-\s]/g, "").trim();
  };

  /**
   * Sanitize สำหรับ field อีเมล
   * อนุญาตเฉพาะตัวอักษรที่ valid สำหรับ email
   * @param {string} value - อีเมล
   * @returns {string} - อีเมลที่ถูก sanitize
   */
  const sanitizeEmail = (value) => {
    if (typeof value !== "string") return value;
    return value
      .replace(/[^a-zA-Z0-9@._+-]/g, "")
      .trim()
      .toLowerCase();
  };

  /**
   * Sanitize สำหรับ field ชื่อ/นามสกุล
   * อนุญาตเฉพาะตัวอักษรไทย, อังกฤษ, ช่องว่าง, และ . -
   * @param {string} value - ชื่อ
   * @returns {string} - ชื่อที่ถูก sanitize
   */
  const sanitizeName = (value) => {
    if (typeof value !== "string") return value;
    // อนุญาต: ก-๙ (Thai), a-zA-Z (English), space, . -
    return value.replace(/[^\u0E00-\u0E7Fa-zA-Z\s.\-]/g, "").trim();
  };

  /**
   * Sanitize สำหรับ field ที่อยู่
   * อนุญาตตัวอักษรไทย, อังกฤษ, ตัวเลข, และเครื่องหมายพื้นฐาน
   * @param {string} value - ที่อยู่
   * @returns {string} - ที่อยู่ที่ถูก sanitize
   */
  const sanitizeAddress = (value) => {
    if (typeof value !== "string") return value;
    // อนุญาต: ก-๙ (Thai), a-zA-Z (English), numbers, space, / . - , ()
    return value.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s\/.\-,()]/g, "").trim();
  };

  /**
   * Sanitize ทั้ง object (สำหรับ form data)
   * @param {Object} data - Object ที่ต้องการ sanitize
   * @param {Object} options - ตัวเลือกสำหรับ field เฉพาะ
   * @returns {Object} - Object ที่ถูก sanitize แล้ว
   */
  const sanitizeFormData = (data, options = {}) => {
    if (!data || typeof data !== "object") return data;

    const {
      phoneFields = ["cus_tel", "cus_mobile", "cus_fax"],
      emailFields = ["cus_email"],
      nameFields = ["cus_name", "cus_f_name", "cus_l_name", "cus_contact_name"],
      addressFields = ["cus_address", "cus_address_detail"],
      skipFields = ["cus_id", "cus_bt_id", "created_at", "updated_at"],
    } = options;

    const sanitized = { ...data };

    Object.keys(sanitized).forEach((key) => {
      const value = sanitized[key];

      // Skip fields ที่ไม่ต้อง sanitize
      if (skipFields.includes(key)) return;

      // Skip ถ้าไม่ใช่ string
      if (typeof value !== "string") return;

      // Apply sanitization ตาม field type
      if (phoneFields.includes(key)) {
        sanitized[key] = sanitizePhone(value);
      } else if (emailFields.includes(key)) {
        sanitized[key] = sanitizeEmail(value);
      } else if (nameFields.includes(key)) {
        sanitized[key] = sanitizeName(value);
      } else if (addressFields.includes(key)) {
        sanitized[key] = sanitizeAddress(value);
      } else {
        // Default: ใช้ sanitizeString
        sanitized[key] = sanitizeString(value);
      }
    });

    return sanitized;
  };

  return {
    // Basic sanitization
    removeSpecialChars,
    removeSqlInjection,
    removeXss,
    sanitizeString,
    sanitizeLight,

    // Field-specific sanitization
    sanitizePhone,
    sanitizeEmail,
    sanitizeName,
    sanitizeAddress,

    // Form-level sanitization
    sanitizeFormData,
  };
};
