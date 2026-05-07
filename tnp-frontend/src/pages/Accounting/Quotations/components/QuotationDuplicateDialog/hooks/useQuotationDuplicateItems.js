import { useEffect, useMemo } from "react";

import { useGetBulkPricingRequestAutofillQuery } from "../../../../../../features/Accounting/accountingApi";
import { useQuotationGroups } from "../../shared/hooks/useQuotationGroups";
import {
  getAllPrIdsFromQuotation,
  normalizeAndGroupItems,
} from "../../shared/utils/quotationUtils";

/**
 * Items + autofill + grouping bundle for QuotationDuplicateDialog (Phase 3).
 *
 * Pulls 4 concerns out of the main dialog file into one focused hook:
 *   1. Extract PR IDs from source quotation
 *   2. Normalize + group items from source
 *   3. Fetch bulk autofill (PR pricing data) via RTK Query
 *   4. Build editable groups state via useQuotationGroups
 *
 * Returns everything sections need to render the items table + autofill UI:
 *   - items, groups, groupHandlers (for PRGroupsSection)
 *   - prAutofillMap (for autofill chips)
 *   - prIdsAll (for caller to gate render — e.g. "no items" empty state)
 *   - isAutofillLoading (for loading screen)
 *
 * Side effect: forces edit mode on the underlying useQuotationGroups instance
 * once dialog opens (duplicate is always-edit — no view mode toggle).
 */
export function useQuotationDuplicateItems({ q, open }) {
  const prIdsAll = useMemo(() => getAllPrIdsFromQuotation(q), [q]);
  const items = useMemo(() => normalizeAndGroupItems(q, prIdsAll), [q, prIdsAll]);

  const { data: bulkAutofillData, isLoading: isAutofillLoading } =
    useGetBulkPricingRequestAutofillQuery(prIdsAll, {
      skip: !open || prIdsAll.length === 0,
    });

  const prAutofillMap = useMemo(() => {
    const map = new Map();
    (bulkAutofillData?.data || []).forEach((item) => {
      const key = item.pr_id || item.id;
      if (key) map.set(key, item);
    });
    return map;
  }, [bulkAutofillData]);

  const groupsLogic = useQuotationGroups(items);
  const { groups, setIsEditing, ...groupHandlers } = groupsLogic;

  // Duplicate dialog is always in edit mode — force it once groups are ready.
  useEffect(() => {
    if (open) setIsEditing(true);
  }, [open, setIsEditing]);

  return {
    prIdsAll,
    items,
    groups,
    groupHandlers,
    prAutofillMap,
    isAutofillLoading,
  };
}
