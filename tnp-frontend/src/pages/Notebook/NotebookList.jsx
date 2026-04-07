import { Box } from "@mui/material";

import CustomerCareDialog from "./components/CustomerCareDialog";
import NotebookAssignDialog from "./components/NotebookAssignDialog";
import NotebookDialog from "./components/NotebookDialog";
import NotebookPersonalActivityDialog from "./components/NotebookPersonalActivityDialog";
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
    canViewAllScope,
    canUseQueueTabs,
    queueActionMode,
    canSelfReport,
    canCreateCustomerCare,
    viewMode,
    setViewMode,
    filterSummary,
    customerDialogOpen,
    setCustomerDialogOpen,
    assignDialogState,
    exportDialogOpen,
    setExportDialogOpen,
    customerCareDialogState,
    closeCustomerCareDialog,
    rows,
    total,
    listError,
    isLoading,
    isFetching,
    isBulkAssignEnabled,
    selectedQueueIds,
    refetch,
    exportState,
    handleAdd,
    handleAddPersonalActivity,
    handleAddCustomerCare,
    handleEdit,
    handleEditWorkflow,
    handleView,
    handleDelete,
    handleAssign,
    handleSelectedQueueIdsChange,
    handleToggleSelectedQueueRow,
    handleOpenAssignSelected,
    handleCloseAssignDialog,
    handleAssignSuccess,
    handleAssignError,
    handleReserve,
    handleConvert,
    handleAfterCustomerSave,
    handleClearFilters,
    personalActivityDialogState,
    handleClosePersonalActivityDialog,
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
          onAddPersonalActivity={handleAddPersonalActivity}
          onAddCustomerCare={handleAddCustomerCare}
          disableExport={isLoading}
          canCreateCustomerCare={canCreateCustomerCare}
          scopeFilter={scopeFilter}
          onScopeChange={setScopeFilter}
          showScopeTabs={canUseQueueTabs}
          showAllScopeTab={canViewAllScope}
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
            onAssign: handleAssign,
            onReserve: handleReserve,
            onConvert: handleConvert,
          }}
          userRole={userRole}
          filterSummary={filterSummary}
          viewMode={viewMode}
          scopeFilter={scopeFilter}
          canReserveQueue={canUseQueueTabs}
          queueActionMode={queueActionMode}
          selectionState={{
            enabled: isBulkAssignEnabled,
            selectedIds: selectedQueueIds,
            onSelectedIdsChange: handleSelectedQueueIdsChange,
            onToggleSelectedRow: handleToggleSelectedQueueRow,
            onOpenAssignSelected: handleOpenAssignSelected,
          }}
          onClearFilters={handleClearFilters}
          onRetry={refetch}
        />
      </Box>

      <NotebookDialog currentUser={currentUser} />

      <NotebookAssignDialog
        open={assignDialogState.open}
        notebooks={assignDialogState.notebooks}
        currentUser={currentUser}
        onClose={handleCloseAssignDialog}
        onSuccess={handleAssignSuccess}
        onError={handleAssignError}
      />

      <CustomerCareDialog
        open={customerCareDialogState.open}
        mode={customerCareDialogState.mode}
        selectedRecord={customerCareDialogState.selectedRecord}
        currentUser={currentUser}
        onClose={closeCustomerCareDialog}
      />

      <NotebookPersonalActivityDialog
        open={personalActivityDialogState.open}
        mode={personalActivityDialogState.mode}
        selectedRecord={personalActivityDialogState.selectedRecord}
        onClose={handleClosePersonalActivityDialog}
      />

      <PrintPDFDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        items={exportState.exportItems}
        filteredItems={exportState.filteredItems}
        exportRows={exportState.exportRows}
        csvRows={exportState.csvRows}
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
        recallActions={exportState.recallActions}
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
