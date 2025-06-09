import {
  useState,
  forwardRef,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  DataGrid,
  GridActionsCellItem,
  useGridApiContext,
  useGridSelector,
  gridPageCountSelector,
  gridPageSelector,
  GridToolbar,
} from "@mui/x-data-grid";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  Container,
  CircularProgress,
  Grid2 as Grid,
  Slide,
  Toolbar,
  Typography,
  Pagination,
  PaginationItem,
  styled,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  useTheme,
  useMediaQuery,
  Skeleton,
  Fade,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { MdOutlineManageSearch } from "react-icons/md";
import { RiAddLargeFill } from "react-icons/ri";
import { CiEdit } from "react-icons/ci";
import { BsTrash3 } from "react-icons/bs";
import { PiClockClockwise, PiArrowFatLinesUpFill, PiArrowFatLinesDownFill } from "react-icons/pi";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  useGetAllCustomerQuery,
  useDelCustomerMutation,
  useUpdateRecallMutation,
  useUpdateCustomerMutation,
} from "../../features/Customer/customerApi";
import {
  setItemList,
  setItem,
  setGroupList,
  setMode,
  resetInputList,
  setInputList,
  setTotalCount,
  setPaginationModel,
} from "../../features/Customer/customerSlice";
import { setLocationSearch } from "../../features/globalSlice";
import { Link, useParams } from "react-router-dom";
import TitleBar from "../../components/TitleBar";
import FilterPanel from "./FilterPanel";
import {
  formatCustomRelativeTime,
  genCustomerNo,
} from "../../features/Customer/customerUtils";
import moment from "moment";
import DialogForm from "./DialogForm";
import { swal_delete_by_id } from "../../utils/dialog_swal2/dialog_delete_by_id";
import {
  open_dialog_ok_timer,
  open_dialog_loading,
  open_dialog_error,
} from "../../utils/import_lib";
import { useUserPermissions } from "../../hooks/useUserPermissions";
import { useApiErrorHandler } from "../../hooks/useApiErrorHandler";
import { useCustomerOperations } from "../../hooks/useCustomerOperations";

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  "& .MuiDataGrid-columnHeader": {
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: "0.875rem",
  },

  "& .MuiDataGrid-columnHeaderTitleContainer": {
    justifyContent: "center",
  },

  "& .MuiDataGrid-row--borderBottom .MuiDataGrid-columnHeader": {
    borderBottom: `1px solid ${theme.palette.error.dark}`,
  },

  "& .MuiDataGrid-columnHeader[aria-colindex='1']": {
    borderBottomLeftRadius: theme.shape.borderRadius,
  },

  "& .MuiDataGrid-columnHeader--last": {
    borderBottomRightRadius: theme.shape.borderRadius,
  },

  "& .MuiDataGrid-iconSeparator": {
    display: "none",
  },

  "& .MuiDataGrid-row": {
    backgroundColor: theme.vars.palette.grey.main,
    borderRadius: theme.shape.borderRadius,
    marginTop: 10,
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: theme.vars.palette.grey.light,
      transform: "translateY(-1px)",
      boxShadow: theme.shadows[3],
    },
  },
  "& .MuiDataGrid-cell, .MuiDataGrid-filler > div": {
    textAlign: "center",
    borderWidth: 0,
    color: theme.vars.palette.grey.dark,
    fontSize: "0.813rem",
    userSelect: "none",
  },
  
  "& .MuiIconButton-root": {
    isolation: "isolate",
    userSelect: "none",
    pointerEvents: "auto",
  },

  "& .MuiDataGrid-menuIcon > button > svg": {
    color: "#fff",
  },

  "& .MuiDataGrid-iconButtonContainer > button > svg": {
    color: "#fff",
  },

  "& .MuiDataGrid-actionsCell > .MuiIconButton-root:not(.Mui-disabled) > svg": {
    color: theme.vars.palette.grey.dark,
  },

  "& .MuiDataGrid-footerContainer": {
    borderWidth: 0,
    justifyContent: "center",
  },

  "& .uppercase-cell": {
    textTransform: "uppercase",
  },

  "& .danger-days": {
    color: theme.vars.palette.error.main,
    fontWeight: 600,
  },

  "& .MuiDataGrid-sortIcon": {
    color: "#fff",
  },

  "& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-columnHeaderTitle": {
    fontWeight: 800,
  },
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  "& .MuiPaginationItem-previousNext": {
    backgroundColor: theme.vars.palette.error.dark,
    color: "#fff",
    height: 30,
    width: 38,

    "&:hover": {
      backgroundColor: theme.vars.palette.error.main,
    },
  },

  "& .MuiPaginationItem-page": {
    backgroundColor: theme.vars.palette.grey.outlinedInput,
    borderColor: theme.vars.palette.grey.outlinedInput,
    height: 30,
    width: 38,

    "&:hover": {
      backgroundColor: theme.vars.palette.grey.light,
      borderColor: theme.vars.palette.grey.light,
    },
  },

  "& .MuiPaginationItem-ellipsis": {
    backgroundColor: theme.vars.palette.grey.outlinedInput,
    borderColor: theme.vars.palette.grey.outlinedInput,
    borderRadius: theme.vars.shape.borderRadius,
    height: 30,
    width: 38,
    alignContent: "center",
  },

  "& .MuiPaginationItem-page.Mui-selected": {
    backgroundColor: theme.vars.palette.grey.light,
    borderColor: theme.vars.palette.grey.light,
    color: theme.vars.palette.grey.dark,

    "&:hover": {
      backgroundColor: theme.vars.palette.grey.light,
    },
  },
}));

