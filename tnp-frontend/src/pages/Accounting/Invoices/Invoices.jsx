import React, { useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import accountingTheme from '../theme/accountingTheme';
import { Box, Container, Grid, Alert, Stack, Button, Chip, Typography } from '@mui/material';
import {
  Header,
  FilterSection,
  PaginationSection,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../PricingIntegration/components';
import QuotationCard from '../Quotations/components/QuotationCard';
import {
  useGetQuotationsAwaitingInvoiceQuery,
  useGenerateQuotationPDFMutation,
  useGetInvoicesQuery,
  useGenerateInvoicePDFMutation,
} from '../../../features/Accounting/accountingApi';
import InvoiceCreateDialog from './components/InvoiceCreateDialog';
import InvoiceCard from './components/InvoiceCard';

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data, error, isLoading, isFetching, refetch } = useGetQuotationsAwaitingInvoiceQuery({
    search: searchQuery || undefined,
    page: currentPage,
    per_page: itemsPerPage,
  });

  const quotations = useMemo(() => {
    const arr = data?.data?.data || data?.data || [];
    return Array.isArray(arr) ? arr : [];
  }, [data]);

  const total = data?.data?.total || quotations.length;
  const [generatePDF] = useGenerateQuotationPDFMutation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  // Invoices: filter + pagination
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('');
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePerPage, setInvoicePerPage] = useState(20);

  const {
    data: invoicesResp,
    error: invoicesError,
    isLoading: invoicesLoading,
    isFetching: invoicesFetching,
    refetch: refetchInvoices,
  } = useGetInvoicesQuery({
    search: searchQuery || undefined,
    page: invoicePage,
    per_page: invoicePerPage,
    type: invoiceTypeFilter || undefined,
  });

  const invoices = useMemo(() => {
    const arr = invoicesResp?.data?.data || invoicesResp?.data || [];
    return Array.isArray(arr) ? arr : [];
  }, [invoicesResp]);

  const invoicesTotal = invoicesResp?.data?.total || invoices.length;
  const [generateInvoicePDF] = useGenerateInvoicePDFMutation();

  const handleDownloadPDF = async (id) => {
    try {
      await generatePDF(id).unwrap();
    } catch (e) {
      console.error('Generate PDF failed', e);
    }
  };

  return (
    <ThemeProvider theme={accountingTheme}>
      <Header title="สร้างใบแจ้งหนี้" subtitle="ใบเสนอราคาที่เซ็นแล้วและพร้อมออกใบแจ้งหนี้" />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <FilterSection
          searchQuery={searchQuery}
          onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); setInvoicePage(1); }}
          onRefresh={() => { refetch(); refetchInvoices(); }}
          onResetFilters={() => { setSearchQuery(''); setCurrentPage(1); setItemsPerPage(20); setInvoicePage(1); setInvoicePerPage(20); setInvoiceTypeFilter(''); }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>เกิดข้อผิดพลาดในการดึงข้อมูล: {error.message}</Alert>
        )}

        {isLoading ? (
          <LoadingState />
        ) : quotations.length === 0 ? (
          <EmptyState title="ยังไม่มีใบเสนอราคาให้สร้างใบแจ้งหนี้" />
        ) : (
          <>
            <PaginationSection
              title={`พร้อมออกใบแจ้งหนี้ (${total})`}
              page={currentPage}
              perPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onPerPageChange={setItemsPerPage}
              loading={isFetching}
            />

            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {quotations.map((q) => (
                  <Grid item xs={12} md={6} lg={4} key={q.id}>
                    <QuotationCard
                      data={q}
                      onDownloadPDF={() => handleDownloadPDF(q.id)}
                      onViewDetail={() => { setSelectedQuotation(q); setCreateDialogOpen(true); }}
                      onCreateInvoice={() => { setSelectedQuotation(q); setCreateDialogOpen(true); }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
        {/* Invoices List Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>รายการใบแจ้งหนี้</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {[
              { value: '', label: 'ทั้งหมด' },
              { value: 'full_amount', label: 'เต็มจำนวน' },
              { value: 'remaining', label: 'ยอดคงเหลือ (หักมัดจำ)' },
              { value: 'deposit', label: 'มัดจำ' },
              { value: 'partial', label: 'บางส่วน (กำหนดเอง)' },
            ].map((opt) => (
              <Button
                key={opt.value || 'all'}
                size="small"
                variant={(invoiceTypeFilter === opt.value) ? 'contained' : 'outlined'}
                onClick={() => { setInvoiceTypeFilter(opt.value); setInvoicePage(1); }}
              >
                {opt.label}
              </Button>
            ))}
          </Stack>

          {invoicesError && (
            <Alert severity="error" sx={{ mb: 2 }}>เกิดข้อผิดพลาดในการดึงรายการใบแจ้งหนี้: {invoicesError.message}</Alert>
          )}

          {invoicesLoading ? (
            <LoadingState />
          ) : invoices.length === 0 ? (
            <EmptyState title="ไม่พบรายการใบแจ้งหนี้" />
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1">ทั้งหมด</Typography>
                  <Chip label={invoicesTotal} color="secondary" size="small" />
                </Stack>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  {invoices.map((inv) => (
                    <Grid item xs={12} md={6} lg={4} key={inv.id}>
                      <InvoiceCard
                        invoice={inv}
                        onDownloadPDF={() => generateInvoicePDF(inv.id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </>
          )}
        </Box>
      </Container>
      <InvoiceCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        quotationId={selectedQuotation?.id}
        onCreated={() => refetch()}
      />
    </ThemeProvider>
  );
};

export default Invoices;
