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
import moment from "moment";
import { PiClockClockwise } from "react-icons/pi";
import { PiArrowFatLinesUpFill, PiArrowFatLinesDownFill } from "react-icons/pi";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  useGetAllCustomerQuery,
  useDelCustomerMutation,
  useUpdateRecallMutation,
  useUpdateCustomerMutation,
  useChangeGradeMutation,
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
import ErrorBoundary from "../../components/ErrorBoundary";
import PageSizeSelector from "./components/CustomerList/PageSizeSelector";
import SortInfoDisplay from "./components/CustomerList/SortInfoDisplay";
import CustomPagination from "./components/CustomerList/CustomPagination";
import CustomToolbar from "./components/CustomerList/CustomToolbar";
import NoDataOverlay from "./components/CustomerList/NoDataOverlay";
import useCustomerColumns from "./components/CustomerList/useCustomerColumns";

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  "& .MuiDataGrid-columnHeader": {
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.common.white,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: theme.palette.error.main,
    },
  },

  "& .MuiDataGrid-columnHeaderTitleContainer": {
    justifyContent: "center",
    fontSize: "0.95rem",
    fontWeight: "bold",
    letterSpacing: "0.5px",
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
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: theme.vars.palette.grey.light,
      transform: "translateY(-2px)",
      boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
    },
  },
  "& .MuiDataGrid-cell, .MuiDataGrid-filler > div": {
    textAlign: "center",
    borderWidth: 0,
    color: theme.vars.palette.grey.dark,
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    fontSize: "0.95rem",
    transition: "all 0.15s ease-in-out",
    position: "relative",
    "&:hover": {
      transform: "scale(1.02)",
    },
    "&:focus": {
      outline: "none",
      backgroundColor: `${theme.palette.primary.light}11`,
    },
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "10%",
      width: "80%",
      height: "1px",
      backgroundColor: `${theme.palette.divider}`,
      opacity: 0.5,
    },
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
    padding: "4px 8px",
    borderRadius: "12px",
    backgroundColor: `${theme.palette.error.light}22`,
  },

  "& .warning-days": {
    color: theme.vars.palette.warning.main,
    fontWeight: "bold",
    padding: "4px 8px",
    borderRadius: "12px",
    backgroundColor: `${theme.palette.warning.light}22`,
  },
  "& .MuiDataGrid-toolbarContainer": {
    gap: 2,
    padding: "12px 20px",
    justifyContent: "space-between",
    backgroundColor: theme.palette.error.dark,
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
    marginBottom: 10,
    borderBottom: "2px solid rgba(255,255,255,0.1)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  // Animations for visual appeal
  "@keyframes glow-border": {
    "0%": {
      boxShadow: `0 0 5px rgba(244, 67, 54, 0.5), inset 0 0 5px rgba(244, 67, 54, 0.1)`,
    },
    "50%": {
      boxShadow: `0 0 20px rgba(244, 67, 54, 0.8), inset 0 0 10px rgba(244, 67, 54, 0.3)`,
    },
    "100%": {
      boxShadow: `0 0 5px rgba(244, 67, 54, 0.5), inset 0 0 5px rgba(244, 67, 54, 0.1)`,
    },
  },

  // Subtle pulse animation for attention
  "@keyframes subtle-pulse": {
    "0%, 100%": {
      opacity: 1,
      transform: "scale(1)",
    },
    "50%": {
      opacity: 0.95,
      transform: "scale(1.02)",
    },
  },

  // Left indicator animation
  "@keyframes slide-in-left": {
    from: {
      transform: "translateX(-100%)",
      opacity: 0,
    },
    to: {
      transform: "translateX(0)",
      opacity: 1,
    },
  },
  // Highlight rows based on recall days
  "& .high-priority-row": {
    backgroundColor: `${theme.palette.error.light}33`, // 20% opacity red for <= 7 days
    animation: "glow-border 2s ease-in-out infinite",
    border: `2px solid ${theme.palette.error.main}`,
    borderRadius: theme.shape.borderRadius,
    position: "relative",
    zIndex: 1,
    "&:hover": {
      backgroundColor: `${theme.palette.error.light}66`, // 40% opacity
      transform: "translateY(-3px)",
      boxShadow: `0 6px 12px ${theme.palette.error.light}66`,
    },
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: -8,
      height: "100%",
      width: "4px",
      backgroundColor: theme.palette.error.main,
      borderRadius: "2px",
    },
  },

  "& .medium-priority-row": {
    backgroundColor: `${theme.palette.warning.light}33`, // 20% opacity yellow for <= 15 days
    border: `1px solid ${theme.palette.warning.main}66`,
    borderRadius: theme.shape.borderRadius,
    position: "relative",
    zIndex: 0,
    "&:hover": {
      backgroundColor: `${theme.palette.warning.light}66`, // 40% opacity
      transform: "translateY(-2px)",
      boxShadow: `0 4px 10px ${theme.palette.warning.light}66`,
    },
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: -8,
      height: "100%",
      width: "4px",
      backgroundColor: theme.palette.warning.main,
      borderRadius: "2px",
    },
  },
}));

