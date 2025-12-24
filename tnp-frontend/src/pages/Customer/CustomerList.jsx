import { Box, Button, useTheme, useMediaQuery, Pagination, Tabs, Tab } from "@mui/material";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { RiAddLargeFill } from "react-icons/ri";
import { MdPerson, MdGroup, MdSettings } from "react-icons/md";
import { useDispatch } from "react-redux";

// Common components
import {
  CustomPagination,
  CustomToolbar,
  NoDataComponent,
  ScrollTopButton,
} from "./components/Common";
// Data display components
import {
  CustomerCardList,
  ScrollContext,
  DataGridWithRowIdFix,
  getRowClassName,
  CustomerTableSkeleton,
  CustomerCardListSkeleton,
} from "./components/DataDisplay";
// Filter components
import { FilterPanel, FilterTab, FilterTags } from "./components/Filters";
// Form components
import { DialogForm, TelesalesQuickCreateForm } from "./components/Forms";
// Config
import { useColumnDefinitions } from "./config/columnDefinitions";
// Hooks
import {
  useCustomerActions,
  useScrollToTop,
  useCustomerTableConfig,
  useCustomerData,
} from "./hooks";
import TitleBar from "../../components/TitleBar";
import { setPaginationModel } from "../../features/Customer/customerSlice";

// AllocationHub components for "จัดการลูกค้า" tab
import { useAllocationHub, useSnackbar } from "../AllocationHub/hooks";
import { AssignDialog, PoolCustomersTable } from "../AllocationHub/components";
import { AllocationTabs } from "../AllocationHub/sections";

