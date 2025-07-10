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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Divider,
  IconButton,
  Collapse,
  CardMedia,
} from '@mui/material';
import {
  Save,
  Cancel,
  AutoAwesome,
  NavigateNext,
  NavigateBefore,
  CheckCircle,
  Info,
  Build,
  Note,
  Warning,
  AddCircle,
  RemoveCircle,
  Image,
  Schedule,
  Person,
  Category,
  Straighten,
  Print,
  ColorLens,
  Assignment,
  ArrowBack,
  Refresh,
  CalendarToday,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { maxSupplyApi, worksheetApi } from '../../services/maxSupplyApi';
import { useGetAllWorksheetQuery } from '../../features/Worksheet/worksheetApi';
import toast from 'react-hot-toast';
import { debugTokens } from '../../utils/tokenDebug';

// Set dayjs locale
dayjs.locale('th');

const MaxSupplyForm = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = Boolean(id);

  // States
  const [activeStep, setActiveStep] = useState(0);
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
    sample_image: null,
    print_locations: {
      screen: { enabled: false, position: '', colors: 0 },
      dtf: { enabled: false, position: '', colors: 0 },
      sublimation: { enabled: false, position: '', colors: 0 },
    },
    size_breakdown: [],
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
    { value: 'screen', label: '📺 Screen Printing', color: '#7c3aed' },
    { value: 'dtf', label: '📱 DTF (Direct to Film)', color: '#0891b2' },
    { value: 'sublimation', label: '⚽ Sublimation', color: '#16a34a' },
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

  // Size options
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  // Priority levels
  const priorityLevels = [
    { value: 'low', label: 'ต่ำ', color: '#10b981' },
    { value: 'normal', label: 'ปกติ', color: '#6b7280' },
    { value: 'high', label: 'สูง', color: '#f59e0b' },
    { value: 'urgent', label: 'ด่วน', color: '#ef4444' },
  ];

  // Steps definition
  const steps = [
    {
      label: 'ข้อมูลพื้นฐาน',
      icon: <Info />,
      description: 'เลือก Worksheet และกรอกข้อมูลพื้นฐาน'
    },
    {
      label: 'ข้อมูลการผลิต',
      icon: <Build />,
      description: 'กำหนดรายละเอียดการผลิตและจุดพิมพ์'
    },
    {
      label: 'หมายเหตุ',
      icon: <Note />,
      description: 'เพิ่มหมายเหตุและข้อมูลเพิ่มเติม'
    }
  ];

  // Process worksheet data
  const processWorksheetData = (data) => {
    if (!data) return [];
    
    try {
      let worksheetItems = [];
      
      if (Array.isArray(data)) {
        worksheetItems = data;
      } else if (data.data && Array.isArray(data.data)) {
        worksheetItems = data.data;
      } else if (typeof data === 'object') {
        const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayProps.length > 0) {
          worksheetItems = data[arrayProps[0]];
        }
      }
      
      return worksheetItems
        .filter(ws => ws && (ws.worksheet_id || ws.id || ws.work_id))
        .filter(ws => ws.has_production !== true)
        .map(ws => ({
          id: ws.worksheet_id || ws.id || ws.work_id || '',
          label: `${ws.customer_name || 'ไม่ระบุ'} - ${ws.product_name || ws.work_name || ws.title || 'ไม่ระบุ'}`,
          ...ws,
        }));
    } catch (error) {
      console.error('Error processing worksheet data:', error);
      return [];
    }
  };

  // Load worksheets
  useEffect(() => {
    debugTokens();
    if (worksheetData) {
      const options = processWorksheetData(worksheetData);
      setWorksheetOptions(options);
    }
  }, [worksheetData]);

  // Handle worksheet selection
  const handleWorksheetSelect = (worksheet) => {
    setSelectedWorksheet(worksheet);
    
    if (worksheet) {
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
        sample_image: worksheet.sample_image || null,
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

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Handle size breakdown
  const handleSizeBreakdown = (sizes) => {
    const breakdown = sizes.map(size => ({
      size,
      quantity: 0,
    }));
    setFormData(prev => ({
      ...prev,
      sizes,
      size_breakdown: breakdown,
    }));
  };

  // Handle size quantity change
  const handleSizeQuantityChange = (sizeIndex, quantity) => {
    const newBreakdown = [...formData.size_breakdown];
    newBreakdown[sizeIndex].quantity = quantity;
    
    const totalQuantity = newBreakdown.reduce((sum, item) => sum + item.quantity, 0);
    
    setFormData(prev => ({
      ...prev,
      size_breakdown: newBreakdown,
      total_quantity: totalQuantity,
    }));
  };

  // Handle print location changes
  const handlePrintLocationChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      print_locations: {
        ...prev.print_locations,
        [type]: {
          ...prev.print_locations[type],
          [field]: value,
        },
      },
    }));
  };

  // Validate current step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.title.trim()) newErrors.title = 'กรุณากรอกชื่องาน';
        if (!formData.customer_name.trim()) newErrors.customer_name = 'กรุณากรอกชื่อลูกค้า';
        if (!formData.start_date) newErrors.start_date = 'กรุณาเลือกวันที่เริ่มต้น';
        if (!formData.expected_completion_date) newErrors.expected_completion_date = 'กรุณาเลือกวันที่คาดว่าจะเสร็จ';
        if (!formData.due_date) newErrors.due_date = 'กรุณาเลือกวันที่ส่งมอบ';
        
        // Date validation
        if (formData.expected_completion_date && formData.due_date) {
          if (formData.expected_completion_date.isAfter(formData.due_date)) {
            newErrors.expected_completion_date = 'วันที่คาดว่าจะเสร็จต้องมาก่อนวันที่ครบกำหนด';
          }
        }
        break;
        
      case 1: // Production Information
        if (!formData.shirt_type) newErrors.shirt_type = 'กรุณาเลือกประเภทเสื้อ';
        if (!formData.production_type) newErrors.production_type = 'กรุณาเลือกประเภทการพิมพ์';
        if (formData.sizes.length === 0) newErrors.sizes = 'กรุณาเลือกไซส์';
        if (!formData.total_quantity || formData.total_quantity <= 0) newErrors.total_quantity = 'กรุณากรอกจำนวนที่ถูกต้อง';
        break;
        
      case 2: // Notes
        // Optional validation for notes
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step navigation
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
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

  // Manual refresh worksheets
  const manualRefreshWorksheets = async () => {
    try {
      toast.loading('กำลังโหลดข้อมูล Worksheet...', {id: 'worksheet-loading'});
      
      const response = await worksheetApi.getForMaxSupply();
      toast.dismiss('worksheet-loading');
      
      if (response.status === 'success' && response.data) {
        const options = processWorksheetData(response.data);
        setWorksheetOptions(options);
        toast.success(`โหลดข้อมูล Worksheet สำเร็จ (${options.length} รายการ)`);
      }
    } catch (error) {
      console.error('Error refreshing worksheets:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      toast.dismiss('worksheet-loading');
    }
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
                onClick={() => navigate('/max-supply')}
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

            {/* Progress Stepper */}
            <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel 
                    icon={
                      <Avatar 
                        sx={{ 
                          bgcolor: activeStep >= index ? 'primary.main' : 'grey.400',
                          width: 32, 
                          height: 32 
                        }}
                      >
                        {activeStep > index ? <CheckCircle /> : step.icon}
                      </Avatar>
                    }
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {step.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* Form Content */}
          <form onSubmit={(e) => e.preventDefault()}>
            {activeStep === 0 && (
              <StepBasicInfo
                formData={formData}
                errors={errors}
                worksheetOptions={worksheetOptions}
                worksheetLoading={worksheetLoading}
                selectedWorksheet={selectedWorksheet}
                onInputChange={handleInputChange}
                onWorksheetSelect={handleWorksheetSelect}
                onRefreshWorksheets={manualRefreshWorksheets}
                priorityLevels={priorityLevels}
              />
            )}

            {activeStep === 1 && (
              <StepProductionInfo
                formData={formData}
                errors={errors}
                shirtTypes={shirtTypes}
                productionTypes={productionTypes}
                sizeOptions={sizeOptions}
                onInputChange={handleInputChange}
                onSizeBreakdown={handleSizeBreakdown}
                onSizeQuantityChange={handleSizeQuantityChange}
                onPrintLocationChange={handlePrintLocationChange}
              />
            )}

            {activeStep === 2 && (
              <StepNotes
                formData={formData}
                errors={errors}
                onInputChange={handleInputChange}
              />
            )}

            {/* Navigation Buttons */}
            <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<NavigateBefore />}
                  variant="outlined"
                >
                  ย้อนกลับ
                </Button>
                
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/max-supply')}
                    startIcon={<Cancel />}
                  >
                    ยกเลิก
                  </Button>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={submitLoading}
                      startIcon={submitLoading ? <CircularProgress size={20} /> : <Save />}
                    >
                      {submitLoading ? 'กำลังบันทึก...' : (isEditMode ? 'อัปเดต' : 'สร้างงาน')}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={<NavigateNext />}
                    >
                      ถัดไป
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          </form>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

// Step 1: Basic Information Component
const StepBasicInfo = ({ 
  formData, 
  errors, 
  worksheetOptions, 
  worksheetLoading, 
  selectedWorksheet,
  onInputChange, 
  onWorksheetSelect, 
  onRefreshWorksheets,
  priorityLevels 
}) => {
  return (
    <Grid container spacing={3}>
      {/* Worksheet Selection */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
              เลือก Worksheet (Auto Fill)
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Autocomplete
                value={selectedWorksheet}
                onChange={(event, newValue) => onWorksheetSelect(newValue)}
                options={worksheetOptions}
                getOptionLabel={(option) => option.label || ''}
                loading={worksheetLoading}
                sx={{ flexGrow: 1 }}
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
              />
              <Button 
                variant="outlined" 
                onClick={onRefreshWorksheets} 
                title="รีเฟรชข้อมูล Worksheet"
                sx={{ height: 56 }}
              >
                <Refresh />
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Basic Information */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              ข้อมูลพื้นฐาน
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="ชื่องาน"
                  value={formData.title}
                  onChange={(e) => onInputChange('title', e.target.value)}
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
                  onChange={(e) => onInputChange('customer_name', e.target.value)}
                  error={!!errors.customer_name}
                  helperText={errors.customer_name}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>ระดับความสำคัญ</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => onInputChange('priority', e.target.value)}
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

      {/* Sample Image */}
      {formData.sample_image && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Image sx={{ mr: 1, verticalAlign: 'middle' }} />
                รูปตัวอย่างเสื้อ
              </Typography>
              <CardMedia
                component="img"
                height="200"
                image={formData.sample_image}
                alt="Sample shirt"
                sx={{ objectFit: 'contain', borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Dates */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
              กำหนดเวลา
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="วันที่เริ่มต้น"
                  value={formData.start_date}
                  onChange={(date) => onInputChange('start_date', date)}
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
                  onChange={(date) => onInputChange('expected_completion_date', date)}
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
                  label="วันที่ครบกำหนด"
                  value={formData.due_date}
                  onChange={(date) => onInputChange('due_date', date)}
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
            
            {formData.expected_completion_date && formData.due_date && 
             formData.expected_completion_date.isAfter(formData.due_date) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Warning sx={{ mr: 1 }} />
                วันที่คาดว่าจะเสร็จเกินกำหนดส่งมอบ กรุณาตรวจสอบอีกครั้ง
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Step 2: Production Information Component
const StepProductionInfo = ({ 
  formData, 
  errors, 
  shirtTypes, 
  productionTypes,
  sizeOptions,
  onInputChange, 
  onSizeBreakdown,
  onSizeQuantityChange,
  onPrintLocationChange 
}) => {
  return (
    <Grid container spacing={3}>
      {/* Shirt Type */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
              ประเภทเสื้อ
            </Typography>
            
            <FormControl fullWidth error={!!errors.shirt_type}>
              <InputLabel>ประเภทเสื้อ</InputLabel>
              <Select
                value={formData.shirt_type}
                onChange={(e) => onInputChange('shirt_type', e.target.value)}
                label="ประเภทเสื้อ"
              >
                {shirtTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.shirt_type && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.shirt_type}
                </Typography>
              )}
            </FormControl>
          </CardContent>
        </Card>
      </Grid>

      {/* Size Selection */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Straighten sx={{ mr: 1, verticalAlign: 'middle' }} />
              ขนาดและจำนวน
            </Typography>
            
            <Autocomplete
              multiple
              value={formData.sizes}
              onChange={(event, newValue) => onSizeBreakdown(newValue)}
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
                  error={!!errors.sizes}
                  helperText={errors.sizes}
                />
              )}
            />
            
            {/* Size Breakdown Table */}
            {formData.size_breakdown.length > 0 && (
              <TableContainer sx={{ mt: 2 }}>
                <Table>
                  <TableBody>
                    {formData.size_breakdown.map((item, index) => (
                      <TableRow key={item.size}>
                        <TableCell>
                          <Chip label={item.size} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => onSizeQuantityChange(index, parseInt(e.target.value) || 0)}
                            inputProps={{ min: 0 }}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>รวม</strong></TableCell>
                      <TableCell><strong>{formData.total_quantity} ตัว</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Print Locations */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Print sx={{ mr: 1, verticalAlign: 'middle' }} />
              จุดพิมพ์ (แยกกันคำนวณ)
            </Typography>
            
            <Grid container spacing={2}>
              {/* Screen Printing */}
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      📺 Screen Printing
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>เปิดใช้งาน</InputLabel>
                      <Select
                        value={formData.print_locations.screen.enabled}
                        onChange={(e) => onPrintLocationChange('screen', 'enabled', e.target.value)}
                        label="เปิดใช้งาน"
                      >
                        <MenuItem value={false}>ไม่ใช้</MenuItem>
                        <MenuItem value={true}>ใช้</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Collapse in={formData.print_locations.screen.enabled}>
                      <TextField
                        label="ตำแหน่งพิมพ์"
                        value={formData.print_locations.screen.position}
                        onChange={(e) => onPrintLocationChange('screen', 'position', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="จำนวนสี"
                        type="number"
                        value={formData.print_locations.screen.colors}
                        onChange={(e) => onPrintLocationChange('screen', 'colors', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                      />
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>

              {/* DTF */}
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      📱 DTF (Direct to Film)
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>เปิดใช้งาน</InputLabel>
                      <Select
                        value={formData.print_locations.dtf.enabled}
                        onChange={(e) => onPrintLocationChange('dtf', 'enabled', e.target.value)}
                        label="เปิดใช้งาน"
                      >
                        <MenuItem value={false}>ไม่ใช้</MenuItem>
                        <MenuItem value={true}>ใช้</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Collapse in={formData.print_locations.dtf.enabled}>
                      <TextField
                        label="ตำแหน่งพิมพ์"
                        value={formData.print_locations.dtf.position}
                        onChange={(e) => onPrintLocationChange('dtf', 'position', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="จำนวนสี"
                        type="number"
                        value={formData.print_locations.dtf.colors}
                        onChange={(e) => onPrintLocationChange('dtf', 'colors', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                      />
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sublimation */}
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      ⚽ Sublimation
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>เปิดใช้งาน</InputLabel>
                      <Select
                        value={formData.print_locations.sublimation.enabled}
                        onChange={(e) => onPrintLocationChange('sublimation', 'enabled', e.target.value)}
                        label="เปิดใช้งาน"
                      >
                        <MenuItem value={false}>ไม่ใช้</MenuItem>
                        <MenuItem value={true}>ใช้</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Collapse in={formData.print_locations.sublimation.enabled}>
                      <TextField
                        label="ตำแหน่งพิมพ์"
                        value={formData.print_locations.sublimation.position}
                        onChange={(e) => onPrintLocationChange('sublimation', 'position', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        label="จำนวนสี"
                        type="number"
                        value={formData.print_locations.sublimation.colors}
                        onChange={(e) => onPrintLocationChange('sublimation', 'colors', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                      />
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Step 3: Notes Component
const StepNotes = ({ formData, errors, onInputChange }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Note sx={{ mr: 1, verticalAlign: 'middle' }} />
              หมายเหตุและข้อมูลเพิ่มเติม
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="หมายเหตุทั่วไป"
                  value={formData.notes}
                  onChange={(e) => onInputChange('notes', e.target.value)}
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
                  onChange={(e) => onInputChange('special_instructions', e.target.value)}
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

      {/* Summary */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
              สรุปข้อมูล
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2"><strong>ชื่องาน:</strong> {formData.title}</Typography>
                <Typography variant="body2"><strong>ลูกค้า:</strong> {formData.customer_name}</Typography>
                <Typography variant="body2"><strong>ประเภทเสื้อ:</strong> {formData.shirt_type}</Typography>
                <Typography variant="body2"><strong>จำนวนรวม:</strong> {formData.total_quantity} ตัว</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2"><strong>วันที่เริ่ม:</strong> {formData.start_date?.format('DD/MM/YYYY')}</Typography>
                <Typography variant="body2"><strong>วันที่คาดว่าจะเสร็จ:</strong> {formData.expected_completion_date?.format('DD/MM/YYYY')}</Typography>
                <Typography variant="body2"><strong>วันที่ครบกำหนด:</strong> {formData.due_date?.format('DD/MM/YYYY')}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default MaxSupplyForm; 