// Skeleton Component
const SkeletonLoader = ({ rows = 10 }) => {
  return (
    <Box sx={{ p: 3 }}>
      {[...Array(rows)].map((_, index) => (
        <Fade in={true} timeout={500 + index * 100} key={index}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              background:
                "linear-gradient(90deg, #f5f5f5 25%, #e0e0e0 50%, #f5f5f5 75%)",
              backgroundSize: "200% 100%",
              animation: "loading 1.5s infinite",
              "@keyframes loading": {
                "0%": {
                  backgroundPosition: "200% 0",
                },
                "100%": {
                  backgroundPosition: "-200% 0",
                },
              },
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid size={1}>
                <Skeleton variant="text" width={60} height={30} />
              </Grid>
              <Grid size={1}>
                <Skeleton variant="text" width={80} height={30} />
              </Grid>
              <Grid size={2}>
                <Skeleton variant="text" width="100%" height={30} />
              </Grid>
              <Grid size={2}>
                <Skeleton variant="text" width="100%" height={30} />
              </Grid>
              <Grid size={2}>
                <Skeleton variant="text" width="100%" height={30} />
              </Grid>
              <Grid size={1}>
                <Skeleton variant="text" width="100%" height={30} />
              </Grid>
              <Grid size={1}>
                <Skeleton variant="text" width="100%" height={30} />
              </Grid>
              <Grid size={2}>
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                  <Skeleton variant="circular" width={30} height={30} />
                  <Skeleton variant="circular" width={30} height={30} />
                  <Skeleton variant="circular" width={30} height={30} />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Fade>
      ))}
    </Box>
  );
};

const channelMap = {
  1: "sales",
  2: "online",
  3: "office",
  4: "mobile",
  5: "email",
};

