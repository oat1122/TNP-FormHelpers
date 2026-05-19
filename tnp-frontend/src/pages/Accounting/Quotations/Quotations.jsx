import { Alert, Box, CircularProgress, Container, Grid, Stack } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { th } from "date-fns/locale";
import { lazy, Suspense, useEffect, useRef } from "react";

import {
  DocumentTypeSelector,
  QuotationCard,
  QuotationControlsBar,
  QuotationTableView,
} from "./components";
import { useLazyGetQuotationRelatedInvoicesQuery } from "../../../features/Accounting/accountingApi";
import { QuotationListSkeleton, QuotationTableSkeleton } from "../components/SkeletonLoaders";
import { useDocumentMode } from "./hooks/useDocumentMode";
import InvoiceCreateDialog from "../Invoices/components/InvoiceCreateDialog";
import InvoicesView from "../Invoices/components/InvoicesView";
import {
  EmptyState,
  ErrorState,
  FloatingActionButton,
  Header,
  PaginationSection,
} from "../PricingIntegration/components";
import { AdvancedFilter } from "../shared/components";
import { useCurrentUser } from "../shared/hooks/useCurrentUser";
import accountingTheme from "../theme/accountingTheme";
import { useQuotationsPage } from "./hooks/useQuotationsPage";
import { useInvoicesPage } from "../Invoices/hooks/useInvoicesPage";

// 🔄 Lazy-load heavy dialogs ที่ render เฉพาะตอน user click
// (rule: tnp-frontend/.claude/rules/performance.md — "Component หนัก → lazy()")
const CompanyManagerDialog = lazy(() => import("./components/CompanyManagerDialog"));
const LinkedPricingDialog = lazy(() => import("./components/LinkedPricingDialog"));
const QuotationDuplicateDialog = lazy(() => import("./components/QuotationDuplicateDialog"));
const QuotationStandaloneCreateDialog = lazy(
  () => import("./components/QuotationStandaloneCreateDialog")
);

const UNIFIED_ROLES = ["admin", "account", "sale"];
const EDIT_ROLES = ["admin", "account", "sale"];

