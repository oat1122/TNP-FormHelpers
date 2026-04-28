import { useCallback, useMemo, useState } from "react";

import { useGetQuotationRelatedInvoicesQuery } from "../../../../../../features/Accounting/accountingApi";
import { useCurrentUser } from "../../../../shared/hooks/useCurrentUser";

const EDITABLE_ROLES = ["admin", "account"];
const UPLOAD_ROLES = ["admin", "account", "sale"];

const emptyPermissionError = { open: false, message: "", invoices: [] };

// Resolve user role + related-invoice state into the permissions QuotationDetailDialog needs.
export function useQuotationEditPermission(quotationId, open) {
  const { currentUser } = useCurrentUser();
  const role = currentUser?.role;

  const { data: relatedInvoicesData } = useGetQuotationRelatedInvoicesQuery(quotationId, {
    skip: !open || !quotationId,
  });

  const canEdit = useMemo(() => {
    const hasInvoices = relatedInvoicesData?.has_invoices || false;
    if (EDITABLE_ROLES.includes(role)) return true;
    if (role === "sale") return !hasInvoices;
    return false;
  }, [role, relatedInvoicesData?.has_invoices]);

  const canUploadSignatures = UPLOAD_ROLES.includes(role);
  const canUploadSampleImages = UPLOAD_ROLES.includes(role);

  const [permissionError, setPermissionError] = useState(emptyPermissionError);
  const clearPermissionError = useCallback(() => setPermissionError(emptyPermissionError), []);

  return {
    role,
    canEdit,
    canUploadSignatures,
    canUploadSampleImages,
    relatedInvoices: relatedInvoicesData,
    permissionError,
    setPermissionError,
    clearPermissionError,
  };
}