function CustomerList() {
  const [delCustomer] = useDelCustomerMutation();
  const [updateRecall] = useUpdateRecallMutation();
  const [updateCustomer] = useUpdateCustomerMutation();  const dispatch = useDispatch();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadingTimer, setLoadingTimer] = useState(null);
  
  // Use refs to track previous values and prevent unnecessary API calls
  const prevQueryRef = useRef(null);
  const cachedDataHashRef = useRef(null);
  const prevFiltersRef = useRef(null);
  const prevGroupSelectedRef = useRef(null);
  const prevKeywordRef = useRef(null);
  const dataFetchedRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Use custom hooks
  const { handleError } = useApiErrorHandler();
  const userPermissions = useUserPermissions();
  const user = JSON.parse(localStorage.getItem("userData")); // Keep for backward compatibility

  // Simple test function for recall debugging
  const testRecall = (params) => {
    console.log("🔥 TEST RECALL FUNCTION!");
    console.log("Customer:", params.cus_name);
    alert(`Test Recall for: ${params.cus_name}\nID: ${params.cus_id}`);
  };

  const [totalItems, setTotalItems] = useState(0);
  const [showAll, setShowAll] = useState(false);
  
  // Use shallowEqual to prevent unnecessary re-renders
  const itemList = useSelector((state) => state.customer.itemList, shallowEqual);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const groupList = useSelector((state) => state.customer.groupList, shallowEqual);
  const keyword = useSelector((state) => state.global.keyword);
  const paginationModel = useSelector(
    (state) => state.customer.paginationModel,
    shallowEqual
  );
  const filters = useSelector((state) => state.customer.filters, shallowEqual);
    // Create stable query params with deep comparison to prevent unnecessary API calls
  const queryParams = useMemo(() => {
    const params = {
      group: groupSelected,
      page: showAll ? 0 : paginationModel.page,
      per_page: showAll ? 10000 : paginationModel.pageSize,
      user_id: user.user_id,
      search: keyword || undefined,
      dateStart: filters.dateRange?.startDate || undefined,
      dateEnd: filters.dateRange?.endDate || undefined,
      salesName: filters.salesName?.length > 0 ? filters.salesName : undefined,
      channel: filters.channel?.length > 0 ? filters.channel : undefined,
      recallMin: filters.recallRange?.minDays ?? undefined,
      recallMax: filters.recallRange?.maxDays ?? undefined,
    };

    // Create a stable key for comparison
    const paramsKey = JSON.stringify(params);
    
    // Check if params actually changed to prevent new object creation
    if (prevQueryRef.current && paramsKey === prevQueryRef.current.key) {
      if (process.env.NODE_ENV === 'development') {
        console.log("Query parameters unchanged, reusing previous params");
      }
      return prevQueryRef.current.params; // Return previous params to prevent new object
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log("Query parameters changed, creating new params object");
    }
    
    prevQueryRef.current = { key: paramsKey, params };
    return params;
  }, [
    groupSelected,
    showAll,
    paginationModel.page,
    paginationModel.pageSize,
    user.user_id,
    keyword,
    filters.dateRange.startDate,
    filters.dateRange.endDate,
    filters.salesName,
    filters.channel,
    filters.recallRange.minDays,
    filters.recallRange.maxDays,
  ]);
  // Optimized RTK Query with smart caching and time-based fetch prevention
  const { data, error, isFetching, isSuccess, refetch } =
    useGetAllCustomerQuery(
      queryParams,
      { 
        // Only refetch if 60 seconds have passed
        refetchOnMountOrArgChange: 60,  
        // Don't refetch when browser tab gets focus
        refetchOnFocus: false,          
        // Refetch when internet connection returns
        refetchOnReconnect: true,       
        // Never skip this query
        skip: false,                    
        // Keep unused data for 10 minutes
        keepUnusedDataFor: 600,         
        // Custom condition to prevent unnecessary fetches
        selectFromResult: (result) => {
          const now = Date.now();
          const timeSinceLastFetch = now - lastFetchTimeRef.current;
          
          // If data exists and was fetched less than 30 seconds ago, use cached data
          if (result.data && timeSinceLastFetch < 30000) {
            if (process.env.NODE_ENV === 'development') {
              console.log("Using cached data, skipping fetch (fetched", Math.floor(timeSinceLastFetch / 1000), "seconds ago)");
            }
            return { ...result, isLoading: false };
          }
          
          // Update last fetch time when successful
          if (result.isSuccess && !result.isLoading) {
            lastFetchTimeRef.current = now;
          }
          
          return result;
        },
      }
    );

  const [openDialog, setOpenDialog] = useState(false);

  // Pagination customize
  function CustomPagination() {
    const apiRef = useGridApiContext();
    const page = useGridSelector(apiRef, gridPageSelector);
    const pageCount = useGridSelector(apiRef, gridPageCountSelector);
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down("sm"));

    // Reset page to first page after change group.
    useEffect(() => {
      if (paginationModel.page !== page) {
        apiRef.current.setPage(0);
      }
    }, [paginationModel]);

    return (
      <StyledPagination
        color="error"
        variant="outlined"
        shape="rounded"
        page={page + 1}
        count={pageCount}
        siblingCount={isXs ? 0 : 1}
        boundaryCount={1}
        // @ts-expect-error
        renderItem={(props2) => (
          <PaginationItem
            {...props2}
            disableRipple
            slots={{ previous: FaChevronLeft, next: FaChevronRight }}
          />
        )}
        onChange={(event, value) => apiRef.current.setPage(value - 1)}
      />
    );
  }

  const handleOpenDialog = (mode, cus_id = null) => {
    if (mode !== "create") {
      const itemFill = itemList.find((item) => item.cus_id === cus_id);
      dispatch(setInputList(itemFill));
      dispatch(
        setLocationSearch({
          province_sort_id: itemFill.province_sort_id,
          district_sort_id: itemFill.district_sort_id,
        })
      );
    }

    dispatch(setMode(mode));
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);

    setTimeout(() => {
      dispatch(resetInputList());
      dispatch(setMode(""));
    }, 500);
  };  const { deleteCustomer } = useCustomerOperations(refetch);

  const handleDelete = async (params) => {
    try {
      // Clear any browser selections before operation
      if (window.getSelection) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          selection.removeAllRanges();
        }
      }
      
      await deleteCustomer(delCustomer, params);
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการลบข้อมูล");
      console.error("Delete operation error:", error);
    }
  };  // Enhanced recall function with detailed logging
  const handleRecall = useCallback(async (params) => {
    console.log("🔥 === RECALL FUNCTION START ===");
    console.log("🔥 Customer:", params.cus_name);
    console.log("🔥 Customer ID:", params.cus_id);
    console.log("🔥 Full params:", params);
    
    try {
      console.log("🔥 Calling swal_delete_by_id...");
      const confirmed = await swal_delete_by_id(
        `กรุณายืนยันการรีเซตเวลาของ ${params.cus_name}`
      );

      console.log("🔥 User confirmation result:", confirmed);

      if (confirmed) {
        console.log("🔥 User confirmed! Opening loading dialog...");
        open_dialog_loading();

        const inputUpdate = {
          cus_mcg_id: params.cus_mcg_id,
          cd_id: params.cd_id,
          cd_updated_by: user.user_id,
        };

        console.log("🔥 Calling updateRecall API with data:", inputUpdate);

        try {
          const res = await updateRecall(inputUpdate);
          console.log("🔥 API Response received:", res);
          
          if (res.data.status === "success") {
            console.log("🔥 Success! Showing success message and refetching...");
            open_dialog_ok_timer("รีเซตเวลาสำเร็จ");
            refetch();
            console.log("🔥 === RECALL FUNCTION COMPLETED ===");
          } else {
            console.error("🔥 API returned error status:", res.data);
            open_dialog_error("เกิดข้อผิดพลาดในการรีเซตเวลา", res.data.message);
          }
        } catch (error) {
          console.error("🔥 API call failed:", error);
          open_dialog_error(error.message, error);
        }
      } else {
        console.log("🔥 User cancelled the action");
      }
    } catch (err) {
      console.error("🔥 Critical error in handleRecall:", err);
      open_dialog_error("เกิดข้อผิดพลาดร้ายแรง", err);
    }
  }, [updateRecall, user.user_id, refetch]);
  const { changeCustomerGroup } = useCustomerOperations(refetch);

  const handleChangeGroup = async (is_up, params) => {
    try {
      // Clear any browser selections before operation
      if (window.getSelection) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          selection.removeAllRanges();
        }
      }
      
      // Find target group
      const targetGroup = groupList.find(
        (group) => group.mcg_id === params.cus_mcg_id
      );

      if (!targetGroup) {
        handleError(null, "ไม่พบกลุ่มลูกค้า");
        return;
      }

      await changeCustomerGroup(updateCustomer, is_up, params, groupList, user.user_id);
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการเปลี่ยนเกรด");
      console.error("Change group error:", error);
    }
  };

  const handleDisableChangeGroupBtn = useMemo(
    () => (is_up, params) => {
      const matchGroup = groupList.find(
        (group) => group.mcg_id === params.cus_mcg_id
      );
      if (!matchGroup) return true;

      const targetSort = is_up ? 1 : groupList.length;
      return matchGroup.mcg_sort === targetSort;
    },
    [groupList]
  );

  // Render when not found data.
  const NoDataComponent = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: 400,
        color: "gray",
      }}
    >
      <Typography variant="h5" sx={{ mb: 2 }}>
        ไม่พบข้อมูล
      </Typography>
      <Typography variant="body1">
        กรุณาลองค้นหาใหม่หรือเปลี่ยนตัวกรอง
      </Typography>
    </Box>
  );
  // Loading management
  useEffect(() => {
    if (isFetching && !loadingTimer) {
      setIsLoadingData(true);
      const timer = setTimeout(() => {
        setLoadingTimer(null);
        setIsLoadingData(false);
      }, 2000);
      setLoadingTimer(timer);
    }
  }, [isFetching]);

  // เพิ่ม cleanup timer
  useEffect(() => {
    return () => {
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
    };  }, [loadingTimer]);
  // Optimized data update effect with minimal dependencies
  useEffect(() => {
    if (error) {
      console.error("Customer API Error:", error);
      setIsLoadingData(false);
      handleError(
        error,
        "เกิดข้อผิดพลาดในการโหลดข้อมูล"
      );
    } else if (isSuccess && data?.data) {
      if (data.status === "error") {
        handleError(
          { message: data.message },
          "Fetch customer error"
        );
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log("=== CUSTOMER DATA RECEIVED ===");
          console.log("Total data count:", data.data.length);
        }
        
        // Only update if data actually changed - use customer IDs for faster comparison
        const newDataHash = JSON.stringify(data.data.map(d => ({ id: d.cus_id, updated: d.updated_at })));
        const currentDataHash = JSON.stringify(itemList.map(d => ({ id: d.cus_id, updated: d.updated_at })));
        
        if (newDataHash !== currentDataHash) {
          if (process.env.NODE_ENV === 'development') {
            console.log("Data has changed, updating Redux store");
          }
          cachedDataHashRef.current = newDataHash;
          dispatch(setItemList(data.data));
          if (data.groups) dispatch(setGroupList(data.groups));
          if (data.total_count !== undefined) dispatch(setTotalCount(data.total_count));
          if (data.pagination?.total_items !== undefined) setTotalItems(data.pagination.total_items);
        } else if (process.env.NODE_ENV === 'development') {
          console.log("Data unchanged, skipping Redux update");
        }
      }
    }
  }, [data, isSuccess, error]); // Minimal dependencies
  // Reset showAll and pagination when filters or group change
  // This is in a separate effect to avoid unnecessary API calls
  useEffect(() => {
    // Only reset if these values actually changed 
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
    const groupChanged = groupSelected !== prevGroupSelectedRef.current;
    const keywordChanged = keyword !== prevKeywordRef.current;
    
    if (filtersChanged || groupChanged || keywordChanged) {
      prevFiltersRef.current = JSON.parse(JSON.stringify(filters));
      prevGroupSelectedRef.current = groupSelected;
      prevKeywordRef.current = keyword;
      
      setShowAll(false);
      dispatch(setPaginationModel({ page: 0, pageSize: 30 }));
    }
  }, [filters, groupSelected, keyword, dispatch]);

  // No client-side filtering - server handles everything
  const filteredItemList = itemList || [];

  // Extended columns with all fields  // Extended columns with all fields
  const columns = useMemo(
    () => [
      {
        field: "cus_no",
        headerName: "ID",
        width: 120,
        sortable: true,
      },
      {
        field: "cus_channel",
        headerName: "CHANNEL",
        width: 120,
        cellClassName: "uppercase-cell",
        renderCell: (params) => {
          const channelName = channelMap[params.value] || "unknown";
          const channelColors = {
            1: "#4caf50",
            2: "#2196f3",
            3: "#ff9800",
            4: "#9c27b0",
            5: "#f44336",
          };
          return (
            <Chip
              label={channelName}
              size="small"
              sx={{
                bgcolor: channelColors[params.value] || "#757575",
                color: "white",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            />
          );
        },
        sortable: true,
      },
      {
        field: "cus_manage_by",
        headerName: "SALES NAME",
        width: 160,
        cellClassName: "uppercase-cell",
        hideable: false,
        renderCell: (params) => {
          return params.value?.username || "-";
        },
        sortable: true,
      },
      { field: "cus_name", headerName: "CUSTOMER", width: 200, sortable: true },
      {
        field: "cus_company",
        headerName: "COMPANY NAME",
        width: 280,
        sortable: true,
      },
      {
        field: "cus_firstname",
        headerName: "FIRST NAME",
        width: 150,
        sortable: true,
      },
      {
        field: "cus_lastname",
        headerName: "LAST NAME",
        width: 150,
        sortable: true,
      },
      {
        field: "cus_depart",
        headerName: "DEPARTMENT",
        width: 150,
        sortable: true,
      },
      { field: "cus_tel_1", headerName: "TEL", width: 140, sortable: true },
      { field: "cus_tel_2", headerName: "TEL 2", width: 140, sortable: true },
      { field: "cus_email", headerName: "EMAIL", width: 200, sortable: true },
      { field: "cus_tax_id", headerName: "TAX ID", width: 140, sortable: true },
      {
        field: "cus_address",
        headerName: "ADDRESS",
        width: 300,
        sortable: true,
      },
      {
        field: "province_name",
        headerName: "PROVINCE",
        width: 150,
        sortable: true,
      },
      {
        field: "district_name",
        headerName: "DISTRICT",
        width: 150,
        sortable: true,
      },
      {
        field: "subdistrict_name",
        headerName: "SUB-DISTRICT",
        width: 150,
        sortable: true,
      },
      {
        field: "cus_zip_code",
        headerName: "ZIP CODE",
        width: 100,
        sortable: true,
      },
      {
        field: "cus_created_date",
        headerName: "CREATED DATE",
        width: 140,
        renderCell: (params) => {
          const date = moment(params.value);
          const buddhistYear = date.year() + 543;
          return date.format("DD/MM/") + buddhistYear;
        },
        sortable: true,
      },
      {
        field: "cus_updated_date",
        headerName: "UPDATED DATE",
        width: 140,
        renderCell: (params) => {
          if (!params.value) return "-";
          const date = moment(params.value);
          const buddhistYear = date.year() + 543;
          return date.format("DD/MM/") + buddhistYear;
        },
        sortable: true,
      },
      {
        field: "cus_created_by",
        headerName: "CREATED BY",
        width: 120,
        renderCell: (params) => params.value || "-",
        sortable: true,
      },
      {
        field: "cus_updated_by",
        headerName: "UPDATED BY",
        width: 120,
        renderCell: (params) => params.value || "-",
        sortable: true,
      },
      { field: "cd_note", headerName: "NOTE", width: 280, sortable: true },
      { field: "cd_remark", headerName: "REMARK", width: 300, sortable: true },
      {
        field: "cd_last_datetime",
        headerName: "RECALL",
        width: 140,
        renderCell: (params) => {
          const daysLeft = formatCustomRelativeTime(params.value);
          return `${daysLeft} DAYS`;
        },
        cellClassName: (params) => {
          const daysLeft = formatCustomRelativeTime(params.value);
          if (daysLeft <= 7) {
            return "danger-days";
          }
        },
        sortable: true,
      },
      {
        field: "mcg_name",
        headerName: "GRADE",
        width: 120,
        renderCell: (params) => {
          const group = groupList.find(
            (g) => g.mcg_id === params.row.cus_mcg_id
          );
          return group?.mcg_name || "-";
        },
        sortable: true,
      },
      {
        field: "cus_is_use",
        headerName: "STATUS",
        width: 100,
        renderCell: (params) => (
          <Chip
            label={params.value ? "Active" : "Inactive"}
            color={params.value ? "success" : "default"}
            size="small"
          />
        ),
        sortable: true,
      },      {
        field: "tools",
        headerName: "TOOLS",
        width: 320,
        sortable: false,
        align: 'center',
        headerAlign: 'center',        renderCell: (params) => {
          // 🎯 Enhanced stable event handlers within renderCell
          const handleRecallClick = useCallback((e) => {
            console.log("🔥 Enhanced Recall triggered for:", params.row.cus_name);
            
            // 1. Prevent all event propagation immediately
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // 2. Prevent focus issues with onMouseDown
            e.currentTarget.blur();
            
            // 3. Clear browser text selection properly 
            setTimeout(() => {
              try {
                if (window.getSelection) {
                  const selection = window.getSelection();
                  if (selection.rangeCount > 0) {
                    selection.removeAllRanges();
                  }
                }
                if (document.selection) {
                  document.selection.empty();
                }
              } catch (err) {
                console.warn("Selection clear warning (safe to ignore):", err);
              }
              
              // 4. Execute recall with enhanced error handling
              try {
                handleRecall(params.row);
              } catch (error) {
                console.error("Recall error:", error);
              }
            }, 0);
          }, [params.row]);

          const handleGradeUpClick = useCallback((e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            setTimeout(() => {
              try {
                handleChangeGroup(true, params.row);
              } catch (error) {
                console.error("Grade up error:", error);
              }
            }, 0);
          }, [params.row]);

          const handleGradeDownClick = useCallback((e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            setTimeout(() => {
              try {
                handleChangeGroup(false, params.row);
              } catch (error) {
                console.error("Grade down error:", error);
              }
            }, 0);
          }, [params.row]);

          const handleViewClick = useCallback((e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            setTimeout(() => {
              try {
                handleOpenDialog("view", params.id);
              } catch (error) {
                console.error("View error:", error);
              }
            }, 0);
          }, [params.id]);

          const handleEditClick = useCallback((e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            setTimeout(() => {
              try {
                handleOpenDialog("edit", params.id);
              } catch (error) {
                console.error("Edit error:", error);
              }
            }, 0);
          }, [params.id]);

          const handleDeleteClick = useCallback((e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            setTimeout(() => {
              try {
                handleDelete(params.row);
              } catch (error) {
                console.error("Delete error:", error);
              }
            }, 0);
          }, [params.row]);
          
          return (
            <Box sx={{ 
              display: 'flex', 
              gap: 0.5, 
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              py: 0.5,
              // Enhanced isolation and event handling
              isolation: 'isolate',
              position: 'relative',
              zIndex: 10,
              userSelect: 'none',
              '& .MuiIconButton-root': {
                userSelect: 'none',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 11
              }
            }}>
              {/* 🔥 Enhanced Recall Button */}
              <Tooltip title="รีเซตเวลาติดต่อ" arrow placement="top">
                <IconButton
                  size="small"
                  onClick={handleRecallClick}
                  onMouseDown={(e) => e.preventDefault()} // Prevent focus issues
                  sx={{ 
                    color: 'info.main',
                    backgroundColor: 'info.light',
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: 'info.main',
                      color: 'white',
                      transform: 'scale(1.1)'
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    },
                    transition: 'all 0.2s ease',
                    isolation: 'isolate',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    zIndex: 12
                  }}
                >
                  <PiClockClockwise style={{ fontSize: 20, pointerEvents: 'none' }} />
                </IconButton>
              </Tooltip>

              {/* Enhanced Grade Up Button */}
              <Tooltip title="เปลี่ยนเกรดขึ้น" arrow placement="top">
                <IconButton
                  size="small"
                  onClick={handleGradeUpClick}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={handleDisableChangeGroupBtn(true, params.row)}
                  sx={{ 
                    color: 'success.main',
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: 'success.light',
                      transform: 'scale(1.1)'
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    },
                    transition: 'all 0.2s ease',
                    isolation: 'isolate',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    zIndex: 12
                  }}
                >
                  <PiArrowFatLinesUpFill style={{ fontSize: 20, pointerEvents: 'none' }} />
                </IconButton>
              </Tooltip>

              {/* Enhanced Grade Down Button - Admin Only */}
              {user.role === "admin" && (
                <Tooltip title="เปลี่ยนเกรดลง" arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={handleGradeDownClick}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={handleDisableChangeGroupBtn(false, params.row)}
                    sx={{ 
                      color: 'warning.main',
                      cursor: 'pointer',
                      '&:hover': { 
                        backgroundColor: 'warning.light',
                        transform: 'scale(1.1)'
                      },
                      '&:active': {
                        transform: 'scale(0.95)'
                      },
                      transition: 'all 0.2s ease',
                      isolation: 'isolate',
                      userSelect: 'none',
                      pointerEvents: 'auto',
                      zIndex: 12
                    }}
                  >
                    <PiArrowFatLinesDownFill style={{ fontSize: 20, pointerEvents: 'none' }} />
                  </IconButton>
                </Tooltip>
              )}

              {/* Enhanced View Button */}
              <Tooltip title="ดูข้อมูล" arrow placement="top">
                <IconButton
                  size="small"
                  onClick={handleViewClick}
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{ 
                    color: 'primary.main',
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: 'primary.light',
                      transform: 'scale(1.1)'
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    },
                    transition: 'all 0.2s ease',
                    isolation: 'isolate',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    zIndex: 12
                  }}
                >
                  <MdOutlineManageSearch style={{ fontSize: 22, pointerEvents: 'none' }} />
                </IconButton>
              </Tooltip>

              {/* Enhanced Edit Button */}
              <Tooltip title="แก้ไข" arrow placement="top">
                <IconButton
                  size="small"
                  onClick={handleEditClick}
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{ 
                    color: 'secondary.main',
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: 'secondary.light',
                      transform: 'scale(1.1)'
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    },
                    transition: 'all 0.2s ease',
                    isolation: 'isolate',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    zIndex: 12
                  }}
                >
                  <CiEdit style={{ fontSize: 22, pointerEvents: 'none' }} />
                </IconButton>
              </Tooltip>

              {/* Enhanced Delete Button */}
              <Tooltip title="ลบ" arrow placement="top">
                <IconButton
                  size="small"
                  onClick={handleDeleteClick}
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{ 
                    color: 'error.main',
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: 'error.light',
                      transform: 'scale(1.1)'
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    },
                    transition: 'all 0.2s ease',
                    isolation: 'isolate',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    zIndex: 12
                  }}
                >
                  <BsTrash3 style={{ fontSize: 18, pointerEvents: 'none' }} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [handleRecall, handleOpenDialog, handleDelete, handleChangeGroup, handleDisableChangeGroupBtn, user.role]
  );
  return (
    <div className="customer-list" style={{ 
      isolation: 'isolate',
      position: 'relative',
      zIndex: 1
    }}>
      {" "}      <DialogForm
        openDialog={openDialog}
        handleCloseDialog={handleCloseDialog}
        refetch={refetch} // เพิ่ม prop refetch
      />
      <TitleBar title="customer" />
      <Box
        paddingX={3}
        sx={{ margin: "auto", maxWidth: 1800, paddingBlock: 3 }}
      >
        {/* Button and Filters */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            {user.role === "sale" || user.role === "admin" ? (
              <Button
                variant="icon-contained"
                color="grey"
                onClick={() => handleOpenDialog("create")}
                sx={{
                  height: 40,
                  padding: 0,
                }}
              >
                <RiAddLargeFill style={{ width: 24, height: 24 }} />
              </Button>
            ) : null}

            <Button
              variant={showAll ? "contained" : "outlined"}
              color="error"
              onClick={() => setShowAll(!showAll)}
              sx={{ ml: "auto" }}
            >
              {showAll ? "แสดงแบบแบ่งหน้า" : "แสดงข้อมูลทั้งหมด"}
            </Button>
          </Box>

          <FilterPanel />
        </Box>        {/* Show skeleton loader when loading */}
        {isLoadingData ? (
          <SkeletonLoader rows={paginationModel.pageSize} />
        ) : (
          <Box sx={{ 
            isolation: 'isolate',
            position: 'relative',
            zIndex: 1,
            '& *::before, & *::after': {
              pointerEvents: 'none'
            }
          }}>
          <StyledDataGrid
            disableRowSelectionOnClick
            disableVirtualization={false}
            paginationMode={showAll ? "client" : "server"}
            rows={filteredItemList}
            columns={columns}
            getRowId={(row) => row.cus_id}
            initialState={{
              pagination: { paginationModel },
              columns: {
                columnVisibilityModel: {
                  // Hide some columns by default
                  cus_firstname: false,
                  cus_lastname: false,
                  cus_depart: false,
                  cus_tel_2: false,
                  cus_email: false,
                  cus_tax_id: false,
                  cus_address: false,
                  province_name: false,
                  district_name: false,
                  subdistrict_name: false,
                  cus_zip_code: false,
                  cus_updated_date: false,
                  cus_created_by: false,
                  cus_updated_by: false,
                  cd_remark: false,
                  mcg_name: false,
                  cus_is_use: false,
                },
              },
            }}
            onPaginationModelChange={(model) =>
              !showAll && dispatch(setPaginationModel(model))
            }
            rowCount={showAll ? filteredItemList.length : totalItems}
            loading={false} // Controlled by skeleton loader
            pageSizeOptions={
              showAll ? [filteredItemList.length] : [30, 45, 55, 80]
            }
            slots={{
              noRowsOverlay: NoDataComponent,
              pagination: showAll ? undefined : CustomPagination,
              toolbar: GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
                csvOptions: { disableToolbarButton: true },
                printOptions: { disableToolbarButton: true },
              },
            }}
            sx={{
              border: 0,
              height: showAll ? "auto" : 700,
              "& .MuiDataGrid-main": {
                maxHeight: showAll ? "none" : undefined,
              },
              "& .MuiDataGrid-toolbarContainer": {
                padding: 2,
                borderBottom: "1px solid rgba(224, 224, 224, 1)",
                backgroundColor: "#fafafa",
              },
              "& .MuiTextField-root": {
                marginBottom: 0,
              },
            }}
            rowHeight={50}
            columnHeaderHeight={50}
            disableColumnFilter
            disableDensitySelector
            disableColumnSelector={false}            sortingOrder={["desc", "asc"]}
          />
          </Box>
        )}
      </Box>
    </div>
  );
}

export default CustomerList;
