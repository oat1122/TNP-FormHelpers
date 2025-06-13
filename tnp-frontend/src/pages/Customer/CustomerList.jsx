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
  GridToolbarContainer,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Tooltip,
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
  setFilters,
  resetFilters,
} from "../../features/Customer/customerSlice";
import { setLocationSearch } from "../../features/globalSlice";
import { Link, useParams } from "react-router-dom";
import TitleBar from "../../components/TitleBar";
import FilterTab from "./FilterTab";
import FilterPanel from "./FilterPanel";
import FilterTags from "./FilterTags";
import ScrollContext from "./ScrollContext";
import ScrollTopButton from "./ScrollTopButton";
import ColumnVisibilitySelector from "./ColumnVisibilitySelector";
import {
  formatCustomRelativeTime,
  genCustomerNo,
} from "../../features/Customer/customerUtils";
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
    "&:hover": {
      backgroundColor: theme.vars.palette.grey.light,
      transition: "background-color 0.2s ease",
    },
  },
  "& .MuiDataGrid-cell, .MuiDataGrid-filler > div": {
    textAlign: "center",
    borderWidth: 0,
    color: theme.vars.palette.grey.dark,
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
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
    padding: "16px 0",
  },

  "& .uppercase-cell": {
    textTransform: "uppercase",
  },
  "& .danger-days": {
    color: theme.vars.palette.error.main,
    fontWeight: "bold",
  },

  "& .warning-days": {
    color: theme.vars.palette.warning.main,
    fontWeight: "bold",
  },

  "& .MuiDataGrid-toolbarContainer": {
    gap: 2,
    padding: "8px 16px",
    justifyContent: "space-between",
    backgroundColor: theme.palette.error.dark,
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
    marginBottom: 10,
  },
  // Highlight rows based on recall days
  "& .high-priority-row": {
    backgroundColor: `${theme.palette.error.light}33`, // 20% opacity red for <= 7 days
    "&:hover": {
      backgroundColor: `${theme.palette.error.light}66`, // 40% opacity
    },
  },

  "& .medium-priority-row": {
    backgroundColor: `${theme.palette.warning.light}33`, // 20% opacity yellow for <= 15 days
    "&:hover": {
      backgroundColor: `${theme.palette.warning.light}66`, // 40% opacity
    },
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

// Custom component for page size selection
const PageSizeSelector = ({ value, onChange }) => {
  const pageSizeOptions = [30, 50, 80, 100];

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        variant="body2"
        sx={{ color: (theme) => theme.vars.palette.grey.dark }}
      >
        Rows per page:
      </Typography>
      <FormControl size="small" sx={{ minWidth: 85 }}>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          displayEmpty
          variant="outlined"
          sx={{
            borderRadius: 1,
            backgroundColor: (theme) => theme.vars.palette.grey.outlinedInput,
            ".MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
            ".MuiSelect-select": { py: 0.5, px: 1 },
          }}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option} rows
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

const channelMap = {
  1: "sales",
  2: "online",
  3: "office",
};

// Custom component for information about column sorting
const SortInfoDisplay = ({ sortModel }) => {
  if (!sortModel || sortModel.length === 0) {
    return null;
  }
  const fieldMap = {
    cus_no: "รหัสลูกค้า",
    cus_channel: "ช่องทาง",
    business_type: "ประเภทธุรกิจ",
    cus_manage_by: "ชื่อเซลล์",
    cus_name: "ชื่อลูกค้า",
    cus_company: "ชื่อบริษัท",
    cus_tel_1: "เบอร์โทร",
    cd_last_datetime: "วันติดต่อกลับ",
    cd_note: "หมายเหตุ",
    cus_email: "อีเมล",
    cus_address: "ที่อยู่",
  };

  const { field, sort } = sortModel[0];
  const displayField = fieldMap[field] || field;
  const displayDirection = sort === "asc" ? "ascending" : "descending";

  // Use icons to make it more visually clear
  const SortIcon =
    sort === "asc"
      ? () => <span style={{ fontSize: "0.8em", marginRight: "4px" }}>▲</span>
      : () => <span style={{ fontSize: "0.8em", marginRight: "4px" }}>▼</span>;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        padding: "4px 8px",
        borderRadius: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        color: "white",
      }}
    >
      <SortIcon />
      <Typography variant="caption" sx={{ fontWeight: "medium" }}>
        เรียงตาม: {displayField} (
        {displayDirection === "ascending" ? "น้อยไปมาก" : "มากไปน้อย"})
      </Typography>
    </Box>
  );
};

