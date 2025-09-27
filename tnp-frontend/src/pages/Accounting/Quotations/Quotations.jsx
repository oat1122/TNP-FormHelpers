import {
  Box,
  Container,
  Grid,
  Alert,
  Button,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Checkbox,
  Paper,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { th } from "date-fns/locale";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

import {
  useGetQuotationsQuery,
  useApproveQuotationMutation,
  useRejectQuotationMutation,
  useSendBackQuotationMutation,
  useGenerateQuotationPDFMutation,
  useMarkQuotationSentMutation,
  useUploadQuotationEvidenceMutation,
  useSubmitQuotationMutation,
} from "../../../features/Accounting/accountingApi";
import { addNotification } from "../../../features/Accounting/accountingSlice";
import {
  Header,
  FilterSection,
  PaginationSection,
  LoadingState,
  ErrorState,
  EmptyState,
  FloatingActionButton,
} from "../PricingIntegration/components";
import accountingTheme from "../theme/accountingTheme";
import CompanyManagerDialog from "./components/CompanyManagerDialog";
import LinkedPricingDialog from "./components/LinkedPricingDialog";
import QuotationCard from "./components/QuotationCard";
// ApprovalPanel removed along with Drawer UI
import QuotationDetailDialog from "./components/QuotationDetailDialog";
import usePagination from "./hooks/usePagination";
import InvoiceCreateDialog from "../Invoices/components/InvoiceCreateDialog";

const statusOrder = ["draft", "pending_review", "approved", "sent", "completed", "rejected"];

const Quotations = () => {
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [signatureOnly, setSignatureOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedQuotation, setSelectedQuotation] = useState(null); // used only for LinkedPricingDialog
  const [linkedOpen, setLinkedOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  const { data, error, isLoading, isFetching, refetch } = useGetQuotationsQuery({
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    signature_uploaded: signatureOnly ? 1 : undefined,
    page: 1,
    per_page: 1000,
  });

  const quotations = useMemo(() => {
    const arr = data?.data?.data || data?.data || [];
    // sort by status then created_at desc if available
    return [...arr].sort((a, b) => {
      const si = statusOrder.indexOf(a.status);
      const sj = statusOrder.indexOf(b.status);
      if (si !== sj) return si - sj;
      const aT = new Date(a.created_at || 0).getTime();
      const bT = new Date(b.created_at || 0).getTime();
      return bT - aT;
    });
  }, [data]);

  // Filter out quotations without any linked pricing request (global filter affects pagination totals)
  const hasPR = useCallback((q) => {
    const set = new Set();
    if (Array.isArray(q?.items))
      q.items.forEach((it) => {
        if (it?.pricing_request_id) set.add(it.pricing_request_id);
      });
    if (q?.primary_pricing_request_id) set.add(q.primary_pricing_request_id);
    if (Array.isArray(q?.primary_pricing_request_ids))
      q.primary_pricing_request_ids.forEach((id) => id && set.add(id));
    return set.size > 0;
  }, []);

  const validQuotations = useMemo(() => quotations.filter(hasPR), [quotations, hasPR]);

  const {
    pageData: paginated,
    info: paginationInfo,
    total,
  } = usePagination(validQuotations, currentPage, itemsPerPage);

  const [approveQuotation] = useApproveQuotationMutation();
  const [rejectQuotation] = useRejectQuotationMutation();
  const [sendBackQuotation] = useSendBackQuotationMutation();
  const [markSent] = useMarkQuotationSentMutation();
  const [generatePDF] = useGenerateQuotationPDFMutation();
  const [uploadEvidence] = useUploadQuotationEvidenceMutation();
  const [submitQuotation] = useSubmitQuotationMutation();

  const handleApprove = async (id, notes) => {
    try {
      await approveQuotation({ id, notes }).unwrap();
      dispatch(
        addNotification({ type: "success", title: "อนุมัติแล้ว", message: "เอกสารถูกอนุมัติ" })
      );
      refetch();
    } catch (e) {
      dispatch(
        addNotification({
          type: "error",
          title: "ไม่สำเร็จ",
          message: e?.data?.message || e.message,
        })
      );
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await rejectQuotation({ id, reason }).unwrap();
      dispatch(
        addNotification({ type: "success", title: "ปฏิเสธแล้ว", message: "ได้ปฏิเสธเอกสาร" })
      );
      refetch();
    } catch (e) {
      dispatch(
        addNotification({
          type: "error",
          title: "ไม่สำเร็จ",
          message: e?.data?.message || e.message,
        })
      );
    }
  };

  const handleSendBack = async (id, reason) => {
    try {
      await sendBackQuotation({ id, reason }).unwrap();
      dispatch(
        addNotification({ type: "info", title: "ส่งกลับแก้ไข", message: "ส่งกลับให้ฝ่ายขายแก้ไข" })
      );
      refetch();
    } catch (e) {
      dispatch(
        addNotification({
          type: "error",
          title: "ไม่สำเร็จ",
          message: e?.data?.message || e.message,
        })
      );
    }
  };

  const handleMarkSent = async (id, payload) => {
    try {
      await markSent({ id, ...payload }).unwrap();
      dispatch(
        addNotification({
          type: "success",
          title: "บันทึกการส่งแล้ว",
          message: "เปลี่ยนสถานะเป็น sent",
        })
      );
      refetch();
    } catch (e) {
      dispatch(
        addNotification({
          type: "error",
          title: "ไม่สำเร็จ",
          message: e?.data?.message || e.message,
        })
      );
    }
  };

  const handleDownloadPDF = async (id) => {
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
  };

  const handleUploadEvidence = async (id, files, description) => {
    try {
      await uploadEvidence({ id, files, description }).unwrap();
      dispatch(
        addNotification({ type: "success", title: "อัปโหลดสำเร็จ", message: "แนบหลักฐานเรียบร้อย" })
      );
      refetch();
    } catch (e) {
      dispatch(
        addNotification({
          type: "error",
          title: "อัปโหลดไม่สำเร็จ",
          message: e?.data?.message || e.message,
        })
      );
    }
  };

  const handleSubmitForReview = async (id) => {
    try {
      await submitQuotation(id).unwrap();
      dispatch(
        addNotification({
          type: "success",
          title: "ส่งตรวจสอบแล้ว",
          message: "สถานะเปลี่ยนเป็นรอตรวจสอบ",
        })
      );
      refetch();
    } catch (e) {
      dispatch(
        addNotification({
          type: "error",
          title: "ส่งตรวจสอบไม่สำเร็จ",
          message: e?.data?.message || e.message,
        })
      );
    }
  };

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
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSignatureOnly(false);
  };

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((e, p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleItemsPerPageChange = useCallback((val) => {
    setItemsPerPage(val);
    setCurrentPage(1);
  }, []);

  // Removed auto-selection effect since Drawer has been removed

  // Ensure current page stays within bounds after filtering or per-page changes
  useEffect(() => {
    if (paginationInfo && currentPage > paginationInfo.last_page) {
      setCurrentPage(paginationInfo.last_page || 1);
    }
  }, [paginationInfo?.last_page]);

  return (
    <ThemeProvider theme={accountingTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
          <Header title="ใบเสนอราคา" subtitle="ตรวจสอบ อนุมัติ และจัดการเอกสาร" />

          <Container maxWidth="xl" sx={{ py: 4 }}>
            <FilterSection
              searchQuery={searchQuery}
              onSearchChange={handleSearch}
              onRefresh={handleRefresh}
              onResetFilters={handleResetFilters}
            />

            {/* Extra filters: status + signature evidence */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" sx={{ minWidth: 56 }}>
                      สถานะ
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      color="primary"
                      value={statusFilter}
                      onChange={(e, val) => {
                        if (val) setStatusFilter(val);
                      }}
                    >
                      <ToggleButton value="all">ทั้งหมด</ToggleButton>
                      <ToggleButton value="draft">กำลังรอดำเนินการ</ToggleButton>
                      <ToggleButton value="approved">อนุมัติแล้ว</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={signatureOnly}
                        onChange={(e) => setSignatureOnly(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="แสดงเฉพาะใบที่มีหลักฐานการเซ็นแล้ว"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* 🔐 Access Control Information */}
            {(() => {
              const userData = JSON.parse(localStorage.getItem("userData") || "{}");
              const isAdmin = userData.user_id === 1;
              const canManageCompanies = userData.role === "admin" || userData.role === "account";
              return (
                <>
                  {!isAdmin && (
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }} icon={<span>🔐</span>}>
                      <strong>การแบ่งสิทธิ์การเข้าถึง:</strong>{" "}
                      คุณสามารถดูข้อมูลใบเสนอราคาได้เฉพาะลูกค้าที่คุณดูแลเท่านั้น
                      {userData.username && (
                        <Box
                          component="span"
                          sx={{ ml: 1, color: "info.dark", fontWeight: "medium" }}
                        >
                          (ผู้ใช้: {userData.username})
                        </Box>
                      )}
                    </Alert>
                  )}
                  {canManageCompanies && (
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setCompanyDialogOpen(true)}
                      >
                        จัดการบริษัท
                      </Button>
                    </Box>
                  )}
                </>
              );
            })()}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                โหลดข้อมูลไม่สำเร็จ: {error.message}
              </Alert>
            )}

            {/* Pagination Section (Top) */}
            <PaginationSection
              title="ใบเสนอราคาทั้งหมด"
              pagination={paginationInfo}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              isFetching={isFetching}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />

            <Grid container spacing={3}>
              {isLoading ? (
                <Grid item xs={12}>
                  <LoadingState itemCount={6} />
                </Grid>
              ) : error ? (
                <Grid item xs={12}>
                  <ErrorState error={error} onRetry={handleRefresh} />
                </Grid>
              ) : validQuotations.length > 0 ? (
                <>
                  {(paginated || []).map((q) => (
                    <Grid item xs={12} sm={6} lg={4} key={q.id}>
                      <QuotationCard
                        data={q}
                        onDownloadPDF={() => handleDownloadPDF(q.id)}
                        onViewLinked={() => {
                          setSelectedQuotation(q);
                          setLinkedOpen(true);
                        }}
                        onViewDetail={() => {
                          setSelectedQuotation(q);
                          setDetailOpen(true);
                        }}
                        onCreateInvoice={() => {
                          setSelectedQuotation(q);
                          setCreateInvoiceOpen(true);
                        }}
                      />
                    </Grid>
                  ))}
                  {paginationInfo.last_page > 1 && (
                    <Grid item xs={12}>
                      <PaginationSection
                        title="ใบเสนอราคาทั้งหมด"
                        pagination={paginationInfo}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        isFetching={isFetching}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        showHeader={false}
                      />
                    </Grid>
                  )}
                </>
              ) : (
                <Grid item xs={12}>
                  <EmptyState onRefresh={handleRefresh} />
                </Grid>
              )}
            </Grid>
          </Container>
          <LinkedPricingDialog
            open={linkedOpen}
            onClose={() => setLinkedOpen(false)}
            quotationId={selectedQuotation?.id}
          />
          <QuotationDetailDialog
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            quotationId={selectedQuotation?.id}
          />
          <CompanyManagerDialog
            open={companyDialogOpen}
            onClose={() => setCompanyDialogOpen(false)}
          />
          <InvoiceCreateDialog
            open={createInvoiceOpen}
            onClose={() => setCreateInvoiceOpen(false)}
            quotationId={selectedQuotation?.id}
          />
          {/* Floating Action Button */}
          <FloatingActionButton onRefresh={handleRefresh} />
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default Quotations;
