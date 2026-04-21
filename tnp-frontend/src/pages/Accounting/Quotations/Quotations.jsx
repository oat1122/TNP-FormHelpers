import { Alert, Box, Container, Grid } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { th } from "date-fns/locale";

import {
  CompanyManagerDialog,
  LinkedPricingDialog,
  QuotationCard,
  QuotationControlsBar,
  QuotationDetailDialog,
  QuotationDuplicateDialog,
  QuotationStandaloneCreateDialog,
  QuotationTableView,
} from "./components";
import { QuotationListSkeleton, QuotationTableSkeleton } from "../components/SkeletonLoaders";
import InvoiceCreateDialog from "../Invoices/components/InvoiceCreateDialog";
import {
  EmptyState,
  ErrorState,
  FloatingActionButton,
  Header,
  PaginationSection,
} from "../PricingIntegration/components";
import { AdvancedFilter } from "../shared/components";
import accountingTheme from "../theme/accountingTheme";
import { useQuotationsPage } from "./hooks/useQuotationsPage";

const Quotations = () => {
  const page = useQuotationsPage();

  const openDetail = (q) => {
    page.setSelectedQuotation(q);
    page.setDetailOpen(true);
  };
  const openLinked = (q) => {
    page.setSelectedQuotation(q);
    page.setLinkedOpen(true);
  };
  const openCreateInvoice = (q) => {
    page.setSelectedQuotation(q);
    page.setCreateInvoiceOpen(true);
  };

  return (
    <ThemeProvider theme={accountingTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
          <Header title="ใบเสนอราคา" subtitle="ตรวจสอบ อนุมัติ และจัดการเอกสาร" />

          <Container
            maxWidth={page.viewMode === "table" ? false : "xl"}
            sx={{ py: 4, px: page.viewMode === "table" ? { xs: 2, md: 3, lg: 4 } : undefined }}
          >
            <AdvancedFilter
              filters={page.filters}
              handlers={page.handlers}
              onRefresh={page.handleRefresh}
              statusOptions={page.statusOptions}
            />

            <QuotationControlsBar
              showOnlyMine={page.showOnlyMine}
              onShowOnlyMineChange={page.setShowOnlyMine}
              signatureOnly={page.signatureOnly}
              onSignatureOnlyChange={page.setSignatureOnly}
              viewMode={page.viewMode}
              onViewModeChange={page.setViewMode}
              onOpenCompanyDialog={() => page.setCompanyDialogOpen(true)}
              onOpenStandaloneCreate={() => page.setStandaloneCreateOpen(true)}
            />

            {page.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                โหลดข้อมูลไม่สำเร็จ: {page.error.message}
              </Alert>
            )}

            <PaginationSection
              title="ใบเสนอราคาทั้งหมด"
              pagination={page.paginationInfo}
              currentPage={page.currentPage}
              itemsPerPage={page.itemsPerPage}
              isFetching={page.isFetching}
              onPageChange={page.handlePageChange}
              onItemsPerPageChange={page.handleItemsPerPageChange}
            />

            {page.isLoading ? (
              page.viewMode === "table" ? (
                <QuotationTableSkeleton />
              ) : (
                <QuotationListSkeleton />
              )
            ) : page.error ? (
              <ErrorState error={page.error} onRetry={page.handleRefresh} />
            ) : page.quotationsCount > 0 ? (
              <>
                {page.viewMode === "table" ? (
                  <QuotationTableView
                    data={page.paginated || []}
                    onViewDetail={openDetail}
                    onDownloadPDF={page.handleDownloadPDF}
                    onDuplicate={page.handleDuplicate}
                    onCreateInvoice={openCreateInvoice}
                    onActionSuccess={page.handleCardActionSuccess}
                  />
                ) : (
                  <Grid container spacing={3}>
                    {(page.paginated || []).map((q) => (
                      <Grid item xs={12} sm={6} lg={4} key={q.id}>
                        <QuotationCard
                          data={q}
                          onDownloadPDF={() => page.handleDownloadPDF(q.id)}
                          onViewLinked={() => openLinked(q)}
                          onViewDetail={() => openDetail(q)}
                          onCreateInvoice={() => openCreateInvoice(q)}
                          onDuplicate={() => page.handleDuplicate(q.id)}
                          onActionSuccess={page.handleCardActionSuccess}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}

                {page.paginationInfo.last_page > 1 && (
                  <Box sx={{ mt: 2 }}>
                    <PaginationSection
                      title="ใบเสนอราคาทั้งหมด"
                      pagination={page.paginationInfo}
                      currentPage={page.currentPage}
                      itemsPerPage={page.itemsPerPage}
                      isFetching={page.isFetching}
                      onPageChange={page.handlePageChange}
                      onItemsPerPageChange={page.handleItemsPerPageChange}
                      showHeader={false}
                    />
                  </Box>
                )}
              </>
            ) : (
              <EmptyState onRefresh={page.handleRefresh} />
            )}
          </Container>

          <LinkedPricingDialog
            open={page.linkedOpen}
            onClose={() => page.setLinkedOpen(false)}
            quotationId={page.selectedQuotation?.id}
          />
          <QuotationDetailDialog
            open={page.detailOpen}
            onClose={page.handleCloseDetailDialog}
            quotationId={page.selectedQuotation?.id}
            onSaveSuccess={page.handleDetailSaveSuccess}
          />
          <CompanyManagerDialog
            open={page.companyDialogOpen}
            onClose={() => page.setCompanyDialogOpen(false)}
          />
          <InvoiceCreateDialog
            open={page.createInvoiceOpen}
            onClose={() => page.setCreateInvoiceOpen(false)}
            quotationId={page.selectedQuotation?.id}
          />
          <QuotationStandaloneCreateDialog
            open={page.standaloneCreateOpen}
            onClose={() => page.setStandaloneCreateOpen(false)}
            onSuccess={page.handleStandaloneCreateSuccess}
            companyId={page.companyId}
          />
          {page.duplicateOpen && page.duplicateData && (
            <QuotationDuplicateDialog
              open={page.duplicateOpen}
              onClose={page.handleCloseDuplicateDialog}
              initialData={page.duplicateData}
              onSaveSuccess={page.handleSaveDuplicateSuccess}
            />
          )}

          <FloatingActionButton onRefresh={page.handleRefresh} />
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default Quotations;