function CustomerList() {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [delCustomer] = useDelCustomerMutation();
  const [updateRecall] = useUpdateRecallMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const dispatch = useDispatch();
  const [totalItems, setTotalItems] = useState(0);
  const itemList = useSelector((state) => state.customer.itemList);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const groupList = useSelector((state) => state.customer.groupList);
  const keyword = useSelector((state) => state.global.keyword);
  const paginationModel = useSelector(
    (state) => state.customer.paginationModel
  );
  const filters = useSelector((state) => state.customer.filters);
  const isLoading = useSelector((state) => state.customer.isLoading);
  const [openDialog, setOpenDialog] = useState(false);
  const [serverSortModel, setServerSortModel] = useState([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    // Default visibility settings - show only the requested columns
    cus_no: false, // Hide ID column
    cus_channel: true, // Show Channel column
    cus_manage_by: true, // Show Sales Name column
    cus_name: true, // Show Customer column
    cus_company: false, // Hide Company column
    cus_tel_1: true, // Show Tel column
    cd_note: true, // Show Note column
    cd_last_datetime: true, // Show Recall column
    cus_created_date: true, // Show Customer Create At column
    cus_email: false, // Hide Email column
    cus_address: false, // Hide Address column
    tools: true, // Show Tools column
  });  // State to track column order
  const [columnOrderModel, setColumnOrderModel] = useState([
    // Define explicit column order as requested
    "cus_channel", // Channel
    "cus_manage_by", // Sales Name
    "cus_name", // Customer
    "cus_tel_1", // Tel
    "cd_note", // Note
    "business_type", // Business Type
    "cd_last_datetime", // Recall
    "cus_created_date", // Customer Create At
    "tools", // Tools
    // Include other columns at the end (they'll be hidden by default)
    "cus_no",
    "cus_company",
    "cus_email",
    "cus_address",
  ]);

  // Get current theme for responsive behavior
  const theme = useTheme();
  const tableContainerRef = useRef(null);

  const { data, error, isFetching, isSuccess } = useGetAllCustomerQuery({
    group: groupSelected,
    page: paginationModel.page,
    per_page: paginationModel.pageSize,
    user_id: user.user_id,
    search: keyword,
    filters: filters,
    sortModel: serverSortModel,
  }); // Scroll to top function
  const scrollToTop = useCallback(() => {
    // Return early if we're in testing mode or SSR environment
    if (typeof window === "undefined") return;

    const scrollOptions = { behavior: "smooth" };

    // First try to scroll the container if it's available
    if (tableContainerRef.current) {
      try {
        // Add a small delay to ensure UI has updated before scrolling
        setTimeout(() => {
          // Scroll the container element to top
          tableContainerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });

          // Also ensure the window is scrolled to show the container at the top
          const containerRect =
            tableContainerRef.current.getBoundingClientRect();
          if (containerRect.top < 0) {
            window.scrollBy({
              top: containerRect.top - 20, // Add a small offset for visual padding
              behavior: "smooth",
            });
          }
        }, 50);
      } catch (error) {
        // Fallback for browsers that don't support smooth scrolling
        console.warn("Smooth scrolling not supported, using fallback", error);
        tableContainerRef.current.scrollIntoView(true);
      }
    } else {
      // Otherwise scroll the window
      try {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (error) {
        // Fallback for browsers that don't support smooth scrolling
        console.warn("Smooth scrolling not supported, using fallback", error);
        window.scrollTo(0, 0);
      }
    }
  }, [tableContainerRef]);

  // Handle changes in the sort model
  const handleSortModelChange = (newModel) => {
    // Only update if the sort model actually changed
    if (JSON.stringify(newModel) !== JSON.stringify(serverSortModel)) {
      setServerSortModel(newModel);
      // Reset to first page when sorting changes
      const newPaginationModel = { ...paginationModel, page: 0 };
      dispatch(setPaginationModel(newPaginationModel));
      // Scroll to top when sorting changes
      scrollToTop();
    }
  };
  // Handle changes to column visibility
  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);

    // Store column visibility in localStorage for persistence between sessions
    try {
      // Add timestamp to track when preferences were last updated
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

  // Handle column order changes
  const handleColumnOrderChange = (newOrder) => {
    setColumnOrderModel(newOrder);

    // Store column order in localStorage for persistence between sessions
    try {
      // Save the column order with metadata
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
  }; // Pagination customize
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
        scrollToTop();
      }
    }, [paginationModel, scrollToTop]);

    // Handle page size change
    const handlePageSizeChange = (newPageSize) => {
      const newModel = { ...paginationModel, pageSize: newPageSize, page: 0 };
      dispatch(setPaginationModel(newModel));
      apiRef.current.setPageSize(newPageSize);
      scrollToTop();
    };
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          width: "100%",
          p: 1,
        }}
      >
        <PageSizeSelector
          value={paginationModel.pageSize}
          onChange={handlePageSizeChange}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "center",
            flex: 1,
          }}
        >
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
            onChange={(event, value) => {
              apiRef.current.setPage(value - 1);
              scrollToTop();
            }}
          />
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: (theme) => theme.vars.palette.grey.dark,
            minWidth: 120,
            textAlign: "right",
          }}
        >
          {`${page * paginationModel.pageSize + 1}-${Math.min(
            (page + 1) * paginationModel.pageSize,
            totalItems
          )} of ${totalItems}`}
        </Typography>
      </Box>
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
          // Scroll to top after deletion is successful
          scrollToTop();
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
          // Scroll to top after recall timer reset is successful
          scrollToTop();
        }
      } catch (error) {
        open_dialog_error(error.message, error);
        console.error(error);
      }
    }
  };

  const handleChangeGroup = async (is_up, params) => {
    // ฟังก์ชันหาค่าไอดีกลุ่มลูกค้าที่ต้องการจะเปลี่ยน
    const groupResult = (() => {
      // Wrap in an IIFE to limit sort scope
      const targetGroup = groupList.find(
        (group) => group.mcg_id === params.cus_mcg_id
      );

      if (!targetGroup) {
        return []; // Return empty array if target group not found
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
          // Scroll to top after group change is successful
          scrollToTop();
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
      if (!matchGroup) return true; // Disable if matchGroup is not found

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
        height: "100%",
        color: "gray",
      }}
    >
      <Typography sx={{ fontSize: 18 }}>No data found.</Typography>
    </Box>
  ); // Load saved column visibility and order settings from localStorage
  useEffect(() => {
    try {
      // Load column visibility settings
      const savedVisibilityPrefs = localStorage.getItem(
        "customerTableColumnVisibility"
      );
      if (savedVisibilityPrefs) {
        const savedPrefs = JSON.parse(savedVisibilityPrefs);

        // Check if we have the new format with metadata
        const savedModel = savedPrefs.model || savedPrefs;

        // Apply the saved visibility settings
        setColumnVisibilityModel(savedModel);

        console.log(
          `Loaded column visibility preferences${
            savedPrefs.username ? " for " + savedPrefs.username : ""
          }, ` +
            `last saved: ${
              savedPrefs.timestamp
                ? new Date(savedPrefs.timestamp).toLocaleString()
                : "unknown"
            }`
        );
      }

      // Load column order settings
      const savedOrderPrefs = localStorage.getItem("customerTableColumnOrder");
      if (savedOrderPrefs) {
        const savedOrderData = JSON.parse(savedOrderPrefs);

        // Check if we have the new format with metadata
        const savedOrder = savedOrderData.order || savedOrderData;

        // Apply the saved order settings
        setColumnOrderModel(savedOrder);

        console.log(
          `Loaded column order preferences${
            savedOrderData.username ? " for " + savedOrderData.username : ""
          }, ` +
            `last saved: ${
              savedOrderData.timestamp
                ? new Date(savedOrderData.timestamp).toLocaleString()
                : "unknown"
            }`
        );
      }
    } catch (error) {
      console.warn("Failed to load saved column settings", error);
    }
  }, []);

  // Apply responsive behavior to automatically hide columns on smaller screens
  // We only apply this if there are no saved user preferences
  const isSmall = useMediaQuery(theme.breakpoints.down("md")); // md = 900px
  const isExtraSmall = useMediaQuery(theme.breakpoints.down("sm")); // sm = 600px

  useEffect(() => {
    // Only apply responsive behavior if no user preferences exist
    const hasSavedPreferences = localStorage.getItem(
      "customerTableColumnVisibility"
    );

    if (!hasSavedPreferences) {
      // Start with default visibility
      const responsiveVisibility = {
        cus_email: false,
        cus_address: false,
      };

      // On small screens, hide less important columns
      if (isSmall) {
        responsiveVisibility.cus_company = false;
        responsiveVisibility.cd_note = false;
      }

      // On extra small screens, hide even more columns
      if (isExtraSmall) {
        responsiveVisibility.cus_channel = false;
      }

      setColumnVisibilityModel((prev) => ({
        ...prev,
        ...responsiveVisibility,
      }));
    }
  }, [isSmall, isExtraSmall]);
  useEffect(() => {
    if (isSuccess) {
      if (data.status === "error") {
        open_dialog_error("Fetch customer error", data.message);
      } else if (data.data) {
        // Debug log to see the structure of the data
        console.log(
          "Customer Data Sample:",
          data.data.length > 0 ? data.data[0] : "No data"
        );

        dispatch(setItemList(data.data));
        dispatch(setGroupList(data.groups));
        dispatch(setTotalCount(data.total_count));
        setTotalItems(data.pagination.total_items);

        // Check if this is a data refresh caused by operations other than pagination/sorting
        // If the page is 0 and we have a previous different data set, scroll to top
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
  }, [data, groupSelected, scrollToTop, paginationModel.page, itemList]);
  const columns = useMemo(
    () => [
      {
        field: "cus_no",
        headerName: "ID",
        width: 120,
        sortable: true,
        renderCell: (params) => <span>{params.value}</span>,
      },      {
        field: "cus_channel",
        headerName: "CHANNEL",
        width: 120,
        sortable: true,
        cellClassName: "uppercase-cell",
        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Chip
              label={channelMap[params.value]}
              size="small"
              sx={{
                textTransform: "uppercase",
                backgroundColor: (theme) =>
                  params.value === 1
                    ? theme.palette.info.light
                    : params.value === 2
                    ? theme.palette.success.light
                    : theme.palette.warning.light,
                color: (theme) => theme.palette.common.white,
                fontWeight: "bold",
              }}
            />
          </Box>
        ),
      },
      {
        field: "cus_manage_by",
        headerName: "SALES NAME",
        sortable: true,
        width: 160,
        cellClassName: "uppercase-cell",
        hideable: false,
        renderCell: (params) => {
          return (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography variant="body2" sx={{ textTransform: "uppercase" }}>
                {params.value.username}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "cus_name",
        headerName: "CUSTOMER",
        width: 200,
        sortable: true,
        renderCell: (params) => {
          const fullName = params.value;
          const company = params.row.cus_company || "";

          // Create a simple, readable tooltip text that includes both name and company
          const tooltipText = company ? `${fullName}\n${company}` : fullName;

          return (
            <Tooltip
              title={tooltipText}
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: "rgba(0, 0, 0, 0.8)",
                    "& .MuiTooltip-arrow": {
                      color: "rgba(0, 0, 0, 0.8)",
                    },
                    fontSize: "0.875rem",
                    padding: "8px 12px",
                    maxWidth: "400px",
                    whiteSpace: "pre-line",
                  },
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {fullName}
                </Typography>
                {params.row.cus_company && (
                  <Typography variant="caption" color="text.secondary">
                    {params.row.cus_company}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        },
      },
      {
        field: "cus_company",
        headerName: "COMPANY NAME",
        width: 280,
        sortable: true,
        renderCell: (params) => {
          return <span>{params.value || "—"}</span>;
        },
      },
      {
        field: "cus_tel_1",
        headerName: "TEL",
        width: 140,
        sortable: true,
        renderCell: (params) => {
          const tel1 = params.value;
          const tel2 = params.row.cus_tel_2;

          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography variant="body2">{tel1 || "—"}</Typography>
              {tel2 && (
                <Typography variant="caption" color="text.secondary">
                  {tel2}
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: "cd_note",
        headerName: "NOTE",
        width: 280,
        sortable: true,
        renderCell: (params) => (
          <Tooltip
            title={params.value || "No notes"}
            placement="top-start"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                  "& .MuiTooltip-arrow": {
                    color: "rgba(0, 0, 0, 0.8)",
                  },
                  fontSize: "0.875rem",
                  padding: "8px 12px",
                  maxWidth: "400px",
                },
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 260,
                textAlign: "left",
              }}
            >
              {params.value || "—"}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: "business_type",
        headerName: "BUSINESS TYPE",
        width: 180,
        sortable: true,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 160,
              textAlign: "left",
            }}
          >
            {params.value || "—"}
          </Typography>
        ),
      },
      {
        field: "cd_last_datetime",
        headerName: "RECALL",
        width: 140,
        sortable: true,
        renderCell: (params) => {
          const daysLeft = formatCustomRelativeTime(params.value);
          return (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: daysLeft <= 15 ? "bold" : "normal",
                  color:
                    daysLeft <= 7
                      ? "error.main"
                      : daysLeft <= 15
                      ? "warning.main"
                      : "inherit",
                }}
              >
                {`${daysLeft} DAYS`}
              </Typography>
            </Box>
          );
        },
        cellClassName: (params) => {
          const daysLeft = formatCustomRelativeTime(params.value);
          if (daysLeft <= 7) {
            return "danger-days";
          } else if (daysLeft <= 15) {
            return "warning-days";
          }
        },
      },
      {
        field: "cus_created_date",
        headerName: "CUSTOMER CREATE AT",
        width: 180,
        sortable: true,
        renderCell: (params) => {
          // Check if the value exists and is a valid date
          const isValidDate =
            params.value && !isNaN(new Date(params.value).getTime());

          // Format the date for display
          const date = isValidDate ? new Date(params.value) : null;
          const formattedDate = date
            ? date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "—";

          return (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography variant="body2">{formattedDate}</Typography>
            </Box>
          );
        },
      },
      {
        field: "cus_email",
        headerName: "EMAIL",
        width: 200,
        sortable: true,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 180,
            }}
          >
            {params.value || "—"}
          </Typography>
        ),
      },
      {
        field: "cus_address",
        headerName: "ADDRESS",
        width: 200,
        sortable: true,
        renderCell: (params) => {
          const address = params.value;
          const province = params.row.province_name;
          const district = params.row.district_name;

          const fullAddress = [address, district, province]
            .filter(Boolean)
            .join(", ");

          return (
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 180,
                textAlign: "left",
              }}
            >
              {fullAddress || "—"}
            </Typography>
          );
        },
      },
      {
        field: "tools",
        headerName: "TOOLS",
        flex: 1,
        minWidth: 280,
        sortable: false,
        type: "actions",
        getActions: (params) => [
          <GridActionsCellItem
            icon={<PiClockClockwise style={{ fontSize: 22 }} />}
            label="Recall"
            onClick={() => handleRecall(params.row)}
            showInMenu={false}
            tooltipText="Reset recall timer"
          />,
          handleDisableChangeGroupBtn(true, params.row) ? (
            // If button is disabled, don't use tooltip
            <GridActionsCellItem
              icon={<PiArrowFatLinesUpFill style={{ fontSize: 22 }} />}
              label="Change Grade Up"
              onClick={() => {}}
              disabled={true}
            />
          ) : (
            <GridActionsCellItem
              icon={<PiArrowFatLinesUpFill style={{ fontSize: 22 }} />}
              label="Change Grade Up"
              onClick={() => handleChangeGroup(true, params.row)}
              disabled={false}
              showInMenu={false}
              tooltipText="Change grade up"
            />
          ),
          handleDisableChangeGroupBtn(false, params.row) ||
          user.role !== "admin" ? (
            // If button is disabled, don't use tooltip
            <GridActionsCellItem
              icon={<PiArrowFatLinesDownFill style={{ fontSize: 22 }} />}
              label="Change Grade Down"
              onClick={() => {}}
              disabled={true}
              sx={{ visibility: user.role !== "admin" ? "hidden" : "visible" }}
            />
          ) : (
            <GridActionsCellItem
              icon={<PiArrowFatLinesDownFill style={{ fontSize: 22 }} />}
              label="Change Grade Down"
              onClick={() => handleChangeGroup(false, params.row)}
              disabled={false}
              showInMenu={false}
              tooltipText="Change grade down"
            />
          ),
          <GridActionsCellItem
            icon={<MdOutlineManageSearch style={{ fontSize: 26 }} />}
            label="View"
            onClick={() => handleOpenDialog("view", params.id)}
            showInMenu={false}
            tooltipText="View details"
          />,
          <GridActionsCellItem
            icon={<CiEdit style={{ fontSize: 26 }} />}
            label="Edit"
            onClick={() => handleOpenDialog("edit", params.id)}
            showInMenu={false}
            tooltipText="Edit customer"
          />,
          <GridActionsCellItem
            icon={<BsTrash3 style={{ fontSize: 22 }} />}
            label="Delete"
            onClick={() => handleDelete(params.row)}
            showInMenu={false}
            tooltipText="Delete customer"
          />,
        ],
      },
    ],
    [
      handleOpenDialog,
      handleDelete,
      handleRecall,
      handleChangeGroup,
      handleDisableChangeGroupBtn,
      user.role,
    ]
  );

  // Custom toolbar component
  function CustomToolbar() {
    return (
      <GridToolbarContainer>
        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: "common.white",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              mr: 2,
            }}
          >
            รายการลูกค้า
          </Typography>
          <SortInfoDisplay sortModel={serverSortModel} />
        </Box>{" "}
        <Box sx={{ display: "flex", gap: 1 }}>
          <ColumnVisibilitySelector columns={columns} />
        </Box>
      </GridToolbarContainer>
    );
  }

  return (
    <ScrollContext.Provider value={{ scrollToTop }}>
      <div className="customer-list">
        <DialogForm
          openDialog={openDialog}
          handleCloseDialog={handleCloseDialog}
          handleRecall={handleRecall}
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
          {/* Button on top table */}{" "}
          <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
            {(user.role === "sale" || user.role === "admin") && (
              <Button
                variant="icon-contained"
                color="grey"
                onClick={() => handleOpenDialog("create")}
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
          {/* Advanced Filter Panel */}
          <FilterPanel />
          {/* Filter Tags - Shows active filters */}
          <FilterTags />{" "}
          <Box
            sx={{
              height: "auto",
              minHeight: Math.min(500, totalItems * 60 + 120), // Dynamically adjust height based on content
              maxHeight: 800, // Cap the maximum height
              width: "100%",
              "& .MuiDataGrid-main": {
                overflow: "hidden",
              },
              "& .MuiDataGrid-root": {
                transition: "height 0.3s ease",
              },
            }}
          >
            <StyledDataGrid
              disableRowSelectionOnClick
              paginationMode="server"
              sortingMode="server"
              rows={itemList}
              columns={columns}
              getRowId={(row) => row.cus_id}              initialState={{
                  pagination: { paginationModel },
                  sorting: { sortModel: serverSortModel },
                  columns: {
                    columnVisibilityModel: {
                      cus_no: false, // Hide ID column
                      cus_channel: true, // Show Channel column
                      business_type: true, // Show Business Type column
                      cus_manage_by: true, // Show Sales Name column
                      cus_name: true, // Show Customer column
                      cus_company: false, // Hide Company column
                      cus_tel_1: true, // Show Tel column
                      cd_note: true, // Show Note column
                    cd_last_datetime: true, // Show Recall column
                    cus_created_date: true, // Show Customer Create At column
                    cus_email: false, // Hide Email column
                    cus_address: false, // Hide Address column
                    tools: true, // Show Tools column
                  },
                  columnOrder: columnOrderModel,
                },
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
                pagination: CustomPagination,
                toolbar: CustomToolbar,
              }}
              sx={{ border: 0 }}
              rowHeight={60}
              columnHeaderHeight={50}
              getRowClassName={(params) => {
                // Add extra classes for styling rows based on data
                const classes = [];
                if (params.indexRelativeToCurrentPage % 2 === 0) {
                  classes.push("even-row");
                } else {
                  classes.push("odd-row");
                } // Add warning class if recall is approaching based on requirements
                const daysLeft = formatCustomRelativeTime(
                  params.row.cd_last_datetime
                );
                if (daysLeft <= 7) {
                  classes.push("high-priority-row"); // Red background for <= 7 days
                } else if (daysLeft <= 15) {
                  classes.push("medium-priority-row"); // Yellow background for <= 15 days
                }

                return classes.join(" ");
              }}
            />{" "}
          </Box>
        </Box>

        {/* Floating button to scroll to top */}
        <ScrollTopButton />
      </div>
    </ScrollContext.Provider>
  );
}

export default CustomerList;
