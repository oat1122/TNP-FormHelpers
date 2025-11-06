// Helper for currency formatting
export const formatTHB = (value) => {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

// Helper for sanitizing decimal input
export const sanitizeDecimal = (value) => {
  if (value == null || value === "") return "";
  let str = String(value).replace(/[^0-9.]/g, "");
  const parts = str.split(".");
  if (parts.length > 2) {
    str = parts[0] + "." + parts.slice(1).join("");
  }
  return str;
};

// Helper for sanitizing integer input
export const sanitizeInt = (value) => {
  if (value == null || value === "") return "";
  return String(value).replace(/[^0-9]/g, "");
};
