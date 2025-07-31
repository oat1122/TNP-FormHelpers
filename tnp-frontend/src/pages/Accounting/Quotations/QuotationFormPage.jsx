import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Stack,
  Divider,
  Grid,
  TextField,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import { quotationService } from '../../../features/Accounting';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import CustomerAutocomplete from '../components/CustomerAutocomplete';
import ProductSelector from '../components/ProductSelector';

// Validation schema
const quotationSchema = yup.object({
  customer_id: yup.string().required('กรุณาเลือกลูกค้า'),
  valid_until: yup.date().required('กรุณาระบุวันที่ใช้ได้ถึง').min(new Date(), 'วันที่ต้องไม่เป็นอดีต'),
  payment_terms: yup.string().required('กรุณาระบุเงื่อนไขการชำระเงิน'),
  items: yup.array().min(1, 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'),
  tax_rate: yup.number().min(0, 'อัตราภาษีต้องไม่น้อยกว่า 0').max(100, 'อัตราภาษีต้องไม่เกิน 100'),
  deposit_amount: yup.number().min(0, 'มัดจำต้องไม่น้อยกว่า 0')
});

const steps = [
  {
    label: 'ข้อมูลลูกค้า',
    description: 'เลือกลูกค้าและข้อมูลการติดต่อ',
    icon: <PersonIcon />
  },
  {
    label: 'รายการสินค้า',
    description: 'เพิ่มสินค้าและกำหนดราคา',
    icon: <ReceiptIcon />
  },
  {
    label: 'เงื่อนไขและรายละเอียด',
    description: 'กำหนดเงื่อนไขการชำระเงินและหมายเหตุ',
    icon: <DescriptionIcon />
  },
  {
    label: 'ตรวจสอบและยืนยัน',
    description: 'ตรวจสอบข้อมูลก่อนบันทึก',
    icon: <CheckCircleIcon />
  }
];

const QuotationFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const isView = false; // You can determine this from URL or props
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  
  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid }
  } = useForm({
    resolver: yupResolver(quotationSchema),
    defaultValues: {
      customer_id: '',
      customer: null,
      valid_until: dayjs().add(30, 'day'),
      payment_terms: 'เงินสด',
      deposit_amount: 0,
      tax_rate: 7,
      items: [],
      remarks: ''
    }
  });

  const watchedItems = watch('items');
  const watchedCustomer = watch('customer');
  const watchedTaxRate = watch('tax_rate');

  // Load existing quotation for edit mode
  useEffect(() => {
    if (isEdit) {
      loadQuotation();
    }
  }, [id, isEdit]);

  const loadQuotation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await quotationService.getQuotation(id);
      
      if (response.data && response.data.data) {
        const data = response.data.data;
        setQuotationData(data);
        
        // Populate form with existing data
        setValue('customer_id', data.customer_id);
        setValue('customer', data.customer);
        setValue('valid_until', dayjs(data.valid_until));
        setValue('payment_terms', data.payment_terms || 'เงินสด');
        setValue('deposit_amount', data.deposit_amount || 0);
        setValue('tax_rate', data.tax_rate || 7);
        setValue('items', data.items || []);
        setValue('remarks', data.remarks || '');
      }
    } catch (err) {
      console.error('Error loading quotation:', err);
      setError('ไม่สามารถโหลดข้อมูลใบเสนอราคาได้');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const items = getValues('items') || [];
    const taxRate = getValues('tax_rate') || 0;
    
    let subtotal = 0;
    
    items.forEach(item => {
      const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
      const discount = itemTotal * ((item.discount_percentage || 0) / 100);
      subtotal += itemTotal - discount;
    });
    
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    return {
      subtotal,
      taxAmount,
      total,
      itemCount: items.length
    };
  }, [getValues]);

  const totals = calculateTotals();

  // Step validation
  const validateCurrentStep = useCallback(() => {
    const values = getValues();
    
    switch (activeStep) {
      case 0: // Customer step
        return !!values.customer_id && !!values.customer;
      case 1: // Items step
        return values.items && values.items.length > 0;
      case 2: // Terms step
        return !!values.valid_until && !!values.payment_terms;
      case 3: // Review step
        return isValid;
      default:
        return true;
    }
  }, [activeStep, getValues, isValid]);

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setError(null);
    } else {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleProductsConfirm = (selectedItems) => {
    setValue('items', selectedItems);
  };

  const handleRemoveItem = (index) => {
    const currentItems = getValues('items') || [];
    const newItems = currentItems.filter((_, i) => i !== index);
    setValue('items', newItems);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const submitData = {
        ...data,
        customer_id: data.customer.id,
        valid_until: data.valid_until.format('YYYY-MM-DD'),
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total_amount: totals.total
      };

      let response;
      if (isEdit) {
        response = await quotationService.updateQuotation(id, submitData);
      } else {
        response = await quotationService.createQuotation(submitData);
      }

      if (response.data && response.data.status === 'success') {
        setSuccessMessage(isEdit ? 'แก้ไขใบเสนอราคาเรียบร้อยแล้ว' : 'สร้างใบเสนอราคาเรียบร้อยแล้ว');
        
        setTimeout(() => {
          navigate(`/accounting/quotations/${response.data.data.id}`);
        }, 2000);
      } else {
        throw new Error(response.data?.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error('Error saving quotation:', err);
      setError(err.response?.data?.message || 'ไม่สามารถบันทึกใบเสนอราคาได้');
    } finally {
      setLoading(false);
    }
  };

  // Step content renderers
  const renderCustomerStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          ข้อมูลลูกค้า
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Controller
              name="customer"
              control={control}
              render={({ field }) => (
                <CustomerAutocomplete
                  {...field}
                  label="เลือกลูกค้า *"
                  error={errors.customer_id?.message}
                  disabled={isView}
                  onChange={(event, value) => {
                    field.onChange(value);
                    setValue('customer_id', value?.id || '');
                  }}
                />
              )}
            />
          </Grid>

          {watchedCustomer && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {watchedCustomer.type === 'company' ? <BusinessIcon /> : <PersonIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {watchedCustomer.type === 'company' ? watchedCustomer.company_name : 
                         `${watchedCustomer.first_name} ${watchedCustomer.last_name}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {watchedCustomer.email} • {watchedCustomer.phone}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {watchedCustomer.address && (
                    <Typography variant="body2">
                      <strong>ที่อยู่:</strong> {watchedCustomer.address}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderItemsStep = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            รายการสินค้า ({watchedItems?.length || 0})
          </Typography>
          
          {!isView && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowProductSelector(true)}
            >
              เพิ่มสินค้า
            </Button>
          )}
        </Box>

        {watchedItems && watchedItems.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>สินค้า</TableCell>
                  <TableCell align="center">จำนวน</TableCell>
                  <TableCell align="right">ราคาต่อหน่วย</TableCell>
                  <TableCell align="right">ส่วนลด %</TableCell>
                  <TableCell align="right">รวม</TableCell>
                  {!isView && <TableCell align="center">จัดการ</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {watchedItems.map((item, index) => {
                  const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
                  const discount = itemTotal * ((item.discount_percentage || 0) / 100);
                  const netTotal = itemTotal - discount;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {item.product?.name || item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.product?.sku || item.product?.code}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">฿{item.unit_price?.toLocaleString()}</TableCell>
                      <TableCell align="right">{item.discount_percentage}%</TableCell>
                      <TableCell align="right">฿{netTotal.toLocaleString()}</TableCell>
                      {!isView && (
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            ยังไม่ได้เพิ่มรายการสินค้า กรุณาคลิก "เพิ่มสินค้า" เพื่อเลือกสินค้า
          </Alert>
        )}

        {/* Totals Summary */}
        {watchedItems && watchedItems.length > 0 && (
          <Card variant="outlined" sx={{ mt: 3, bgcolor: 'grey.50' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    จำนวนรายการ: {totals.itemCount} รายการ
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1} alignItems="flex-end">
                    <Typography variant="body2">
                      ยอดรวม: ฿{totals.subtotal.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      ภาษี ({watchedTaxRate}%): ฿{totals.taxAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      รวมทั้งสิ้น: ฿{totals.total.toLocaleString()}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );

  const renderTermsStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          เงื่อนไขและรายละเอียด
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="valid_until"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="ใช้ได้ถึงวันที่ *"
                  disabled={isView}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.valid_until}
                      helperText={errors.valid_until?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="payment_terms"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="เงื่อนไขการชำระเงิน *"
                  fullWidth
                  disabled={isView}
                  error={!!errors.payment_terms}
                  helperText={errors.payment_terms?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="deposit_amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="จำนวนเงินมัดจำ"
                  type="number"
                  fullWidth
                  disabled={isView}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>฿</Typography>
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  error={!!errors.deposit_amount}
                  helperText={errors.deposit_amount?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="tax_rate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="อัตราภาษี"
                  type="number"
                  fullWidth
                  disabled={isView}
                  InputProps={{
                    endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  error={!!errors.tax_rate}
                  helperText={errors.tax_rate?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="remarks"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="หมายเหตุ"
                  multiline
                  rows={4}
                  fullWidth
                  disabled={isView}
                />
              )}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderReviewStep = () => (
    <Stack spacing={3}>
      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ข้อมูลลูกค้า
              </Typography>
              {watchedCustomer && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {watchedCustomer.type === 'company' ? <BusinessIcon /> : <PersonIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {watchedCustomer.type === 'company' ? watchedCustomer.company_name : 
                       `${watchedCustomer.first_name} ${watchedCustomer.last_name}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {watchedCustomer.email}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                สรุปยอดเงิน
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>ยอดรวม:</Typography>
                  <Typography>฿{totals.subtotal.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>ภาษี ({watchedTaxRate}%):</Typography>
                  <Typography>฿{totals.taxAmount.toLocaleString()}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">รวมทั้งสิ้น:</Typography>
                  <Typography variant="h6" color="primary.main">
                    ฿{totals.total.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Items Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            รายการสินค้า ({totals.itemCount} รายการ)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>สินค้า</TableCell>
                  <TableCell align="center">จำนวน</TableCell>
                  <TableCell align="right">ราคา</TableCell>
                  <TableCell align="right">ส่วนลด</TableCell>
                  <TableCell align="right">รวม</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {watchedItems?.map((item, index) => {
                  const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
                  const discount = itemTotal * ((item.discount_percentage || 0) / 100);
                  const netTotal = itemTotal - discount;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{item.product?.name || item.name}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">฿{item.unit_price?.toLocaleString()}</TableCell>
                      <TableCell align="right">{item.discount_percentage}%</TableCell>
                      <TableCell align="right">฿{netTotal.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );

  const getStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return renderCustomerStep();
      case 1:
        return renderItemsStep();
      case 2:
        return renderTermsStep();
      case 3:
        return renderReviewStep();
      default:
        return <div>Unknown step</div>;
    }
  };

  if (loading && isEdit && !quotationData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg">
        <Box py={3}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/accounting/quotations')}
              variant="outlined"
            >
              กลับไปรายการ
            </Button>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              {isEdit ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคาใหม่'}
            </Typography>
            
            {quotationData && (
              <DocumentStatusBadge 
                status={quotationData.status}
                showTooltip
              />
            )}
          </Stack>

          {/* Success Message */}
          {successMessage && (
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
              icon={<CheckCircleIcon />}
            >
              {successMessage}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Main Form */}
          <Paper sx={{ p: 3 }}>
            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel icon={step.icon}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {step.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Divider sx={{ mb: 3 }} />

            {/* Step Content */}
            <Box sx={{ minHeight: 400 }}>
              {getStepContent(activeStep)}
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                variant="outlined"
                size="large"
              >
                ย้อนกลับ
              </Button>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={loading || !isValid}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    variant="contained"
                    size="large"
                    color="primary"
                  >
                    {loading ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'สร้างใบเสนอราคา'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    endIcon={<ArrowForwardIcon />}
                    variant="contained"
                    size="large"
                    disabled={!validateCurrentStep()}
                  >
                    ถัดไป
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>

      {/* Product Selector Dialog */}
      <ProductSelector
        open={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onConfirm={handleProductsConfirm}
        selectedItems={watchedItems || []}
        title="เลือกสินค้าสำหรับใบเสนอราคา"
      />
    </LocalizationProvider>
  );
};

export default QuotationFormPage;