import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Container, Paper, Snackbar, Alert } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

import PoolCustomersTable from "./components/PoolCustomersTable";
import PoolFilters from "./components/PoolFilters";
import AssignDialog from "./components/AssignDialog";
import { useGetPoolCustomersQuery } from "../../features/Customer/customerApi";

/**
 * AllocationHub - Manager's central interface for assigning customers from pool
 * Role-based access: admin, manager only
 */
const AllocationHub = () => {
  const navigate = useNavigate();

  // Role guard - check authorization
  useEffect(() => {
    try {
      const userData = localStorage.getItem("userData");
      if (!userData) {
        navigate("/customer");
        return;
      }

      const user = JSON.parse(userData);
      if (!["admin", "manager"].includes(user.role)) {
        navigate("/customer");
      }
    } catch (error) {
      console.error("Failed to parse user data", error);
      navigate("/customer");
    }
  }, [navigate]);

  // State management
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 30 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    source: "",
    search: "",
    startDate: null,
    endDate: null,
  });
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // API query
  const {
    data: poolData,
    isLoading,
    isFetching,
    refetch,
  } = useGetPoolCustomersQuery({
    page: paginationModel.page,
    per_page: paginationModel.pageSize,
    source: filters.source || undefined,
    search: filters.search || undefined,
  });

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
    setSnackbar({
      open: true,
      message: `จัดสรรสำเร็จ ${count} รายการ`,
      severity: "success",
    });
    setSelectedIds([]);
    setAssignDialogOpen(false);
    refetch();
  };

  const handleAssignError = (message) => {
    setSnackbar({
      open: true,
      message: message || "เกิดข้อผิดพลาดในการจัดสรร",
      severity: "error",
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold" aria-label="หน้าจัดสรรลูกค้า">
          จัดสรรลูกค้า | Allocation Hub
        </Typography>
        <IconButton
          onClick={refetch}
          disabled={isFetching}
          aria-label="รีเฟรชข้อมูล"
          color="primary"
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <PoolFilters filters={filters} onFiltersChange={setFilters} />
      </Paper>

      {/* Pool Customers Table */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <PoolCustomersTable
          data={poolData}
          isLoading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onAssignClick={handleOpenAssignDialog}
        />
      </Paper>

      {/* Assign Dialog */}
      <AssignDialog
        open={assignDialogOpen}
        onClose={handleCloseAssignDialog}
        selectedIds={selectedIds}
        onSuccess={handleAssignSuccess}
        onError={handleAssignError}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AllocationHub;
