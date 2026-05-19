import { useMemo } from "react";

import {
  useGetCompaniesQuery,
  useGetInvoiceQuery,
  useUpdateInvoiceMutation,
  useGenerateInvoicePDFMutation,
} from "../../../../../../features/Accounting/accountingApi";

/**
 * รวม RTK Query hooks ทั้งหมดที่ InvoiceDetailDialog ใช้ +
 * memoize derived collections (companies, invoice).
 *
 * แยกออกจาก shell เพื่อให้ shell ดูเหมือน orchestration list ไม่ใช่ "init dump".
 */
export function useInvoiceDetailQueries({ open, invoiceId }) {
  const { data, isLoading, error } = useGetInvoiceQuery(invoiceId, {
    skip: !open || !invoiceId,
  });
  const [updateInvoice, { isLoading: isSaving }] = useUpdateInvoiceMutation();
  const [generateInvoicePDF, { isLoading: isGeneratingPdf }] = useGenerateInvoicePDFMutation();
  const { data: companiesResp, isLoading: loadingCompanies } = useGetCompaniesQuery();

  const companies = useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);

  const invoice = useMemo(() => data?.data || data || {}, [data]);

  return {
    invoice,
    isLoading,
    error,
    updateInvoice,
    isSaving,
    generateInvoicePDF,
    isGeneratingPdf,
    companies,
    loadingCompanies,
  };
}
