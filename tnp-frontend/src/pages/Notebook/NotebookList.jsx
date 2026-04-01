import { Box } from "@mui/material";

import NotebookDialog from "./components/NotebookDialog";
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
    periodFilter,
    setPeriodFilter,
    dateFilterBy,
    setDateFilterBy,
    filterSummary,
    customerDialogOpen,
    setCustomerDialogOpen,
    exportDialogOpen,
    setExportDialogOpen,
    rows,
    total,
    listError,
    isLoading,
    isFetching,
    refetch,
    exportState,
    handleAdd,
    handleEdit,
    handleView,
    handleDelete,
    handleConvert,
    handleAfterCustomerSave,
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
          disableExport={isLoading}
        />

        <NotebookFilterSection
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          dateFilterBy={dateFilterBy}
          onDateFilterChange={setDateFilterBy}
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
            onDelete: handleDelete,
            onConvert: handleConvert,
          }}
          userRole={userRole}
          filterSummary={filterSummary}
          onRetry={refetch}
        />
      </Box>

      <NotebookDialog currentUser={currentUser} />

      <PrintPDFDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        items={exportState.exportItems}
        filteredItems={exportState.filteredItems}
        exportRows={exportState.exportRows}
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
