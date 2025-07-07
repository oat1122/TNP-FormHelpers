import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  GridActionsCellItem,
  useGridApiContext,
  useGridSelector,
  gridPageCountSelector,
  gridPageSelector,
} from "@mui/x-data-grid";
import {
  Box,
  Button,
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
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
} from "@mui/material";
import { MdOutlineManageSearch, MdMoreVert, MdFileDownload } from "react-icons/md";
import { RiAddLargeFill } from "react-icons/ri";
import { CiEdit } from "react-icons/ci";
import { BsTrash3, BsEye } from "react-icons/bs";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";
import moment from "moment";
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// API and State
import { 
  useMaxSupplyList, 
  useDeleteMaxSupply,
  useUpdateMaxSupplyStatus
} from "../../features/MaxSupply/maxSupplyApi";
import { useMaxSupplyStore } from "../../features/MaxSupply/maxSupplySlice";
import { 
  getStatusConfig, 
  getPriorityConfig, 
  formatDate,
  exportToCSV 
} from "../../features/MaxSupply/maxSupplyUtils";

// Components
import TitleBar from "../../components/TitleBar";
import StyledDataGrid from "../../components/StyledDataGrid";
import FilterTab from "./FilterTab";
import AuditDialog from "./components/AuditDialog";

// Utils
import { swal_delete_by_id } from "../../utils/dialog_swal2/dialog_delete_by_id";
import {
  open_dialog_ok_timer,
  open_dialog_error,
  dialog_confirm_yes_no,
} from "../../utils/import_lib";

// Styled components
const StyledPagination = styled(Pagination)(({ theme }) => ({
  "& .MuiPaginationItem-root": {
    color: theme.vars.palette.text.primary,
    fontWeight: 500,
    "&.Mui-selected": {
      backgroundColor: theme.vars.palette.error.main,
      color: theme.vars.palette.error.contrastText,
      "&:hover": {
        backgroundColor: theme.vars.palette.error.dark,
      },
    },
    "&:hover": {
      backgroundColor: theme.vars.palette.action.hover,
    },
  },
}));

// Custom pagination component
function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <StyledPagination
      color="primary"
      variant="outlined"
      shape="rounded"
      page={page + 1}
      count={pageCount}
      renderItem={(props) => (
        <PaginationItem
          slots={{
            previous: FaChevronLeft,
            next: FaChevronRight,
          }}
          {...props}
        />
      )}
      onChange={(event, value) => apiRef.current.setPage(value - 1)}
    />
  );
}

