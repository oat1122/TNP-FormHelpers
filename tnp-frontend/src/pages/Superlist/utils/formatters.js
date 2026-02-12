/**
 * Format price with currency
 * @param {number} price - Price to format
 * @param {string} currency - Currency code (default: THB)
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = "THB") => {
  if (!price) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(price);
};

/**
 * Format number with comma separators
 * @param {number|string} val - Value to format
 * @returns {string} Formatted number with commas
 */
export const formatWithCommas = (val) => {
  if (val === "" || val == null) return "";
  const num = String(val);
  const parts = num.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

/**
 * Remove commas from number string
 * @param {string} val - Value with commas
 * @returns {string} Value without commas
 */
export const stripCommas = (val) => String(val).replace(/,/g, "");
