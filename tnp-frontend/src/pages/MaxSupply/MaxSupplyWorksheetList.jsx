import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab
} from '@mui/material';
import { 
  FaSearch, 
  FaFileAlt, 
  FaPlus, 
  FaCalendarAlt,
  FaFilter,
  FaSort
} from 'react-icons/fa';
import { useMaxSupply } from '../../context/MaxSupplyContext';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const MaxSupplyWorksheetList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { fetchWorksheetList, worksheetList, isLoading } = useMaxSupply();
  
  // State for pagination, filtering, and view mode
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState(isMobile ? 'cards' : 'table');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Fetch worksheets on component mount
  useEffect(() => {
    fetchWorksheetList();
  }, []);
  
  // Filter and sort worksheets
  const filteredWorksheets = worksheetList ? worksheetList.filter(worksheet => {
    // Search term filter
    const searchMatches = 
      worksheet.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worksheet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worksheet.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const statusMatches = statusFilter === 'all' || worksheet.status === statusFilter;
    
    // Date filter
    let dateMatches = true;
    const today = dayjs();
    const worksheetDate = dayjs(worksheet.created_at);
    
    if (dateFilter === 'today') {
      dateMatches = worksheetDate.isSame(today, 'day');
    } else if (dateFilter === 'week') {
      dateMatches = worksheetDate.isAfter(today.subtract(7, 'day'));
    } else if (dateFilter === 'month') {
      dateMatches = worksheetDate.isAfter(today.subtract(30, 'day'));
    }
    
    return searchMatches && statusMatches && dateMatches;
  }).sort((a, b) => {
    // Sorting
    if (sortBy === 'created_at') {
      return sortOrder === 'asc' 
        ? dayjs(a.created_at).diff(dayjs(b.created_at))
        : dayjs(b.created_at).diff(dayjs(a.created_at));
    }
    
    if (sortBy === 'due_date') {
      return sortOrder === 'asc' 
        ? dayjs(a.due_date).diff(dayjs(b.due_date))
        : dayjs(b.due_date).diff(dayjs(a.due_date));
    }
    
    if (sortBy === 'name') {
      return sortOrder === 'asc'
        ? (a.name || '').localeCompare(b.name || '')
        : (b.name || '').localeCompare(a.name || '');
    }
    
    if (sortBy === 'customer') {
      return sortOrder === 'asc'
        ? (a.customer?.name || '').localeCompare(b.customer?.name || '')
        : (b.customer?.name || '').localeCompare(a.customer?.name || '');
    }
    
    return 0;
  }) : [];

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Get worksheet status chip
  const getStatusChip = (status) => {
    let color = 'default';
    let label = 'Unknown';
    
    switch (status) {
      case 'draft':
        color = 'default';
        label = 'แบบร่าง';
        break;
      case 'pending':
        color = 'warning';
        label = 'รอดำเนินการ';
        break;
      case 'in_progress':
        color = 'info';
        label = 'กำลังดำเนินการ';
        break;
      case 'completed':
        color = 'success';
        label = 'เสร็จสิ้น';
        break;
      case 'cancelled':
        color = 'error';
        label = 'ยกเลิก';
        break;
      default:
        break;
    }
    
    return <Chip size="small" color={color} label={label} />;
  };
  
  // Navigate to worksheet details
  const handleViewWorksheet = (worksheetId) => {
    navigate(`/worksheets/${worksheetId}`);
  };
  
  // Navigate to max supply form with pre-selected worksheet
  const handleCreateFromWorksheet = (worksheet) => {
    navigate(`/max-supply/create?worksheet_id=${worksheet.id}`);
  };

  // Render table view
  const renderTableView = () => {
    return (
      <TableContainer component={Paper} elevation={3}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                onClick={() => handleSort('code')}
                style={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  รหัส Worksheet
                  {sortBy === 'code' && (
                    <FaSort style={{ fontSize: '0.8rem', marginLeft: '4px' }} />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('name')}
                style={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  ชื่องาน
                  {sortBy === 'name' && (
                    <FaSort style={{ fontSize: '0.8rem', marginLeft: '4px' }} />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('customer')}
                style={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  ลูกค้า
                  {sortBy === 'customer' && (
                    <FaSort style={{ fontSize: '0.8rem', marginLeft: '4px' }} />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('created_at')}
                style={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  วันที่สร้าง
                  {sortBy === 'created_at' && (
                    <FaSort style={{ fontSize: '0.8rem', marginLeft: '4px' }} />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('due_date')}
                style={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  กำหนดส่ง
                  {sortBy === 'due_date' && (
                    <FaSort style={{ fontSize: '0.8rem', marginLeft: '4px' }} />
                  )}
                </Box>
              </TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="center">จำนวน</TableCell>
              <TableCell align="right">การดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredWorksheets
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((worksheet) => (
                <TableRow key={worksheet.id}>
                  <TableCell>{worksheet.code}</TableCell>
                  <TableCell>{worksheet.name}</TableCell>
                  <TableCell>{worksheet.customer?.name || '-'}</TableCell>
                  <TableCell>{dayjs(worksheet.created_at).format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{worksheet.due_date ? dayjs(worksheet.due_date).format('DD/MM/YYYY') : '-'}</TableCell>
                  <TableCell>{getStatusChip(worksheet.status)}</TableCell>
                  <TableCell align="center">{worksheet.total_quantity || 0}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => handleViewWorksheet(worksheet.id)}
                      sx={{ mr: 1 }}
                    >
                      รายละเอียด
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      onClick={() => handleCreateFromWorksheet(worksheet)}
                    >
                      สร้าง MaxSupply
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
            {filteredWorksheets.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {isLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Typography variant="body2">ไม่พบรายการ Worksheet</Typography>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredWorksheets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    );
  };
  
  // Render card view (for mobile)
  const renderCardView = () => {
    return (
      <Grid container spacing={2}>
        {filteredWorksheets
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((worksheet) => (
            <Grid item xs={12} key={worksheet.id}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h2">
                      {worksheet.code}
                    </Typography>
                    {getStatusChip(worksheet.status)}
                  </Box>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    {worksheet.name}
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        ลูกค้า: {worksheet.customer?.name || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        จำนวน: {worksheet.total_quantity || 0} ชิ้น
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        วันที่สร้าง: {dayjs(worksheet.created_at).format('DD/MM/YYYY')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        กำหนดส่ง: {worksheet.due_date ? dayjs(worksheet.due_date).format('DD/MM/YYYY') : '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    color="primary"
                    onClick={() => handleViewWorksheet(worksheet.id)}
                  >
                    รายละเอียด
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained"
                    color="secondary"
                    onClick={() => handleCreateFromWorksheet(worksheet)}
                  >
                    สร้าง MaxSupply
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          
        {filteredWorksheets.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              {isLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography variant="body2">ไม่พบรายการ Worksheet</Typography>
              )}
            </Paper>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredWorksheets.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          รายการ Worksheet
        </Typography>
        
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<FaPlus />}
            onClick={() => navigate('/worksheets/create')}
            sx={{ mr: 1 }}
          >
            สร้าง Worksheet
          </Button>
          <Button 
            variant="outlined"
            startIcon={<FaCalendarAlt />}
            onClick={() => navigate('/worksheets/calendar')}
          >
            ปฏิทิน
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
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
              size="small"
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="สถานะ"
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="draft">แบบร่าง</MenuItem>
                <MenuItem value="pending">รอดำเนินการ</MenuItem>
                <MenuItem value="in_progress">กำลังดำเนินการ</MenuItem>
                <MenuItem value="completed">เสร็จสิ้น</MenuItem>
                <MenuItem value="cancelled">ยกเลิก</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>ระยะเวลา</InputLabel>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                label="ระยะเวลา"
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="today">วันนี้</MenuItem>
                <MenuItem value="week">7 วันล่าสุด</MenuItem>
                <MenuItem value="month">30 วันล่าสุด</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Tabs 
                value={viewMode} 
                onChange={(e, newValue) => setViewMode(newValue)}
                aria-label="view mode"
              >
                <Tab label="ตาราง" value="table" />
                <Tab label="การ์ด" value="cards" />
              </Tabs>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {viewMode === 'table' ? renderTableView() : renderCardView()}
    </Box>
  );
};

export default MaxSupplyWorksheetList;
