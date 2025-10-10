import AddIcon from "@mui/icons-material/Add";
import { Box, Container, Grid, Alert, Stack, Button, Chip, Typography, Fab } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import React, { useMemo, useState } from "react";

import {
  Header,
  PaginationSection,
  LoadingState,
  EmptyState,
} from "../PricingIntegration/components";
import { AdvancedFilter, useAdvancedFilter } from "../shared/components";
import accountingTheme from "../theme/accountingTheme";
import InvoiceCard from "./components/InvoiceCard";
import InvoiceCreateDialog from "./components/InvoiceCreateDialog";
import InvoiceDetailDialog from "./components/InvoiceDetailDialog";
import QuotationSelectionDialog from "./components/QuotationSelectionDialog";
import { useInvoiceActions } from "../../../hooks/Accounting/useInvoiceActions";
import { useGetInvoicesQuery } from "../../../features/Accounting/accountingApi";
import CompanyManagerDialog from "../Quotations/components/CompanyManagerDialog";

const Invoices = () => {
  // Define status options for invoices
  // Define options for status before/after deposit
  const statusBeforeOptions = [
    { value: "draft", label: "แบบร่าง" },
    { value: "approved", label: "อนุมัติแล้ว" },
  ];

  const statusAfterOptions = [
    { value: "draft", label: "แบบร่าง" },
    { value: "approved", label: "อนุมัติแล้ว" },
  ];

  // Use the new filter hook
  const { filters, handlers, getQueryArgs } = useAdvancedFilter();

  // Use Invoice Actions hook
  const {
    handleApprove,
    handleSubmit,
    handleSubmitAndApprove,
    handleDownloadPDF,
    handlePreviewPDF,
    handleDownloadMultiHeader,
  } = useInvoiceActions();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [quotationSelectionOpen, setQuotationSelectionOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  // Invoices: filter + pagination
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState("");
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePerPage, setInvoicePerPage] = useState(20);

  const {
    data: invoicesResp,
    error: invoicesError,
    isLoading: invoicesLoading,
    isFetching: invoicesFetching,
    refetch: refetchInvoices,
  } = useGetInvoicesQuery({
    ...getQueryArgs(),
    page: invoicePage,
    per_page: invoicePerPage,
    type: invoiceTypeFilter || undefined,
  });

  const invoices = useMemo(() => {
    const arr = invoicesResp?.data?.data || invoicesResp?.data || [];
    return Array.isArray(arr) ? arr : [];
  }, [invoicesResp]);

  const invoicesTotal = invoicesResp?.data?.total || invoices.length;

  const handleSelectQuotation = (quotation) => {
    setSelectedQuotation(quotation);
    setCreateDialogOpen(true);
  };

  const handleCreateInvoiceClick = () => {
    setQuotationSelectionOpen(true);
  };

  const handleInvoiceCreated = () => {
    // RTK Query จะ invalidate cache อัตโนมัติแล้ว ไม่ต้อง refetch
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
      <Header title="จัดการใบแจ้งหนี้" subtitle="รายการใบแจ้งหนี้ทั้งหมดในระบบ" />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header with Create Button */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={600}>
            รายการใบแจ้งหนี้
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button variant="outlined" size="small" onClick={() => setCompanyDialogOpen(true)}>
              จัดการบริษัท
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={handleCreateInvoiceClick}
              sx={{ px: 3, py: 1.5 }}
            >
              สร้างใบแจ้งหนี้
            </Button>
          </Stack>
        </Box>

        {/* AdvancedFilter Component */}
        <AdvancedFilter
          filters={filters}
          handlers={handlers}
          onRefresh={() => {
            setInvoicePage(1);
            refetchInvoices();
          }}
          statusBeforeOptions={statusBeforeOptions}
          statusAfterOptions={statusAfterOptions}
        />

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
                      onDownloadPDF={handleDownloadPDF}
                      onPreviewPDF={handlePreviewPDF}
                      onView={() => handleViewInvoice(inv)}
                      onApprove={async (notes) => {
                        await handleSubmitAndApprove(inv, notes);
                      }}
                      onSubmit={async () => {
                        await handleSubmit(inv.id);
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
          position: "fixed",
          bottom: 24,
          right: 24,
          display: { xs: "flex", md: "none" }, // Show only on mobile
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

      {/* Company Manager Dialog */}
      <CompanyManagerDialog open={companyDialogOpen} onClose={() => setCompanyDialogOpen(false)} />
    </ThemeProvider>
  );
};

export default Invoices;