function CustomerList() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  // User data
  const user = JSON.parse(localStorage.getItem("userData"));

  // Check if user is HEAD
  const userSubRole = useMemo(() => {
    return user?.sub_roles?.[0]?.msr_code || null;
  }, [user]);
  const isHead = userSubRole === "HEAD_ONLINE" || userSubRole === "HEAD_OFFLINE";

  // View mode for HEAD users: "my" = own customers, "team" = team's customers, "manage" = allocation hub
  const [viewMode, setViewMode] = useState("my");

  // Local state for dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [quickFormOpen, setQuickFormOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // AllocationHub hooks (for "จัดการลูกค้า" tab)
  const allocationHub = useAllocationHub();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  // Skeleton loading state - แสดง skeleton เมื่อมีการเปลี่ยน context สำคัญ
  const [showSkeleton, setShowSkeleton] = useState(true);
  const previousGroupRef = useRef(null);
  const previousFiltersRef = useRef(null);
  const previousViewModeRef = useRef(viewMode);

  // 1. Hook: Scroll management
  const { tableContainerRef, scrollToTop } = useScrollToTop();

  // 2. Hook: Table Config (Sort, Visibility, Order, localStorage)
  const {
    serverSortModel,
    handleSortModelChange,
    columnVisibilityModel,
    handleColumnVisibilityChange,
    columnOrderModel,
    handleColumnOrderChange,
  } = useCustomerTableConfig(user, scrollToTop);

  // 3. Hook: Data Fetching (API, Redux Sync, Rows) - pass viewMode for HEAD
  const {
    validRows,
    totalItems,
    isFetching,
    isLoading,
    refetch,
    paginationModel,
    filters,
    groupSelected,
    isHead: isHeadFromHook,
  } = useCustomerData(serverSortModel, scrollToTop, viewMode);

  // 4. Hook: Actions (Delete, Dialogs, etc.)
  const {
    handleOpenDialog,
    handleCloseDialog,
    handleDelete,
    handleRecall,
    handleChangeGroup,
    handleDisableChangeGroupBtn,
  } = useCustomerActions(scrollToTop);

  // Handle dialog actions
  const handleOpenDialogWithState = (mode, cus_id = null) => {
    handleOpenDialog(mode, cus_id);
    setOpenDialog(true);
  };

  const handleCloseDialogWithState = () => {
    setOpenDialog(false);
    handleCloseDialog();
  };

  // Handle view dialog actions - เปิด DialogForm ใน view mode
  const handleOpenViewDialog = (customerId) => {
    handleOpenDialogWithState("view", customerId);
  };

  // Handle after save action - เปิด view dialog หลังจากบันทึกเสร็จ
  const handleAfterSave = (savedCustomerId) => {
    // รอให้ข้อมูลอัปเดตแล้วค่อยเปิด view dialog
    setTimeout(() => {
      handleOpenViewDialog(savedCustomerId);
    }, 1000);
  };

  // Handle change group with refetch
  const handleChangeGroupWithRefetch = (is_up, params) => {
    handleChangeGroup(is_up, params, refetch);
  };

  // 5. Column definitions (must be after handler definitions)
  const columns = useColumnDefinitions({
    handleOpenDialog: handleOpenDialogWithState,
    handleDelete,
    handleRecall,
    handleChangeGroup: handleChangeGroupWithRefetch,
    handleDisableChangeGroupBtn,
    userRole: user.role,
  });

  // Custom pagination component wrapper
  const PaginationComponent = () => {
    // ซ่อน pagination เมื่อข้อมูลน้อยกว่า 30 แถว
    if (totalItems < 30) {
      return null;
    }

    return (
      <CustomPagination
        paginationModel={paginationModel}
        totalItems={totalItems}
        scrollToTop={scrollToTop}
      />
    );
  };

  // Custom toolbar component wrapper
  const ToolbarComponent = () => (
    <CustomToolbar serverSortModel={serverSortModel} isFetching={isFetching} />
  );

  // Reset เมื่อเปลี่ยนกลุ่มหรือกรองข้อมูล เพื่อป้องกัน DataGrid error
  useEffect(() => {
    // Reset เมื่อข้อมูลเปลี่ยน - ปิด dialog ถ้าเปิดอยู่
    setOpenDialog(false);
  }, [groupSelected, filters.dateRange, filters.salesName, filters.channel]);

  // Track context changes to show skeleton - เมื่อเปลี่ยน tab หรือ filter
  useEffect(() => {
    const hasGroupChanged =
      previousGroupRef.current !== null && previousGroupRef.current !== groupSelected;

    const currentFiltersKey = JSON.stringify({
      dateRange: filters.dateRange,
      salesName: filters.salesName,
      channel: filters.channel,
    });
    const hasFiltersChanged =
      previousFiltersRef.current !== null && previousFiltersRef.current !== currentFiltersKey;

    // Show skeleton when context changes significantly
    if (hasGroupChanged || hasFiltersChanged) {
      setShowSkeleton(true);
    }

    // Update refs
    previousGroupRef.current = groupSelected;
    previousFiltersRef.current = currentFiltersKey;
  }, [groupSelected, filters.dateRange, filters.salesName, filters.channel]);

  // Hide skeleton when data is loaded
  useEffect(() => {
    if (!isFetching && validRows.length >= 0) {
      // Small delay for smooth animation transition
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFetching, validRows.length]);

  return (
    <ScrollContext.Provider value={{ scrollToTop }}>
      <div className="customer-list">
        <DialogForm
          openDialog={openDialog}
          handleCloseDialog={handleCloseDialogWithState}
          handleRecall={handleRecall}
          onAfterSave={handleAfterSave}
          onTransferSuccess={() => {
            // Refetch customer list after transfer
            refetch();
          }}
        />

        <TitleBar title="customer" />
        <Box
          ref={tableContainerRef}
          id="customerTableTop"
          paddingX={3}
          sx={{
            margin: "auto",
            maxWidth: 1800,
            height: "auto",
            paddingBlock: 3,
          }}
        >
          {/* HEAD User View Mode Tabs */}
          {isHead && (
            <Box sx={{ mb: 2 }}>
              <Tabs
                value={viewMode}
                onChange={(e, newValue) => {
                  setViewMode(newValue);
                  setShowSkeleton(true);
                }}
                sx={{
                  "& .MuiTabs-indicator": {
                    height: 3,
                  },
                }}
              >
                <Tab
                  value="my"
                  icon={<MdPerson size={18} />}
                  iconPosition="start"
                  label="ลูกค้าตัวเอง"
                  sx={{ minHeight: 48 }}
                />
                <Tab
                  value="team"
                  icon={<MdGroup size={18} />}
                  iconPosition="start"
                  label="ลูกค้าในทีม"
                  sx={{ minHeight: 48 }}
                />
                <Tab
                  value="manage"
                  icon={<MdSettings size={18} />}
                  iconPosition="start"
                  label="จัดการลูกค้า"
                  sx={{ minHeight: 48 }}
                />
              </Tabs>
            </Box>
          )}

          {/* Conditional Rendering based on viewMode */}
          {viewMode === "manage" ? (
            /* AllocationHub-like content for "จัดการลูกค้า" tab */
            <>
              {/* Allocation Sub-Tabs */}
              <AllocationTabs
                activeTab={allocationHub.activeTab}
                onTabChange={allocationHub.handleTabChange}
                telesalesCount={allocationHub.telesalesCount}
                transferredCount={allocationHub.transferredCount}
              />

              {/* Pool Customers Table */}
              <PoolCustomersTable
                data={allocationHub.currentData}
                isLoading={allocationHub.isLoading}
                paginationModel={allocationHub.paginationModel}
                onPaginationModelChange={allocationHub.setPaginationModel}
                selectedIds={allocationHub.selectedIds}
                onSelectedIdsChange={allocationHub.setSelectedIds}
                onAssignClick={() => {
                  if (allocationHub.selectedIds.length > 0) {
                    setAssignDialogOpen(true);
                  }
                }}
                mode={allocationHub.activeTab === 0 ? "telesales" : "transferred"}
              />

              {/* Assign Dialog */}
              <AssignDialog
                open={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                selectedIds={allocationHub.selectedIds}
                onSuccess={(count) => {
                  showSuccess(`จัดสรรสำเร็จ ${count} รายการ`);
                  allocationHub.setSelectedIds([]);
                  setAssignDialogOpen(false);
                  allocationHub.refetch();
                  allocationHub.refetchCounts();
                }}
                onError={(message) => {
                  showError(message || "เกิดข้อผิดพลาดในการจัดสรร");
                }}
                userSubRole={userSubRole}
              />
            </>
          ) : (
            /* Original Customer List Content */
            <>
              {/* Top Controls */}
              <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2, gap: 1 }}>
                {(user.role === "sale" || user.role === "admin") && (
                  <Button
                    variant="icon-contained"
                    color="grey"
                    onClick={() => handleOpenDialogWithState("create")}
                    sx={{
                      height: 40,
                      padding: 0,
                    }}
                  >
                    <RiAddLargeFill style={{ width: 24, height: 24 }} />
                  </Button>
                )}
                {(user.role === "telesale" || user.role === "admin") && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<RiAddLargeFill />}
                    onClick={() => setQuickFormOpen(true)}
                    sx={{
                      height: 40,
                    }}
                    aria-label="เปิดฟอร์มเพิ่มลูกค้าด่วน"
                  >
                    เพิ่มลูกค้าด่วน
                  </Button>
                )}
                <Box sx={{ flexGrow: 1 }}>
                  <FilterTab refetchCustomers={refetch} />
                </Box>
              </Box>

              {/* Filter Controls */}
              <FilterPanel refetchCustomers={refetch} viewMode={viewMode} isHead={isHead} />
              <FilterTags />

              {/* Data Display - Responsive */}
              {isMobile || isTablet ? (
                // Mobile/Tablet Card View
                <>
                  {/* Show skeleton during loading */}
                  {showSkeleton && isFetching ? (
                    <CustomerCardListSkeleton count={6} isTablet={isTablet} />
                  ) : (
                    <CustomerCardList
                      customers={validRows}
                      onView={handleOpenViewDialog}
                      onEdit={(id) => handleOpenDialogWithState("edit", id)}
                      handleRecall={handleRecall}
                      loading={false} // ไม่ใช้ internal loading เพราะใช้ skeleton
                      totalCount={totalItems}
                      paginationModel={paginationModel}
                    />
                  )}
                  {/* Mobile Pagination */}
                  {totalItems > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2, px: 2 }}>
                      <Pagination
                        count={Math.ceil(totalItems / paginationModel.pageSize)}
                        page={paginationModel.page + 1}
                        onChange={(event, page) => {
                          dispatch(
                            setPaginationModel({
                              ...paginationModel,
                              page: page - 1,
                            })
                          );
                          // Scroll to top on page change
                          scrollToTop();
                        }}
                        color="primary"
                        size="medium"
                        showFirstButton
                        showLastButton
                        sx={{
                          "& .MuiPaginationItem-root": {
                            fontSize: "0.9rem",
                            margin: "0 2px",
                          },
                        }}
                      />
                    </Box>
                  )}
                </>
              ) : (
                // Desktop Table View - ใช้ autoHeight เพื่อให้ Page เป็นตัว scroll หลัก
                <Box
                  sx={{
                    width: "100%",
                    "& .MuiDataGrid-root": {
                      border: "none",
                    },
                    // ป้องกัน row สุดท้ายถูก footer ทับ
                    "& .MuiDataGrid-main": {
                      paddingBottom: "8px",
                    },
                    // ให้ footer มี spacing ที่เหมาะสม
                    "& .MuiDataGrid-footerContainer": {
                      marginTop: "8px",
                      borderTop: "1px solid #e0e0e0",
                    },
                  }}
                >
                  {/* Show skeleton during context changes or initial load */}
                  {showSkeleton && isFetching ? (
                    <CustomerTableSkeleton rows={paginationModel.pageSize} />
                  ) : (
                    <DataGridWithRowIdFix
                      autoHeight // ให้ตารางขยายตามจำนวนข้อมูล แล้ว Page เป็นตัว scroll
                      disableRowSelectionOnClick
                      paginationMode="server"
                      sortingMode="server"
                      hideFooter={totalItems < 30} // ซ่อน footer เมื่อข้อมูลน้อยกว่า 30 แถว
                      rows={validRows}
                      columns={columns}
                      columnVisibilityModel={columnVisibilityModel}
                      columnOrderModel={columnOrderModel}
                      componentsProps={{
                        row: {
                          style: { cursor: "pointer" },
                        },
                      }}
                      initialState={{
                        pagination: { paginationModel },
                        sorting: { sortModel: serverSortModel },
                      }}
                      onPaginationModelChange={(model) => dispatch(setPaginationModel(model))}
                      onSortModelChange={handleSortModelChange}
                      onColumnVisibilityModelChange={handleColumnVisibilityChange}
                      onColumnOrderChange={handleColumnOrderChange}
                      rowCount={totalItems}
                      loading={isFetching || isLoading}
                      slots={{
                        noRowsOverlay: NoDataComponent,
                        pagination: PaginationComponent,
                        toolbar: ToolbarComponent,
                      }}
                      sx={{ border: 0 }}
                      rowHeight={60}
                      columnHeaderHeight={50}
                      getRowClassName={getRowClassName}
                      onRowClick={(params) => {
                        if (isMobile) return;
                        handleOpenViewDialog(params.row.cus_id);
                      }}
                    />
                  )}
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Floating scroll to top button */}
        <ScrollTopButton />

        {/* Telesales Quick Create Form */}
        <TelesalesQuickCreateForm open={quickFormOpen} onClose={() => setQuickFormOpen(false)} />
      </div>
    </ScrollContext.Provider>
  );
}

export default CustomerList;
