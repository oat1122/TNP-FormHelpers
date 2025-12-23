import React, { useState } from "react";
import { Container, Paper, Snackbar, Alert } from "@mui/material";

import { useAllocationHub, useSnackbar } from "./hooks";
import { PageHeader, AllocationTabs } from "./sections";
import { AssignDialog, PoolCustomersTable } from "./components";

/**
 * AllocationHub - Manager's central interface for assigning customers from pool
 *
 * Two tabs:
 * - ลูกค้าจาก Telesales: Customers from telesales source
 * - ลูกค้าที่ถูกโยน: Customers transferred from other teams
 *
 * Role-based access: admin, manager only
 */
const AllocationHub = () => {
  const {
    userSubRole,
    activeTab,
    handleTabChange,
    currentData,
    telesalesCount,
    transferredCount,
    isLoading,
    isFetching,
    paginationModel,
    setPaginationModel,
    selectedIds,
    setSelectedIds,
    refetch,
    refetchCounts,
  } = useAllocationHub();

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Handlers
  const handleOpenAssignDialog = () => {
    if (selectedIds.length > 0) {
      setAssignDialogOpen(true);
    }
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
  };

  const handleAssignSuccess = (count) => {
    showSuccess(`จัดสรรสำเร็จ ${count} รายการ`);
    setSelectedIds([]);
    setAssignDialogOpen(false);
    refetch();
    refetchCounts();
  };

  const handleAssignError = (message) => {
    showError(message || "เกิดข้อผิดพลาดในการจัดสรร");
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <PageHeader
        title="จัดสรรลูกค้า | Allocation Hub"
        onRefresh={refetch}
        isRefreshing={isFetching}
      />

      {/* Tabs */}
      <AllocationTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        telesalesCount={telesalesCount}
        transferredCount={transferredCount}
      />

      {/* Pool Customers Table */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <PoolCustomersTable
          data={currentData}
          isLoading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onAssignClick={handleOpenAssignDialog}
          mode={activeTab === 0 ? "telesales" : "transferred"}
        />
      </Paper>

      {/* Assign Dialog */}
      <AssignDialog
        open={assignDialogOpen}
        onClose={handleCloseAssignDialog}
        selectedIds={selectedIds}
        onSuccess={handleAssignSuccess}
        onError={handleAssignError}
        userSubRole={userSubRole}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AllocationHub;