function MaxSupplyList() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  
  // Zustand store
  const {
    itemList,
    filters,
    paginationModel,
    totalCount,
    setItemList,
    setFilters,
    setPaginationModel,
    setTotalCount,
  } = useMaxSupplyStore();

  // API hooks - Tanstack Query
  const queryParams = {
    status: filters.status !== 'all' ? filters.status : undefined,
    priority: filters.priority !== 'all' ? filters.priority : undefined,
    page: paginationModel.page + 1, // API expects 1-based pagination
    per_page: paginationModel.pageSize,
    search: filters.search,
    start_date: filters.dateRange.startDate,
    end_date: filters.dateRange.endDate,
  };

  const { data, error, isLoading, isFetching, isSuccess, refetch } = useMaxSupplyList(queryParams);
  const deleteMaxSupplyMutation = useDeleteMaxSupply();
  const updateStatusMutation = useUpdateMaxSupplyStatus();

  // Handle API response
  useEffect(() => {
    if (isSuccess && data?.success) {
      setItemList(data.data.data || []);
      setTotalCount(data.data.total || 0);
    } else if (error) {
      toast.error(error?.message || "ไม่สามารถโหลดข้อมูลได้");
    }
  }, [data, error, isSuccess, setItemList, setTotalCount]);

  // Action handlers
  const handleCreate = () => {
    navigate("/max-supply/create");
  };

  const handleEdit = useCallback((id) => {
    navigate(`/max-supply/edit/${id}`);
  }, [navigate]);

  const handleView = useCallback((id) => {
    navigate(`/max-supply/view/${id}`);
  }, [navigate]);

  const handleDelete = useCallback(async (id) => {
    const item = itemList.find(item => item.id === id);
    if (!item) return;

    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบงานผลิต "${item.production_code}" หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await deleteMaxSupplyMutation.mutateAsync(id);
        toast.success("ลบข้อมูลเรียบร้อยแล้ว");
        refetch();
      } catch (error) {
        toast.error(error?.message || "ไม่สามารถลบข้อมูลได้");
      }
    }
  }, [itemList, deleteMaxSupplyMutation, refetch]);

  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      toast.success("อัปเดตสถานะเรียบร้อยแล้ว");
      refetch();
    } catch (error) {
      toast.error(error?.message || "ไม่สามารถอัปเดตสถานะได้");
    }
  }, [updateStatusMutation, refetch]);

  const handleAuditLog = useCallback((item) => {
    setSelectedItem(item);
    setAuditDialogOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    if (itemList.length === 0) {
      open_dialog_error("ไม่มีข้อมูล", "ไม่มีข้อมูลสำหรับการส่งออก");
      return;
    }
    exportToCSV(itemList, "max-supply-list");
    open_dialog_ok_timer("สำเร็จ", "ส่งออกข้อมูลเรียบร้อยแล้ว");
  }, [itemList]);

  // Menu handlers
  const handleMenuOpen = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  // DataGrid columns
  const columns = useMemo(() => [
    {
      field: "production_code",
      headerName: "รหัสการผลิต",
      width: 160,
      renderCell: (params) => (
        <Box sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: "customer_name",
      headerName: "ลูกค้า",
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Box sx={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {params.value}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "product_name",
      headerName: "สินค้า",
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Box sx={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {params.value}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "quantity",
      headerName: "จำนวน",
      width: 100,
      type: "number",
      renderCell: (params) => (
        <Box sx={{ textAlign: 'right', width: '100%' }}>
          {params.value?.toLocaleString()}
        </Box>
      ),
    },
    {
      field: "print_points",
      headerName: "จุดพิมพ์",
      width: 120,
      type: "number",
      renderCell: (params) => (
        <Box sx={{ textAlign: 'right', width: '100%', fontWeight: 'bold' }}>
          {params.value?.toFixed(2)}
        </Box>
      ),
    },
    {
      field: "start_date",
      headerName: "วันที่เริ่ม",
      width: 120,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: "end_date",
      headerName: "วันที่สิ้นสุด",
      width: 120,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: "status",
      headerName: "สถานะ",
      width: 140,
      renderCell: (params) => {
        const config = getStatusConfig(params.value);
        return (
          <Chip
            label={config.label}
            size="small"
            sx={{
              backgroundColor: config.bgColor,
              color: config.textColor,
              fontWeight: 'bold',
              fontSize: '0.75rem',
            }}
          />
        );
      },
    },
    {
      field: "priority",
      headerName: "ความสำคัญ",
      width: 120,
      renderCell: (params) => {
        const config = getPriorityConfig(params.value);
        return (
          <Chip
            label={config.label}
            size="small"
            sx={{
              backgroundColor: config.bgColor,
              color: config.textColor,
              fontWeight: 'bold',
              fontSize: '0.75rem',
            }}
          />
        );
      },
    },
    {
      field: "created_at",
      headerName: "วันที่สร้าง",
      width: 120,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "จัดการ",
      width: 80,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <IconButton size="small" onClick={(e) => handleMenuOpen(e, params.row)}>
              <MdMoreVert />
            </IconButton>
          }
          label="เมนู"
        />,
      ],
    },
  ], []);

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress color="error" size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <TitleBar title="จัดการงานผลิต Max Supply" />
      
      <Box sx={{ p: 3 }}>
        {/* Filter Section */}
        <FilterTab />
        
        {/* Action Buttons */}
        <TableContainer>
          <Table sx={{ marginBottom: 2 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ padding: 0, border: 0 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleCreate}
                      startIcon={<RiAddLargeFill />}
                      sx={{ height: 40 }}
                    >
                      เพิ่มงานใหม่
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={() => refetch()}
                      startIcon={<IoMdRefresh />}
                      sx={{ height: 40 }}
                    >
                      รีเฟรช
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={handleExport}
                      startIcon={<MdFileDownload />}
                      sx={{ height: 40 }}
                      disabled={itemList.length === 0}
                    >
                      ส่งออกข้อมูล
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Data Grid */}
        <StyledDataGrid
          rows={itemList}
          columns={columns}
          loading={isFetching}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={totalCount}
          pageSizeOptions={[10, 15, 25, 50]}
          paginationMode="server"
          sortingMode="server"
          filterMode="server"
          disableColumnFilter
          disableColumnSelector
          disableDensitySelector
          slots={{
            pagination: CustomPagination,
          }}
          sx={{
            minHeight: 400,
            '& .MuiDataGrid-row:hover': {
              backgroundColor: theme.vars.palette.action.hover,
            },
          }}
          getRowId={(row) => row.id}
          initialState={{
            pagination: {
              paginationModel: paginationModel,
            },
          }}
        />

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              borderRadius: 2,
            }
          }}
        >
          <MenuItem onClick={() => {
            handleView(selectedItem?.id);
            handleMenuClose();
          }}>
            <BsEye style={{ marginRight: 8 }} />
            ดูรายละเอียด
          </MenuItem>
          
          <MenuItem onClick={() => {
            handleEdit(selectedItem?.id);
            handleMenuClose();
          }}>
            <CiEdit style={{ marginRight: 8 }} />
            แก้ไข
          </MenuItem>
          
          <MenuItem onClick={() => {
            handleAuditLog(selectedItem);
            handleMenuClose();
          }}>
            <MdOutlineManageSearch style={{ marginRight: 8 }} />
            ประวัติการแก้ไข
          </MenuItem>
          
          <MenuItem 
            onClick={() => {
              handleDelete(selectedItem?.id);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <BsTrash3 style={{ marginRight: 8 }} />
            ลบ
          </MenuItem>
        </Menu>

        {/* Audit Dialog */}
        {selectedItem && (
          <AuditDialog
            open={auditDialogOpen}
            onClose={() => setAuditDialogOpen(false)}
            maxSupplyId={selectedItem.id}
            productionCode={selectedItem.production_code}
          />
        )}
      </Box>
    </Box>
  );
}

export default MaxSupplyList;
