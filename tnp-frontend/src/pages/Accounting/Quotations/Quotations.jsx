import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import accountingTheme from '../theme/accountingTheme';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { th } from 'date-fns/locale';
import {
  Box,
  Container,
  Grid,
  Paper,
  Alert,
} from '@mui/material';
import Header from '../PricingIntegration/components/Header';
import FilterSection from '../PricingIntegration/components/FilterSection';
import PaginationSection from '../PricingIntegration/components/PaginationSection';
import LoadingState from '../PricingIntegration/components/LoadingState';
import ErrorState from '../PricingIntegration/components/ErrorState';
import EmptyState from '../PricingIntegration/components/EmptyState';
import {
  useGetQuotationsQuery,
  useApproveQuotationMutation,
  useRejectQuotationMutation,
  useSendBackQuotationMutation,
  useGenerateQuotationPDFMutation,
  useMarkQuotationSentMutation,
  useUploadQuotationEvidenceMutation,
  useSubmitQuotationMutation,
} from '../../../features/Accounting/accountingApi';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../features/Accounting/accountingSlice';
import QuotationCard from './components/QuotationCard';
import ApprovalPanel from './components/ApprovalPanel';
import LinkedPricingDialog from './components/LinkedPricingDialog';
import usePagination from './hooks/usePagination';

const statusOrder = ['draft','pending_review','approved','sent','completed','rejected'];

