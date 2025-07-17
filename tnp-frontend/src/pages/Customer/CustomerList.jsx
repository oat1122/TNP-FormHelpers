import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, useTheme, useMediaQuery, Pagination } from "@mui/material";
import { RiAddLargeFill } from "react-icons/ri";
import { useGetAllCustomerQuery } from "../../features/Customer/customerApi";
import {
  setItemList,
  setGroupList,
  setTotalCount,
  setPaginationModel,
} from "../../features/Customer/customerSlice";
import TitleBar from "../../components/TitleBar";
import FilterTab from "./FilterTab";
import FilterPanel from "./FilterPanel";
import FilterTags from "./FilterTags";
import ScrollContext from "./ScrollContext";
import ScrollTopButton from "./ScrollTopButton";
import DialogForm from "./DialogForm";
import CustomerViewDialog from "./components/CustomerViewDialog";
import { formatCustomRelativeTime } from "../../features/Customer/customerUtils";
import moment from "moment";
import { open_dialog_error } from "../../utils/import_lib";

// Import separated components
import { StyledDataGrid } from "./styles/StyledComponents";
import { NoDataComponent } from "./components/UtilityComponents";
import { CustomPagination, CustomToolbar } from "./components/CustomComponents";
import { useCustomerActions } from "./hooks/useCustomerActions";
import { useColumnDefinitions } from "./config/columnDefinitions";
import CustomerCardList from "./components/CustomerCardList";

// Helper function to check if recall date is expired
const isRecallExpired = (dateString) => {
  if (!dateString) return false;
  const recallDate = moment(dateString).startOf("day");
  const today = moment().startOf("day");
  return recallDate.diff(today, "days") <= 0;
};

// DataGrid wrapper สำหรับจัดการ row ID
const DataGridWithRowIdFix = (props) => {
  const getRowId = (row) => {
    if (!row) return `row-${Math.random().toString(36).substring(2, 15)}`;
    return (
      row.cus_id ||
      row.id ||
      `row-${Math.random().toString(36).substring(2, 15)}`
    );
  };

  // สร้าง key ที่เปลี่ยนไปตาม rows เพื่อ force re-render DataGrid
  const dataGridKey = React.useMemo(() => {
    if (!props.rows || !Array.isArray(props.rows)) return "datagrid-empty";
    const rowIds = props.rows
      .map((row) => row?.cus_id || row?.id || "no-id")
      .join(",");
    return `datagrid-${rowIds.substring(0, 50)}-${props.rows.length}`;
  }, [props.rows]);

  return <StyledDataGrid key={dataGridKey} {...props} getRowId={getRowId} />;
};