const Quotations = () => {
  const { mode, setMode } = useDocumentMode();
  const { currentUser, isAdmin } = useCurrentUser();
  const showTypeSelector = isAdmin || UNIFIED_ROLES.includes(currentUser?.role);
  const canEditQuotations = isAdmin || EDIT_ROLES.includes(currentUser?.role);

  const isQuotationMode = mode === "quotation" || !showTypeSelector;
  const effectiveMode = isQuotationMode ? "quotation" : "invoice";

  const quotationsPage = useQuotationsPage({ enabled: effectiveMode === "quotation" });
  const invoicesPage = useInvoicesPage({ enabled: effectiveMode === "invoice" });

  const [triggerRelatedInvoices] = useLazyGetQuotationRelatedInvoicesQuery();
  const pendingInvoiceIdRef = useRef(null);
  const pendingQuotationIdRef = useRef(null);

  const openDetail = (q) => {
    if (!q?.id) return;
    quotationsPage.setSelectedQuotation(q);
    quotationsPage.handleView(q.id);
  };
  const openLinked = (q) => {
    quotationsPage.setSelectedQuotation(q);
    quotationsPage.setLinkedOpen(true);
  };
  const openCreateInvoice = (q) => {
    quotationsPage.setSelectedQuotation(q);
    quotationsPage.setCreateInvoiceOpen(true);
  };

  const handleGoToInvoice = async (q) => {
    if (!q?.id) return;
    try {
      const res = await triggerRelatedInvoices(q.id).unwrap();
      const list = res?.data?.data || res?.data || [];
      const latest = Array.isArray(list) ? list[0] : null;
      if (latest?.id) {
        pendingInvoiceIdRef.current = latest.id;
        setMode("invoice");
      } else {
        openCreateInvoice(q);
      }
    } catch {
      openCreateInvoice(q);
    }
  };

  const handleGoToQuotation = (invoice) => {
    const quotationId = invoice?.quotation_id || invoice?.quotation?.id;
    if (!quotationId) return;
    pendingQuotationIdRef.current = quotationId;
    setMode("quotation");
  };

  useEffect(() => {
    if (effectiveMode !== "invoice") return;
    if (!pendingInvoiceIdRef.current) return;
    invoicesPage.openInvoiceDetail(pendingInvoiceIdRef.current);
    pendingInvoiceIdRef.current = null;
  }, [effectiveMode, invoicesPage]);

  useEffect(() => {
    if (effectiveMode !== "quotation") return;
    if (!pendingQuotationIdRef.current) return;
    quotationsPage.openQuotationDetail(pendingQuotationIdRef.current);
    pendingQuotationIdRef.current = null;
  }, [effectiveMode, quotationsPage]);

  const headerTitle = effectiveMode === "invoice" ? "เอกสารบัญชี" : "ใบเสนอราคา";
  const headerSubtitle =
    effectiveMode === "invoice"
      ? "จัดการใบแจ้งหนี้และใบเสนอราคาในที่เดียว"
      : "ตรวจสอบ อนุมัติ และจัดการเอกสาร";

  const containerMaxWidth =
    effectiveMode === "quotation" && quotationsPage.viewMode === "table" ? false : "xl";

  return (
    <ThemeProvider theme={accountingTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
          <Header title={headerTitle} subtitle={headerSubtitle} />

          <Container
            maxWidth={containerMaxWidth}
            sx={{
              py: 4,
              px:
                effectiveMode === "quotation" && quotationsPage.viewMode === "table"
                  ? { xs: 2, md: 3, lg: 4 }
                  : undefined,
            }}
          >
            {showTypeSelector && (
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <DocumentTypeSelector value={effectiveMode} onChange={setMode} />
              </Stack>
            )}

            {effectiveMode === "quotation" ? (
              <>
                <AdvancedFilter
                  filters={quotationsPage.filters}
                  handlers={quotationsPage.handlers}
                  onRefresh={quotationsPage.handleRefresh}
                  statusOptions={quotationsPage.statusOptions}
                />

                <QuotationControlsBar
                  showOnlyMine={quotationsPage.showOnlyMine}
                  onShowOnlyMineChange={quotationsPage.setShowOnlyMine}
                  signatureOnly={quotationsPage.signatureOnly}
                  onSignatureOnlyChange={quotationsPage.setSignatureOnly}
                  viewMode={quotationsPage.viewMode}
                  onViewModeChange={quotationsPage.setViewMode}
                  onOpenCompanyDialog={() => quotationsPage.setCompanyDialogOpen(true)}
                  onOpenStandaloneCreate={() => quotationsPage.setStandaloneCreateOpen(true)}
                />

                {quotationsPage.error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    โหลดข้อมูลไม่สำเร็จ: {quotationsPage.error.message}
                  </Alert>
                )}

                <PaginationSection
                  title="ใบเสนอราคาทั้งหมด"
                  pagination={quotationsPage.paginationInfo}
                  currentPage={quotationsPage.currentPage}
                  itemsPerPage={quotationsPage.itemsPerPage}
                  isFetching={quotationsPage.isFetching}
                  onPageChange={quotationsPage.handlePageChange}
                  onItemsPerPageChange={quotationsPage.handleItemsPerPageChange}
                />

                {quotationsPage.isLoading ? (
                  quotationsPage.viewMode === "table" ? (
                    <QuotationTableSkeleton />
                  ) : (
                    <QuotationListSkeleton />
                  )
                ) : quotationsPage.error ? (
                  <ErrorState error={quotationsPage.error} onRetry={quotationsPage.handleRefresh} />
                ) : quotationsPage.quotationsCount > 0 ? (
                  <>
                    {quotationsPage.viewMode === "table" ? (
                      <QuotationTableView
                        data={quotationsPage.paginated || []}
                        onViewDetail={openDetail}
                        onDownloadPDF={quotationsPage.handleDownloadPDF}
                        onDuplicate={quotationsPage.handleDuplicate}
                        onEdit={quotationsPage.handleEdit}
                        canEditQuotations={canEditQuotations}
                        currentUserRole={currentUser?.role}
                        onCreateInvoice={openCreateInvoice}
                        onGoToInvoice={handleGoToInvoice}
                        onActionSuccess={quotationsPage.handleCardActionSuccess}
                      />
                    ) : (
                      <Grid container spacing={3}>
                        {(quotationsPage.paginated || []).map((q) => (
                          <Grid item xs={12} sm={6} lg={4} key={q.id}>
                            <QuotationCard
                              data={q}
                              onDownloadPDF={() => quotationsPage.handleDownloadPDF(q.id)}
                              onViewLinked={() => openLinked(q)}
                              onViewDetail={() => openDetail(q)}
                              onCreateInvoice={() => openCreateInvoice(q)}
                              onDuplicate={() => quotationsPage.handleDuplicate(q.id)}
                              onActionSuccess={quotationsPage.handleCardActionSuccess}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}

                    {quotationsPage.paginationInfo.last_page > 1 && (
                      <Box sx={{ mt: 2 }}>
                        <PaginationSection
                          title="ใบเสนอราคาทั้งหมด"
                          pagination={quotationsPage.paginationInfo}
                          currentPage={quotationsPage.currentPage}
                          itemsPerPage={quotationsPage.itemsPerPage}
                          isFetching={quotationsPage.isFetching}
                          onPageChange={quotationsPage.handlePageChange}
                          onItemsPerPageChange={quotationsPage.handleItemsPerPageChange}
                          showHeader={false}
                        />
                      </Box>
                    )}
                  </>
                ) : (
                  <EmptyState onRefresh={quotationsPage.handleRefresh} />
                )}
              </>
            ) : (
              <InvoicesView page={invoicesPage} onGoToQuotation={handleGoToQuotation} />
            )}
          </Container>

          {effectiveMode === "quotation" && (
            <>
              {/* lazy dialogs — render เฉพาะตอน user click; Suspense จะ defer import จนถึงครั้งแรกที่เปิด */}
              <Suspense fallback={<CircularProgress />}>
                {quotationsPage.linkedOpen && (
                  <LinkedPricingDialog
                    open={quotationsPage.linkedOpen}
                    onClose={() => quotationsPage.setLinkedOpen(false)}
                    quotationId={quotationsPage.selectedQuotation?.id}
                  />
                )}
                {quotationsPage.viewOpen && quotationsPage.viewData && (
                  <QuotationDuplicateDialog
                    mode="view"
                    open={quotationsPage.viewOpen}
                    onClose={quotationsPage.handleCloseViewDialog}
                    initialData={quotationsPage.viewData}
                    quotationId={quotationsPage.viewQuotationId}
                  />
                )}
                {quotationsPage.companyDialogOpen && (
                  <CompanyManagerDialog
                    open={quotationsPage.companyDialogOpen}
                    onClose={() => quotationsPage.setCompanyDialogOpen(false)}
                  />
                )}
                {quotationsPage.standaloneCreateOpen && (
                  <QuotationStandaloneCreateDialog
                    open={quotationsPage.standaloneCreateOpen}
                    onClose={() => quotationsPage.setStandaloneCreateOpen(false)}
                    onSuccess={quotationsPage.handleStandaloneCreateSuccess}
                    companyId={quotationsPage.companyId}
                  />
                )}
                {quotationsPage.duplicateOpen && quotationsPage.duplicateData && (
                  <QuotationDuplicateDialog
                    open={quotationsPage.duplicateOpen}
                    onClose={quotationsPage.handleCloseDuplicateDialog}
                    initialData={quotationsPage.duplicateData}
                    onSaveSuccess={quotationsPage.handleSaveDuplicateSuccess}
                  />
                )}
                {quotationsPage.editOpen && quotationsPage.editData && (
                  <QuotationDuplicateDialog
                    mode="edit"
                    open={quotationsPage.editOpen}
                    onClose={quotationsPage.handleCloseEditDialog}
                    initialData={quotationsPage.editData}
                    quotationId={quotationsPage.editQuotationId}
                    onSaveSuccess={quotationsPage.handleSaveEditSuccess}
                    onSignatureUploaded={quotationsPage.handleSignatureUploaded}
                  />
                )}
              </Suspense>

              {/* InvoiceCreateDialog — ไม่ใช่ lazy ที่นี่ (อาจถูก refactor โดย agent อื่น) */}
              <InvoiceCreateDialog
                open={quotationsPage.createInvoiceOpen}
                onClose={() => quotationsPage.setCreateInvoiceOpen(false)}
                quotationId={quotationsPage.selectedQuotation?.id}
              />

              <FloatingActionButton onRefresh={quotationsPage.handleRefresh} />
            </>
          )}
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default Quotations;