const Quotations = () => {
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [linkedOpen, setLinkedOpen] = useState(false);

  const { data, error, isLoading, isFetching, refetch } = useGetQuotationsQuery({
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    date_from: dateRange.start || undefined,
    date_to: dateRange.end || undefined,
    page: 1,
    per_page: 1000,
  });

  const quotations = useMemo(() => {
    const arr = data?.data?.data || data?.data || [];
    // sort by status then created_at desc if available
    return [...arr].sort((a,b) => {
      const si = statusOrder.indexOf(a.status); const sj = statusOrder.indexOf(b.status);
      if (si !== sj) return si - sj;
      const aT = new Date(a.created_at || 0).getTime();
      const bT = new Date(b.created_at || 0).getTime();
      return bT - aT;
    });
  }, [data]);

  const { pageData: paginated, info: paginationInfo, total } = usePagination(quotations, currentPage, itemsPerPage);

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
      dispatch(addNotification({ type: 'success', title: 'อนุมัติแล้ว', message: 'เอกสารถูกอนุมัติ' }));
      refetch();
    } catch (e) {
      dispatch(addNotification({ type: 'error', title: 'ไม่สำเร็จ', message: e?.data?.message || e.message }));
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await rejectQuotation({ id, reason }).unwrap();
      dispatch(addNotification({ type: 'success', title: 'ปฏิเสธแล้ว', message: 'ได้ปฏิเสธเอกสาร' }));
      refetch();
    } catch (e) {
      dispatch(addNotification({ type: 'error', title: 'ไม่สำเร็จ', message: e?.data?.message || e.message }));
    }
  };

  const handleSendBack = async (id, reason) => {
    try {
      await sendBackQuotation({ id, reason }).unwrap();
      dispatch(addNotification({ type: 'info', title: 'ส่งกลับแก้ไข', message: 'ส่งกลับให้ฝ่ายขายแก้ไข' }));
      refetch();
    } catch (e) {
      dispatch(addNotification({ type: 'error', title: 'ไม่สำเร็จ', message: e?.data?.message || e.message }));
    }
  };

  const handleMarkSent = async (id, payload) => {
    try {
      await markSent({ id, ...payload }).unwrap();
      dispatch(addNotification({ type: 'success', title: 'บันทึกการส่งแล้ว', message: 'เปลี่ยนสถานะเป็น sent' }));
      refetch();
    } catch (e) {
      dispatch(addNotification({ type: 'error', title: 'ไม่สำเร็จ', message: e?.data?.message || e.message }));
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      const res = await generatePDF(id).unwrap();
      const url = res?.data?.pdf_url || res?.pdf_url;
      if (url) window.open(url, '_blank');
      else throw new Error('ไม่พบไฟล์ PDF');
    } catch (e) {
      dispatch(addNotification({ type: 'error', title: 'ดาวน์โหลดไม่ได้', message: e?.data?.message || e.message }));
    }
  };

  const handleUploadEvidence = async (id, files, description) => {
    try {
      await uploadEvidence({ id, files, description }).unwrap();
      dispatch(addNotification({ type: 'success', title: 'อัปโหลดสำเร็จ', message: 'แนบหลักฐานเรียบร้อย' }));
      refetch();
    } catch (e) {
      dispatch(addNotification({ type: 'error', title: 'อัปโหลดไม่สำเร็จ', message: e?.data?.message || e.message }));
    }
  };

  const handleSubmitForReview = async (id) => {
    try {
      await submitQuotation(id).unwrap();
      dispatch(addNotification({ type: 'success', title: 'ส่งตรวจสอบแล้ว', message: 'สถานะเปลี่ยนเป็นรอตรวจสอบ' }));
      refetch();
    } catch (e) {
      dispatch(addNotification({ type: 'error', title: 'ส่งตรวจสอบไม่สำเร็จ', message: e?.data?.message || e.message }));
    }
  };

  const handleRefresh = useCallback(() => refetch(), [refetch]);
  const handleResetFilters = () => {
    setSearchQuery('');
    setDateRange({ start: null, end: null });
    setStatusFilter('all');
  };

  useEffect(() => {
    // auto select first pending_review for quick approval UX
    if (!selectedQuotation && quotations.length) {
      const target = quotations.find(q => q.status === 'pending_review') || quotations[0];
      setSelectedQuotation(target);
    }
  }, [quotations, selectedQuotation]);

  return (
    <ThemeProvider theme={accountingTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
          <Header title="ใบเสนอราคา" subtitle="ตรวจสอบ อนุมัติ และจัดการเอกสาร" />

          <Container maxWidth="xl" sx={{ py: 4 }}>
            <FilterSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onRefresh={handleRefresh}
              onResetFilters={handleResetFilters}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>โหลดข้อมูลไม่สำเร็จ: {error.message}</Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={7} lg={8}>
                {isLoading ? (
                  <LoadingState itemCount={6} />
                ) : error ? (
                  <ErrorState error={error} onRetry={handleRefresh} />
                ) : quotations.length > 0 ? (
                  <>
                    <Grid container spacing={2}>
                      {paginated.map((q) => (
            <Grid item xs={12} key={q.id}>
                          <QuotationCard
                            data={q}
                            onSelect={() => setSelectedQuotation(q)}
                            onDownloadPDF={() => handleDownloadPDF(q.id)}
              onViewLinked={() => { setSelectedQuotation(q); setLinkedOpen(true); }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                    {paginationInfo.last_page > 1 && (
                      <PaginationSection
                        pagination={paginationInfo}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        isFetching={isFetching}
                        onPageChange={(e, p) => setCurrentPage(p)}
                        onItemsPerPageChange={setItemsPerPage}
                        showHeader={false}
                      />
                    )}
                  </>
                ) : (
                  <EmptyState onRefresh={handleRefresh} />
                )}
              </Grid>

              <Grid item xs={12} md={5} lg={4}>
                <Paper sx={{ p: 2, position: 'sticky', top: 16 }}>
                  <ApprovalPanel
                    quotation={selectedQuotation}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onSendBack={handleSendBack}
                    onMarkSent={handleMarkSent}
                    onDownloadPDF={handleDownloadPDF}
                    onUploadEvidence={handleUploadEvidence}
                    onSubmitForReview={handleSubmitForReview}
                    onOpenLinkedPricing={(id) => { if (id) { const found = quotations.find((x) => x.id === id); if (found) setSelectedQuotation(found); } setLinkedOpen(true); }}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Container>
          <LinkedPricingDialog open={linkedOpen} onClose={() => setLinkedOpen(false)} quotationId={selectedQuotation?.id} />
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default Quotations;
