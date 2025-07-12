import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  FaSearch,
  FaSync,
  FaFilter,
  FaPlus,
  FaEye,
  FaCalendarAlt,
} from 'react-icons/fa';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
// Import locale without direct reference to specific structure
// This works with both date-fns v2.x and v4.x
import * as dateFnsLocales from 'date-fns/locale';
import ProductionTypeIcon from './components/ProductionTypeIcon';
import { productionTypeConfig } from './utils/constants';

const MaxSupplyList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [maxSupplies, setMaxSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    production_type: 'all',
    priority: 'all',
    date_from: '',
    date_to: '',
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);

  // Production type colors and icons
  const productionColors = {
    screen: productionTypeConfig.screen.color,
    dtf: productionTypeConfig.dtf.color,
    sublimation: productionTypeConfig.sublimation.color,
    embroidery: productionTypeConfig.embroidery.color,
  };

  const getProductionTypeIcon = (type) => {
    return <ProductionTypeIcon type={type} size={20} />;
  };

  // Status colors
  const statusColors = {
    pending: '#d97706',
    in_progress: '#2563eb',
    completed: '#059669',
    cancelled: '#dc2626',
  };

  const statusLabels = {
    pending: '🟡 รอเริ่ม',
    in_progress: '🔵 กำลังผลิต',
    completed: '🟢 เสร็จสิ้น',
    cancelled: '🔴 ยกเลิก',
  };

  const priorityLabels = {
    low: 'ต่ำ',
    normal: 'ปกติ',
    high: 'สูง',
    urgent: 'ด่วน',
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        ...filters,
      });

      const response = await fetch(`/api/v1/max-supplies?${params}`);
      const data = await response.json();

      if (data.status === 'success') {
        setMaxSupplies(data.data);
        setTotalPages(data.pagination.total_pages);
        setTotalItems(data.pagination.total_items);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
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

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('คุณต้องการลบงานนี้หรือไม่?')) {
      try {
        const response = await fetch(`/api/v1/max-supplies/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          loadData();
        }
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  // Handle view detail
  const handleViewDetail = async (id) => {
    try {
      const response = await fetch(`/api/v1/max-supplies/${id}`);
      const data = await response.json();

      if (data.status === 'success') {
        setSelectedItem(data.data);
        setDetailDialog(true);
      }
    } catch (error) {
      console.error('Error loading detail:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filters]);

  // Filter Bar Component
  const FilterBar = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="ค้นหา..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaSearch />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>ประเภท</InputLabel>
              <Select
                value={filters.production_type}
                onChange={(e) => handleFilterChange('production_type', e.target.value)}
                label="ประเภท"
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="screen">Screen</MenuItem>
                <MenuItem value="dtf">DTF</MenuItem>
                <MenuItem value="sublimation">Sublimation</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>ความสำคัญ</InputLabel>
              <Select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
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
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FaSync />}
                onClick={handleRefresh}
                disabled={loading}
              >
                รีเฟรช
              </Button>
              <Button
                variant="contained"
                startIcon={<FaPlus />}
                onClick={() => navigate('/max-supply/create')}
              >
                สร้างใหม่
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Mobile Card View
  const MobileCardView = () => (
    <Grid container spacing={2}>
      {maxSupplies.map((item) => (
        <Grid item xs={12} key={item.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {item.code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.title}
                  </Typography>
                </Box>
                <Chip
                  label={statusLabels[item.status]}
                  sx={{
                    bgcolor: statusColors[item.status],
                    color: 'white',
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getProductionTypeIcon(item.production_type)}
                      {item.production_type}
                    </Box>
                  }
                  sx={{
                    bgcolor: productionColors[item.production_type],
                    color: 'white',
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  👤 {item.creator?.name || 'N/A'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                📅 ครบกำหนด: {format(new Date(item.due_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                startIcon={<FaEye />}
                onClick={() => handleViewDetail(item.id)}
              >
                ดู
              </Button>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/max-supply/edit/${item.id}`)}
              >
                แก้ไข
              </Button>
              <Button
                size="small"
                startIcon={<DeleteIcon />}
                color="error"
                onClick={() => handleDelete(item.id)}
              >
                ลบ
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Desktop Table View
  const DesktopTableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>ชื่องาน</TableCell>
            <TableCell>ประเภท</TableCell>
            <TableCell>สถานะ</TableCell>
            <TableCell>ความสำคัญ</TableCell>
            <TableCell>ครบกำหนด</TableCell>
            <TableCell>ผู้สร้าง</TableCell>
            <TableCell>จัดการ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {maxSupplies.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.code}</TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.customer_name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getProductionTypeIcon(item.production_type)}
                      {item.production_type}
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
                <Chip
                  label={statusLabels[item.status]}
                  size="small"
                  sx={{
                    bgcolor: statusColors[item.status],
                    color: 'white',
                  }}
                />
              </TableCell>
              <TableCell>{priorityLabels[item.priority] || item.priority}</TableCell>
              <TableCell>
                <Typography variant="body2">
                  {format(new Date(item.due_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}
                </Typography>
              </TableCell>
              <TableCell>{item.creator?.name || 'N/A'}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="ดูรายละเอียด">
                    <IconButton size="small" onClick={() => handleViewDetail(item.id)}>
                      <FaEye />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="แก้ไข">
                    <IconButton size="small" onClick={() => navigate(`/max-supply/edit/${item.id}`)}>
                      <EditIcon  />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ลบ">
                    <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                      <DeleteIcon  />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Detail Dialog
  const DetailDialog = () => (
    <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">รายละเอียดงาน</Typography>
          <IconButton onClick={() => setDetailDialog(false)}>
            <CloseIcon  />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedItem && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  ข้อมูลพื้นฐาน
                </Typography>
                <Typography><strong>รหัส:</strong> {selectedItem.code}</Typography>
                <Typography><strong>ชื่องาน:</strong> {selectedItem.title}</Typography>
                <Typography><strong>ลูกค้า:</strong> {selectedItem.customer_name}</Typography>
                <Typography><strong>ประเภท:</strong> {selectedItem.production_type}</Typography>
                <Typography><strong>สถานะ:</strong> {statusLabels[selectedItem.status]}</Typography>
                <Typography><strong>ความสำคัญ:</strong> {priorityLabels[selectedItem.priority]}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  กำหนดการ
                </Typography>
                <Typography><strong>วันเริ่ม:</strong> {format(new Date(selectedItem.start_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}</Typography>
                <Typography><strong>วันที่คาดว่าจะเสร็จ:</strong> {format(new Date(selectedItem.expected_completion_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}</Typography>
                <Typography><strong>วันครบกำหนด:</strong> {format(new Date(selectedItem.due_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}</Typography>
                <Typography><strong>จำนวนทั้งหมด:</strong> {selectedItem.total_quantity}</Typography>
                <Typography><strong>จำนวนที่เสร็จ:</strong> {selectedItem.completed_quantity}</Typography>
                <Typography><strong>ความคืบหน้า:</strong> {selectedItem.progress_percentage}%</Typography>
              </Box>
            </Grid>
            {selectedItem.notes && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  หมายเหตุ
                </Typography>
                <Typography>{selectedItem.notes}</Typography>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailDialog(false)}>ปิด</Button>
        <Button
          variant="contained"
          onClick={() => {
            setDetailDialog(false);
            navigate(`/max-supply/edit/${selectedItem.id}`);
          }}
        >
          แก้ไข
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          รายการงานผลิต
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ทั้งหมด {totalItems} รายการ
        </Typography>
      </Box>

      <FilterBar />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>กำลังโหลด...</Typography>
        </Box>
      ) : (
        <>
          {isMobile ? <MobileCardView /> : <DesktopTableView />}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}

      <DetailDialog />
    </Container>
  );
};

export default MaxSupplyList; 