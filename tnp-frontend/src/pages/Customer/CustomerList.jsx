import {
  useState,
  forwardRef,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
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
} from "@mui/material";
import { MdOutlineManageSearch } from "react-icons/md";
import { RiAddLargeFill } from "react-icons/ri";
import { CiEdit } from "react-icons/ci";
import { BsTrash3 } from "react-icons/bs";
import { PiClockClockwise } from "react-icons/pi";
import { PiArrowFatLinesUpFill, PiArrowFatLinesDownFill } from "react-icons/pi";
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

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  "& .MuiDataGrid-columnHeader": {
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: '0.875rem',
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
    transition: 'all 0.3s ease',
    "&:hover": {
      backgroundColor: theme.vars.palette.grey.light,
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows[3],
    },
  },

  "& .MuiDataGrid-cell, .MuiDataGrid-filler > div": {
    textAlign: "center",
    borderWidth: 0,
    color: theme.vars.palette.grey.dark,
    fontSize: '0.813rem',
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
    }
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
              background: 'linear-gradient(90deg, #f5f5f5 25%, #e0e0e0 50%, #f5f5f5 75%)',
              backgroundSize: '200% 100%',
              animation: 'loading 1.5s infinite',
              '@keyframes loading': {
                '0%': {
                  backgroundPosition: '200% 0',
                },
                '100%': {
                  backgroundPosition: '-200% 0',
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
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
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
  const user = JSON.parse(localStorage.getItem("userData"));
  const [delCustomer] = useDelCustomerMutation();
  const [updateRecall] = useUpdateRecallMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const dispatch = useDispatch();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadingTimer, setLoadingTimer] = useState(null);

  const [totalItems, setTotalItems] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const itemList = useSelector((state) => state.customer.itemList);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const groupList = useSelector((state) => state.customer.groupList);
  const keyword = useSelector((state) => state.global.keyword);
  const paginationModel = useSelector((state) => state.customer.paginationModel);
  const filters = useSelector((state) => state.customer.filters);
  
  // ตรวจสอบว่ามีการใช้ recall filter หรือไม่
  const hasRecallFilter = filters.recallRange.minDays !== null || filters.recallRange.maxDays !== null;
  
  const { data, error, isFetching, isSuccess } = useGetAllCustomerQuery({
    group: groupSelected,
    page: showAll || hasRecallFilter ? 0 : paginationModel.page,
    per_page: showAll || hasRecallFilter ? 999999 : paginationModel.pageSize,
    user_id: user.user_id,
    search: keyword,
    dateStart: filters.dateRange.startDate,
    dateEnd: filters.dateRange.endDate,
    salesName: filters.salesName,
    channel: filters.channel,
  });

  const [openDialog, setOpenDialog] = useState(false);

  // Pagination customize
  function CustomPagination() {
    const apiRef = useGridApiContext();
    const page = useGridSelector(apiRef, gridPageSelector);
    const pageCount = useGridSelector(apiRef, gridPageCountSelector);
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down('sm'));

    // Reset page to first page after change group.
    useEffect(() => {
      if (paginationModel.page !== page) {
        apiRef.current.setPage(0); 
      }
    }, [paginationModel])

    return (
      <StyledPagination
        color="error"
        variant="outlined"
        shape="rounded"
        page={page + 1}
        count={pageCount}
        siblingCount={ isXs ? 0 : 1 } 
        boundaryCount={1} 
        // @ts-expect-error
        renderItem={(props2) => 
          <PaginationItem 
            {...props2} 
            disableRipple 
            slots={{ previous: FaChevronLeft, next: FaChevronRight }}
          />
        }
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
  };

  const handleDelete = async (params) => {
    const confirmed = await swal_delete_by_id(
      `กรุณายืนยันการลบข้อมูล ${params.cus_name}`
    );

    if (confirmed) {
      open_dialog_loading();

      try {
        const res = await delCustomer(params.cus_id);

        if (res.data.status === "success") {
          open_dialog_ok_timer("ลบข้อมูลสำเร็จ");
        }
      } catch (error) {
        open_dialog_error(error.message, error);
        console.error(error);
      }
    }
  };

  const handleRecall = async (params) => {
    const confirmed = await swal_delete_by_id(
      `กรุณายืนยันการรีเซตเวลาของ ${params.cus_name}`
    );

    if (confirmed) {
      open_dialog_loading();

      const inputUpdate = {
        cus_mcg_id: params.cus_mcg_id,
        cd_id: params.cd_id,
        cd_updated_by: user.user_id,
      };

      try {
        const res = await updateRecall(inputUpdate);

        if (res.data.status === "success") {
          open_dialog_ok_timer("รีเซตเวลาสำเร็จ");
        }
      } catch (error) {
        open_dialog_error(error.message, error);
        console.error(error);
      }
    }
  };

  const handleChangeGroup = async (is_up, params) => {
    // ฟังก์ชันหาค่าไอดีกลุ่มลูกค้าที่ต้องการจะเปลี่ยน
    const groupResult = (() => {
      const targetGroup = groupList.find(
        (group) => group.mcg_id === params.cus_mcg_id
      );

      if (!targetGroup) {
        return [];
      }

      const sortOffset = is_up ? -1 : 1;
      const targetSort = targetGroup.mcg_sort + sortOffset;

      return groupList.find((group) => group.mcg_sort === targetSort) || null;
    })();

    const confirmed = await swal_delete_by_id(
      `กรุณายืนยันการเปลี่ยนเกรดของ ${params.cus_name}`
    );

    if (confirmed) {
      open_dialog_loading();

      const inputUpdate = {
        ...params,
        cus_mcg_id: groupResult.mcg_id,
        cus_updated_by: user.user_id,
      };

      try {
        const res = await updateCustomer(inputUpdate);

        if (res.data.status === "success") {
          open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ");
        }
      } catch (error) {
        open_dialog_error(error.message, error);
        console.error(error);
      }
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
      <Typography variant="h5" sx={{ mb: 2 }}>ไม่พบข้อมูล</Typography>
      <Typography variant="body1">กรุณาลองค้นหาใหม่หรือเปลี่ยนตัวกรอง</Typography>
    </Box>
  );

  // Loading management
  useEffect(() => {
    if (isFetching) {
      setIsLoadingData(true);
      // Set minimum loading time 2 seconds
      const timer = setTimeout(() => {
        setLoadingTimer(null);
      }, 2000);
      setLoadingTimer(timer);
    } else if (!isFetching && !loadingTimer) {
      setIsLoadingData(false);
    }
  }, [isFetching, loadingTimer]);

  useEffect(() => {
    if (isSuccess) {
      if (data.status === "error") {
        open_dialog_error("Fetch customer error", data.message);
      } else if (data.data) {
        dispatch(setItemList(data.data));
        dispatch(setGroupList(data.groups));
        dispatch(setTotalCount(data.total_count));
        setTotalItems(data.pagination.total_items);
      }
    }
  }, [data, groupSelected]);

  // Reset showAll when filters change
  useEffect(() => {
    setShowAll(false);
  }, [filters, groupSelected, keyword]);

  // Filter data based on recall range (client-side filtering) and multi-select filters
  const filteredItemList = useMemo(() => {
    if (!itemList || itemList.length === 0) return itemList;

    let filtered = [...itemList];

    // Apply recall range filter
    if (filters.recallRange.minDays !== null || filters.recallRange.maxDays !== null) {
      filtered = filtered.filter((item) => {
        const recallDays = formatCustomRelativeTime(item.cd_last_datetime);
        const recallNumber = parseInt(recallDays, 10);
        
        const minDays = filters.recallRange.minDays;
        const maxDays = filters.recallRange.maxDays;
        
        let matchesMin = true;
        let matchesMax = true;
        
        if (minDays !== null && minDays !== "") {
          matchesMin = recallNumber >= minDays;
        }
        
        if (maxDays !== null && maxDays !== "") {
          matchesMax = recallNumber <= maxDays;
        }
        
        return matchesMin && matchesMax;
      });
    }

    // Apply sales name filter (multi-select)
    if (filters.salesName && filters.salesName.length > 0) {
      filtered = filtered.filter((item) => 
        filters.salesName.includes(item.cus_manage_by?.username)
      );
    }

    // Apply channel filter (multi-select)
    if (filters.channel && filters.channel.length > 0) {
      filtered = filtered.filter((item) => 
        filters.channel.includes(item.cus_channel?.toString())
      );
    }

    return filtered;
  }, [itemList, filters]);

  // Extended columns with 30+ fields
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
          const channelName = channelMap[params.value] || 'unknown';
          const channelColors = {
            1: '#4caf50',
            2: '#2196f3', 
            3: '#ff9800',
            4: '#9c27b0',
            5: '#f44336'
          };
          return (
            <Chip 
              label={channelName} 
              size="small" 
              sx={{ 
                bgcolor: channelColors[params.value] || '#757575',
                color: 'white',
                fontWeight: 600,
                textTransform: 'uppercase'
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
          return params.value?.username || '-';
        },
        sortable: true,
      },
      { field: "cus_name", headerName: "CUSTOMER", width: 200, sortable: true },
      { field: "cus_company", headerName: "COMPANY NAME", width: 280, sortable: true },
      { field: "cus_firstname", headerName: "FIRST NAME", width: 150, sortable: true },
      { field: "cus_lastname", headerName: "LAST NAME", width: 150, sortable: true },
      { field: "cus_depart", headerName: "DEPARTMENT", width: 150, sortable: true },
      { field: "cus_tel_1", headerName: "TEL", width: 140, sortable: true },
      { field: "cus_tel_2", headerName: "TEL 2", width: 140, sortable: true },
      { field: "cus_email", headerName: "EMAIL", width: 200, sortable: true },
      { field: "cus_tax_id", headerName: "TAX ID", width: 140, sortable: true },
      { field: "cus_address", headerName: "ADDRESS", width: 300, sortable: true },
      { field: "province_name", headerName: "PROVINCE", width: 150, sortable: true },
      { field: "district_name", headerName: "DISTRICT", width: 150, sortable: true },
      { field: "subdistrict_name", headerName: "SUB-DISTRICT", width: 150, sortable: true },
      { field: "cus_zip_code", headerName: "ZIP CODE", width: 100, sortable: true },
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
          if (!params.value) return '-';
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
        renderCell: (params) => params.value || '-',
        sortable: true,
      },
      { 
        field: "cus_updated_by", 
        headerName: "UPDATED BY", 
        width: 120,
        renderCell: (params) => params.value || '-',
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
          const group = groupList.find(g => g.mcg_id === params.row.cus_mcg_id);
          return group?.mcg_name || '-';
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
      },
      {
        field: "tools",
        headerName: "TOOLS",
        flex: 1,
        minWidth: 280,
        type: "actions",
        getActions: (params) => [
          <GridActionsCellItem
            icon={<PiClockClockwise style={{ fontSize: 22 }} />}
            label="Recall"
            onClick={() => handleRecall(params.row)}
          />,
          <GridActionsCellItem
            icon={<PiArrowFatLinesUpFill style={{ fontSize: 22 }} />}
            label="Change Grade Up"
            onClick={() => handleChangeGroup(true, params.row)}
            disabled={handleDisableChangeGroupBtn(true, params.row)}
          />,
          <GridActionsCellItem
            icon={<PiArrowFatLinesDownFill style={{ fontSize: 22 }} />}
            label="Change Grade Down"
            onClick={() => handleChangeGroup(false, params.row)}
            disabled={handleDisableChangeGroupBtn(false, params.row)}
            hidden={user.role !== "admin"}
          />,
          <GridActionsCellItem
            icon={<MdOutlineManageSearch style={{ fontSize: 26 }} />}
            label="View"
            onClick={() => handleOpenDialog("view", params.id)}
          />,
          <GridActionsCellItem
            icon={<CiEdit style={{ fontSize: 26 }} />}
            label="Edit"
            onClick={() => handleOpenDialog("edit", params.id)}
          />,
          <GridActionsCellItem
            icon={<BsTrash3 style={{ fontSize: 22 }} />}
            label="Delete"
            onClick={() => handleDelete(params.row)}
          />,
        ],
      },
    ],
    [handleOpenDialog, handleDelete, groupList]
  );

  return (
    <div className="customer-list">
      <DialogForm
        openDialog={openDialog}
        handleCloseDialog={handleCloseDialog}
        handleRecall={handleRecall}
      />

      <TitleBar title="customer" />
      <Box
        paddingX={3}
        sx={{ margin: "auto", maxWidth: 1800, paddingBlock: 3 }}
      >
        {/* Button and Filters */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            { user.role === 'sale' || user.role === 'admin' ? (
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
              sx={{ ml: 'auto' }}
            >
              {showAll ? "แสดงแบบแบ่งหน้า" : "แสดงข้อมูลทั้งหมด"}
            </Button>
          </Box>
          
          <FilterPanel />
        </Box>

        {/* Show skeleton loader when loading */}
        {isLoadingData ? (
          <SkeletonLoader rows={paginationModel.pageSize} />
        ) : (
          <StyledDataGrid
            disableRowSelectionOnClick
            paginationMode={showAll || hasRecallFilter ? "client" : "server"}
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
            onPaginationModelChange={(model) => !showAll && dispatch(setPaginationModel(model))}
            rowCount={filters.recallRange.minDays !== null || filters.recallRange.maxDays !== null 
              ? filteredItemList.length 
              : (showAll ? filteredItemList.length : totalItems)}
            loading={false} // Controlled by skeleton loader
            pageSizeOptions={showAll ? [filteredItemList.length] : [30, 45, 55, 80]}
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
              height: showAll ? 'auto' : 700,
              '& .MuiDataGrid-main': {
                maxHeight: showAll ? 'none' : undefined,
              },
              '& .MuiDataGrid-toolbarContainer': {
                padding: 2,
                borderBottom: '1px solid rgba(224, 224, 224, 1)',
                backgroundColor: '#fafafa',
              },
              '& .MuiTextField-root': {
                marginBottom: 0,
              },
            }}
            rowHeight={50}
            columnHeaderHeight={50}
            disableColumnFilter
            disableDensitySelector
            disableColumnSelector={false}
            sortingOrder={['desc', 'asc']}
          />
        )}
      </Box>
    </div>
  );
}

export default CustomerList;