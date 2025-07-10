import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
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
  Chip,
  Alert,
  Paper,
  Divider,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  Remove,
  Save,
  Cancel,
  AutoAwesome,
  CalendarToday,
  Assignment,
  Note,
  ArrowBack,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
// Import locale without direct reference to specific structure
// This works with both date-fns v2.x and v4.x
import * as dateFnsLocales from 'date-fns/locale';

const MaxSupplyForm = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [activeStep, setActiveStep] = useState(0);
  const [worksheets, setWorksheets] = useState([]);
  const [formData, setFormData] = useState({
    worksheet_id: '',
    title: '',
    customer_name: '',
    production_type: '',
    start_date: new Date(),
    expected_completion_date: new Date(),
    due_date: new Date(),
    shirt_type: '',
    total_quantity: 0,
    sizes: [],
    screen_points: 0,
    dtf_points: 0,
    sublimation_points: 0,
    priority: 'normal',
    notes: '',
    special_instructions: '',
  });
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [autoFillPreview, setAutoFillPreview] = useState(null);

  const steps = [
    'ข้อมูลพื้นฐาน',
    'ข้อมูลการผลิต',
    'หมายเหตุ',
  ];

  // Production types
  const productionTypes = [
    { value: 'screen', label: '📺 Screen', color: '#7c3aed' },
    { value: 'dtf', label: '📱 DTF', color: '#0891b2' },
    { value: 'sublimation', label: '⚽ Sublimation', color: '#16a34a' },
  ];

  // Shirt types
  const shirtTypes = [
    { value: 'polo', label: 'เสื้อโปโล' },
    { value: 't-shirt', label: 'เสื้อยืด' },
    { value: 'hoodie', label: 'เสื้อฮูดี้' },
    { value: 'tank-top', label: 'เสื้อกล้าม' },
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
  const loadWorksheets = async () => {
    try {
      const response = await fetch('/api/v1/worksheets');
      const data = await response.json();
      
      if (data.status === 'success') {
        setWorksheets(data.data);
      }
    } catch (error) {
      console.error('Error loading worksheets:', error);
    }
  };

  // Load existing data for edit mode
  const loadExistingData = async () => {
    try {
      const response = await fetch(`/api/v1/max-supplies/${id}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        const item = data.data;
        setFormData({
          ...item,
          start_date: new Date(item.start_date),
          expected_completion_date: new Date(item.expected_completion_date),
          due_date: new Date(item.due_date),
        });
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

  // Handle worksheet selection
  const handleWorksheetSelect = (worksheet) => {
    setSelectedWorksheet(worksheet);
    
    if (worksheet) {
      // Auto-fill data from worksheet
      const autoFillData = {
        worksheet_id: worksheet.worksheet_id,
        title: worksheet.product_name || worksheet.title,
        customer_name: worksheet.customer_name,
        production_type: worksheet.items?.[0]?.print_type || '',
        due_date: new Date(worksheet.due_date),
        shirt_type: worksheet.items?.[0]?.shirt_type || '',
        total_quantity: worksheet.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
        sizes: worksheet.items?.[0]?.sizes || [],
        screen_points: calculatePoints(worksheet.items, 'screen'),
        dtf_points: calculatePoints(worksheet.items, 'dtf'),
        sublimation_points: calculatePoints(worksheet.items, 'sublimation'),
        special_instructions: worksheet.special_instructions || '',
      };
      
      setFormData(prev => ({
        ...prev,
        ...autoFillData,
      }));
      
      setAutoFillPreview(autoFillData);
    }
  };

  // Calculate points for production type
  const calculatePoints = (items, type) => {
    if (!items) return 0;
    
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

  // Handle form data change
  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Handle size management
  const handleSizeChange = (index, field, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = {
      ...newSizes[index],
      [field]: value,
    };
    setFormData(prev => ({
      ...prev,
      sizes: newSizes,
    }));
  };

  const addSizeRow = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { sizes: [], quantity: 0 }],
    }));
  };

  const removeSizeRow = (index) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (activeStep === 0) {
      if (!formData.title) newErrors.title = 'กรุณากรอกชื่องาน';
      if (!formData.customer_name) newErrors.customer_name = 'กรุณากรอกชื่อลูกค้า';
      if (!formData.production_type) newErrors.production_type = 'กรุณาเลือกประเภทการผลิต';
      if (!formData.start_date) newErrors.start_date = 'กรุณาเลือกวันที่เริ่ม';
      if (!formData.expected_completion_date) newErrors.expected_completion_date = 'กรุณาเลือกวันที่คาดว่าจะเสร็จ';
      if (!formData.due_date) newErrors.due_date = 'กรุณาเลือกวันครบกำหนด';
      
      // Check date logic
      if (formData.start_date && formData.expected_completion_date) {
        if (formData.expected_completion_date < formData.start_date) {
          newErrors.expected_completion_date = 'วันที่คาดว่าจะเสร็จต้องมากกว่าวันที่เริ่ม';
        }
      }
      
      if (formData.expected_completion_date && formData.due_date) {
        if (formData.expected_completion_date > formData.due_date) {
          newErrors.expected_completion_date = 'วันที่คาดว่าจะเสร็จต้องไม่เกินวันครบกำหนด';
        }
      }
    } else if (activeStep === 1) {
      if (!formData.shirt_type) newErrors.shirt_type = 'กรุณาเลือกประเภทเสื้อ';
      if (!formData.total_quantity || formData.total_quantity <= 0) {
        newErrors.total_quantity = 'กรุณากรอกจำนวนที่ถูกต้อง';
      }
      if (!formData.sizes || formData.sizes.length === 0) {
        newErrors.sizes = 'กรุณาเพิ่มข้อมูลขนาด';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateForm()) {
      setActiveStep(prev => prev + 1);
    }
  };

  // Handle previous step
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? `/api/v1/max-supplies/${id}` : '/api/v1/max-supplies';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        navigate('/max-supply/list');
      } else {
        console.error('Error submitting form:', data.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorksheets();
    if (isEditMode) {
      loadExistingData();
    }
  }, [isEditMode, id]);

  // Step 1: Basic Information
  const StepBasicInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AutoAwesome sx={{ mr: 1 }} />
              เลือก Worksheet (Auto-fill)
            </Typography>
            <Autocomplete
              options={worksheets}
              getOptionLabel={(option) => `${option.code} - ${option.customer_name}`}
              value={selectedWorksheet}
              onChange={(event, value) => handleWorksheetSelect(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="เลือก Worksheet"
                  placeholder="เลือก Worksheet เพื่อ Auto-fill ข้อมูล"
                  helperText="เลือก Worksheet เพื่อกรอกข้อมูลอัตโนมัติ"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="subtitle2">{option.code}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.customer_name} - {option.product_name}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          </CardContent>
        </Card>
      </Grid>

      {autoFillPreview && (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              ข้อมูลที่จะ Auto-fill:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label={`ชื่องาน: ${autoFillPreview.title}`} size="small" />
              <Chip label={`ลูกค้า: ${autoFillPreview.customer_name}`} size="small" />
              <Chip label={`ประเภท: ${autoFillPreview.production_type}`} size="small" />
              <Chip label={`จำนวน: ${autoFillPreview.total_quantity}`} size="small" />
            </Box>
          </Alert>
        </Grid>
      )}

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="ชื่องาน"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="ชื่อลูกค้า"
          value={formData.customer_name}
          onChange={(e) => handleInputChange('customer_name', e.target.value)}
          error={!!errors.customer_name}
          helperText={errors.customer_name}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth error={!!errors.production_type} required>
          <InputLabel>ประเภทการผลิต</InputLabel>
          <Select
            value={formData.production_type}
            onChange={(e) => handleInputChange('production_type', e.target.value)}
            label="ประเภทการผลิต"
          >
            {productionTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: type.color,
                      borderRadius: '50%',
                    }}
                  />
                  {type.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
          {errors.production_type && (
            <Typography variant="caption" color="error">
              {errors.production_type}
            </Typography>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>ความสำคัญ</InputLabel>
          <Select
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            label="ความสำคัญ"
          >
            {priorityLevels.map((level) => (
              <MenuItem key={level.value} value={level.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: level.color,
                      borderRadius: '50%',
                    }}
                  />
                  {level.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={4}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
          <MuiDatePicker
            label="วันที่เริ่ม"
            value={formData.start_date}
            onChange={(value) => handleInputChange('start_date', value)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.start_date,
                helperText: errors.start_date,
                required: true
              }
            }}
          />
        </LocalizationProvider>
      </Grid>

      <Grid item xs={12} md={4}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
          <MuiDatePicker
            label="วันที่คาดว่าจะเสร็จ"
            value={formData.expected_completion_date}
            onChange={(value) => handleInputChange('expected_completion_date', value)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.expected_completion_date,
                helperText: errors.expected_completion_date,
                required: true
              }
            }}
          />
        </LocalizationProvider>
      </Grid>

      <Grid item xs={12} md={4}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
          <MuiDatePicker
            label="วันครบกำหนด"
            value={formData.due_date}
            onChange={(value) => handleInputChange('due_date', value)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.due_date,
                helperText: errors.due_date,
                required: true
              }
            }}
          />
        </LocalizationProvider>
      </Grid>
    </Grid>
  );

  // Step 2: Production Information
  const StepProductionInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth error={!!errors.shirt_type} required>
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
          {errors.shirt_type && (
            <Typography variant="caption" color="error">
              {errors.shirt_type}
            </Typography>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="จำนวนทั้งหมด"
          type="number"
          value={formData.total_quantity}
          onChange={(e) => handleInputChange('total_quantity', parseInt(e.target.value) || 0)}
          error={!!errors.total_quantity}
          helperText={errors.total_quantity}
          required
          InputProps={{
            inputProps: { min: 0 }
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">การจัดการขนาด</Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addSizeRow}
                size="small"
              >
                เพิ่มขนาด
              </Button>
            </Box>
            
            {formData.sizes.map((sizeRow, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">ชุดขนาดที่ {index + 1}</Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeSizeRow(index)}
                    disabled={formData.sizes.length === 1}
                  >
                    <Remove />
                  </IconButton>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Autocomplete
                      multiple
                      options={sizeOptions}
                      value={sizeRow.sizes || []}
                      onChange={(event, value) => handleSizeChange(index, 'sizes', value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="ขนาด"
                          placeholder="เลือกขนาด"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            label={option}
                            {...getTagProps({ index })}
                            size="small"
                            key={index}
                          />
                        ))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="จำนวน"
                      type="number"
                      value={sizeRow.quantity || 0}
                      onChange={(e) => handleSizeChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      InputProps={{
                        inputProps: { min: 0 }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
            
            {errors.sizes && (
              <Typography variant="caption" color="error">
                {errors.sizes}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              จุดพิมพ์ (คำนวณอัตโนมัติ)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {formData.screen_points}
                  </Typography>
                  <Typography variant="body2">📺 Screen Points</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {formData.dtf_points}
                  </Typography>
                  <Typography variant="body2">📱 DTF Points</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {formData.sublimation_points}
                  </Typography>
                  <Typography variant="body2">⚽ Sublimation Points</Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Step 3: Notes
  const StepNotes = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="หมายเหตุ"
          multiline
          rows={4}
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="ข้อมูลเพิ่มเติม..."
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="คำแนะนำพิเศษ"
          multiline
          rows={4}
          value={formData.special_instructions}
          onChange={(e) => handleInputChange('special_instructions', e.target.value)}
          placeholder="คำแนะนำพิเศษในการผลิต..."
        />
      </Grid>
    </Grid>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <StepBasicInfo />;
      case 1:
        return <StepProductionInfo />;
      case 2:
        return <StepNotes />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/max-supply/list')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" sx={{ ml: 2 }}>
          {isEditMode ? 'แก้ไขงาน' : 'สร้างงานใหม่'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          {renderStepContent()}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Button
              onClick={() => navigate('/max-supply/list')}
              startIcon={<Cancel />}
              variant="outlined"
              color="secondary"
            >
              ยกเลิก
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
              variant="outlined"
            >
              กลับ
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                startIcon={<Save />}
                variant="contained"
                disabled={loading}
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                endIcon={<ArrowForward />}
                variant="contained"
              >
                ถัดไป
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default MaxSupplyForm; 