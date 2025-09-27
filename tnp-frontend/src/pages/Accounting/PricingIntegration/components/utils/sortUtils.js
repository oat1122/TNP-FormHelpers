// Utility functions for sorting and organizing Pricing Integration components

/**
 * Try to parse a date-like value safely
 */
const parseDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Extract a sortable token from pr_no like "P2025-05-0023" to compare by year-month-seq
 */
const prNoToSortable = (prNo) => {
  if (typeof prNo !== "string") return null;
  // Expect formats like PYYYY-MM-#### or PR-YYYY-MM-####
  const numeric = prNo.replace(/[^0-9]/g, "");
  return numeric.length ? numeric : null;
};

/**
 * Sort pricing requests by latest first.
 * Priority: created_at -> pr_created_date -> updated_at -> pr_no token -> fallback original order
 */
export const sortPricingRequestsByLatest = (requests = []) => {
  // Clone to avoid mutating caller data
  const arr = [...(requests || [])];

  return arr.sort((a, b) => {
    const aCreated =
      parseDate(a?.created_at) || parseDate(a?.pr_created_date) || parseDate(a?.updated_at);
    const bCreated =
      parseDate(b?.created_at) || parseDate(b?.pr_created_date) || parseDate(b?.updated_at);
    if (aCreated && bCreated) return bCreated - aCreated; // newest first
    if (aCreated) return -1;
    if (bCreated) return 1;

    const aToken = prNoToSortable(a?.pr_no || a?.pr_number);
    const bToken = prNoToSortable(b?.pr_no || b?.pr_number);
    if (aToken && bToken) return bToken.localeCompare(aToken, "en");
    if (aToken) return -1;
    if (bToken) return 1;

    return 0; // keep relative order
  });
};

export default {
  sortPricingRequestsByLatest,
};
