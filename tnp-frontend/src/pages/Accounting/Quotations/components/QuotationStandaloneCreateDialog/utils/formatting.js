// Re-export sanitizers from the shared source of truth to avoid drift.
export { sanitizeInt, sanitizeDecimal } from "../../../../shared/inputSanitizers";

// Helper for currency formatting (kept local — only used inside QuotationStandaloneCreateDialog).
export const formatTHB = (value) => {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};
