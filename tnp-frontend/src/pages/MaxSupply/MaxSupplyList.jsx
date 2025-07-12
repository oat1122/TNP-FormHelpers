import React, { useState, useEffect } from "react";
import "./MaxSupplyList.css";
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
  Pagination,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Stack,
  Avatar,
  LinearProgress,
  Divider,
  Skeleton,
  Alert,
  TableSortLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Fab,
} from "@mui/material";
import {
  FaSearch,
  FaSync,
  FaFilter,
  FaPlus,
  FaEye,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaChartLine,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, isAfter, isBefore } from "date-fns";
// Import locale without direct reference to specific structure
// This works with both date-fns v2.x and v4.x
import * as dateFnsLocales from "date-fns/locale";
import ProductionTypeIcon from "./components/ProductionTypeIcon";
import {
  productionTypeConfig,
  statusConfig,
  priorityConfig,
} from "./utils/constants";
import { maxSupplyApi } from "../../services/maxSupplyApi";

const MaxSupplyList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const navigate = useNavigate();

  const [maxSupplies, setMaxSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState(isMobile ? "card" : "table");
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    production_type: "all",
    priority: "all",
    date_from: "",
    date_to: "",
    overdue_only: false,
    urgent_only: false,
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Helper functions for better date handling and status indicators
  const getDaysUntilDeadline = (dueDate) => {
    if (!dueDate) return null;
    return differenceInDays(new Date(dueDate), new Date());
  };

  const getDeadlineStatus = (dueDate) => {
    const days = getDaysUntilDeadline(dueDate);
    if (days === null) return "none";
    if (days < 0) return "overdue";
    if (days <= 2) return "urgent";
    if (days <= 7) return "warning";
    return "normal";
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "success";
    if (percentage >= 50) return "warning";
    return "error";
  };

  // Enhanced Production type colors and icons
  const productionColors = {
    screen: productionTypeConfig.screen.color,
    dtf: productionTypeConfig.dtf.color,
    sublimation: productionTypeConfig.sublimation.color,
    embroidery: productionTypeConfig.embroidery.color,
  };

  const getProductionTypeIcon = (type) => {
    return <ProductionTypeIcon type={type} size={20} />;
  };

  // Enhanced Status colors and labels
  const statusColors = {
    pending: statusConfig.pending.color,
    in_progress: statusConfig.in_progress.color,
    completed: statusConfig.completed.color,
    cancelled: statusConfig.cancelled.color,
  };

  const statusLabels = {
    pending: statusConfig.pending.label,
    in_progress: statusConfig.in_progress.label,
    completed: statusConfig.completed.label,
    cancelled: statusConfig.cancelled.label,
  };

  // Status labels with emoji for mobile
  const statusLabelsWithEmoji = {
    pending: "รอเริ่ม",
    in_progress: "กำลังผลิต",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
  };

  const priorityLabels = {
    low: priorityConfig.low.label,
    normal: priorityConfig.normal.label,
    high: priorityConfig.high.label,
    urgent: priorityConfig.urgent.label,
  };

  const priorityColors = {
    low: priorityConfig.low.color,
    normal: priorityConfig.normal.color,
    high: priorityConfig.high.color,
    urgent: priorityConfig.urgent.color,
  };

  // Load data with enhanced sorting and filtering
  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        page: page.toString(),
        per_page: "20",
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === "all") {
          delete params[key];
        }
      });

      const response = await maxSupplyApi.getAll(params);

      if (response.status === "success") {
        setMaxSupplies(response.data);
        setTotalPages(response.pagination.total_pages);
        setTotalItems(response.pagination.total_items);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change with debounce for search
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(1);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadData();
  };

  // Handle delete with confirmation dialog
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        await maxSupplyApi.delete(itemToDelete.id);
        setDeleteConfirmDialog(false);
        setItemToDelete(null);
        loadData();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  // Handle view detail
  const handleViewDetail = async (id) => {
    try {
      const response = await maxSupplyApi.getById(id);

      if (response.status === "success") {
        setSelectedItem(response.data);
        setDetailDialog(true);
      }
    } catch (error) {
      console.error("Error loading detail:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filters, sortBy, sortOrder]);

  useEffect(() => {
    setViewMode(isMobile ? "card" : "table");
  }, [isMobile]);

  // Enhanced Filter Bar Component with better UX
  const FilterBar = () => {
    const urgentCount = maxSupplies.filter(
      (item) =>
        getDeadlineStatus(item.due_date) === "urgent" ||
        getDeadlineStatus(item.due_date) === "overdue"
    ).length;

    return (
      <Card sx={{ mb: 3, overflow: "visible" }}>
        <CardContent>
          {/* Quick Actions & Summary Row */}
          <Box sx={{ mb: 2 }}>
            {/* Header Title */}
            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 1, 
              mb: isMobile ? 2 : 0,
              flexWrap: "wrap"
            }}>
              <Typography
                variant={isMobile ? "h6" : "h6"}
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1,
                  flexWrap: "wrap",
                  lineHeight: 1.2
                }}
              >
                <AssignmentIcon color="primary" />
                รายการงานผลิต
                <Chip
                  label={`${totalItems} งาน`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Typography>
              {urgentCount > 0 && (
                <Badge badgeContent={urgentCount} color="error">
                  <Chip
                    label="ใกล้ครบกำหนด"
                    size="small"
                    color="error"
                    icon={<WarningIcon />}
                  />
                </Badge>
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ 
              display: "flex", 
              gap: 1, 
              justifyContent: isMobile ? "center" : "flex-end",
              flexWrap: "wrap"
            }}>
              <Button
                variant="outlined"
                startIcon={<FaSync />}
                onClick={handleRefresh}
                disabled={loading}
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  minWidth: isMobile ? "120px" : "auto",
                  flex: isMobile ? "1 1 auto" : "none",
                  maxWidth: isMobile ? "150px" : "none"
                }}
              >
                รีเฟรช
              </Button>
              <Button
                variant="contained"
                startIcon={<FaPlus />}
                onClick={() => navigate("/max-supply/create")}
                size={isMobile ? "medium" : "small"}
                sx={{
                  background: "linear-gradient(45deg, #B20000, #E36264)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #900F0F, #B20000)",
                  },
                  minWidth: isMobile ? "140px" : "auto",
                  flex: isMobile ? "1 1 auto" : "none",
                  maxWidth: isMobile ? "180px" : "none"
                }}
              >
                สร้างงานใหม่
              </Button>
            </Box>
          </Box>

          {/* Search and Quick Filters Row */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                fullWidth
                placeholder="ค้นหาด้วยรหัส, ชื่องาน, หรือลูกค้า..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaSearch color={theme.palette.primary.main} />
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{ mb: isMobile ? 1 : 0 }}
              />
            </Grid>

            <Grid item xs={6} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>สถานะ</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  label="สถานะ"
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  <MenuItem value="pending">รอเริ่ม</MenuItem>
                  <MenuItem value="in_progress">กำลังผลิต</MenuItem>
                  <MenuItem value="completed">เสร็จสิ้น</MenuItem>
                  <MenuItem value="cancelled">ยกเลิก</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>ประเภท</InputLabel>
                <Select
                  value={filters.production_type}
                  onChange={(e) =>
                    handleFilterChange("production_type", e.target.value)
                  }
                  label="ประเภท"
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  <MenuItem value="screen">Screen</MenuItem>
                  <MenuItem value="dtf">DTF</MenuItem>
                  <MenuItem value="sublimation">Sublimation</MenuItem>
                  <MenuItem value="embroidery">Embroidery</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} md={2}>
              <Button
                fullWidth
                variant={filterExpanded ? "contained" : "outlined"}
                startIcon={<FilterListIcon />}
                onClick={() => setFilterExpanded(!filterExpanded)}
                size="small"
                sx={{ 
                  mt: isMobile ? 1 : 0,
                  minHeight: "40px"
                }}
              >
                ตัวกรองเพิ่มเติม
              </Button>
            </Grid>
          </Grid>

          {/* Advanced Filters (Collapsible) */}
          {filterExpanded && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>ความสำคัญ</InputLabel>
                    <Select
                      value={filters.priority}
                      onChange={(e) =>
                        handleFilterChange("priority", e.target.value)
                      }
                      label="ความสำคัญ"
                    >
                      <MenuItem value="all">ทั้งหมด</MenuItem>
                      <MenuItem value="low">ต่ำ</MenuItem>
                      <MenuItem value="normal">ปกติ</MenuItem>
                      <MenuItem value="high">สูง</MenuItem>
                      <MenuItem value="urgent">ด่วน</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    label="วันที่เริ่ม"
                    type="date"
                    value={filters.date_from}
                    onChange={(e) =>
                      handleFilterChange("date_from", e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    label="วันที่สิ้นสุด"
                    type="date"
                    value={filters.date_to}
                    onChange={(e) =>
                      handleFilterChange("date_to", e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Button
                      variant={filters.overdue_only ? "contained" : "outlined"}
                      color="error"
                      size="small"
                      startIcon={<FaExclamationTriangle />}
                      onClick={() =>
                        handleFilterChange(
                          "overdue_only",
                          !filters.overdue_only
                        )
                      }
                    >
                      เลยกำหนดเท่านั้น
                    </Button>
                    <Button
                      variant={filters.urgent_only ? "contained" : "outlined"}
                      color="warning"
                      size="small"
                      startIcon={<FaClock />}
                      onClick={() =>
                        handleFilterChange("urgent_only", !filters.urgent_only)
                      }
                    >
                      ด่วนเท่านั้น
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Enhanced Mobile Card View with better visual hierarchy
  const MobileCardView = () => (
    <Grid container spacing={2}>
      {maxSupplies.map((item) => {
        const deadlineStatus = getDeadlineStatus(item.due_date);
        const daysUntilDeadline = getDaysUntilDeadline(item.due_date);
        const progressPercentage = item.progress_percentage || 0;

        return (
          <Grid item xs={12} key={item.id}>
            <Card 
              sx={{ 
                position: 'relative',
                border: deadlineStatus === 'overdue' ? '2px solid #dc2626' : 
                       deadlineStatus === 'urgent' ? '2px solid #f59e0b' : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {/* Priority and Status Indicators */}
              <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1, flexDirection: 'column' }}>
                {deadlineStatus === 'overdue' && (
                  <Chip
                    icon={<FaExclamationTriangle />}
                    label="เลยกำหนด"
                    color="error"
                    size="small"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
                {deadlineStatus === 'urgent' && (
                  <Chip
                    icon={<FaClock />}
                    label={`เหลือ ${daysUntilDeadline} วัน`}
                    color="warning"
                    size="small"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
                {item.priority === 'urgent' && (
                  <Chip
                    label="ด่วน"
                    color="error"
                    size="small"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              <CardContent sx={{ pb: 1 }}>
                {/* Header Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, pr: 6 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {item.code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FaUser style={{ fontSize: '0.8rem' }} />
                      {item.customer_name || 'ไม่ระบุลูกค้า'}
                    </Typography>
                  </Box>
                </Box>

                {/* Status and Production Type Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={statusLabelsWithEmoji[item.status]}
                    sx={{
                      bgcolor: statusColors[item.status],
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                  <Chip
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getProductionTypeIcon(item.production_type)}
                        {productionTypeConfig[item.production_type]?.label || item.production_type}
                      </Box>
                    }
                    sx={{
                      bgcolor: productionColors[item.production_type],
                      color: 'white',
                    }}
                  />
                </Box>

                {/* Dates Section */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FaCalendarAlt style={{ fontSize: '0.8rem', color: theme.palette.primary.main }} />
                    เริ่ม: {item.start_date ? format(new Date(item.start_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th }) : 'ไม่ระบุ'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ScheduleIcon style={{ fontSize: '0.8rem', color: theme.palette.success.main }} />
                    คาดว่าเสร็จ: {item.expected_completion_date ? format(new Date(item.expected_completion_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th }) : 'ไม่ระบุ'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      color: deadlineStatus === 'overdue' ? 'error.main' : 
                             deadlineStatus === 'urgent' ? 'warning.main' : 'text.secondary'
                    }}
                  >
                    <FaExclamationTriangle style={{ fontSize: '0.8rem' }} />
                    ครบกำหนด: {item.due_date ? format(new Date(item.due_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th }) : 'ไม่ระบุ'}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleViewDetail(item.id)}
                  variant="outlined"
                  sx={{ mr: 1 }}
                >
                  ดูรายละเอียด
                </Button>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/max-supply/edit/${item.id}`)}
                  variant="outlined"
                  color="primary"
                >
                  แก้ไข
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(item)}
                  sx={{ ml: 'auto' }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  // Enhanced Desktop Table View with sorting and better visual indicators
  const DesktopTableView = () => (
    <TableContainer component={Paper} sx={{ boxShadow: theme.shadows[2] }}>
      <Table>
        <TableHead sx={{ bgcolor: theme.palette.grey[50] }}>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'code'}
                direction={sortBy === 'code' ? sortOrder : 'asc'}
                onClick={() => handleSort('code')}
              >
                รหัส
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'title'}
                direction={sortBy === 'title' ? sortOrder : 'asc'}
                onClick={() => handleSort('title')}
              >
                ชื่องาน / ลูกค้า
              </TableSortLabel>
            </TableCell>
            <TableCell>ประเภท</TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'status'}
                direction={sortBy === 'status' ? sortOrder : 'asc'}
                onClick={() => handleSort('status')}
              >
                สถานะ
              </TableSortLabel>
            </TableCell>
            <TableCell>ความสำคัญ</TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'start_date'}
                direction={sortBy === 'start_date' ? sortOrder : 'asc'}
                onClick={() => handleSort('start_date')}
              >
                วันที่เริ่ม
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'due_date'}
                direction={sortBy === 'due_date' ? sortOrder : 'asc'}
                onClick={() => handleSort('due_date')}
              >
                ครบกำหนด
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">จัดการ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {maxSupplies.map((item) => {
            const deadlineStatus = getDeadlineStatus(item.due_date);
            const daysUntilDeadline = getDaysUntilDeadline(item.due_date);
            const progressPercentage = item.progress_percentage || 0;

            return (
              <TableRow 
                key={item.id} 
                hover
                sx={{
                  backgroundColor: deadlineStatus === 'overdue' ? '#fef2f2' : 
                                 deadlineStatus === 'urgent' ? '#fffbeb' : 'inherit',
                  borderLeft: deadlineStatus === 'overdue' ? '4px solid #dc2626' :
                             deadlineStatus === 'urgent' ? '4px solid #f59e0b' : 'none',
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {item.code}
                    </Typography>
                    {item.priority === 'urgent' && (
                      <Chip label="ด่วน" size="small" color="error" sx={{ fontSize: '0.7rem' }} />
                    )}
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FaUser style={{ fontSize: '0.7rem' }} />
                      {item.customer_name || 'ไม่ระบุลูกค้า'}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getProductionTypeIcon(item.production_type)}
                        {productionTypeConfig[item.production_type]?.label || item.production_type}
                      </Box>
                    }
                    size="small"
                    sx={{
                      bgcolor: productionColors[item.production_type],
                      color: 'white',
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={statusLabels[item.status]}
                      size="small"
                      sx={{
                        bgcolor: statusColors[item.status],
                        color: 'white',
                      }}
                    />
                    {deadlineStatus === 'overdue' && (
                      <Tooltip title="เลยกำหนดแล้ว">
                        <FaExclamationTriangle style={{ color: '#dc2626', fontSize: '0.9rem' }} />
                      </Tooltip>
                    )}
                    {deadlineStatus === 'urgent' && (
                      <Tooltip title={`เหลือ ${daysUntilDeadline} วัน`}>
                        <FaClock style={{ color: '#f59e0b', fontSize: '0.9rem' }} />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={priorityLabels[item.priority] || item.priority}
                    size="small"
                    sx={{
                      bgcolor: priorityColors[item.priority] || '#6b7280',
                      color: 'white',
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {item.start_date ? format(new Date(item.start_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th }) : 'ไม่ระบุ'}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: deadlineStatus === 'overdue' ? 'error.main' : 
                               deadlineStatus === 'urgent' ? 'warning.main' : 'text.primary'
                      }}
                    >
                      {item.due_date ? format(new Date(item.due_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th }) : 'ไม่ระบุ'}
                    </Typography>
                    {deadlineStatus === 'urgent' && (
                      <Typography variant="caption" color="warning.main">
                        เหลือ {daysUntilDeadline} วัน
                      </Typography>
                    )}
                    {deadlineStatus === 'overdue' && (
                      <Typography variant="caption" color="error.main">
                        เลย {Math.abs(daysUntilDeadline)} วัน
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="ดูรายละเอียด">
                      <IconButton size="small" onClick={() => handleViewDetail(item.id)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="แก้ไข">
                      <IconButton size="small" onClick={() => navigate(`/max-supply/edit/${item.id}`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ลบ">
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(item)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Enhanced Detail Dialog with better formatting and visual hierarchy
  const DetailDialog = () => {
    if (!selectedItem) return null;

    const deadlineStatus = getDeadlineStatus(selectedItem.due_date);
    const daysUntilDeadline = getDaysUntilDeadline(selectedItem.due_date);
    const progressPercentage = selectedItem.progress_percentage || 0;

    return (
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                sx={{ 
                  bgcolor: productionColors[selectedItem.production_type],
                  width: 40,
                  height: 40
                }}
              >
                {getProductionTypeIcon(selectedItem.production_type)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {selectedItem.code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedItem.title}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDetailDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {/* Status and Progress Overview */}
          <Box sx={{ mb: 3, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Chip
                  label={statusLabels[selectedItem.status]}
                  sx={{
                    bgcolor: statusColors[selectedItem.status],
                    color: 'white',
                    width: '100%',
                    fontWeight: 'bold'
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Chip
                  label={productionTypeConfig[selectedItem.production_type]?.label || selectedItem.production_type}
                  sx={{
                    bgcolor: productionColors[selectedItem.production_type],
                    color: 'white',
                    width: '100%'
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Chip
                  label={priorityLabels[selectedItem.priority]}
                  sx={{
                    bgcolor: priorityColors[selectedItem.priority] || '#6b7280',
                    color: 'white',
                    width: '100%'
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                {deadlineStatus === 'overdue' && (
                  <Chip
                    icon={<FaExclamationTriangle />}
                    label="เลยกำหนด"
                    color="error"
                    sx={{ width: '100%' }}
                  />
                )}
                {deadlineStatus === 'urgent' && (
                  <Chip
                    icon={<FaClock />}
                    label={`เหลือ ${daysUntilDeadline} วัน`}
                    color="warning"
                    sx={{ width: '100%' }}
                  />
                )}
                {deadlineStatus === 'normal' && (
                  <Chip
                    icon={<FaCheckCircle />}
                    label="ปกติ"
                    color="success"
                    sx={{ width: '100%' }}
                  />
                )}
              </Grid>
            </Grid>
          </Box>

          {/* Progress Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" />
              ความคืบหน้า
            </Typography>
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h4" fontWeight="bold" color={getProgressColor(progressPercentage)}>
                  {progressPercentage}%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {selectedItem.completed_quantity || 0} / {selectedItem.total_quantity || 0} ชิ้น
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage} 
                color={getProgressColor(progressPercentage)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon color="primary" />
                  ข้อมูลพื้นฐาน
                </Typography>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">รหัสงาน</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedItem.code}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">ชื่องาน</Typography>
                    <Typography variant="body1">{selectedItem.title}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">ลูกค้า</Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FaUser style={{ fontSize: '0.8rem' }} />
                      {selectedItem.customer_name || 'ไม่ระบุลูกค้า'}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">จำนวนทั้งหมด</Typography>
                    <Typography variant="body1">{selectedItem.total_quantity || 0} ชิ้น</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Schedule Information */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon color="primary" />
                  กำหนดการ
                </Typography>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">วันที่เริ่ม</Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FaCalendarAlt style={{ fontSize: '0.8rem', color: theme.palette.primary.main }} />
                      {selectedItem.start_date ? format(new Date(selectedItem.start_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th }) : 'ไม่ระบุ'}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">วันที่คาดว่าจะเสร็จ</Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScheduleIcon style={{ fontSize: '0.8rem', color: theme.palette.success.main }} />
                      {selectedItem.expected_completion_date ? format(new Date(selectedItem.expected_completion_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th }) : 'ไม่ระบุ'}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">วันครบกำหนด</Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        color: deadlineStatus === 'overdue' ? 'error.main' : 
                               deadlineStatus === 'urgent' ? 'warning.main' : 'text.primary'
                      }}
                    >
                      <FaExclamationTriangle style={{ fontSize: '0.8rem' }} />
                      {selectedItem.due_date ? format(new Date(selectedItem.due_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th }) : 'ไม่ระบุ'}
                    </Typography>
                    {deadlineStatus === 'urgent' && (
                      <Typography variant="caption" color="warning.main">
                        เหลือ {daysUntilDeadline} วัน
                      </Typography>
                    )}
                    {deadlineStatus === 'overdue' && (
                      <Typography variant="caption" color="error.main">
                        เลย {Math.abs(daysUntilDeadline)} วัน
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Notes Section */}
          {selectedItem.notes && (
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  หมายเหตุ
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedItem.notes}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailDialog(false)} variant="outlined">
            ปิด
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              setDetailDialog(false);
              navigate(`/max-supply/edit/${selectedItem.id}`);
            }}
            sx={{ 
              background: 'linear-gradient(45deg, #B20000, #E36264)',
              '&:hover': {
                background: 'linear-gradient(45deg, #900F0F, #B20000)',
              }
            }}
          >
            แก้ไข
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Delete Confirmation Dialog
  const DeleteConfirmDialog = () => (
    <Dialog
      open={deleteConfirmDialog}
      onClose={() => setDeleteConfirmDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="error" />
        ยืนยันการลบ
      </DialogTitle>
      <DialogContent>
        <Typography>
          คุณต้องการลบงาน <strong>{itemToDelete?.code}</strong> หรือไม่?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          การกระทำนี้ไม่สามารถย้อนกลับได้
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteConfirmDialog(false)} variant="outlined">
          ยกเลิก
        </Button>
        <Button
          onClick={handleDeleteConfirm}
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
        >
          ลบ
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Loading Skeleton Component
  const LoadingSkeleton = () => (
    <Grid container spacing={2}>
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" height={32} />
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="30%" height={20} />
                </Box>
                <Skeleton variant="rounded" width={80} height={28} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Skeleton variant="rounded" width={100} height={28} />
                <Skeleton variant="rounded" width={120} height={28} />
              </Box>
              <Skeleton variant="rectangular" width="100%" height={6} sx={{ mb: 1 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="65%" />
                <Skeleton variant="text" width="60%" />
              </Box>
            </CardContent>
            <CardActions>
              <Skeleton variant="rounded" width={80} height={32} />
              <Skeleton variant="rounded" width={60} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Empty State Component
  const EmptyState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        textAlign: 'center',
      }}
    >
      <AssignmentIcon 
        sx={{ 
          fontSize: 80, 
          color: theme.palette.grey[400],
          mb: 2 
        }} 
      />
      <Typography variant="h5" color="text.secondary" gutterBottom>
        ไม่พบงานที่ตรงกับเงื่อนไข
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        ลองปรับเงื่อนไขการค้นหาหรือสร้างงานใหม่
      </Typography>
      <Button
        variant="contained"
        startIcon={<FaPlus />}
        onClick={() => navigate('/max-supply/create')}
        sx={{ 
          background: 'linear-gradient(45deg, #B20000, #E36264)',
          '&:hover': {
            background: 'linear-gradient(45deg, #900F0F, #B20000)',
          }
        }}
      >
        สร้างงานใหม่
      </Button>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header with enhanced styling */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="h4" 
            fontWeight="bold"
            sx={{
              background: 'linear-gradient(45deg, #B20000, #E36264)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            รายการงานผลิต MaxSupply
          </Typography>
          {!isMobile && (
            <Chip 
              label={`ทั้งหมด ${totalItems} งาน`}
              variant="outlined"
              color="primary"
              sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}
            />
          )}
        </Box>
        
        {/* Statistics Summary */}
        {totalItems > 0 && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip 
              label={`รอเริ่ม: ${maxSupplies.filter(item => item.status === 'pending').length}`}
              color="warning"
              size="small"
            />
            <Chip 
              label={`กำลังผลิต: ${maxSupplies.filter(item => item.status === 'in_progress').length}`}
              color="primary"
              size="small"
            />
            <Chip 
              label={`เสร็จสิ้น: ${maxSupplies.filter(item => item.status === 'completed').length}`}
              color="success"
              size="small"
            />
            <Chip 
              label={`ใกล้ครบกำหนด: ${maxSupplies.filter(item => getDeadlineStatus(item.due_date) === 'urgent' || getDeadlineStatus(item.due_date) === 'overdue').length}`}
              color="error"
              size="small"
            />
          </Box>
        )}
      </Box>

      <FilterBar />

      {/* Main Content Area */}
      {loading ? (
        <LoadingSkeleton />
      ) : maxSupplies.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* View Toggle for Tablet/Desktop */}
          {!isMobile && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                  size="small"
                  startIcon={<FaSortAmountDown />}
                >
                  ตารางข้อมูล
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('card')}
                  size="small"
                  startIcon={<FaChartLine />}
                >
                  การ์ดข้อมูล
                </Button>
              </Stack>
            </Box>
          )}

          {/* Data Display */}
          {viewMode === 'card' ? <MobileCardView /> : <DesktopTableView />}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="สร้างงานใหม่"
          onClick={() => navigate('/max-supply/create')}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'linear-gradient(45deg, #B20000, #E36264)',
            '&:hover': {
              background: 'linear-gradient(45deg, #900F0F, #B20000)',
            }
          }}
        >
          <FaPlus />
        </Fab>
      )}

      <DetailDialog />
      <DeleteConfirmDialog />
    </Container>
  );
};

export default MaxSupplyList;
