import AddIcon from "@mui/icons-material/Add";
import { Box, Container, Grid, Alert, Stack, Button, Chip, Typography, Fab } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import React, { useMemo, useState } from "react";

import {
  Header,
  FilterSection,
  PaginationSection,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../PricingIntegration/components";
import { AdvancedFilter, useAdvancedFilter } from "../shared/components";
import accountingTheme from "../theme/accountingTheme";
import InvoiceCard from "./components/InvoiceCard";
import InvoiceCreateDialog from "./components/InvoiceCreateDialog";
import InvoiceDetailDialog from "./components/InvoiceDetailDialog";
import QuotationSelectionDialog from "./components/QuotationSelectionDialog";
import { apiConfig } from "../../../api/apiConfig";
import {
  useGetInvoicesQuery,
  useGenerateInvoicePDFMutation,
  useApproveInvoiceMutation,
  useSubmitInvoiceMutation,
} from "../../../features/Accounting/accountingApi";
import CompanyManagerDialog from "../Quotations/components/CompanyManagerDialog";

const Invoices = () => {
  // Define status options for invoices
  const invoiceStatusOptions = [
    { value: "draft", label: "แบบร่าง" },
    { value: "approved", label: "อนุมัติแล้ว" },
  ];

  // Use the new filter hook
  const { filters, handlers, getQueryArgs } = useAdvancedFilter();

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

  // Multi-header PDF generation handler
  const handleDownloadMultiHeader = async ({ invoiceId, headerTypes }) => {
    try {
      if (!invoiceId || !Array.isArray(headerTypes) || headerTypes.length === 0) return;
      const data = await generateInvoicePDF({ id: invoiceId, headerTypes }).unwrap();
      if (data.mode === "single" && data.pdf_url) {
        const a = document.createElement("a");
        a.href = data.pdf_url;
        a.download = data.filename || "invoice.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else if (data.mode === "zip" && data.zip_url) {
        const a = document.createElement("a");
        a.href = data.zip_url;
        a.download = data.zip_filename || "invoices.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else if (data.pdf_url) {
        const a = document.createElement("a");
        a.href = data.pdf_url;
        a.download = data.filename || "invoice.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        console.warn("Unexpected generateInvoicePDF response", data);
      }
    } catch (e) {
      console.error("Multi-header download failed", e);
    }
  };

  // Mode-aware PDF preview handler - using direct fetch to avoid Redux serialization issues
  const handlePreviewPDF = async ({ invoiceId, mode }) => {
    try {
      if (!invoiceId) return;

      // Build URL with mode parameter
      const url = `${apiConfig.baseUrl}/invoices/${invoiceId}/pdf/preview?mode=${mode || "before"}`;

      // Get auth token from localStorage (same logic as apiConfig)
      const authToken = localStorage.getItem("authToken");
      const token = localStorage.getItem("token");
      const finalToken = authToken || token;

      if (!finalToken) {
        throw new Error("No authentication token found");
      }

      // Direct fetch to avoid storing Blob in Redux
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${finalToken}`,
          Accept: "application/pdf",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Convert to blob and open in new tab
      const blob = await response.blob();
      if (blob.type === "application/pdf") {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, "_blank");
        // Clean up the object URL after some delay
        setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
      } else {
        console.error("Unexpected response type for PDF preview:", blob.type);
      }
    } catch (e) {
      console.error("PDF preview failed", e);
    }
  };

  // Mode-aware PDF download handler with multi-header support - using direct fetch
  const handleDownloadPDF = async ({ invoiceId, headerTypes, mode }) => {
    try {
      if (!invoiceId || !Array.isArray(headerTypes) || headerTypes.length === 0) return;

      // Build URL with mode and headers
      const params = new URLSearchParams();
      params.append("mode", mode || "before");
      if (headerTypes.length > 0) {
        headerTypes.forEach((header) => params.append("headerTypes[]", header));
      }

      const url = `${apiConfig.baseUrl}/invoices/${invoiceId}/pdf/download?${params.toString()}`;

      // Get auth token (same logic as apiConfig)
      const authToken = localStorage.getItem("authToken");
      const token = localStorage.getItem("token");
      const finalToken = authToken || token;

      if (!finalToken) {
        throw new Error("No authentication token found");
      }

      // Direct fetch to avoid storing Blob in Redux
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${finalToken}`,
          Accept: "application/pdf, application/zip, application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/pdf") || contentType.includes("application/zip")) {
        // Handle binary response (PDF or ZIP)
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;

        // Determine filename based on content type and mode
        if (contentType.includes("application/zip")) {
          a.download = `invoices-${mode}-${Date.now()}.zip`;
        } else {
          a.download = `invoice-${mode}-${invoiceId}.pdf`;
        }

        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } else if (contentType.includes("application/json")) {
        // Handle JSON response (legacy format)
        const data = await response.json();

        if (data.mode === "single" && data.pdf_url) {
          const a = document.createElement("a");
          a.href = data.pdf_url;
          a.download = data.filename || `invoice-${mode}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else if (data.mode === "zip" && data.zip_url) {
          const a = document.createElement("a");
          a.href = data.zip_url;
          a.download = data.zip_filename || `invoices-${mode}.zip`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else if (data.pdf_url) {
          const a = document.createElement("a");
          a.href = data.pdf_url;
          a.download = data.filename || `invoice-${mode}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          console.warn("Unexpected download response", data);
        }
      } else {
        console.error("Unexpected content type:", contentType);
      }
    } catch (e) {
      console.error("Mode-aware PDF download failed", e);
    }
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
          statusOptions={invoiceStatusOptions}
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
                        try {
                          if (inv.status === "draft") await submitInvoice(inv.id).unwrap();
                          await approveInvoice({ id: inv.id, notes }).unwrap();
                          // RTK Query จะ invalidate cache อัตโนมัติแล้ว ไม่ต้อง refetch
                        } catch (e) {
                          console.error("Approve invoice failed", e);
                        }
                      }}
                      onSubmit={async () => {
                        try {
                          if (inv.status === "draft") await submitInvoice(inv.id).unwrap();
                          // RTK Query จะ invalidate cache อัตโนมัติแล้ว ไม่ต้อง refetch
                        } catch (e) {
                          console.error("Submit invoice failed", e);
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
