import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Search,
  Refresh,
  FilterList,
  Add,
  Visibility,
  Assignment,
  Business,
  CalendarToday,
  Palette,
  CheckCircle,
  Close,
  ArrowForward,
  AutoAwesome,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
// Import locale without direct reference to specific structure
// This works with both date-fns v2.x and v4.x
import * as dateFnsLocales from 'date-fns/locale';
import { worksheetApi } from '../../services/maxSupplyApi';
import { debugTokens } from '../../utils/tokenDebug';

const WorksheetList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [autoFillDialog, setAutoFillDialog] = useState(false);
  const [autoFillPreview, setAutoFillPreview] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    customer: '',
    date_from: '',
    date_to: '',
  });

  // Production type colors and icons
  const productionColors = {
    screen: '#7c3aed',
    dtf: '#0891b2',
    sublimation: '#16a34a',
  };

  const productionIcons = {
    screen: '📺',
    dtf: '📱',
    sublimation: '⚽',
  };

  // Load worksheets
  const loadWorksheets = async () => {
    try {
      setLoading(true);
      console.log("WorksheetList: Fetching worksheets with filters:", filters);
      
      // Debug authentication tokens
      debugTokens();
      
      // Add a token manually to ensure it's included in the request
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      if (!token) {
        console.warn("No authentication token found! Requests might fail.");
      }
      
      const response = await worksheetApi.getForMaxSupply(filters);
      console.log("WorksheetList: API response:", response);
      
      if (response.status === 'success') {
        if (Array.isArray(response.data)) {
          console.log("WorksheetList: Retrieved", response.data.length, "worksheets");
          
          // Log sample data to understand structure
          if (response.data.length > 0) {
            console.log("WorksheetList: Sample worksheet data:", response.data[0]);
          }
          
          setWorksheets(response.data);
        } else {
          console.error("WorksheetList: Expected array but got:", typeof response.data);
          console.error("WorksheetList: Data structure:", response.data);
          setWorksheets([]);
        }
      } else {
        console.error("WorksheetList: API returned error status:", response.status);
        setWorksheets([]);
      }
    } catch (error) {
      console.error('WorksheetList: Error loading worksheets:', error);
      setWorksheets([]);
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
  };

  // Handle refresh
  const handleRefresh = () => {
    loadWorksheets();
  };

  // Handle view detail
  const handleViewDetail = (worksheet) => {
    setSelectedWorksheet(worksheet);
    setDetailDialog(true);
  };

  // Handle create production job
  const handleCreateProductionJob = (worksheet) => {
    // Generate auto-fill preview
    const preview = generateAutoFillPreview(worksheet);
    setAutoFillPreview(preview);
    setSelectedWorksheet(worksheet);
    setAutoFillDialog(true);
  };

  // Generate auto-fill preview
  const generateAutoFillPreview = (worksheet) => {
    const sizes = {};
    if (Array.isArray(worksheet.pattern_sizes)) {
      worksheet.pattern_sizes.forEach(s => {
        sizes[s.size_name] = s.quantity || 0;
      });
    } else if (worksheet.pattern_sizes) {
      const arr = [...(worksheet.pattern_sizes.men || []), ...(worksheet.pattern_sizes.women || []), ...(worksheet.pattern_sizes.unisex || [])];
      arr.forEach(s => {
        sizes[s.size_name] = s.quantity || 0;
      });
    }

    return {
      worksheet_id: worksheet.worksheet_id,
      title: worksheet.product_name || worksheet.work_name,
      customer_name: worksheet.customer_name || worksheet.cus_name,
      production_type: worksheet.screen_dft > 0 ? 'dtf' : 'screen',
      due_date: worksheet.due_date,
      shirt_type: worksheet.type_shirt === 'polo-shirt' ? 'polo' : 't-shirt',
      total_quantity: worksheet.total_quantity,
      sizes: sizes,
      screen_points: worksheet.screen_point || 0,
      dtf_points: worksheet.screen_dft || 0,
      sublimation_points: 0,
      special_instructions: worksheet.special_instructions || worksheet.worksheet_note || '',
      items: [],
    };
  };

  // Calculate points for production type
  const calculatePoints = (items, type) => {
    const basePoints = {
      screen: 2,
      dtf: 1,
      sublimation: 3,
    };
    
    return items
      .filter(item => item.print_type === type)
      .reduce((sum, item) => {
        const sizes = item.sizes ? Object.keys(item.sizes).length : 1;
        const colors = item.colors ? item.colors.length : 1;
        return sum + (basePoints[type] * sizes * colors);
      }, 0);
  };

  // Handle confirm create
  const handleConfirmCreate = () => {
    setAutoFillDialog(false);
    // Navigate to create form with pre-filled data
    navigate('/max-supply/create', {
      state: {
        worksheet: selectedWorksheet,
        autoFillData: autoFillPreview,
      },
    });
  };

  useEffect(() => {
    // Debug authentication tokens
    debugTokens();
    
    // Then load worksheets
    loadWorksheets();
  }, [filters]);

  // Worksheet Card Component
  const WorksheetCard = ({ worksheet }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            {worksheet.code}
          </Typography>
          <Chip
            label={worksheet.status}
            color={worksheet.status === 'approved' ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Business fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {worksheet.customer_name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Assignment fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {worksheet.product_name || 'ไม่ระบุชื่อสินค้า'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CalendarToday fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            วันที่สั่ง: {format(new Date(worksheet.created_at), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CalendarToday fontSize="small" color="error" />
          <Typography variant="body2" color="error">
            ครบกำหนด: {format(new Date(worksheet.due_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}
          </Typography>
        </Box>

        {/* Production Types */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {worksheet.worksheet_items?.map((item, index) => (
            <Chip
              key={index}
              label={`${productionIcons[item.print_type]} ${item.print_type}`}
              size="small"
              sx={{
                bgcolor: productionColors[item.print_type],
                color: 'white',
              }}
            />
          ))}
        </Box>

        {/* Quantity */}
        <Typography variant="body2" color="text.secondary">
          จำนวนทั้งหมด: {worksheet.worksheet_items?.reduce((sum, item) => sum + (item.quantity || 0), 0)} ชิ้น
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => handleViewDetail(worksheet)}
        >
          ดูรายละเอียด
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<AutoAwesome />}
          onClick={() => handleCreateProductionJob(worksheet)}
        >
          สร้างงานผลิต
        </Button>
      </CardActions>
    </Card>
  );

  // Filter Bar Component
  const FilterBar = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="ค้นหา worksheet..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>สถานะ</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="สถานะ"
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="approved">อนุมัติแล้ว</MenuItem>
                <MenuItem value="pending">รอการอนุมัติ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="ลูกค้า..."
              value={filters.customer}
              onChange={(e) => handleFilterChange('customer', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
              fullWidth
            >
              รีเฟรช
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Auto-fill Preview Dialog
  const AutoFillPreviewDialog = () => (
    <Dialog open={autoFillDialog} onClose={() => setAutoFillDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            <AutoAwesome sx={{ mr: 1 }} />
            ตัวอย่างข้อมูลที่จะ Auto-fill
          </Typography>
          <IconButton onClick={() => setAutoFillDialog(false)}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {autoFillPreview && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                ข้อมูลด้านล่างนี้จะถูกกรอกอัตโนมัติในฟอร์มสร้างงานผลิต คุณสามารถแก้ไขได้ภายหลัง
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    ข้อมูลพื้นฐาน
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle fontSize="small" color="success" />
                      <Typography variant="body2">
                        <strong>ชื่องาน:</strong> {autoFillPreview.title}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle fontSize="small" color="success" />
                      <Typography variant="body2">
                        <strong>ลูกค้า:</strong> {autoFillPreview.customer_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle fontSize="small" color="success" />
                      <Typography variant="body2">
                        <strong>วันครบกำหนด:</strong> {format(new Date(autoFillPreview.due_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle fontSize="small" color="success" />
                      <Typography variant="body2">
                        <strong>ประเภทการผลิต:</strong> {autoFillPreview.production_type}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    ข้อมูลการผลิต
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle fontSize="small" color="success" />
                      <Typography variant="body2">
                        <strong>ประเภทเสื้อ:</strong> {autoFillPreview.shirt_type}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle fontSize="small" color="success" />
                      <Typography variant="body2">
                        <strong>จำนวนทั้งหมด:</strong> {autoFillPreview.total_quantity} ชิ้น
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle fontSize="small" color="success" />
                      <Typography variant="body2">
                        <strong>จุดพิมพ์:</strong> 
                        📺 {autoFillPreview.screen_points}, 
                        📱 {autoFillPreview.dtf_points}, 
                        ⚽ {autoFillPreview.sublimation_points}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    รายการสินค้าในออร์เดอร์
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {autoFillPreview.items.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Chip
                          label={`${productionIcons[item.print_type]} ${item.print_type}`}
                          size="small"
                          sx={{
                            bgcolor: productionColors[item.print_type],
                            color: 'white',
                          }}
                        />
                        <Typography variant="body2">
                          {item.product_name || 'ไม่ระบุชื่อ'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          จำนวน: {item.quantity}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAutoFillDialog(false)}>ยกเลิก</Button>
        <Button
          variant="contained"
          onClick={handleConfirmCreate}
          startIcon={<ArrowForward />}
        >
          ไปที่ฟอร์มสร้างงาน
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Detail Dialog
  const DetailDialog = () => (
    <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">รายละเอียด Worksheet</Typography>
          <IconButton onClick={() => setDetailDialog(false)}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedWorksheet && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  ข้อมูลพื้นฐาน
                </Typography>
                <Typography><strong>รหัส:</strong> {selectedWorksheet.code}</Typography>
                <Typography><strong>ชื่อสินค้า:</strong> {selectedWorksheet.product_name || 'ไม่ระบุ'}</Typography>
                <Typography><strong>ลูกค้า:</strong> {selectedWorksheet.customer_name}</Typography>
                <Typography><strong>สถานะ:</strong> {selectedWorksheet.status}</Typography>
                <Typography><strong>วันที่สั่ง:</strong> {format(new Date(selectedWorksheet.created_at), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}</Typography>
                <Typography><strong>วันครบกำหนด:</strong> {format(new Date(selectedWorksheet.due_date), 'dd/MM/yyyy', { locale: dateFnsLocales.th })}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  รายการสินค้า
                </Typography>
                {selectedWorksheet.worksheet_items?.map((item, index) => (
                  <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={`${productionIcons[item.print_type]} ${item.print_type}`}
                        size="small"
                        sx={{
                          bgcolor: productionColors[item.print_type],
                          color: 'white',
                        }}
                      />
                      <Typography variant="body2">{item.product_name || 'ไม่ระบุชื่อ'}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      จำนวน: {item.quantity} ชิ้น
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ประเภทเสื้อ: {item.shirt_type}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            {selectedWorksheet.special_instructions && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  คำแนะนำพิเศษ
                </Typography>
                <Typography>{selectedWorksheet.special_instructions}</Typography>
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
            handleCreateProductionJob(selectedWorksheet);
          }}
          startIcon={<AutoAwesome />}
        >
          สร้างงานผลิต
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          เลือก Worksheet สำหรับสร้างงานผลิต
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {worksheets.length} รายการ
        </Typography>
      </Box>

      <FilterBar />

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="text" width="70%" height={24} />
                  <Skeleton variant="text" width="90%" height={24} />
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Skeleton variant="rounded" width={80} height={24} />
                    <Skeleton variant="rounded" width={80} height={24} />
                  </Box>
                </CardContent>
                <CardActions>
                  <Skeleton variant="rounded" width={100} height={32} />
                  <Skeleton variant="rounded" width={120} height={32} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : worksheets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            ไม่พบ Worksheet ที่สามารถสร้างงานผลิตได้
          </Typography>
          <Typography variant="body2" color="text.secondary">
            กรุณาตรวจสอบว่ามี Worksheet ที่อนุมัติแล้วและยังไม่ได้สร้างงานผลิต
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {worksheets.map((worksheet) => (
            <Grid item xs={12} md={6} lg={4} key={worksheet.worksheet_id}>
              <WorksheetCard worksheet={worksheet} />
            </Grid>
          ))}
        </Grid>
      )}

      <DetailDialog />
      <AutoFillPreviewDialog />
    </Container>
  );
};

export default WorksheetList;