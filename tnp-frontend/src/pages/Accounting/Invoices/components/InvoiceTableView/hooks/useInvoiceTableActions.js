import { useCallback, useMemo } from "react";

import { useGetCompaniesQuery } from "../../../../../../features/Accounting/accountingApi";

// Mirror useQuotationTableActions — ดึง company name สำหรับ chip ใน table
export function useInvoiceTableActions() {
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
