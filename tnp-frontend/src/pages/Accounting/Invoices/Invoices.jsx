import React, { useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import accountingTheme from '../theme/accountingTheme';
import { Box, Container, Grid, Alert } from '@mui/material';
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
} from '../../../features/Accounting/accountingApi';
import InvoiceCreateDialog from './components/InvoiceCreateDialog';

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
          onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
          onRefresh={() => refetch()}
          onResetFilters={() => { setSearchQuery(''); setCurrentPage(1); setItemsPerPage(20); }}
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
                      onViewDetail={() => {
                        const prId = q.primary_pricing_request_id || (Array.isArray(q.primary_pricing_request_ids) ? q.primary_pricing_request_ids[0] : undefined);
                        const url = prId ? `/pricing/view/${encodeURIComponent(prId)}` : '/accounting/quotations';
                        window.open(url, '_blank');
                      }}
                      onCreateInvoice={() => { setSelectedQuotation(q); setCreateDialogOpen(true); }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
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