function CustomerList() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  // Selectors
  const user = JSON.parse(localStorage.getItem("userData"));
  const itemList = useSelector((state) => state.customer.itemList);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const keyword = useSelector((state) => state.global.keyword);
  const paginationModel = useSelector(
    (state) => state.customer.paginationModel
  );
  const filters = useSelector((state) => state.customer.filters);
  const isLoading = useSelector((state) => state.customer.isLoading);

  // Local state
  const [totalItems, setTotalItems] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [serverSortModel, setServerSortModel] = useState([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    cus_no: false,
    cus_channel: true,
    cus_manage_by: true,
    cus_name: true,
    cus_company: false,
    cus_tel_1: true,
    cd_note: true,
    business_type: true, // เพิ่ม business_type
    cd_last_datetime: true,
    cus_created_date: true,
    cus_email: false,
    cus_address: false,
    tools: true,
  });
  const [columnOrderModel, setColumnOrderModel] = useState([
    "cus_channel",
    "cus_manage_by",
    "cus_name",
    "cus_tel_1",
    "cd_note",
    "business_type",
    "cd_last_datetime",
    "cus_created_date",
    "tools",
    "cus_no",
    "cus_company",
    "cus_email",
    "cus_address",
  ]);

  // Refs
  const tableContainerRef = useRef(null);

  // Load column preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedVisibility = localStorage.getItem("customerTableColumnVisibility");
      const savedOrder = localStorage.getItem("customerTableColumnOrder");
      
      if (savedVisibility) {
        const parsed = JSON.parse(savedVisibility);
        // ตรวจสอบว่า column ใหม่ที่จำเป็นมีอยู่หรือไม่
        const requiredColumns = ['cus_channel', 'cd_note', 'business_type'];
        const hasAllRequired = requiredColumns.every(col => col in parsed.model);
        
        if (hasAllRequired) {
          setColumnVisibilityModel(parsed.model);
        } else {
          // ถ้าไม่ครบ ให้ใช้ default และลบ localStorage เก่า
          console.log('Column preferences outdated, using defaults');
          localStorage.removeItem("customerTableColumnVisibility");
        }
      }
      
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder);
        const requiredColumns = ['cus_channel', 'cd_note', 'business_type'];
        const hasAllRequired = requiredColumns.every(col => parsed.order.includes(col));
        
        if (hasAllRequired) {
          setColumnOrderModel(parsed.order);
        } else {
          // ถ้าไม่ครบ ให้ใช้ default และลบ localStorage เก่า
          console.log('Column order outdated, using defaults');
          localStorage.removeItem("customerTableColumnOrder");
        }
      }
    } catch (error) {
      console.warn('Failed to load column preferences from localStorage', error);
      // ลบ localStorage ที่เสียหาย
      localStorage.removeItem("customerTableColumnVisibility");
      localStorage.removeItem("customerTableColumnOrder");
    }
  }, []); // Empty dependency array - run once on mount

  // API Query
  const { data, error, isFetching, isSuccess, refetch } =
    useGetAllCustomerQuery({
      group: groupSelected,
      page: paginationModel.page,
      per_page: paginationModel.pageSize,
      user_id: user.user_id,
      search: keyword,
      filters: filters,
      sortModel: serverSortModel,
    });

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      if (tableContainerRef && tableContainerRef.current) {
        setTimeout(() => {
          try {
            tableContainerRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "nearest",
            });

            const containerRect =
              tableContainerRef.current.getBoundingClientRect();
            if (containerRect.top < 0) {
              window.scrollBy({
                top: containerRect.top - 20,
                behavior: "smooth",
              });
            }
          } catch (innerError) {
            console.warn(
              "Smooth scrolling not supported in timeout, using fallback",
              innerError
            );
            if (tableContainerRef.current) {
              tableContainerRef.current.scrollIntoView(true);
            } else {
              window.scrollTo(0, 0);
            }
          }
        }, 50);
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    } catch (error) {
      console.warn("Error in scrollToTop, using basic fallback", error);
      try {
        window.scrollTo(0, 0);
      } catch (finalError) {
        console.error("Failed to scroll to top", finalError);
      }
    }
  }, []);

  // Custom hooks for actions
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

  // Handle view dialog actions
  const handleOpenViewDialog = (customerId) => {
    // ใช้ validRows แทน itemList เพื่อความปลอดภัย
    const customer = validRows.find((item) => item.cus_id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setOpenViewDialog(true);
    } else {
      console.warn("Customer not found:", customerId);
    }
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedCustomer(null);
  };

  // Handle edit from view action
  const handleEditFromView = (customerId) => {
    setOpenViewDialog(false);
    setSelectedCustomer(null);
    handleOpenDialogWithState("edit", customerId);
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

  // Column definitions
  const columns = useColumnDefinitions({
    handleOpenDialog: handleOpenDialogWithState,
    handleDelete,
    handleRecall,
    handleChangeGroup: handleChangeGroupWithRefetch,
    handleDisableChangeGroupBtn,
    userRole: user.role,
  });

  // Handle sort model change
  const handleSortModelChange = (newModel) => {
    if (JSON.stringify(newModel) !== JSON.stringify(serverSortModel)) {
      const processedModel = newModel.map((item) => {
        if (item.field === "business_type") {
          return { ...item, field: "cus_bt_id" };
        }
        return item;
      });

      setServerSortModel(processedModel);
      const newPaginationModel = { ...paginationModel, page: 0 };
      dispatch(setPaginationModel(newPaginationModel));
      scrollToTop();
    }
  };

  // Handle column visibility change
  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);

    try {
      const columnPreferences = {
        model: newModel,
        timestamp: new Date().toISOString(),
        username: user?.username || "unknown",
      };

      localStorage.setItem(
        "customerTableColumnVisibility",
        JSON.stringify(columnPreferences)
      );
    } catch (error) {
      console.warn("Failed to save column visibility to localStorage", error);
    }
  };

  // Handle column order change
  const handleColumnOrderChange = (newOrder) => {
    setColumnOrderModel(newOrder);

    try {
      const columnOrderPreferences = {
        order: newOrder,
        timestamp: new Date().toISOString(),
        username: user?.username || "unknown",
      };

      localStorage.setItem(
        "customerTableColumnOrder",
        JSON.stringify(columnOrderPreferences)
      );
    } catch (error) {
      console.warn("Failed to save column order to localStorage", error);
    }
  };

  // Custom pagination component wrapper
  const PaginationComponent = () => (
    <CustomPagination
      paginationModel={paginationModel}
      totalItems={totalItems}
      scrollToTop={scrollToTop}
    />
  );

  // Custom toolbar component wrapper
  const ToolbarComponent = () => (
    <CustomToolbar serverSortModel={serverSortModel} isFetching={isFetching} />
  );

  // Load saved column settings
  useEffect(() => {
    try {
      const savedVisibilityPrefs = localStorage.getItem(
        "customerTableColumnVisibility"
      );
      if (savedVisibilityPrefs) {
        const savedPrefs = JSON.parse(savedVisibilityPrefs);
        const savedModel = savedPrefs.model || savedPrefs;
        setColumnVisibilityModel(savedModel);
      }

      const savedOrderPrefs = localStorage.getItem("customerTableColumnOrder");
      if (savedOrderPrefs) {
        const savedOrderData = JSON.parse(savedOrderPrefs);
        const savedOrder = savedOrderData.order || savedOrderData;
        setColumnOrderModel(savedOrder);
      }
    } catch (error) {
      console.warn("Failed to load saved column settings", error);
    }
  }, []);

  // Responsive column visibility
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const hasSavedPreferences = localStorage.getItem(
      "customerTableColumnVisibility"
    );

    if (!hasSavedPreferences) {
      const responsiveVisibility = {
        cus_email: false,
        cus_address: false,
      };

      if (isSmall) {
        responsiveVisibility.cus_company = false;
        responsiveVisibility.cd_note = false;
      }

      if (isExtraSmall) {
        responsiveVisibility.cus_channel = false;
      }

      setColumnVisibilityModel((prev) => ({
        ...prev,
        ...responsiveVisibility,
      }));
    }
  }, [isSmall, isExtraSmall]);

  // Handle API response
  useEffect(() => {
    if (isSuccess) {
      if (data.status === "error") {
        open_dialog_error("Fetch customer error", data.message);
      } else if (data.data) {
        dispatch(setItemList(data.data));

        const hasActiveFilters =
          filters.dateRange.startDate ||
          filters.dateRange.endDate ||
          (filters.salesName && filters.salesName.length > 0) ||
          (filters.channel && filters.channel.length > 0);

        if (!hasActiveFilters || data.groups) {
          dispatch(setGroupList(data.groups));
        }

        dispatch(setTotalCount(data.total_count));
        setTotalItems(data.pagination.total_items);

        if (
          paginationModel.page === 0 &&
          data.data?.length > 0 &&
          itemList?.length > 0 &&
          data.data[0]?.cus_id !== itemList[0]?.cus_id
        ) {
          scrollToTop();
        }
      }
    }
  }, [
    data,
    dispatch,
    filters,
    itemList,
    paginationModel.page,
    scrollToTop,
    isSuccess,
  ]);

  // Reset เมื่อเปลี่ยนกลุ่มหรือกรองข้อมูล เพื่อป้องกัน DataGrid error
  useEffect(() => {
    // Reset selected customer เมื่อข้อมูลเปลี่ยน
    setSelectedCustomer(null);
    setOpenViewDialog(false);
  }, [groupSelected, filters.dateRange, filters.salesName, filters.channel]);

  // Filter rows ที่มี ID ที่ถูกต้องและข้อมูลครบ
  const validRows = useMemo(() => {
    if (!itemList || !Array.isArray(itemList)) {
      return [];
    }

    return itemList.filter((row) => {
      // ต้องมี ID ที่ใช้งานได้
      const hasValidId = row.cus_id || row.id;
      // ต้องเป็น object ที่มีข้อมูล
      const hasValidData = row && typeof row === "object";

      return hasValidId && hasValidData;
    });
  }, [itemList]);

  return (
    <ScrollContext.Provider value={{ scrollToTop }}>
      <div className="customer-list">
        <DialogForm
          openDialog={openDialog}
          handleCloseDialog={handleCloseDialogWithState}
          handleRecall={handleRecall}
          onAfterSave={handleAfterSave}
        />

        <CustomerViewDialog
          open={openViewDialog}
          onClose={handleCloseViewDialog}
          customerData={selectedCustomer}
          onEdit={handleEditFromView}
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
          <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
            {(user.role === "sale" || user.role === "admin") && (
              <Button
                variant="icon-contained"
                color="grey"
                onClick={() => handleOpenDialogWithState("create")}
                sx={{
                  marginRight: 3,
                  height: 40,
                  padding: 0,
                }}
              >
                <RiAddLargeFill style={{ width: 24, height: 24 }} />
              </Button>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <FilterTab />
            </Box>
          </Box>

          {/* Filter Controls */}
          <FilterPanel />
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
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, px: 2 }}>
                  <Pagination 
                    count={Math.ceil(totalItems / paginationModel.pageSize)}
                    page={paginationModel.page + 1}
                    onChange={(event, page) => {
                      dispatch(setPaginationModel({ 
                        ...paginationModel, 
                        page: page - 1 
                      }));
                      // Scroll to top on page change
                      scrollToTop();
                    }}
                    color="primary"
                    size="medium"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontSize: '0.9rem',
                        margin: '0 2px',
                      }
                    }}
                  />
                </Box>
              )}
            </>
          ) : (
            // Desktop Table View
            <Box
              sx={{
                height: "auto",
                minHeight: Math.min(500, totalItems * 60 + 120),
                maxHeight: 800,
                width: "100%",
                "& .MuiDataGrid-main": {
                  overflow: "hidden",
                },
                "& .MuiDataGrid-root": {
                  transition: "height 0.3s ease",
                },
              }}
            >
              <DataGridWithRowIdFix
                disableRowSelectionOnClick
                paginationMode="server"
                sortingMode="server"
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
                onPaginationModelChange={(model) =>
                  dispatch(setPaginationModel(model))
                }
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
                getRowClassName={(params) => {
                  const classes = [];
                  if (params.indexRelativeToCurrentPage % 2 === 0) {
                    classes.push("even-row");
                  } else {
                    classes.push("odd-row");
                  }

                  const expired = isRecallExpired(params.row.cd_last_datetime);
                  const daysLeft = formatCustomRelativeTime(
                    params.row.cd_last_datetime
                  );

                  if (expired) {
                    classes.push("expired-row");
                  } else if (daysLeft <= 7) {
                    classes.push("high-priority-row");
                  } else if (daysLeft <= 15) {
                    classes.push("medium-priority-row");
                  }

                  return classes.join(" ");
                }}
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
      </div>
    </ScrollContext.Provider>
  );
}

export default CustomerList;
