import { useMemo, useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

import { usePagination } from "./usePagination";
import {
  useGetQuotationsQuery,
  useGenerateQuotationPDFMutation,
  useLazyGetQuotationDuplicateDataQuery,
  useLazyGetQuotationRelatedInvoicesQuery,
} from "../../../../features/Accounting/accountingApi";
import { addNotification } from "../../../../features/Accounting/accountingSlice";
import { PERFORMANCE_CONFIG } from "../../config/performanceConfig";
import { useAdvancedFilter } from "../../shared/components";

const statusOrder = ["draft", "pending_review", "approved", "sent", "completed", "rejected"];

// intentional: fetch all + paginate client-side. Server-side pagination ticket แยก (Non-Goal §6)
const CLIENT_SIDE_FETCH_LIMIT = 1000;

const quotationStatusOptions = [
  { value: "draft", label: "แบบร่าง" },
  { value: "approved", label: "อนุมัติแล้ว" },
];

export const useQuotationsPage = ({ enabled = true } = {}) => {
  const dispatch = useDispatch();
  const { filters, handlers, getQueryArgs } = useAdvancedFilter();

  const [viewMode, setViewMode] = useState("table");
  const [signatureOnly, setSignatureOnly] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(PERFORMANCE_CONFIG.DEFAULT_PAGE_SIZE);

  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [linkedOpen, setLinkedOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [standaloneCreateOpen, setStandaloneCreateOpen] = useState(false);

  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);

  // Edit-mode state — reuses same QuotationDuplicateDialog with mode="edit"
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editQuotationId, setEditQuotationId] = useState(null);

  const [lastSavedId, setLastSavedId] = useState(null);

  const { data, error, isLoading, isFetching, refetch } = useGetQuotationsQuery(
    {
      ...getQueryArgs(),
      signature_uploaded: signatureOnly ? 1 : undefined,
      only_mine: showOnlyMine ? 1 : undefined,
      page: 1,
      per_page: CLIENT_SIDE_FETCH_LIMIT,
    },
    { skip: !enabled }
  );
  const [generatePDF] = useGenerateQuotationPDFMutation();
  const [triggerGetDuplicateData] = useLazyGetQuotationDuplicateDataQuery();
  const [triggerGetRelatedInvoices] = useLazyGetQuotationRelatedInvoicesQuery();

  const quotations = useMemo(() => {
    const arr = data?.data?.data || data?.data || [];
    return [...arr].sort((a, b) => {
      const si = statusOrder.indexOf(a.status);
      const sj = statusOrder.indexOf(b.status);
      if (si !== sj) return si - sj;
      const aT = new Date(a.created_at || 0).getTime();
      const bT = new Date(b.created_at || 0).getTime();
      return bT - aT;
    });
  }, [data]);

  const { pageData: paginated, info: paginationInfo } = usePagination(
    quotations,
    currentPage,
    itemsPerPage
  );

  const handleDownloadPDF = useCallback(
    async (id) => {
      try {
        const res = await generatePDF({ id, format: "A4", orientation: "P" }).unwrap();
        const url = res?.data?.pdf_url || res?.pdf_url;
        if (url) window.open(url, "_blank");
        else throw new Error("ไม่พบไฟล์ PDF");
      } catch (e) {
        dispatch(
          addNotification({
            type: "error",
            title: "ดาวน์โหลดไม่ได้",
            message: e?.data?.message || e.message,
          })
        );
      }
    },
    [generatePDF, dispatch]
  );

  const handleDuplicate = useCallback(
    async (quotationId) => {
      try {
        const result = await triggerGetDuplicateData(quotationId).unwrap();
        setDuplicateData(result.data);
        setDuplicateOpen(true);
      } catch (err) {
        if (import.meta.env.DEV) console.error("Failed to get duplicate data", err);
        dispatch(
          addNotification({
            type: "error",
            title: "ไม่สามารถทำสำเนาได้",
            message: err?.data?.message || err.message || "เกิดข้อผิดพลาด",
          })
        );
      }
    },
    [triggerGetDuplicateData, dispatch]
  );

  const handleCloseDuplicateDialog = useCallback(() => {
    setDuplicateOpen(false);
    setDuplicateData(null);
  }, []);

  const handleSaveDuplicateSuccess = useCallback(() => {
    refetch();
    dispatch(
      addNotification({
        type: "success",
        title: "สร้างสำเร็จ",
        message: "สร้างใบเสนอราคา (สำเนา) เรียบร้อยแล้ว",
      })
    );
  }, [refetch, dispatch]);

  // Edit flow (Edit-Phase 4):
  // 1. Check related invoices first — if any → block edit (toast warning)
  // 2. Otherwise → fetch duplicate-data (same shape) → open dialog with mode="edit"
  const handleEdit = useCallback(
    async (quotationId) => {
      try {
        const relRes = await triggerGetRelatedInvoices(quotationId).unwrap();
        const list = relRes?.data?.data || relRes?.data || [];
        const hasInvoices = Array.isArray(list) && list.length > 0;
        if (hasInvoices) {
          dispatch(
            addNotification({
              type: "error",
              title: "ไม่สามารถแก้ไขได้",
              message:
                "ใบเสนอราคานี้มีใบแจ้งหนี้ที่อ้างอิงอยู่แล้ว — แก้ไขจะกระทบใบแจ้งหนี้ที่ออกไปแล้ว",
            })
          );
          return;
        }

        // edit flow needs signatures preserved (duplicate flow clears them by default)
        const result = await triggerGetDuplicateData({
          id: quotationId,
          preserveSignatures: true,
        }).unwrap();
        setEditData(result.data);
        setEditQuotationId(quotationId);
        setEditOpen(true);
      } catch (err) {
        if (import.meta.env.DEV) console.error("Failed to open edit dialog", err);
        dispatch(
          addNotification({
            type: "error",
            title: "ไม่สามารถเปิดหน้าต่างแก้ไขได้",
            message: err?.data?.message || err.message || "เกิดข้อผิดพลาด",
          })
        );
      }
    },
    [triggerGetRelatedInvoices, triggerGetDuplicateData, dispatch]
  );

  const handleCloseEditDialog = useCallback(() => {
    setEditOpen(false);
    setEditData(null);
    setEditQuotationId(null);
  }, []);

  const handleSaveEditSuccess = useCallback(() => {
    refetch();
    dispatch(
      addNotification({
        type: "success",
        title: "บันทึกสำเร็จ",
        message: "บันทึกใบเสนอราคาเรียบร้อยแล้ว",
      })
    );
  }, [refetch, dispatch]);

  // Refresh editData snapshot + list after a signature is uploaded inside the
  // edit dialog. Local optimistic state in EvidenceSection updates the gallery
  // immediately; this refetch keeps the row's signature_image_url in sync so
  // the "create invoice" button enables without closing the dialog.
  const handleSignatureUploaded = useCallback(
    async (updatedSignatures) => {
      refetch();
      if (editQuotationId) {
        try {
          const result = await triggerGetDuplicateData({
            id: editQuotationId,
            preserveSignatures: true,
          }).unwrap();
          setEditData(result.data);
        } catch (err) {
          if (import.meta.env.DEV) console.error("Failed to refresh edit data", err);
        }
      }
      // Keep the linter happy — accept arg even if unused (response data already
      // applied locally inside EvidenceSection)
      void updatedSignatures;
    },
    [refetch, editQuotationId, triggerGetDuplicateData]
  );

  const handleRefresh = useCallback(() => {
    refetch();
    dispatch(
      addNotification({
        type: "success",
        title: "รีเฟรชข้อมูล",
        message: "ข้อมูลถูกอัปเดตแล้ว",
      })
    );
  }, [refetch, dispatch]);

  const handleCardActionSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePageChange = useCallback((e, p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleItemsPerPageChange = useCallback((val) => {
    setItemsPerPage(val);
    setCurrentPage(1);
  }, []);

  const handleCloseDetailDialog = useCallback(() => {
    setDetailOpen(false);
    if (lastSavedId) {
      refetch();
      setLastSavedId(null);
    }
  }, [lastSavedId, refetch]);

  const openQuotationDetail = useCallback((quotationId) => {
    if (!quotationId) return;
    setSelectedQuotation({ id: quotationId });
    setDetailOpen(true);
  }, []);

  const handleDetailSaveSuccess = useCallback(() => {
    setLastSavedId(selectedQuotation?.id || null);
  }, [selectedQuotation]);

  const handleStandaloneCreateSuccess = useCallback(
    (quotation) => {
      setLastSavedId(quotation.id);
      refetch();
      dispatch(
        addNotification({
          type: "success",
          message: `สร้างใบเสนอราคา ${quotation.number} สำเร็จ`,
        })
      );
    },
    [refetch, dispatch]
  );

  useEffect(() => {
    if (paginationInfo && currentPage > paginationInfo.last_page) {
      setCurrentPage(paginationInfo.last_page || 1);
    }
  }, [currentPage, paginationInfo]);

  return {
    // Filters
    filters,
    handlers,
    statusOptions: quotationStatusOptions,
    // View toggles
    viewMode,
    setViewMode,
    signatureOnly,
    setSignatureOnly,
    showOnlyMine,
    setShowOnlyMine,
    // Pagination
    currentPage,
    itemsPerPage,
    paginated,
    paginationInfo,
    handlePageChange,
    handleItemsPerPageChange,
    // Query state
    isLoading,
    isFetching,
    error,
    quotationsCount: quotations.length,
    // Selection
    selectedQuotation,
    setSelectedQuotation,
    // Dialogs
    linkedOpen,
    setLinkedOpen,
    detailOpen,
    setDetailOpen,
    createInvoiceOpen,
    setCreateInvoiceOpen,
    companyDialogOpen,
    setCompanyDialogOpen,
    standaloneCreateOpen,
    setStandaloneCreateOpen,
    // Duplicate
    duplicateOpen,
    duplicateData,
    handleCloseDuplicateDialog,
    handleSaveDuplicateSuccess,
    // Edit (reuses QuotationDuplicateDialog with mode="edit")
    editOpen,
    editData,
    editQuotationId,
    handleEdit,
    handleCloseEditDialog,
    handleSaveEditSuccess,
    handleSignatureUploaded,
    // Handlers
    handleDownloadPDF,
    handleDuplicate,
    handleRefresh,
    handleCardActionSuccess,
    handleCloseDetailDialog,
    openQuotationDetail,
    handleDetailSaveSuccess,
    handleStandaloneCreateSuccess,
    // Company filter pass-through (for standalone dialog)
    companyId: filters.company,
  };
};
