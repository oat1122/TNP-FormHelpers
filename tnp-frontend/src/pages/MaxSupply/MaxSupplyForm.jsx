import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Autocomplete,
  Card,
  CardContent,
  CardActions,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useMaxSupply } from '../../context/MaxSupplyContext';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
  getProductionTypeColor, 
  getProductionTypeLabel,
  getProductionTypeIcon,
  getShirtTypeLabel
} from '../../utils/maxSupplyUtils';
import { 
  FaPlus, 
  FaMinus, 
  FaArrowLeft, 
  FaSave, 
  FaTshirt, 
  FaInfoCircle, 
  FaClipboardList,
  FaStickyNote
} from 'react-icons/fa';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import WorksheetPreview from './WorksheetPreview';

const MaxSupplyForm = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const { 
    createMaxSupply, 
    getMaxSupply, 
    updateMaxSupply, 
    fetchWorksheetList,
    getWorksheetDetails,
    worksheetList,
    isLoading, 
    error 
  } = useMaxSupply();
  
  const [activeStep, setActiveStep] = useState(0);
  const [sizes, setSizes] = useState([{ size: '', quantity: 0 }]);
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [isWorksheetLoading, setIsWorksheetLoading] = useState(false);
  
  // Steps for the stepper
  const steps = ['ข้อมูลพื้นฐาน', 'ข้อมูลการผลิต', 'หมายเหตุ'];
  
  // Form validation schema
  const validationSchema = Yup.object({
    title: Yup.string().required('กรุณาระบุชื่องาน'),
    customer_name: Yup.string().required('กรุณาระบุชื่อลูกค้า'),
    production_type: Yup.string().required('กรุณาเลือกประเภทการผลิต'),
    start_date: Yup.date().required('กรุณาระบุวันที่เริ่ม'),
    expected_completion_date: Yup.date().required('กรุณาระบุวันที่คาดว่าจะเสร็จ'),
    due_date: Yup.date().required('กรุณาระบุวันที่ครบกำหนด'),
    shirt_type: Yup.string().required('กรุณาเลือกประเภทเสื้อ'),
    total_quantity: Yup.number()
      .min(1, 'จำนวนต้องมากกว่า 0')
      .required('กรุณาระบุจำนวนทั้งหมด'),
    priority: Yup.string().required('กรุณาเลือกความสำคัญ'),
  });
  
  // Formik initialization
  const formik = useFormik({
    initialValues: {
      worksheet_id: '',
      worksheet_item_id: '',
      title: '',
      customer_name: '',
      production_type: '',
      start_date: dayjs(),
      expected_completion_date: dayjs().add(5, 'day'),
      due_date: dayjs().add(7, 'day'),
      actual_completion_date: null,
      status: 'pending',
      priority: 'normal',
      shirt_type: '',
      total_quantity: 0,
      completed_quantity: 0,
      sizes: {},
      screen_points: 0,
      dtf_points: 0,
      sublimation_points: 0,
      notes: '',
      special_instructions: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Convert sizes array to object format expected by API
        const sizesObject = sizes.reduce((acc, curr) => {
          if (curr.size && curr.quantity) {
            acc[curr.size] = parseInt(curr.quantity, 10);
          }
          return acc;
        }, {});
        
        values.sizes = sizesObject;
        
        // Convert dates to ISO strings
        values.start_date = values.start_date.format('YYYY-MM-DD');
        values.expected_completion_date = values.expected_completion_date.format('YYYY-MM-DD');
        values.due_date = values.due_date.format('YYYY-MM-DD');
        
        if (values.actual_completion_date) {
          values.actual_completion_date = values.actual_completion_date.format('YYYY-MM-DD');
        } else {
          values.actual_completion_date = null;
        }
        
        if (isEditMode) {
          await updateMaxSupply(id, values);
        } else {
          await createMaxSupply(values);
        }
        
        navigate('/max-supply/list');
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  });
  
  // Fetch worksheets on component mount
  useEffect(() => {
    fetchWorksheetList();
    
    // If editing, fetch the max supply data
    if (isEditMode) {
      const fetchMaxSupplyData = async () => {
        try {
          const data = await getMaxSupply(id);
          
          // Convert string dates to dayjs objects for form
          const maxSupplyData = {
            ...data,
            start_date: dayjs(data.start_date),
            expected_completion_date: dayjs(data.expected_completion_date),
            due_date: dayjs(data.due_date),
            actual_completion_date: data.actual_completion_date ? dayjs(data.actual_completion_date) : null
          };
          
          // Set form values
          formik.setValues(maxSupplyData);
          
          // Set sizes from the API response
          if (data.sizes) {
            const sizesArray = [];
            const sizesData = typeof data.sizes === 'string' ? JSON.parse(data.sizes) : data.sizes;
            
            Object.entries(sizesData).forEach(([size, quantity]) => {
              sizesArray.push({ size, quantity });
            });
            
            if (sizesArray.length === 0) {
              sizesArray.push({ size: '', quantity: 0 });
            }
            
            setSizes(sizesArray);
          }
          
          // Set selected worksheet if it exists
          if (data.worksheet) {
            setSelectedWorksheet(data.worksheet);
          }
        } catch (error) {
          console.error('Error fetching max supply:', error);
        }
      };
      
      fetchMaxSupplyData();
    }
  }, [isEditMode, id]);
  
  // Handle worksheet selection and auto-fill
  const handleWorksheetSelect = async (event, worksheet) => {
    if (!worksheet) {
      setSelectedWorksheet(null);
      return;
    }
    
    setIsWorksheetLoading(true);
    setSelectedWorksheet(worksheet);
    
    try {
      // If we only have basic worksheet data, fetch full details
      if (!worksheet.items || !worksheet.sizes) {
        // Use the getWorksheetDetails function from context
        const detailedWorksheet = await getWorksheetDetails(worksheet.id);
        worksheet = detailedWorksheet;
        setSelectedWorksheet(worksheet);
      }
      
      // Extract size data from worksheet
      if (worksheet.sizes) {
        const sizesArray = [];
        const sizesData = typeof worksheet.sizes === 'string' 
          ? JSON.parse(worksheet.sizes) 
          : worksheet.sizes;
        
        Object.entries(sizesData).forEach(([size, quantity]) => {
          sizesArray.push({ size, quantity });
        });
        
        if (sizesArray.length === 0) {
          sizesArray.push({ size: '', quantity: 0 });
        }
        
        setSizes(sizesArray);
      }
      
      // Determine production type from worksheet items
      let productionType = 'screen'; // default
      if (worksheet.items && worksheet.items.length > 0) {
        const item = worksheet.items[0];
        if (item.print_method === 'dtf' || item.print_detail?.toLowerCase().includes('dtf')) {
          productionType = 'dtf';
        } else if (item.print_method === 'sublimation' || item.print_detail?.toLowerCase().includes('sublimation')) {
          productionType = 'sublimation';
        }
      }
      
      // Determine shirt type from worksheet items
      let shirtType = 't-shirt'; // default
      if (worksheet.items && worksheet.items.length > 0) {
        const item = worksheet.items[0];
        if (item.type === 'polo') {
          shirtType = 'polo';
        } else if (item.type === 'jacket') {
          shirtType = 'jacket';
        }
      }
      
      // Auto-fill form values
      formik.setValues({
        ...formik.values,
        worksheet_id: worksheet.id,
        worksheet_item_id: worksheet.items && worksheet.items.length > 0 ? worksheet.items[0].id : '',
        title: worksheet.name || '',
        customer_name: worksheet.customer?.name || '',
        production_type: productionType,
        due_date: dayjs(worksheet.due_date) || dayjs().add(7, 'day'),
        shirt_type: shirtType,
        total_quantity: worksheet.total_quantity || 0,
        notes: worksheet.notes || ''
      });
      
    } catch (error) {
      console.error('Error fetching worksheet details:', error);
    } finally {
      setIsWorksheetLoading(false);
    }
  };
  
  // Size management
  const addSizeRow = () => {
    setSizes([...sizes, { size: '', quantity: 0 }]);
  };
  
  const removeSizeRow = (index) => {
    const newSizes = [...sizes];
    newSizes.splice(index, 1);
    
    if (newSizes.length === 0) {
      newSizes.push({ size: '', quantity: 0 });
    }
    
    setSizes(newSizes);
  };
  
  const updateSizeRow = (index, field, value) => {
    const newSizes = [...sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setSizes(newSizes);
    
    // Update total quantity based on sizes
    const totalQuantity = newSizes.reduce((sum, item) => {
      return sum + (parseInt(item.quantity, 10) || 0);
    }, 0);
    
    formik.setFieldValue('total_quantity', totalQuantity);
  };
  
  // Handle stepper navigation
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Check if current step has validation errors
  const hasStepErrors = (step) => {
    if (step === 0) {
      const stepFields = ['title', 'customer_name', 'production_type', 'start_date', 'expected_completion_date', 'due_date'];
      return stepFields.some(field => formik.touched[field] && formik.errors[field]);
    } else if (step === 1) {
      const stepFields = ['shirt_type', 'total_quantity', 'priority'];
      return stepFields.some(field => formik.touched[field] && formik.errors[field]);
    }
    return false;
  };
  
  // Step content components
  const renderBasicInfoStep = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            เลือก Worksheet
          </Typography>
          
          <Autocomplete
            id="worksheet-select"
            options={worksheetList || []}
            loading={isLoading}
            value={selectedWorksheet}
            onChange={handleWorksheetSelect}
            getOptionLabel={(option) => `${option.code || ''}: ${option.name || ''}`}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ค้นหา Worksheet"
                placeholder="พิมพ์เพื่อค้นหา..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isWorksheetLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="subtitle2">{option.code}: {option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ลูกค้า: {option.customer?.name || '-'} | วันที่: {dayjs(option.created_at).format('DD/MM/YYYY')}
                  </Typography>
                </Box>
              </li>
            )}
          />
          
          {/* Worksheet Preview */}
          {selectedWorksheet && (
            <WorksheetPreview worksheet={selectedWorksheet} loading={isWorksheetLoading} />
          )}
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="title"
            name="title"
            label="ชื่องาน"
            value={formik.values.title}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="customer_name"
            name="customer_name"
            label="ชื่อลูกค้า"
            value={formik.values.customer_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.customer_name && Boolean(formik.errors.customer_name)}
            helperText={formik.touched.customer_name && formik.errors.customer_name}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth error={formik.touched.production_type && Boolean(formik.errors.production_type)}>
            <InputLabel id="production-type-label">ประเภทการผลิต</InputLabel>
            <Select
              labelId="production-type-label"
              id="production_type"
              name="production_type"
              value={formik.values.production_type}
              label="ประเภทการผลิต"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <MenuItem value="screen">สกรีน</MenuItem>
              <MenuItem value="dtf">DTF</MenuItem>
              <MenuItem value="sublimation">ซับลิเมชั่น</MenuItem>
            </Select>
            {formik.touched.production_type && formik.errors.production_type && (
              <FormHelperText>{formik.errors.production_type}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth error={formik.touched.priority && Boolean(formik.errors.priority)}>
            <InputLabel id="priority-label">ความสำคัญ</InputLabel>
            <Select
              labelId="priority-label"
              id="priority"
              name="priority"
              value={formik.values.priority}
              label="ความสำคัญ"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <MenuItem value="low">ต่ำ</MenuItem>
              <MenuItem value="normal">ปกติ</MenuItem>
              <MenuItem value="high">สูง</MenuItem>
              <MenuItem value="urgent">เร่งด่วน</MenuItem>
            </Select>
            {formik.touched.priority && formik.errors.priority && (
              <FormHelperText>{formik.errors.priority}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth error={formik.touched.status && Boolean(formik.errors.status)}>
            <InputLabel id="status-label">สถานะ</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formik.values.status}
              label="สถานะ"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={!isEditMode}
            >
              <MenuItem value="pending">รอเริ่ม</MenuItem>
              <MenuItem value="in_progress">กำลังผลิต</MenuItem>
              <MenuItem value="completed">เสร็จสิ้น</MenuItem>
              <MenuItem value="cancelled">ยกเลิก</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            กำหนดการ
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <DatePicker
            label="วันที่เริ่ม"
            value={formik.values.start_date}
            onChange={(date) => formik.setFieldValue('start_date', date)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: formik.touched.start_date && Boolean(formik.errors.start_date),
                helperText: formik.touched.start_date && formik.errors.start_date
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <DatePicker
            label="วันที่คาดว่าจะเสร็จ"
            value={formik.values.expected_completion_date}
            onChange={(date) => formik.setFieldValue('expected_completion_date', date)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: formik.touched.expected_completion_date && Boolean(formik.errors.expected_completion_date),
                helperText: formik.touched.expected_completion_date && formik.errors.expected_completion_date
              }
            }}
          />
          
          {formik.values.expected_completion_date &&
           formik.values.due_date &&
           formik.values.expected_completion_date.isAfter(formik.values.due_date) && (
            <FormHelperText error>
              วันที่คาดว่าจะเสร็จไม่ควรเกินวันครบกำหนด
            </FormHelperText>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <DatePicker
            label="วันครบกำหนด"
            value={formik.values.due_date}
            onChange={(date) => formik.setFieldValue('due_date', date)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: formik.touched.due_date && Boolean(formik.errors.due_date),
                helperText: formik.touched.due_date && formik.errors.due_date
              }
            }}
          />
        </Grid>
        
        {isEditMode && (
          <Grid item xs={12} md={4}>
            <DatePicker
              label="วันที่เสร็จจริง"
              value={formik.values.actual_completion_date}
              onChange={(date) => formik.setFieldValue('actual_completion_date', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: formik.touched.actual_completion_date && Boolean(formik.errors.actual_completion_date),
                  helperText: formik.touched.actual_completion_date && formik.errors.actual_completion_date
                }
              }}
            />
          </Grid>
        )}
      </Grid>
    );
  };
  
  const renderProductionDetailsStep = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FaTshirt color={theme.palette.text.secondary} />
            <Typography variant="subtitle1" fontWeight="bold">
              ข้อมูลเสื้อ
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={formik.touched.shirt_type && Boolean(formik.errors.shirt_type)}>
            <InputLabel id="shirt-type-label">ประเภทเสื้อ</InputLabel>
            <Select
              labelId="shirt-type-label"
              id="shirt_type"
              name="shirt_type"
              value={formik.values.shirt_type}
              label="ประเภทเสื้อ"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <MenuItem value="polo">เสื้อโปโล</MenuItem>
              <MenuItem value="t-shirt">เสื้อยืด</MenuItem>
              <MenuItem value="hoodie">ฮูดดี้</MenuItem>
              <MenuItem value="tank-top">เสื้อกล้าม</MenuItem>
            </Select>
            {formik.touched.shirt_type && formik.errors.shirt_type && (
              <FormHelperText>{formik.errors.shirt_type}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="total_quantity"
            name="total_quantity"
            label="จำนวนทั้งหมด"
            type="number"
            value={formik.values.total_quantity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.total_quantity && Boolean(formik.errors.total_quantity)}
            helperText={formik.touched.total_quantity && formik.errors.total_quantity}
            InputProps={{
              endAdornment: <Typography variant="body2">ตัว</Typography>
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              ขนาด
            </Typography>
            <Button
              startIcon={<FaPlus />}
              onClick={addSizeRow}
              variant="outlined"
              color="primary"
              size="small"
            >
              เพิ่มขนาด
            </Button>
          </Box>
          
          {sizes.map((sizeRow, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <FormControl sx={{ width: '40%' }}>
                <InputLabel id={`size-label-${index}`}>ขนาด</InputLabel>
                <Select
                  labelId={`size-label-${index}`}
                  value={sizeRow.size}
                  label="ขนาด"
                  onChange={(e) => updateSizeRow(index, 'size', e.target.value)}
                >
                  <MenuItem value="S">S</MenuItem>
                  <MenuItem value="M">M</MenuItem>
                  <MenuItem value="L">L</MenuItem>
                  <MenuItem value="XL">XL</MenuItem>
                  <MenuItem value="2XL">2XL</MenuItem>
                  <MenuItem value="3XL">3XL</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="จำนวน"
                type="number"
                value={sizeRow.quantity}
                onChange={(e) => updateSizeRow(index, 'quantity', e.target.value)}
                sx={{ width: '40%' }}
              />
              
              <IconButton
                color="error"
                onClick={() => removeSizeRow(index)}
                disabled={sizes.length <= 1}
              >
                <FaMinus />
              </IconButton>
            </Box>
          ))}
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FaClipboardList color={theme.palette.text.secondary} />
            <Typography variant="subtitle1" fontWeight="bold">
              จุดพิมพ์
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            p: 2, 
            bgcolor: getProductionTypeColor('screen', 0.1), 
            borderRadius: 1,
            position: 'relative'
          }}>
            <Typography variant="subtitle2" fontWeight="bold" color={getProductionTypeColor('screen')}>
              สกรีน
            </Typography>
            <TextField
              fullWidth
              id="screen_points"
              name="screen_points"
              label="จุดพิมพ์"
              type="number"
              value={formik.values.screen_points}
              onChange={formik.handleChange}
              margin="normal"
              InputProps={{
                endAdornment: <Typography variant="body2">จุด</Typography>
              }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            p: 2, 
            bgcolor: getProductionTypeColor('dtf', 0.1), 
            borderRadius: 1
          }}>
            <Typography variant="subtitle2" fontWeight="bold" color={getProductionTypeColor('dtf')}>
              DTF
            </Typography>
            <TextField
              fullWidth
              id="dtf_points"
              name="dtf_points"
              label="จุดพิมพ์"
              type="number"
              value={formik.values.dtf_points}
              onChange={formik.handleChange}
              margin="normal"
              InputProps={{
                endAdornment: <Typography variant="body2">จุด</Typography>
              }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            p: 2, 
            bgcolor: getProductionTypeColor('sublimation', 0.1), 
            borderRadius: 1
          }}>
            <Typography variant="subtitle2" fontWeight="bold" color={getProductionTypeColor('sublimation')}>
              ซับลิเมชั่น
            </Typography>
            <TextField
              fullWidth
              id="sublimation_points"
              name="sublimation_points"
              label="จุดพิมพ์"
              type="number"
              value={formik.values.sublimation_points}
              onChange={formik.handleChange}
              margin="normal"
              InputProps={{
                endAdornment: <Typography variant="body2">จุด</Typography>
              }}
            />
          </Box>
        </Grid>
      </Grid>
    );
  };
  
  const renderNotesStep = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FaStickyNote color={theme.palette.text.secondary} />
            <Typography variant="subtitle1" fontWeight="bold">
              หมายเหตุ
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            id="notes"
            name="notes"
            label="หมายเหตุ"
            multiline
            rows={4}
            value={formik.values.notes}
            onChange={formik.handleChange}
          />
          
          <FormHelperText>
            ข้อมูลเพิ่มเติมหรือรายละเอียดอื่นๆ ที่เกี่ยวกับงานผลิต
          </FormHelperText>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FaInfoCircle color={theme.palette.warning.main} />
            <Typography variant="subtitle1" fontWeight="bold">
              คำแนะนำพิเศษ
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            id="special_instructions"
            name="special_instructions"
            label="คำแนะนำพิเศษ"
            placeholder="คำแนะนำหรือข้อควรระวังเป็นพิเศษ..."
            multiline
            rows={4}
            value={formik.values.special_instructions}
            onChange={formik.handleChange}
          />
          
          <FormHelperText>
            ข้อมูลสำคัญที่ต้องระวังหรือพิจารณาเป็นพิเศษในการผลิต
          </FormHelperText>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        {/* Form Summary */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ bgcolor: '#fafafa' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                สรุปข้อมูลงานผลิต
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    ชื่องาน:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formik.values.title || '-'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    ลูกค้า:
                  </Typography>
                  <Typography variant="body1">
                    {formik.values.customer_name || '-'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    ประเภทการผลิต:
                  </Typography>
                  <Typography variant="body1">
                    {getProductionTypeLabel(formik.values.production_type) || '-'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    ประเภทเสื้อ:
                  </Typography>
                  <Typography variant="body1">
                    {getShirtTypeLabel(formik.values.shirt_type) || '-'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    จำนวน:
                  </Typography>
                  <Typography variant="body1">
                    {formik.values.total_quantity || 0} ตัว
                  </Typography>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    ครบกำหนด:
                  </Typography>
                  <Typography variant="body1">
                    {formik.values.due_date ? formik.values.due_date.format('DD/MM/YYYY') : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Render the current step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderBasicInfoStep();
      case 1:
        return renderProductionDetailsStep();
      case 2:
        return renderNotesStep();
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: isMobile ? 1 : 3 }}>
        <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                startIcon={<FaArrowLeft />} 
                onClick={() => navigate(-1)}
                sx={{ mr: 2 }}
              >
                กลับ
              </Button>
              <Typography variant="h5">
                {isEditMode ? 'แก้ไขงานผลิต' : 'สร้างงานผลิตใหม่'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label, index) => {
                const stepProps = {};
                const labelProps = {};
                
                // Add error indicator to step if it has errors and has been visited
                if (hasStepErrors(index)) {
                  labelProps.error = true;
                }
                
                return (
                  <Step key={label} {...stepProps}>
                    <StepLabel {...labelProps}>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>
            
            {/* Error display */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {/* Step content */}
            <Box sx={{ mt: 2, mb: 4 }}>
              {getStepContent(activeStep)}
            </Box>
            
            {/* Step navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                variant="outlined"
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                ย้อนกลับ
              </Button>
              
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={formik.handleSubmit}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <FaSave />}
                  >
                    {isEditMode ? 'บันทึกการแก้ไข' : 'สร้างงานผลิต'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                  >
                    ถัดไป
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
    </LocalizationProvider>
  );
};

export default MaxSupplyForm;
