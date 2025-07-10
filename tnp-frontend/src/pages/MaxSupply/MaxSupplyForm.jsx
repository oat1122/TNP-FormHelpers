import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
  Paper,
  Divider,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Save,
  Cancel,
  AutoAwesome,
  CalendarToday,
  Assignment,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { maxSupplyApi, worksheetApi } from '../../services/maxSupplyApi';
import { useGetAllWorksheetQuery } from '../../features/Worksheet/worksheetApi';
import toast from 'react-hot-toast';

// Set dayjs locale
dayjs.locale('th');

const MaxSupplyForm = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // States
  const [formData, setFormData] = useState({
    worksheet_id: '',
    title: '',
    customer_name: '',
    production_type: '',
    start_date: dayjs(),
    expected_completion_date: dayjs().add(7, 'day'),
    due_date: dayjs().add(14, 'day'),
    shirt_type: '',
    total_quantity: 0,
    sizes: [],
    priority: 'normal',
    notes: '',
    special_instructions: '',
    status: 'pending',
  });

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [worksheetOptions, setWorksheetOptions] = useState([]);
  const [autoFillPreview, setAutoFillPreview] = useState(null);

  // Get worksheets data
  const { data: worksheetData, isLoading: worksheetLoading } = useGetAllWorksheetQuery();

  // Production types
  const productionTypes = [
    { value: 'screen', label: '🖥️ Screen Printing', color: '#7c3aed' },
    { value: 'dtf', label: '🖨️ DTF (Direct to Film)', color: '#0891b2' },
    { value: 'sublimation', label: '🎨 Sublimation', color: '#16a34a' },
    { value: 'embroidery', label: '🧵 Embroidery', color: '#dc2626' },
  ];

  // Shirt types
  const shirtTypes = [
    { value: 'polo', label: 'เสื้อโปโล' },
    { value: 't-shirt', label: 'เสื้อยืด' },
    { value: 'hoodie', label: 'เสื้อฮูดี้' },
    { value: 'tank-top', label: 'เสื้อกล้าม' },
    { value: 'long-sleeve', label: 'เสื้อแขนยาว' },
  ];

  // Priority levels
  const priorityLevels = [
    { value: 'low', label: 'ต่ำ', color: '#10b981' },
    { value: 'normal', label: 'ปกติ', color: '#6b7280' },
    { value: 'high', label: 'สูง', color: '#f59e0b' },
    { value: 'urgent', label: 'ด่วน', color: '#ef4444' },
  ];

  // Size options
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  // Load worksheets
  useEffect(() => {
    if (worksheetData?.data) {
      const options = worksheetData.data
        .filter(ws => ws.status === 'approved' || ws.status === 'pending')
        .map(ws => ({
          id: ws.worksheet_id,
          label: `${ws.customer_name} - ${ws.product_name || 'ไม่ระบุ'}`,
          ...ws,
        }));
      setWorksheetOptions(options);
    }
  }, [worksheetData]);

  // Load existing data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadExistingData();
    }
  }, [isEditMode, id]);

  // Load existing data
  const loadExistingData = async () => {
    try {
      setLoading(true);
      const response = await maxSupplyApi.getById(id);
      
      if (response.status === 'success') {
        const item = response.data;
        setFormData({
          ...item,
          start_date: dayjs(item.start_date),
          expected_completion_date: dayjs(item.expected_completion_date),
          due_date: dayjs(item.due_date),
          sizes: item.sizes || [],
        });
        
        // Find and set the selected worksheet
        const worksheet = worksheetOptions.find(ws => ws.id === item.worksheet_id);
        if (worksheet) {
          setSelectedWorksheet(worksheet);
        }
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Handle worksheet selection and auto fill
  const handleWorksheetSelect = (worksheet) => {
    setSelectedWorksheet(worksheet);
    
    if (worksheet) {
      // Auto-fill data from worksheet
      const autoFillData = {
        worksheet_id: worksheet.id,
        title: worksheet.product_name || worksheet.title || `${worksheet.customer_name} - งานใหม่`,
        customer_name: worksheet.customer_name,
        production_type: worksheet.print_type || worksheet.production_type || '',
        due_date: worksheet.due_date ? dayjs(worksheet.due_date) : dayjs().add(14, 'day'),
        shirt_type: worksheet.shirt_type || '',
        total_quantity: worksheet.total_quantity || 0,
        sizes: worksheet.sizes || [],
        special_instructions: worksheet.special_note || worksheet.notes || '',
      };
      
      setFormData(prev => ({
        ...prev,
        ...autoFillData,
      }));
      
      setAutoFillPreview(autoFillData);
      toast.success('ข้อมูลถูกกรอกอัตโนมัติจาก Worksheet แล้ว');
    } else {
      setAutoFillPreview(null);
    }
  };

  // Handle form field changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Handle sizes change
  const handleSizesChange = (newSizes) => {
    setFormData(prev => ({
      ...prev,
      sizes: newSizes,
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'กรุณากรอกชื่องาน';
    }
    
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'กรุณากรอกชื่อลูกค้า';
    }
    
    if (!formData.production_type) {
      newErrors.production_type = 'กรุณาเลือกประเภทการผลิต';
    }
    
    if (!formData.shirt_type) {
      newErrors.shirt_type = 'กรุณาเลือกประเภทเสื้อ';
    }
    
    if (!formData.total_quantity || formData.total_quantity <= 0) {
      newErrors.total_quantity = 'กรุณากรอกจำนวนที่ถูกต้อง';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'กรุณาเลือกวันที่เริ่มต้น';
    }
    
    if (!formData.expected_completion_date) {
      newErrors.expected_completion_date = 'กรุณาเลือกวันที่คาดว่าจะเสร็จ';
    }
    
    if (!formData.due_date) {
      newErrors.due_date = 'กรุณาเลือกวันที่ส่งมอบ';
    }
    
    // Check date logic
    if (formData.start_date && formData.expected_completion_date) {
      if (formData.start_date.isAfter(formData.expected_completion_date)) {
        newErrors.expected_completion_date = 'วันที่คาดว่าจะเสร็จต้องมาหลังวันที่เริ่มต้น';
      }
    }
    
    if (formData.expected_completion_date && formData.due_date) {
      if (formData.expected_completion_date.isAfter(formData.due_date)) {
        newErrors.due_date = 'วันที่ส่งมอบต้องมาหลังวันที่คาดว่าจะเสร็จ';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('กรุณาตรวจสอบข้อมูลให้ครบถ้วน');
      return;
    }
    
    try {
      setSubmitLoading(true);
      
      const submitData = {
        ...formData,
        start_date: formData.start_date.format('YYYY-MM-DD'),
        expected_completion_date: formData.expected_completion_date.format('YYYY-MM-DD'),
        due_date: formData.due_date.format('YYYY-MM-DD'),
      };
      
      let response;
      if (isEditMode) {
        response = await maxSupplyApi.update(id, submitData);
      } else {
        response = await maxSupplyApi.create(submitData);
      }
      
      if (response.status === 'success') {
        toast.success(isEditMode ? 'อัปเดตข้อมูลสำเร็จ' : 'สร้างงานใหม่สำเร็จ');
        navigate('/max-supply');
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/max-supply');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          {/* Header */}
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleCancel}
                variant="outlined"
                size="small"
              >
                กลับ
              </Button>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                {isEditMode ? 'แก้ไขงาน Max Supply' : 'สร้างงาน Max Supply ใหม่'}
              </Typography>
            </Box>

            {/* Auto Fill Preview */}
            {autoFillPreview && (
              <Alert 
                severity="info" 
                icon={<AutoAwesome />}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2">
                  <strong>ข้อมูลถูกกรอกอัตโนมัติจาก Worksheet:</strong><br />
                  ลูกค้า: {autoFillPreview.customer_name} | 
                  จำนวน: {autoFillPreview.total_quantity} ตัว | 
                  ประเภท: {autoFillPreview.production_type}
                </Typography>
              </Alert>
            )}
          </Paper>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Worksheet Selection */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                      เลือก Worksheet (Auto Fill)
                    </Typography>
                    
                    <Autocomplete
                      value={selectedWorksheet}
                      onChange={(event, newValue) => handleWorksheetSelect(newValue)}
                      options={worksheetOptions}
                      getOptionLabel={(option) => option.label || ''}
                      loading={worksheetLoading}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="เลือก Worksheet เพื่อกรอกข้อมูลอัตโนมัติ"
                          variant="outlined"
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {worksheetLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box>
                            <Typography variant="body1">{option.label}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.product_name} - {option.print_type} - {option.total_quantity} ตัว
                            </Typography>
                          </Box>
                        </li>
                      )}
                      noOptionsText="ไม่พบ Worksheet"
                      placeholder="ค้นหา Worksheet..."
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Basic Information */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      ข้อมูลพื้นฐาน
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="ชื่องาน"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          error={!!errors.title}
                          helperText={errors.title}
                          fullWidth
                          required
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="ชื่อลูกค้า"
                          value={formData.customer_name}
                          onChange={(e) => handleInputChange('customer_name', e.target.value)}
                          error={!!errors.customer_name}
                          helperText={errors.customer_name}
                          fullWidth
                          required
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={!!errors.production_type}>
                          <InputLabel>ประเภทการผลิต</InputLabel>
                          <Select
                            value={formData.production_type}
                            onChange={(e) => handleInputChange('production_type', e.target.value)}
                            label="ประเภทการผลิต"
                          >
                            {productionTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                <Box display="flex" alignItems="center">
                                  <Box
                                    sx={{
                                      width: 12,
                                      height: 12,
                                      backgroundColor: type.color,
                                      borderRadius: '50%',
                                      mr: 1,
                                    }}
                                  />
                                  {type.label}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={!!errors.shirt_type}>
                          <InputLabel>ประเภทเสื้อ</InputLabel>
                          <Select
                            value={formData.shirt_type}
                            onChange={(e) => handleInputChange('shirt_type', e.target.value)}
                            label="ประเภทเสื้อ"
                          >
                            {shirtTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="จำนวนรวม"
                          type="number"
                          value={formData.total_quantity}
                          onChange={(e) => handleInputChange('total_quantity', parseInt(e.target.value) || 0)}
                          error={!!errors.total_quantity}
                          helperText={errors.total_quantity}
                          fullWidth
                          required
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>ระดับความสำคัญ</InputLabel>
                          <Select
                            value={formData.priority}
                            onChange={(e) => handleInputChange('priority', e.target.value)}
                            label="ระดับความสำคัญ"
                          >
                            {priorityLevels.map((level) => (
                              <MenuItem key={level.value} value={level.value}>
                                <Box display="flex" alignItems="center">
                                  <Box
                                    sx={{
                                      width: 12,
                                      height: 12,
                                      backgroundColor: level.color,
                                      borderRadius: '50%',
                                      mr: 1,
                                    }}
                                  />
                                  {level.label}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sizes */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      ไซส์
                    </Typography>
                    
                    <Autocomplete
                      multiple
                      value={formData.sizes}
                      onChange={(event, newValue) => handleSizesChange(newValue)}
                      options={sizeOptions}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={option}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="เลือกไซส์"
                          placeholder="เลือกไซส์ที่ต้องการ"
                        />
                      )}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Dates */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                      วันที่
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <DatePicker
                          label="วันที่เริ่มต้น"
                          value={formData.start_date}
                          onChange={(date) => handleInputChange('start_date', date)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.start_date,
                              helperText: errors.start_date,
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <DatePicker
                          label="วันที่คาดว่าจะเสร็จ"
                          value={formData.expected_completion_date}
                          onChange={(date) => handleInputChange('expected_completion_date', date)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.expected_completion_date,
                              helperText: errors.expected_completion_date,
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <DatePicker
                          label="วันที่ส่งมอบ"
                          value={formData.due_date}
                          onChange={(date) => handleInputChange('due_date', date)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.due_date,
                              helperText: errors.due_date,
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      หมายเหตุ
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="หมายเหตุทั่วไป"
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          multiline
                          rows={4}
                          fullWidth
                          placeholder="หมายเหตุเพิ่มเติม..."
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="คำแนะนำพิเศษ"
                          value={formData.special_instructions}
                          onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                          multiline
                          rows={4}
                          fullWidth
                          placeholder="คำแนะนำพิเศษสำหรับการผลิต..."
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Actions */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={submitLoading}
                startIcon={<Cancel />}
              >
                ยกเลิก
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                disabled={submitLoading}
                startIcon={submitLoading ? <CircularProgress size={20} /> : <Save />}
              >
                {submitLoading ? 'กำลังบันทึก...' : (isEditMode ? 'อัปเดต' : 'สร้างงาน')}
              </Button>
            </Box>
          </form>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default MaxSupplyForm; 