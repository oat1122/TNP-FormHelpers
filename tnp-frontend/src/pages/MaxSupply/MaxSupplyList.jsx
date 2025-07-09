import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  InputAdornment, 
  IconButton,
  Chip,
  Button,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useMaxSupply } from '../../context/MaxSupplyContext';
import { useNavigate } from 'react-router-dom';
import { 
  getProductionTypeColor, 
  getStatusColor, 
  getStatusLabel, 
  getProductionTypeIcon, 
  getProductionTypeLabel,
  formatDate,
  getDaysRemaining,
  getDateStatus
} from '../../utils/maxSupplyUtils';
import { 
  FaSearch, 
  FaPlus, 
  FaFilter, 
  FaCalendarAlt, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSyncAlt,
  FaExclamationTriangle,
  FaFileAlt
} from 'react-icons/fa';

// Custom components
import MaxSupplyQuickView from './MaxSupplyQuickView';
import ConfirmDialog from '../../components/ConfirmDialog';

const MaxSupplyList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { 
    maxSupplies, 
    fetchMaxSupplies, 
    deleteMaxSupply, 
    isLoading, 
    error 
  } = useMaxSupply();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [productionTypeFilter, setProductionTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // Table states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [selectedMaxSupply, setSelectedMaxSupply] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // Initial data fetch
  useEffect(() => {
    fetchMaxSupplies();
  }, []);
  
  // Apply filters
  const handleApplyFilters = () => {
    const filters = {};
    
    if (searchTerm) filters.search = searchTerm;
    if (productionTypeFilter) filters.production_type = productionTypeFilter;
    if (statusFilter) filters.status = statusFilter;
    if (startDate) filters.date_from = startDate.format('YYYY-MM-DD');
    if (endDate) filters.date_to = endDate.format('YYYY-MM-DD');
    
    fetchMaxSupplies(filters);
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setProductionTypeFilter('');
    setStatusFilter('');
    setStartDate(null);
    setEndDate(null);
    
    fetchMaxSupplies();
  };
  
  // Table handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // View/Edit/Delete handlers
  const handleViewMaxSupply = (maxSupply) => {
    setSelectedMaxSupply(maxSupply);
    setQuickViewOpen(true);
  };
  
  const handleEditMaxSupply = (id) => {
    navigate(`/max-supply/edit/${id}`);
  };
  
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmDeleteOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    try {
      await deleteMaxSupply(deleteId);
      setConfirmDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };
  
  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setDeleteId(null);
  };
  
  const handleQuickViewClose = () => {
    setQuickViewOpen(false);
  };
  
  const handleCreateNew = () => {
    navigate('/max-supply/create');
  };
  
  // Render table view (desktop)
  const renderTable = () => {
    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell width="80px">รหัส</TableCell>
              <TableCell width="200px">ชื่องาน</TableCell>
              <TableCell width="100px">ประเภท</TableCell>
              <TableCell width="120px">สถานะ</TableCell>
              <TableCell width="120px">ครบกำหนด</TableCell>
              <TableCell width="100px">ผู้สร้าง</TableCell>
              <TableCell width="120px" align="center">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {maxSupplies
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                const daysRemaining = getDaysRemaining(row.due_date);
                const dateStatus = getDateStatus(row.due_date);
                
                return (
                  <TableRow 
                    key={row.id}
                    hover
                    onClick={() => handleViewMaxSupply(row)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {row.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {row.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.customer_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getProductionTypeIcon(row.production_type)}
                        <Typography variant="body2">
                          {getProductionTypeLabel(row.production_type)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={getStatusLabel(row.status)}
                        sx={{
                          bgcolor: getStatusColor(row.status) + '20',
                          color: getStatusColor(row.status),
                          fontWeight: 'medium',
                          borderRadius: '4px'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(row.due_date)}
                        </Typography>
                        {dateStatus === 'overdue' && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'error.main',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <FaExclamationTriangle size={10} />
                            เลยกำหนด {Math.abs(daysRemaining)} วัน
                          </Typography>
                        )}
                        {dateStatus === 'today' && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'warning.main',
                              fontWeight: 'bold'
                            }}
                          >
                            วันนี้
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {row.creator ? row.creator.name : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="ดูรายละเอียด">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewMaxSupply(row);
                            }}
                          >
                            <FaEye />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="แก้ไข">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMaxSupply(row.id);
                            }}
                          >
                            <FaEdit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(row.id);
                            }}
                          >
                            <FaTrash />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              
            {(!maxSupplies || maxSupplies.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูล
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={maxSupplies.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="แถวต่อหน้า"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
        />
      </TableContainer>
    );
  };
  
  // Render card view (mobile)
  const renderCards = () => {
    return (
      <Box>
        {maxSupplies
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((row) => {
            const daysRemaining = getDaysRemaining(row.due_date);
            const dateStatus = getDateStatus(row.due_date);
            
            return (
              <Card 
                key={row.id} 
                elevation={1}
                sx={{ 
                  mb: 2,
                  borderLeft: `4px solid ${getProductionTypeColor(row.production_type)}`
                }}
              >
                <CardContent>
                  <Grid container spacing={1}>
                    <Grid item xs={8}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {row.code}: {row.title}
                      </Typography>
                    </Grid>
                    <Grid item xs={4} sx={{ textAlign: 'right' }}>
                      <Chip
                        size="small"
                        label={getStatusLabel(row.status)}
                        sx={{
                          bgcolor: getStatusColor(row.status) + '20',
                          color: getStatusColor(row.status),
                          fontWeight: 'medium',
                          borderRadius: '4px'
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        ลูกค้า: {row.customer_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        {getProductionTypeIcon(row.production_type)}
                        <Typography variant="body2">
                          {getProductionTypeLabel(row.production_type)}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        ครบกำหนด: {formatDate(row.due_date)}
                      </Typography>
                      {dateStatus === 'overdue' && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'error.main',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <FaExclamationTriangle size={10} />
                          เลยกำหนด {Math.abs(daysRemaining)} วัน
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        ผู้สร้าง: {row.creator ? row.creator.name : '-'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={<FaEye />}
                          onClick={() => handleViewMaxSupply(row)}
                          sx={{ flexGrow: 1 }}
                        >
                          ดูรายละเอียด
                        </Button>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleEditMaxSupply(row.id)}
                          sx={{ border: '1px solid', borderColor: 'info.main' }}
                        >
                          <FaEdit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(row.id)}
                          sx={{ border: '1px solid', borderColor: 'error.main' }}
                        >
                          <FaTrash />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
          
        {(!maxSupplies || maxSupplies.length === 0) && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              ไม่พบข้อมูล
            </Typography>
          </Box>
        )}
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={maxSupplies.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="แถวต่อหน้า"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
        />
      </Box>
    );
  };
  
  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Typography variant="h5" sx={{ mb: { xs: 2, md: 0 } }}>
                  รายการงานผลิต
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    placeholder="ค้นหา..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaSearch />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 200 } }}
                  />
                  
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<FaPlus />}
                    onClick={handleCreateNew}
                  >
                    {isMobile ? "สร้าง" : "สร้างงานใหม่"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaFilter color={theme.palette.primary.main} />
                <Typography variant="subtitle1" fontWeight="medium">
                  ตัวกรอง
                </Typography>
              </Box>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="production-type-label">ประเภทการผลิต</InputLabel>
                <Select
                  labelId="production-type-label"
                  value={productionTypeFilter}
                  label="ประเภทการผลิต"
                  onChange={(e) => setProductionTypeFilter(e.target.value)}
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  <MenuItem value="screen">สกรีน</MenuItem>
                  <MenuItem value="dtf">DTF</MenuItem>
                  <MenuItem value="sublimation">ซับลิเมชั่น</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="status-label">สถานะ</InputLabel>
                <Select
                  labelId="status-label"
                  value={statusFilter}
                  label="สถานะ"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  <MenuItem value="pending">รอเริ่ม</MenuItem>
                  <MenuItem value="in_progress">กำลังผลิต</MenuItem>
                  <MenuItem value="completed">เสร็จสิ้น</MenuItem>
                  <MenuItem value="cancelled">ยกเลิก</MenuItem>
                </Select>
              </FormControl>
              
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="ตั้งแต่วันที่"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{
                    textField: {
                      size: 'small',
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <FaCalendarAlt />
                          </InputAdornment>
                        )
                      }
                    }
                  }}
                />
              </LocalizationProvider>
              
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="ถึงวันที่"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{
                    textField: {
                      size: 'small',
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <FaCalendarAlt />
                          </InputAdornment>
                        )
                      }
                    }
                  }}
                />
              </LocalizationProvider>
              
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined"
                  onClick={handleResetFilters}
                  startIcon={<FaSyncAlt />}
                >
                  รีเซ็ต
                </Button>
                
                <Button 
                  variant="contained"
                  onClick={handleApplyFilters}
                  startIcon={<FaFilter />}
                >
                  กรอง
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          {isLoading ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress color="primary" />
              <Typography variant="body1" sx={{ mt: 2 }}>
                กำลังโหลดข้อมูล...
              </Typography>
            </Paper>
          ) : error ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error" variant="h6">
                {error}
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => fetchMaxSupplies()}
                startIcon={<FaSyncAlt />}
              >
                ลองอีกครั้ง
              </Button>
            </Paper>
          ) : (
            isMobile ? renderCards() : renderTable()
          )}
        </Grid>
      </Grid>
      
      {/* Quick View Modal */}
      {selectedMaxSupply && (
        <MaxSupplyQuickView 
          open={quickViewOpen} 
          onClose={handleQuickViewClose}
          maxSupply={selectedMaxSupply}
        />
      )}
      
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="ยืนยันการลบ"
        content="คุณแน่ใจหรือไม่ว่าต้องการลบงานผลิตนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="ลบ"
        cancelText="ยกเลิก"
        confirmColor="error"
      />
    </Box>
  );
};

export default MaxSupplyList;
