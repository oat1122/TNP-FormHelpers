import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Container,
  Paper,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  SwapHoriz as TransferIcon,
} from "@mui/icons-material";

import PoolCustomersTable from "./components/PoolCustomersTable";
import AssignDialog from "./components/AssignDialog";
import {
  useGetPoolTelesalesCustomersQuery,
  useGetPoolTransferredCustomersQuery,
} from "../../features/Customer/customerApi";
import { CUSTOMER_CHANNEL } from "../Customer/constants/customerChannel";

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
  const navigate = useNavigate();

  // Get user data and sub_role
  const userData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userSubRole = useMemo(() => {
    return userData.sub_roles?.[0]?.msr_code || null;
  }, [userData]);

  // Determine channel filter for transferred tab based on sub_role
  const transferredChannel = useMemo(() => {
    if (userSubRole === "HEAD_ONLINE") return CUSTOMER_CHANNEL.ONLINE;
    if (userSubRole === "HEAD_OFFLINE") return CUSTOMER_CHANNEL.SALES;
    return undefined; // Admin sees all
  }, [userSubRole]);

  // Check if user has allocation permission (admin, manager, or HEAD)
  const canAllocate = useMemo(() => {
    if (["admin", "manager"].includes(userData.role)) return true;
    // HEAD users can also allocate
    if (userSubRole === "HEAD_ONLINE" || userSubRole === "HEAD_OFFLINE") return true;
    return false;
  }, [userData.role, userSubRole]);

  // Role guard - check authorization
  useEffect(() => {
    if (!userData.user_id) {
      navigate("/customer");
      return;
    }
    if (!canAllocate) {
      navigate("/customer");
    }
  }, [navigate, userData, canAllocate]);

  // State management
  const [activeTab, setActiveTab] = useState(0);
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

  // API queries based on active tab
  const {
    data: telesalesData,
    isLoading: isTelesalesLoading,
    isFetching: isTelesalesFetching,
    refetch: refetchTelesales,
  } = useGetPoolTelesalesCustomersQuery(
    {
      page: paginationModel.page,
      per_page: paginationModel.pageSize,
      search: filters.search || undefined,
    },
    { skip: activeTab !== 0 }
  );

  const {
    data: transferredData,
    isLoading: isTransferredLoading,
    isFetching: isTransferredFetching,
    refetch: refetchTransferred,
  } = useGetPoolTransferredCustomersQuery(
    {
      page: paginationModel.page,
      per_page: paginationModel.pageSize,
      channel: transferredChannel,
    },
    { skip: activeTab !== 1 }
  );

  // Current data based on tab
  const currentData = activeTab === 0 ? telesalesData : transferredData;
  const isLoading = activeTab === 0 ? isTelesalesLoading : isTransferredLoading;
  const isFetching = activeTab === 0 ? isTelesalesFetching : isTransferredFetching;
  const refetch = activeTab === 0 ? refetchTelesales : refetchTransferred;

  // Reset selection on tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedIds([]);
    setPaginationModel({ page: 0, pageSize: 30 });
  };

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

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": {
              fontWeight: "bold",
              fontSize: "1rem",
            },
          }}
        >
          <Tab
            icon={<PhoneIcon />}
            iconPosition="start"
            label={`ลูกค้าจาก Telesales (${telesalesData?.pagination?.total || 0})`}
            aria-label="ลูกค้าจาก Telesales"
          />
          <Tab
            icon={<TransferIcon />}
            iconPosition="start"
            label={`ลูกค้าที่ถูกโยน (${transferredData?.pagination?.total || 0})`}
            aria-label="ลูกค้าที่ถูกโยน"
          />
        </Tabs>
      </Paper>

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
