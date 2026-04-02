import { Box } from "@mui/material";

import NotebookDialog from "./components/NotebookDialog";
import CustomerCareDialog from "./components/CustomerCareDialog";
import NotebookTable from "./components/NotebookTable";
import PrintPDFDialog from "./components/PrintPDFDialog";
import { useNotebookList } from "./hooks/useNotebookList";
import NotebookFilterSection from "./sections/NotebookFilterSection";
import NotebookHeaderSection from "./sections/NotebookHeaderSection";
import TitleBar from "../../components/TitleBar";
import { DialogForm } from "../Customer/components/Forms";

const NotebookList = () => {
  const {
    currentUser,
    userRole,
    paginationModel,
    setPaginationModel,
    scopeFilter,
    setScopeFilter,
    searchInput,
    setSearchInput,
    periodFilter,
    setPeriodFilter,
    dateFilterBy,
    setDateFilterBy,
    statusFilter,
    setStatusFilter,
    actionFilter,
    setActionFilter,
    entryTypeFilter,
    setEntryTypeFilter,
    salesFilter,
    setSalesFilter,
    salesOptions,
    canFilterBySales,
    canUseQueueTabs,
    canSelfReport,
    canCreateCustomerCare,
    viewMode,
    setViewMode,
    filterSummary,
    customerDialogOpen,
    setCustomerDialogOpen,
    exportDialogOpen,
    setExportDialogOpen,
    customerCareDialogState,
    closeCustomerCareDialog,
    rows,
    total,
    listError,
    isLoading,
    isFetching,
    refetch,
    exportState,
    handleAdd,
    handleAddCustomerCare,
    handleEdit,
    handleEditWorkflow,
    handleView,
    handleDelete,
    handleReserve,
    handleConvert,
    handleAfterCustomerSave,
    handleClearFilters,
  } = useNotebookList();

  return (
    <Box>
      <TitleBar title="สมุดจดบันทึก (Notebook)" />

      <Box sx={{ p: 3, maxWidth: 1600, margin: "auto" }}>
        <NotebookHeaderSection
          total={total}
          isRefreshing={isFetching}
          onOpenExport={() => setExportDialogOpen(true)}
          onAdd={handleAdd}
          onAddCustomerCare={handleAddCustomerCare}
          disableExport={isLoading}
          canCreateCustomerCare={canCreateCustomerCare}
          scopeFilter={scopeFilter}
          onScopeChange={setScopeFilter}
          showScopeTabs={canUseQueueTabs}
          showAllScopeTab={userRole === "admin" || userRole === "manager"}
          canSelfReport={canSelfReport}
        />

        <NotebookFilterSection
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          actionFilter={actionFilter}
          onActionChange={setActionFilter}
          entryTypeFilter={entryTypeFilter}
          onEntryTypeChange={setEntryTypeFilter}
          salesFilter={salesFilter}
          onSalesChange={setSalesFilter}
          salesOptions={salesOptions}
          canFilterBySales={canFilterBySales}
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          dateFilterBy={dateFilterBy}
          onDateFilterChange={setDateFilterBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isLoading={isLoading}
        />

        <NotebookTable
          rows={rows}
          total={total}
          loadingState={{ isLoading, isFetching }}
          error={listError}
          pagination={{
            model: paginationModel,
            onChange: setPaginationModel,
          }}
          actions={{
            onView: handleView,
            onEdit: handleEdit,
            onEditWorkflow: handleEditWorkflow,
            onDelete: handleDelete,
            onReserve: handleReserve,
            onConvert: handleConvert,
          }}
          userRole={userRole}
          filterSummary={filterSummary}
          viewMode={viewMode}
          scopeFilter={scopeFilter}
          canReserveQueue={canUseQueueTabs}
          onClearFilters={handleClearFilters}
          onRetry={refetch}
        />
      </Box>

      <NotebookDialog currentUser={currentUser} />

      <CustomerCareDialog
        open={customerCareDialogState.open}
        mode={customerCareDialogState.mode}
        selectedRecord={customerCareDialogState.selectedRecord}
        currentUser={currentUser}
        onClose={closeCustomerCareDialog}
      />

      <PrintPDFDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        items={exportState.exportItems}
        filteredItems={exportState.filteredItems}
        exportRows={exportState.exportRows}
        pdfRows={exportState.pdfRows}
        leadSummaryRows={exportState.leadSummaryRows}
        selectedIds={exportState.selectedIds}
        dateRange={exportState.dateRange}
        activePreset={exportState.activePreset}
        loadingState={{
          isLoading: exportState.isLoading,
          isFetching: exportState.isFetching,
        }}
        currentUser={currentUser}
        onPresetClick={exportState.handlePresetClick}
        onDateChange={exportState.handleDateChange}
        onToggleSelection={exportState.handleToggleSelection}
        onSelectAll={exportState.handleSelectAll}
        onExportCsv={exportState.handleExportCsv}
        isAllSelected={exportState.isAllSelected}
        isSelfReportMode={exportState.isSelfReportMode}
      />

      <DialogForm
        openDialog={customerDialogOpen}
        handleCloseDialog={() => setCustomerDialogOpen(false)}
        handleRecall={() => {}}
        onAfterSave={handleAfterCustomerSave}
      />
    </Box>
  );
};

export default NotebookList;
