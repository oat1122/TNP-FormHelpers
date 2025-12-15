import { Box, Button, useTheme, useMediaQuery, Pagination } from "@mui/material";
import React, { useState, useEffect } from "react";
import { RiAddLargeFill } from "react-icons/ri";
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

function CustomerList() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // User data
  const user = JSON.parse(localStorage.getItem("userData"));

  // Local state for dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [quickFormOpen, setQuickFormOpen] = useState(false);

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

  // 3. Hook: Data Fetching (API, Redux Sync, Rows)
  const {
    validRows,
    totalItems,
    isFetching,
    isLoading,
    refetch,
    paginationModel,
    filters,
    groupSelected,
  } = useCustomerData(serverSortModel, scrollToTop);

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
          <FilterPanel refetchCustomers={refetch} />
          <FilterTags />

          {/* Data Display - Responsive */}
          {isMobile ? (
            // Mobile Card View
            <>
              <CustomerCardList
                customers={validRows}
                onView={handleOpenViewDialog}
                onEdit={(id) => handleOpenDialogWithState("edit", id)}
                handleRecall={handleRecall}
                loading={isFetching || isLoading}
                totalCount={totalItems}
                paginationModel={paginationModel}
              />
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
            </Box>
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
