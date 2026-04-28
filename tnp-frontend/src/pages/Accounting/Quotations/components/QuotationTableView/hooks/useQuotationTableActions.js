import { useCallback, useMemo } from "react";

import { useGetCompaniesQuery } from "../../../../../../features/Accounting/accountingApi";

// Provides company-name lookup + memoised getter for the table header chip.
// Action callbacks are passed straight through props in the row — no wrapping
// needed here, just keeps the shell lean.
export function useQuotationTableActions() {
  const { data: companiesResp } = useGetCompaniesQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  const companies = useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);

  const getCompanyName = useCallback(
    (companyId) => {
      const c = companies.find((entry) => entry.id === companyId);
      return c?.short_code || c?.name || "-";
    },
    [companies]
  );

  return { getCompanyName };
}
