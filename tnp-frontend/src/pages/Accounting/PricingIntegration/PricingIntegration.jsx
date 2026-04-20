import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import {
  Alert,
  Box,
  Container,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { th } from "date-fns/locale";
import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";

import {
  CreateQuotationForm,
  CreateQuotationDialog,
  EmptyState,
  ErrorState,
  FilterSection,
  FloatingActionButton,
  Header,
  LoadingState,
  PaginationSection,
  PricingRequestCard,
} from "./components";
import CustomerEditDialog from "./components/CustomerEditDialog";
import PricingTableView from "./components/PricingTableView";
import { usePricingIntegrationState } from "./hooks/usePricingIntegrationState";
import { useQuotationFromPricing } from "./hooks/useQuotationFromPricing";
import { MAX_PR_FETCH } from "./utils/pricingConstants";
import { groupPricingRequestsByCustomer } from "./utils/pricingRequestGrouping";
import { useGetCompletedPricingRequestsQuery } from "../../../features/Accounting/accountingApi";
import { addNotification } from "../../../features/Accounting/accountingSlice";
import accountingTheme from "../theme/accountingTheme";

const PricingIntegration = () => {
  const dispatch = useDispatch();
  const state = usePricingIntegrationState();

  const {
    data: pricingRequests,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetCompletedPricingRequestsQuery({
    search: state.searchTerm,
    only_mine: state.showOnlyMine ? 1 : undefined,
    page: 1,
    per_page: MAX_PR_FETCH,
  });

  const groupedPricingRequests = useMemo(
    () => groupPricingRequestsByCustomer(pricingRequests?.data, state.customerOverrides),
    [pricingRequests, state.customerOverrides]
  );

  const totalCustomers = groupedPricingRequests.length;

  const paginatedRequests = useMemo(() => {
    const start = (state.currentPage - 1) * state.itemsPerPage;
    return groupedPricingRequests.slice(start, start + state.itemsPerPage);
  }, [groupedPricingRequests, state.currentPage, state.itemsPerPage]);

  const paginationInfo = useMemo(() => {
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const to = Math.min(start + state.itemsPerPage, totalCustomers);
    return {
      current_page: state.currentPage,
      last_page: Math.max(1, Math.ceil(totalCustomers / state.itemsPerPage)),
      per_page: state.itemsPerPage,
      total: totalCustomers,
      from: totalCustomers === 0 ? 0 : start + 1,
      to,
    };
  }, [state.currentPage, state.itemsPerPage, totalCustomers]);

  const { saveDraft, submit } = useQuotationFromPricing({
    onSuccess: state.resetAfterCreateSuccess,
  });

  const handleSaveDraft = useCallback(
    (formData) => saveDraft({ formData, selectedPricingRequests: state.selectedPricingRequests }),
    [saveDraft, state.selectedPricingRequests]
  );

  const handleSubmit = useCallback(
    (formData) => submit({ formData, selectedPricingRequests: state.selectedPricingRequests }),
    [submit, state.selectedPricingRequests]
  );

  const handleQuotationFromModal = useCallback(
    (data) => state.handleQuotationFromModal(data, pricingRequests?.data || []),
    [state, pricingRequests]
  );

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

  if (state.showCreateForm) {
    return (
      <ThemeProvider theme={accountingTheme}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
          <CreateQuotationForm
            selectedPricingRequests={state.selectedPricingRequests}
            onBack={state.handleBackFromForm}
            onSave={handleSaveDraft}
            onSubmit={handleSubmit}
          />
        </LocalizationProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={accountingTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
          <Header />

          <Container
            maxWidth={state.viewMode === "table" ? false : "xl"}
            sx={{
              py: 4,
              px: state.viewMode === "table" ? { xs: 2, md: 3, lg: 4 } : undefined,
            }}
          >
            <FilterSection
              searchQuery={state.searchTerm}
              onSearchChange={state.handleSearch}
              showOnlyMine={state.showOnlyMine}
              onOnlyMineChange={state.handleShowOnlyMineChange}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
              </Alert>
            )}

            <PaginationSection
              pagination={paginationInfo}
              currentPage={state.currentPage}
              itemsPerPage={state.itemsPerPage}
              isFetching={isFetching}
              onPageChange={state.handlePageChange}
              onItemsPerPageChange={state.handleItemsPerPageChange}
            />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                mb: 2,
                p: 1.5,
                bgcolor: "background.paper",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <ToggleButtonGroup
                value={state.viewMode}
                exclusive
                onChange={state.handleViewModeChange}
                size="small"
                sx={{ height: 32 }}
              >
                <ToggleButton value="table" sx={{ px: 1.5 }}>
                  <Tooltip title="มุมมองตาราง">
                    <ViewListIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="card" sx={{ px: 1.5 }}>
                  <Tooltip title="มุมมองการ์ด">
                    <ViewModuleIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {isLoading ? (
              <LoadingState itemCount={6} />
            ) : error ? (
              <ErrorState error={error} onRetry={handleRefresh} />
            ) : groupedPricingRequests.length > 0 ? (
              <>
                {state.viewMode === "table" ? (
                  <PricingTableView
                    data={paginatedRequests}
                    onCreateQuotation={state.handleCreateQuotation}
                    onEditCustomer={state.handleEditCustomer}
                  />
                ) : (
                  <Grid container spacing={3}>
                    {paginatedRequests.map((group) => (
                      <Grid item xs={12} sm={6} lg={4} key={group._customerId}>
                        <PricingRequestCard
                          group={group}
                          onCreateQuotation={state.handleCreateQuotation}
                          onEditCustomer={state.handleEditCustomer}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}

                {paginationInfo.last_page > 1 && (
                  <Box sx={{ mt: 2 }}>
                    <PaginationSection
                      pagination={paginationInfo}
                      currentPage={state.currentPage}
                      itemsPerPage={state.itemsPerPage}
                      isFetching={isFetching}
                      onPageChange={state.handlePageChange}
                      onItemsPerPageChange={state.handleItemsPerPageChange}
                      showHeader={false}
                    />
                  </Box>
                )}
              </>
            ) : (
              <EmptyState onRefresh={handleRefresh} />
            )}
          </Container>

          <CreateQuotationDialog
            open={state.showCreateModal}
            onClose={state.handleCloseCreateModal}
            pricingRequest={state.selectedPricingRequest}
            onSubmit={handleQuotationFromModal}
          />

          <CustomerEditDialog
            open={state.editDialogOpen}
            onClose={state.handleCloseEditDialog}
            customer={state.editingCustomer}
            onUpdated={state.handleCustomerUpdated}
          />

          <FloatingActionButton onRefresh={handleRefresh} />
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default PricingIntegration;
