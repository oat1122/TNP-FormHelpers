import { useCallback, useMemo } from "react";

import {
  useGetCompaniesQuery,
  useUpdateInvoiceMutation,
} from "../../../../../../features/Accounting/accountingApi";

/**
 * Manages the company-selector dropdown shown when invoice is in draft state.
 * Skips companies query unless user can approve and side is draft.
 */
export const useInvoiceCardCompany = ({ invoice, canUserApprove, activeSideStatus, onUpdateCompany }) => {
  const { data: companiesResp, isLoading: loadingCompanies } = useGetCompaniesQuery(undefined, {
    refetchOnMountOrArgChange: false,
    skip: !canUserApprove || activeSideStatus !== "draft",
  });
  const [updateInvoice, { isLoading: updatingCompany }] = useUpdateInvoiceMutation();

  const companies = useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);

  const currentCompany = companies.find((c) => c.id === invoice?.company_id) || null;

  const handleCompanyChange = useCallback(
    async (newCompanyId) => {
      if (!newCompanyId || updatingCompany) return;
      try {
        if (onUpdateCompany) {
          await onUpdateCompany(invoice.id, newCompanyId);
        } else {
          await updateInvoice({ id: invoice.id, company_id: newCompanyId }).unwrap();
        }
      } catch (error) {
        console.error("Failed to update company:", error);
      }
    },
    [invoice?.id, onUpdateCompany, updateInvoice, updatingCompany]
  );

  return {
    companies,
    currentCompany,
    loadingCompanies,
    updatingCompany,
    handleCompanyChange,
  };
};