// Custom component for page size selection

function CustomerList() {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [delCustomer] = useDelCustomerMutation();
  const [updateRecall] = useUpdateRecallMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const [changeGrade] = useChangeGradeMutation();
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
  }); // State to track column order
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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  // Get the scroll context
  const scrollRef = useRef(null);
  
  // Add table container ref for scrolling
  const tableContainerRef = useRef(null);
  
  // Function to help with row identification for the DataGrid
  const getRowId = (row) => {
    return row.cus_id || row.id || `row-${Math.random().toString(36).substring(2, 15)}`;
  };
  
  // Create a wrapper for the DataGrid
  const DataGridWithRowIdFix = (props) => {
    return <StyledDataGrid {...props} getRowId={getRowId} />;
  };

  const { data, error, isFetching, isSuccess, refetch } =
    useGetAllCustomerQuery({
      group: groupSelected,
      page: paginationModel.page,
      per_page: paginationModel.pageSize,
      user_id: user.user_id,
      search: keyword,
      filters: filters,
      sortModel: serverSortModel,
    });  // Scroll to top function
  const scrollToTop = useCallback(() => {
    // Return early if we're in testing mode or SSR environment
    if (typeof window === "undefined") return;

    try {
      // First try to scroll the container if it's available and properly initialized
      if (tableContainerRef && tableContainerRef.current) {
        // Add a small delay to ensure UI has updated before scrolling
        setTimeout(() => {
          try {
            // Scroll the container element to top
            tableContainerRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "nearest",
            });

            // Also ensure the window is scrolled to show the container at the top
            const containerRect = tableContainerRef.current.getBoundingClientRect();
            if (containerRect.top < 0) {
              window.scrollBy({
                top: containerRect.top - 20, // Add a small offset for visual padding
                behavior: "smooth",
              });
            }
          } catch (innerError) {
            // Fallback for browsers that don't support smooth scrolling
            console.warn("Smooth scrolling not supported in timeout, using fallback", innerError);
            if (tableContainerRef.current) {
              tableContainerRef.current.scrollIntoView(true);
            } else {
              window.scrollTo(0, 0);
            }
          }
        }, 50);
      } else {
        // Otherwise scroll the window
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    } catch (error) {
      // Ultimate fallback for any errors
      console.warn("Error in scrollToTop, using basic fallback", error);
      try {
        window.scrollTo(0, 0);
      } catch (finalError) {
        console.error("Failed to scroll to top", finalError);
      }
    }
  }, []); // Empty dependency array since tableContainerRef is stable
  // Handle changes in the sort model
  const handleSortModelChange = (newModel) => {
    // Only update if the sort model actually changed
    if (JSON.stringify(newModel) !== JSON.stringify(serverSortModel)) {
      // Map business_type to cus_bt_id for sorting
      const processedModel = newModel.map((item) => {
        if (item.field === "business_type") {
          return { ...item, field: "cus_bt_id" };
        }
        return item;
      });

      setServerSortModel(processedModel);
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
  // CustomPagination component moved to separate file
  const handleOpenDialog = (mode, cus_id = null) => {
    // First, reset the input list to avoid any stale data
    dispatch(resetInputList());

    // Then load the data if it's not create mode
    if (mode !== "create" && cus_id) {
      const itemFill = itemList.find((item) => item.cus_id === cus_id);

      if (itemFill) {
        // Ensure cus_manage_by is properly formatted as an object
        let managedBy = { user_id: "", username: "" };

        if (itemFill.cus_manage_by) {
          if (
            typeof itemFill.cus_manage_by === "object" &&
            itemFill.cus_manage_by.user_id
          ) {
            managedBy = {
              user_id: String(itemFill.cus_manage_by.user_id),
              username: itemFill.cus_manage_by.username || "",
            };
          } else if (
            typeof itemFill.cus_manage_by === "string" ||
            typeof itemFill.cus_manage_by === "number"
          ) {
            managedBy = {
              user_id: String(itemFill.cus_manage_by),
              username: "",
            };
          }
        }

        const formattedItem = {
          ...itemFill,
          cus_manage_by: managedBy,
        };

        // Set the input data
        dispatch(setInputList(formattedItem));

        // Set location search if province/district data is available
        if (itemFill.province_sort_id || itemFill.district_sort_id) {
          dispatch(
            setLocationSearch({
              province_sort_id: itemFill.province_sort_id || "",
              district_sort_id: itemFill.district_sort_id || "",
            })
          );
        }

      } else {
        console.warn(`Customer with ID ${cus_id} not found in itemList`);
      }
    }

    // Set mode and open dialog
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
    // Determine the direction of grade change
    const direction = is_up ? "up" : "down";

    // Get current grade information for display
    const currentGroup = groupList.find(
      (group) => group.mcg_id === params.cus_mcg_id
    );
    const currentGrade = currentGroup ? currentGroup.mcg_name : "?";

    // Get target grade for display
    let targetGrade = "?";
    if (currentGroup) {
      const targetSort = currentGroup.mcg_sort + (is_up ? -1 : 1);
      const targetGroup = groupList.find(
        (group) => group.mcg_sort === targetSort
      );
      if (targetGroup) {
        targetGrade = targetGroup.mcg_name;
      }
    }

    const gradeChangeText = is_up
      ? `เปลี่ยนเกรดขึ้นจาก ${currentGrade} เป็น ${targetGrade}`
      : `เปลี่ยนเกรดลงจาก ${currentGrade} เป็น ${targetGrade}`;

    const confirmed = await swal_delete_by_id(
      `กรุณายืนยันการเปลี่ยนเกรดของ ${params.cus_name}: ${gradeChangeText}`
    );

    if (confirmed) {
      open_dialog_loading();

      try {
        // Use the RTK Query mutation instead of axios
        const res = await changeGrade({
          customerId: params.cus_id,
          direction: direction,
        }).unwrap();

        if (res.status === "success") {
          open_dialog_ok_timer(
            `เปลี่ยนเกรดสำเร็จ จาก ${res.data.old_grade} เป็น ${res.data.new_grade}`
          );
          // Reload data after grade change by refetching the current query
          refetch();
          // Scroll to top after group change is successful
          scrollToTop();
        }
      } catch (error) {
        open_dialog_error(error.data?.message || error.message, error);
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

      // For upgrade button (D → C → B → A): disable when at grade A (sort = 1)
      // For downgrade button (A → B → C → D): disable when at grade D (sort = 4)
      const minSort = 1; // Grade A has sort = 1
      const maxSort = 4; // Grade D has sort = 4

      if (is_up) {
        // Disable upgrading when already at highest grade (A)
        return matchGroup.mcg_sort <= minSort;
      } else {
        // Disable downgrading when already at lowest grade (D)
        return matchGroup.mcg_sort >= maxSort;
      }
    },
    [groupList]
  );
  // Render when not found data handled by NoDataOverlay component
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

      }

      // Load column order settings
      const savedOrderPrefs = localStorage.getItem("customerTableColumnOrder");
      if (savedOrderPrefs) {
        const savedOrderData = JSON.parse(savedOrderPrefs);

        // Check if we have the new format with metadata
        const savedOrder = savedOrderData.order || savedOrderData;

        // Apply the saved order settings
        setColumnOrderModel(savedOrder);

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
  }, [isSmall, isExtraSmall]);  useEffect(() => {
    if (isSuccess) {
      if (data.status === "error") {
        open_dialog_error("Fetch customer error", data.message);
      } else if (data.data) {
        // อัพเดทข้อมูลลูกค้าในรายการ
        dispatch(setItemList(data.data));
        
        // อัพเดทข้อมูลกลุ่มลูกค้า (เฉพาะเมื่อไม่มีการกรองข้อมูล)
        // ถ้ามีการกรอง FilterTab จะคำนวณจำนวนจาก itemList เอง
        const hasActiveFilters = 
          filters.dateRange.startDate || 
          filters.dateRange.endDate || 
          (filters.salesName && filters.salesName.length > 0) || 
          (filters.channel && filters.channel.length > 0);
          
        // อัพเดทข้อมูลกลุ่มเฉพาะเมื่อไม่มีการกรอง หรือเมื่อมีข้อมูลกลุ่มใหม่จาก API
        if (!hasActiveFilters || data.groups) {
          dispatch(setGroupList(data.groups));
        }
        
        // อัพเดทจำนวนทั้งหมด
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
  const columns = useCustomerColumns({
    handleOpenDialog,
    handleDelete,
    handleRecall,
    handleChangeGroup,
    handleDisableChangeGroupBtn,
    userRole: user.role,
  });

  // CustomToolbar component moved to separate file

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
          >            <DataGridWithRowIdFix
              disableRowSelectionOnClick
              paginationMode="server"
              sortingMode="server"
              rows={itemList}
              columns={columns}
              componentsProps={{
                row: {
                  style: { cursor: "pointer" },
                },
              }}
              initialState={{
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
                noRowsOverlay: NoDataOverlay,
                pagination: CustomPagination,
                toolbar: CustomToolbar,
              }}
              slotProps={{
                pagination: {
                  paginationModel,
                  setPaginationModel: (model) => dispatch(setPaginationModel(model)),
                  totalItems,
                  scrollToTop,
                },
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
              onRowClick={(params) => handleOpenDialog("view", params.id)}
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
