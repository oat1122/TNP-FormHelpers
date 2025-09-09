import React, { useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import accountingTheme from '../theme/accountingTheme';
import { Box, Container, Grid, Alert, Stack, Button, Chip, Typography, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  Header,
  FilterSection,
  PaginationSection,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../PricingIntegration/components';
import {
  useGetInvoicesQuery,
  useGenerateInvoicePDFMutation,
  useApproveInvoiceMutation,
  useSubmitInvoiceMutation,
} from '../../../features/Accounting/accountingApi';
import InvoiceCreateDialog from './components/InvoiceCreateDialog';
import QuotationSelectionDialog from './components/QuotationSelectionDialog';
import InvoiceCard from './components/InvoiceCard';
import InvoiceDetailDialog from './components/InvoiceDetailDialog';

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [quotationSelectionOpen, setQuotationSelectionOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

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
  const [approveInvoice, { isLoading: approvingId }] = useApproveInvoiceMutation();
  const [submitInvoice, { isLoading: submittingId }] = useSubmitInvoiceMutation();

  const handleSelectQuotation = (quotation) => {
    setSelectedQuotation(quotation);
    setCreateDialogOpen(true);
  };

  const handleCreateInvoiceClick = () => {
    setQuotationSelectionOpen(true);
  };

  const handleInvoiceCreated = () => {
    refetchInvoices();
    setCreateDialogOpen(false);
    setSelectedQuotation(null);
  };

  const handleInvoiceCreateCancel = () => {
    setCreateDialogOpen(false);
    setSelectedQuotation(null);
    // เปิด QuotationSelectionDialog ขึ้นมาใหม่เมื่อผู้ใช้กดปิด
    setQuotationSelectionOpen(true);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoiceId(invoice.id);
    setDetailDialogOpen(true);
  };

  return (
    <ThemeProvider theme={accountingTheme}>
      <Header 
        title="จัดการใบแจ้งหนี้" 
        subtitle="รายการใบแจ้งหนี้ทั้งหมดในระบบ" 
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header with Create Button */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={600}>
            รายการใบแจ้งหนี้
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleCreateInvoiceClick}
            sx={{ px: 3, py: 1.5 }}
          >
            สร้างใบแจ้งหนี้
          </Button>
        </Box>

        <FilterSection
          searchQuery={searchQuery}
          onSearchChange={(v) => { setSearchQuery(v); setInvoicePage(1); }}
          onRefresh={refetchInvoices}
          onResetFilters={() => { 
            setSearchQuery(''); 
            setInvoicePage(1); 
            setInvoicePerPage(20); 
            setInvoiceTypeFilter(''); 
          }}
        />

        {/* Invoice Type Filter */}
        <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap' }}>
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
          <Alert severity="error" sx={{ mb: 2 }}>
            เกิดข้อผิดพลาดในการดึงรายการใบแจ้งหนี้: {invoicesError.message}
          </Alert>
        )}

        {invoicesLoading ? (
          <LoadingState />
        ) : invoices.length === 0 ? (
          <EmptyState title="ไม่พบรายการใบแจ้งหนี้" />
        ) : (
          <>
            <PaginationSection
              title={`รายการใบแจ้งหนี้ (${invoicesTotal})`}
              page={invoicePage}
              perPage={invoicePerPage}
              onPageChange={setInvoicePage}
              onPerPageChange={setInvoicePerPage}
              loading={invoicesFetching}
            />

            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {invoices.map((inv) => (
                  <Grid item xs={12} md={6} lg={4} key={inv.id}>
                    <InvoiceCard
                      invoice={inv}
                      onDownloadPDF={() => generateInvoicePDF(inv.id)}
                      onView={() => handleViewInvoice(inv)}
                      onApprove={async (notes) => {
                        try {
                          if (inv.status === 'draft') await submitInvoice(inv.id).unwrap();
                          await approveInvoice({ id: inv.id, notes }).unwrap();
                          refetchInvoices();
                        } catch (e) {
                          console.error('Approve invoice failed', e);
                        }
                      }}
                      onSubmit={async () => {
                        try {
                          if (inv.status === 'draft') await submitInvoice(inv.id).unwrap();
                          refetchInvoices();
                        } catch (e) {
                          console.error('Submit invoice failed', e);
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </Container>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="สร้างใบแจ้งหนี้"
        onClick={handleCreateInvoiceClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' }, // Show only on mobile
        }}
      >
        <AddIcon />
      </Fab>

      {/* Quotation Selection Dialog */}
      <QuotationSelectionDialog
        open={quotationSelectionOpen}
        onClose={() => setQuotationSelectionOpen(false)}
        onSelectQuotation={handleSelectQuotation}
      />

      {/* Invoice Create Dialog */}
      <InvoiceCreateDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setSelectedQuotation(null);
        }}
        quotationId={selectedQuotation?.id}
        onCreated={handleInvoiceCreated}
        onCancel={handleInvoiceCreateCancel}
      />

      {/* Invoice Detail Dialog */}
      <InvoiceDetailDialog
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedInvoiceId(null);
        }}
        invoiceId={selectedInvoiceId}
      />
    </ThemeProvider>
  );
};

export default Invoices;
