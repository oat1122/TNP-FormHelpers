import AddIcon from "@mui/icons-material/Add";
import { Alert, Box, Fab, Grid } from "@mui/material";

import InvoiceCard from "./InvoiceCard";
import InvoiceCreateDialog from "./InvoiceCreateDialog";
import InvoiceDetailDialog from "./InvoiceDetailDialog";
import InvoicesControlsBar from "./InvoicesControlsBar";
import InvoiceTableView from "./InvoiceTableView";
import QuotationSelectionDialog from "./QuotationSelectionDialog";
import { InvoiceTableSkeleton } from "../../components/SkeletonLoaders";
import { EmptyState, LoadingState, PaginationSection } from "../../PricingIntegration/components";
import CompanyManagerDialog from "../../Quotations/components/CompanyManagerDialog";
import { AdvancedFilter } from "../../shared/components";

const InvoicesView = ({ page, onGoToQuotation }) => {
  const {
    filters,
    handlers,
    statusBeforeOptions,
    statusAfterOptions,
    invoices,
    total,
    isLoading,
    isFetching,
    error,
    page: pageNum,
    perPage,
    setPage,
    setPerPage,
    viewMode,
    setViewMode,
    canManageInvoices,
    createDialogOpen,
    quotationSelectionOpen,
    selectedQuotation,
    detailDialogOpen,
    selectedInvoiceId,
    companyDialogOpen,
    openQuotationSelection,
    closeQuotationSelection,
    handleSelectQuotation,
    handleInvoiceCreated,
    handleInvoiceCreateCancel,
    closeCreateDialog,
    handleViewInvoice,
    handleCloseInvoiceDetail,
    openCompanyDialog,
    closeCompanyDialog,
    handleRefresh,
    onApproveInvoiceCard,
    onSubmitInvoiceCard,
    handleDownloadPDF,
    handlePreviewPDF,
  } = page;

  return (
    <>
      <InvoicesControlsBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        canManageInvoices={canManageInvoices}
        onOpenCompanyDialog={openCompanyDialog}
        onCreateInvoice={openQuotationSelection}
      />

      <AdvancedFilter
        filters={filters}
        handlers={handlers}
        onRefresh={handleRefresh}
        statusBeforeOptions={statusBeforeOptions}
        statusAfterOptions={statusAfterOptions}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          เกิดข้อผิดพลาดในการดึงรายการใบแจ้งหนี้: {error.message}
        </Alert>
      )}

      {isLoading ? (
        viewMode === "table" ? (
          <InvoiceTableSkeleton />
        ) : (
          <LoadingState />
        )
      ) : invoices.length === 0 ? (
        <EmptyState title="ไม่พบรายการใบแจ้งหนี้" />
      ) : (
        <>
          <PaginationSection
            title={`รายการใบแจ้งหนี้ (${total})`}
            page={pageNum}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            loading={isFetching}
          />

          <Box sx={{ mt: 2 }}>
            {viewMode === "table" ? (
              <InvoiceTableView
                data={invoices}
                onViewDetail={handleViewInvoice}
                onPreviewPDF={handlePreviewPDF}
                onGoToQuotation={onGoToQuotation}
                onActionSuccess={handleRefresh}
              />
            ) : (
              <Grid container spacing={2}>
                {invoices.map((inv) => (
                  <Grid item xs={12} md={6} lg={4} key={inv.id}>
                    <InvoiceCard
                      invoice={inv}
                      onDownloadPDF={handleDownloadPDF}
                      onPreviewPDF={handlePreviewPDF}
                      onView={() => handleViewInvoice(inv)}
                      onApprove={(notes) => onApproveInvoiceCard(inv, notes)}
                      onSubmit={() => onSubmitInvoiceCard(inv)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </>
      )}

      {canManageInvoices && (
        <Fab
          color="primary"
          aria-label="สร้างใบแจ้งหนี้"
          onClick={openQuotationSelection}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            display: { xs: "flex", md: "none" },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <QuotationSelectionDialog
        open={quotationSelectionOpen}
        onClose={closeQuotationSelection}
        onSelectQuotation={handleSelectQuotation}
      />

      <InvoiceCreateDialog
        open={createDialogOpen}
        onClose={closeCreateDialog}
        quotationId={selectedQuotation?.id}
        onCreated={handleInvoiceCreated}
        onCancel={handleInvoiceCreateCancel}
      />

      <InvoiceDetailDialog
        open={detailDialogOpen}
        onClose={handleCloseInvoiceDetail}
        invoiceId={selectedInvoiceId}
      />

      <CompanyManagerDialog open={companyDialogOpen} onClose={closeCompanyDialog} />
    </>
  );
};

export default InvoicesView;
