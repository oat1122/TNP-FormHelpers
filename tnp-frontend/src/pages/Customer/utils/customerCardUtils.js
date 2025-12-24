/**
 * DataDisplay Color Scheme
 * สีสำหรับ Customer Card และ DataDisplay components
 */
export const datadisplayColors = {
  // Primary brand colors
  primary: "#9e0000",
  primaryHover: "#b71c1c",
  primaryLight: "rgba(158, 0, 0, 0.08)",
  primaryBorder: "rgba(158, 0, 0, 0.2)",
  primaryDivider: "rgba(158, 0, 0, 0.13)",

  // Secondary colors
  secondary: "#d32f2f",
  secondaryLight: "rgba(211, 47, 47, 0.1)",

  // Card styling
  card: {
    background: "#fffaf9",
    border: "#9e0000",
    shadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    hoverShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
  },

  // Status colors for recall
  status: {
    success: {
      color: "#2e7d32",
      background: "rgba(46, 125, 50, 0.1)",
      border: "rgba(46, 125, 50, 0.3)",
    },
    warning: {
      color: "#ed6c02",
      background: "rgba(237, 108, 2, 0.1)",
      border: "rgba(237, 108, 2, 0.3)",
    },
    error: {
      color: "#d32f2f",
      background: "rgba(211, 47, 47, 0.1)",
      border: "rgba(211, 47, 47, 0.3)",
    },
    default: {
      color: "rgba(0, 0, 0, 0.6)",
      background: "rgba(0, 0, 0, 0.04)",
      border: "rgba(0, 0, 0, 0.12)",
    },
  },

  // Text colors
  text: {
    primary: "rgba(0, 0, 0, 0.87)",
    secondary: "rgba(0, 0, 0, 0.6)",
    disabled: "rgba(0, 0, 0, 0.38)",
  },

  // Avatar
  avatar: {
    background: "#9e0000",
    text: "#ffffff",
  },

  // Icon styling
  icon: {
    primary: "#9e0000",
    action: "#ffffff",
  },
};

/**
 * คำนวณวันที่เปรียบเทียบกับวันนี้ (สำหรับ recall date)
 * @param {string|Object} dateString - Date string หรือ object ที่มี date property
 * @returns {number} จำนวนวันจากวันนี้ (บวก = อนาคต, ลบ = เลย)
 */
export const safeFormatCustomRelativeTime = (dateString) => {
  try {
    if (!dateString) return 0;

    // Handle object case
    let dateValue = dateString;
    if (typeof dateString === "object") {
      dateValue = dateString?.date || dateString?.datetime || dateString?.last_datetime || null;
    }

    if (!dateValue) return 0;

    const recallDate = new Date(dateValue);
    const today = new Date();

    // Reset time to start of day
    recallDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = recallDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.warn("Error calculating relative time:", error);
    return 0;
  }
};

/**
 * Parse full address string to parts
 * @param {string} fullAddress - ที่อยู่เต็ม
 * @returns {Object} Object ที่มี address, subdistrict, district, province, zipCode
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
    const parts = fullAddress.trim().split(" ");
    const zipCode = parts[parts.length - 1];
    const isZipCode = /^\d{5}$/.test(zipCode);

    if (isZipCode) {
      const addressParts = parts.slice(0, -1);
      const province = addressParts[addressParts.length - 1] || "";
      const district = addressParts[addressParts.length - 2] || "";
      const subdistrict = addressParts[addressParts.length - 3] || "";
      const address = addressParts.slice(0, -3).join(" ") || "";

      return { address, subdistrict, district, province, zipCode };
    }

    return {
      address: fullAddress,
      subdistrict: "",
      district: "",
      province: "",
      zipCode: "",
    };
  } catch (error) {
    console.warn("Error parsing address:", error);
    return {
      address: fullAddress,
      subdistrict: "",
      district: "",
      province: "",
      zipCode: "",
    };
  }
};

/**
 * ย่อชื่อเป็นตัวอักษรย่อสำหรับ Avatar
 * @param {string|Object} name - ชื่อลูกค้า
 * @returns {string} ตัวย่อ 1-2 ตัวอักษร
 */
export const getInitials = (name) => {
  if (!name) return "N/A";

  // Handle object case
  if (typeof name === "object") {
    const nameValue = name?.name || name?.user_name || name?.username || "N/A";
    const words = nameValue.toString().trim().split(" ");
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return words[0].charAt(0).toUpperCase();
  }

  // Handle string case
  const words = name.toString().trim().split(" ");
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return words[0].charAt(0).toUpperCase();
};

/**
 * กำหนดสีและข้อความตาม recall status
 * @param {string} recallDate - วันที่นัด
 * @param {number} daysLeft - จำนวนวันที่เหลือ
 * @returns {Object} { color, text, statusKey }
 */
export const getRecallStatus = (recallDate, daysLeft) => {
  if (!recallDate) return { color: "default", text: "ไม่ได้นัด", statusKey: "default" };

  if (daysLeft === 0) return { color: "warning", text: "นัดวันนี้", statusKey: "warning" };
  if (daysLeft < 0)
    return { color: "error", text: `เกิน ${Math.abs(daysLeft)} วัน`, statusKey: "error" };
  return { color: "success", text: `${daysLeft} วัน`, statusKey: "success" };
};

/**
 * แปลงเกรดแสดงเป็นภาษาไทย
 * @param {string|Object} mcgName - ชื่อกลุ่มลูกค้า
 * @returns {string} เกรดเป็นภาษาไทย
 */
export const getGradeDisplay = (mcgName) => {
  const gradeMapping = {
    A: "เกรด A",
    B: "เกรด B",
    C: "เกรด C",
    D: "เกรด D",
  };

  let groupName = "";
  if (typeof mcgName === "object") {
    groupName = mcgName?.name || mcgName?.group_name || "";
  } else {
    groupName = mcgName || "";
  }

  const grade = groupName.match(/Grade\s*([A-D])/i)?.[1];
  return grade ? gradeMapping[grade.toUpperCase()] : groupName || "ไม่ระบุ";
};

/**
 * Safe value extractor from object or primitive
 * @param {any} value - Value ที่อาจเป็น object หรือ primitive
 * @param {string[]} keys - Keys ที่จะลองเข้าถึงถ้าเป็น object
 * @param {string} fallback - ค่า default ถ้าไม่พบ
 * @returns {string} ค่าที่ extract ได้
 */
export const safeExtractValue = (value, keys = [], fallback = "ไม่ระบุ") => {
  if (!value) return fallback;

  if (typeof value === "object") {
    for (const key of keys) {
      if (value[key]) return value[key];
    }
    return fallback;
  }

  return value.toString();
};

/**
 * Format date to Thai locale
 * @param {string|Object} dateValue - Date value
 * @returns {string} Formatted date string
 */
export const formatThaiDate = (dateValue) => {
  try {
    let date = dateValue;
    if (typeof dateValue === "object") {
      date = dateValue?.date || dateValue?.created_at || new Date().toISOString();
    }
    return new Date(date).toLocaleDateString("th-TH");
  } catch (error) {
    console.warn("Error formatting date:", error);
    return "ไม่ระบุ";
  }
};
