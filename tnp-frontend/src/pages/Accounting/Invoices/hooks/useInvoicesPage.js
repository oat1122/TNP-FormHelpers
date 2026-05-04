import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useGetInvoicesQuery } from "../../../../features/Accounting/accountingApi";
import { useInvoiceActions } from "../../../../hooks/Accounting/useInvoiceActions";
import { useAdvancedFilter } from "../../shared/components";
import { useCurrentUser } from "../../shared/hooks/useCurrentUser";

const statusBeforeOptions = [
  { value: "draft", label: "แบบร่าง" },
  { value: "approved", label: "อนุมัติแล้ว" },
];

const statusAfterOptions = [
  { value: "draft", label: "แบบร่าง" },
  { value: "approved", label: "อนุมัติแล้ว" },
];

const VIEW_MODE_STORAGE_KEY = "invoicesViewMode";
const readPersistedViewMode = () => {
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "card" || stored === "table" ? stored : "table";
  } catch {
    return "table";
  }
};

export const useInvoicesPage = ({ enabled = true } = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedInvoiceFromUrl = searchParams.get("selected");

  const { filters, handlers, getQueryArgs } = useAdvancedFilter();
  const { handleSubmit, handleSubmitAndApprove, handleDownloadPDF, handlePreviewPDF } =
    useInvoiceActions();

  const { currentUser, isAdmin } = useCurrentUser();
  const isAccount = currentUser?.role === "account";
  const canManageInvoices = isAdmin || isAccount || currentUser?.user_id === 1;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [quotationSelectionOpen, setQuotationSelectionOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [viewMode, setViewModeState] = useState(readPersistedViewMode);

  const setViewMode = useCallback((next) => {
    if (next !== "table" && next !== "card") return;
    setViewModeState(next);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
    } catch {
      // ignore quota
    }
  }, []);

  const {
    data: invoicesResp,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetInvoicesQuery(
    {
      ...getQueryArgs(),
      page,
      per_page: perPage,
    },
    { skip: !enabled }
  );

  const invoices = useMemo(() => {
    const arr = invoicesResp?.data?.data || invoicesResp?.data || [];
    return Array.isArray(arr) ? arr : [];
  }, [invoicesResp]);

  const total = invoicesResp?.data?.total || invoices.length;

  const handleSelectQuotation = useCallback((quotation) => {
    setSelectedQuotation(quotation);
    setCreateDialogOpen(true);
  }, []);

  const openQuotationSelection = useCallback(() => {
    setQuotationSelectionOpen(true);
  }, []);

  const closeQuotationSelection = useCallback(() => {
    setQuotationSelectionOpen(false);
  }, []);

  const handleInvoiceCreated = useCallback(() => {
    setCreateDialogOpen(false);
    setSelectedQuotation(null);
  }, []);

  const handleInvoiceCreateCancel = useCallback(() => {
    setCreateDialogOpen(false);
    setSelectedQuotation(null);
    setQuotationSelectionOpen(true);
  }, []);

  const closeCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
    setSelectedQuotation(null);
  }, []);

  const handleViewInvoice = useCallback((invoice) => {
    setSelectedInvoiceId(invoice.id);
    setDetailDialogOpen(true);
  }, []);

  const openInvoiceDetail = useCallback((invoiceId) => {
    if (!invoiceId) return;
    setSelectedInvoiceId(invoiceId);
    setDetailDialogOpen(true);
  }, []);

  const handleCloseInvoiceDetail = useCallback(() => {
    setDetailDialogOpen(false);
    setSelectedInvoiceId(null);

    if (searchParams.has("selected")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("selected");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const openCompanyDialog = useCallback(() => setCompanyDialogOpen(true), []);
  const closeCompanyDialog = useCallback(() => setCompanyDialogOpen(false), []);

  const onApproveInvoiceCard = useCallback(
    async (invoice, notes) => {
      await handleSubmitAndApprove(invoice, notes);
    },
    [handleSubmitAndApprove]
  );

  const onSubmitInvoiceCard = useCallback(
    async (invoice) => {
      await handleSubmit(invoice.id);
    },
    [handleSubmit]
  );

  useEffect(() => {
    if (!enabled) return;
    if (!selectedInvoiceFromUrl || selectedInvoiceFromUrl === selectedInvoiceId) return;

    setSelectedInvoiceId(selectedInvoiceFromUrl);
    setDetailDialogOpen(true);
  }, [enabled, selectedInvoiceFromUrl, selectedInvoiceId]);

  return {
    // Filter
    filters,
    handlers,
    statusBeforeOptions,
    statusAfterOptions,
    // Data
    invoices,
    total,
    isLoading,
    isFetching,
    error,
    // Pagination
    page,
    perPage,
    setPage,
    setPerPage,
    // View
    viewMode,
    setViewMode,
    // Permission
    canManageInvoices,
    // Dialog state
    createDialogOpen,
    quotationSelectionOpen,
    selectedQuotation,
    detailDialogOpen,
    selectedInvoiceId,
    companyDialogOpen,
    // Handlers
    openQuotationSelection,
    closeQuotationSelection,
    handleSelectQuotation,
    handleInvoiceCreated,
    handleInvoiceCreateCancel,
    closeCreateDialog,
    handleViewInvoice,
    openInvoiceDetail,
    handleCloseInvoiceDetail,
    openCompanyDialog,
    closeCompanyDialog,
    handleRefresh,
    // Card actions (for InvoiceCard)
    onApproveInvoiceCard,
    onSubmitInvoiceCard,
    handleDownloadPDF,
    handlePreviewPDF,
  };
};
