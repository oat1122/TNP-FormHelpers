// 📁utils/formatters.js

// Format Thai Baht currency
export function formatTHB(amount) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(amount || 0).replace('฿', ''); // Often, we just want the number
}

// Format date in Thai format
export function formatDateTH(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}