// 📁utils/sanitizers.js

// Sanitize integer input
export const sanitizeInt = (value) => {
  if (value == null || value === "") return "";
  return String(value).replace(/[^0-9]/g, "");
};

// Sanitize decimal input
export const sanitizeDecimal = (value) => {
  if (value == null || value === "") return "";
  let str = String(value).replace(/[^0-9.]/g, "");
  // Ensure only one decimal point
  const parts = str.split(".");
  if (parts.length > 2) {
    str = parts[0] + "." + parts.slice(1).join("");
  }
  return str;
};