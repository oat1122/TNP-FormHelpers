// Re-export shim — canonical implementation lives in components/shared/hooks/
// Keeps backward-compat for callers that import from this path (e.g. InvoiceCreateDialog).
export { useQuotationGroups } from "../components/shared/hooks/useQuotationGroups";
