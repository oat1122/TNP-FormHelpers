import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Stack,
  Chip,
  AlertTitle,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Percent as PercentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { productService } from '../../../../features/Accounting';

const PAYMENT_TERMS = [
  { value: 'Cash on Delivery', label: 'เงินสดเมื่อจัดส่ง', deposit_percent: 0 },
  { value: 'Net 7', label: '7 วัน', deposit_percent: 0 },
  { value: 'Net 15', label: '15 วัน', deposit_percent: 0 },
  { value: 'Net 30', label: '30 วัน', deposit_percent: 0 },
  { value: 'Net 45', label: '45 วัน', deposit_percent: 0 },
  { value: 'Net 60', label: '60 วัน', deposit_percent: 0 },
  { value: 'Advance Payment', label: 'จ่ายล่วงหน้า 100%', deposit_percent: 100 },
  { value: '50% Advance', label: 'จ่ายล่วงหน้า 50%', deposit_percent: 50 }
];

const DEFAULT_ITEM = {
  product_id: '', // Maps to mpc_id in master_product_categories
  item_name: '', // Maps to mpc_name or custom product name
  item_description: '', // Maps to mpc_remark or custom description
  quantity: 1,
  unit: 'ชิ้น',
  unit_price: 0,
  discount_amount: 0,
  discount_percent: 0,
  total_amount: 0,
  quantity_remaining: 0, // For partial delivery tracking
  vat_type: 'included' // 'included', 'excluded', 'exempt'
};

// Validation Schema
const quotationSchema = yup.object().shape({
  valid_until: yup
    .date()
    .required('กรุณาเลือกวันที่ใช้ได้ถึง')
    .min(dayjs().add(1, 'day').toDate(), 'วันที่ใช้ได้ถึงต้องเป็นอนาคต'),
  payment_terms: yup
    .string()
    .required('กรุณาเลือกเงื่อนไขการชำระเงิน'),
  deposit_amount: yup
    .number()
    .min(0, 'มัดจำต้องไม่ติดลบ'),
  deposit_percent: yup
    .number()
    .min(0, 'เปอร์เซ็นต์มัดจำต้องไม่ติดลบ')
    .max(100, 'เปอร์เซ็นต์มัดจำต้องไม่เกิน 100%'),
  tax_rate: yup
    .number()
    .min(0, 'อัตราภาษีต้องไม่ติดลบ')
    .max(100, 'อัตราภาษีต้องไม่เกิน 100%'),
  wht_rate: yup
    .number()
    .min(0, 'อัตราหัก ณ ที่จ่ายต้องไม่ติดลบ')
    .max(100, 'อัตราหัก ณ ที่จ่ายต้องไม่เกิน 100%'),
  remarks: yup.string(),
  items: yup
    .array()
    .min(1, 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ')
});

const itemSchema = yup.object().shape({
  item_name: yup
    .string()
    .required('กรุณากรอกชื่อสินค้า/บริการ'),
  quantity: yup
    .number()
    .positive('จำนวนต้องมากกว่า 0')
    .required('กรุณากรอกจำนวน'),
  unit_price: yup
    .number()
    .positive('ราคาต่อหน่วยต้องมากกว่า 0')
    .required('กรุณากรอกราคาต่อหน่วย'),
  discount_amount: yup
    .number()
    .min(0, 'ส่วนลดต้องไม่ติดลบ'),
  discount_percent: yup
    .number()
    .min(0, 'เปอร์เซ็นต์ส่วนลดต้องไม่ติดลบ')
    .max(100, 'เปอร์เซ็นต์ส่วนลดต้องไม่เกิน 100%')
});

const QuotationStep = ({ data, onChange, loading }) => {
  const [itemDialog, setItemDialog] = useState({
    open: false,
    item: { ...DEFAULT_ITEM },
    editIndex: -1
  });

  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    taxAmount: 0,
    whtAmount: 0,
    total: 0,
    netTotal: 0,
    depositAmount: 0,
    remainingAmount: 0
  });

  const [alerts, setAlerts] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const [validationErrors, setValidationErrors] = useState([]);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
    trigger
  } = useForm({
    resolver: yupResolver(quotationSchema),
    defaultValues: {
      valid_until: null,
      deposit_amount: 0,
      deposit_percent: 0,
      payment_terms: '',
      remarks: '',
      tax_rate: 7,
      wht_rate: 0,
      items: [],
      ...data.quotationData
    },
    mode: 'onChange'
  });

  const watchedItems = watch('items');
  const watchedTaxRate = watch('tax_rate');
  const watchedWhtRate = watch('wht_rate');
  const watchedDepositAmount = watch('deposit_amount');
  const watchedDepositPercent = watch('deposit_percent');
  const watchedPaymentTerms = watch('payment_terms');

  // Ref to track if this is initial render and prevent infinite loops
  const initialRender = useRef(true);
  const previousData = useRef({});
  const isUpdating = useRef(false);

  // Update form values when props change
  useEffect(() => {
    if (data.quotationData && Object.keys(data.quotationData).length > 0) {
      Object.keys(data.quotationData).forEach(key => {
        setValue(key, data.quotationData[key]);
      });
    }
  }, [data.quotationData, setValue]);

  // Calculate totals when items or tax rates change
  useEffect(() => {
    calculateTotals();
  }, [watchedItems, watchedTaxRate, watchedWhtRate, watchedDepositAmount, watchedDepositPercent, watchedPaymentTerms]);

  // Auto-set deposit amount based on payment terms
  useEffect(() => {
    const selectedTerm = PAYMENT_TERMS.find(term => term.value === watchedPaymentTerms);
    if (selectedTerm && selectedTerm.deposit_percent > 0) {
      setValue('deposit_percent', selectedTerm.deposit_percent);
      const calculatedDeposit = (totals.total * selectedTerm.deposit_percent) / 100;
      setValue('deposit_amount', calculatedDeposit);
    }
  }, [watchedPaymentTerms, totals.total, setValue]);

  // Backend Schema Mapping Function
  const mapToBackendSchema = (formData) => {
    return {
      // Map to backend quotation fields based on DATABASE_SCHEMA_ALIGNMENT.md
      customer_id: data.customer?.cus_id || data.customer?.id, // Maps to cus_id in master_customers
      pr_id: data.pricingDetails?.pr_id || null, // Link to pricing request
      quotation_no: '', // Will be auto-generated by backend
      valid_until: formData.valid_until ? dayjs(formData.valid_until).format('YYYY-MM-DD') : null,
      payment_terms: formData.payment_terms,
      deposit_amount: formData.deposit_amount || 0,
      deposit_percent: formData.deposit_percent || 0,
      tax_rate: formData.tax_rate || 7,
      wht_rate: formData.wht_rate || 0,
      remarks: formData.remarks || '',
      status: 'draft',
      items: formData.items.map(item => ({
        product_id: item.product_id || null, // Maps to mpc_id if selected from catalog
        item_name: item.item_name,
        item_description: item.item_description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || 0,
        discount_percent: item.discount_percent || 0,
        total_amount: item.total_amount,
        quantity_remaining: item.quantity_remaining || item.quantity,
        vat_type: item.vat_type || 'included'
      })),
      // Calculated totals for backend verification
      subtotal: totals.subtotal,
      total_discount: totals.discount,
      tax_amount: totals.taxAmount,
      wht_amount: totals.whtAmount,
      total_amount: totals.total,
      net_amount: totals.netTotal
    };
  };

  // Notify parent of changes
  useEffect(() => {
    if (!initialRender.current && isValid) {
      const formData = getValues();
      const mappedData = mapToBackendSchema(formData);
      onChange(mappedData);
    } else if (initialRender.current) {
      initialRender.current = false;
    }
  }, [watch(), onChange, isValid, getValues, totals]);

  const calculateTotals = () => {
    const items = watchedItems || [];
    
    // Calculate item totals first
    const itemTotals = items.map(item => {
      const baseAmount = item.quantity * item.unit_price;
      const discountAmount = item.discount_percent > 0 
        ? (baseAmount * item.discount_percent) / 100
        : item.discount_amount || 0;
      return baseAmount - discountAmount;
    });

    const subtotal = itemTotals.reduce((sum, total) => sum + total, 0);
    const discount = items.reduce((sum, item) => {
      const baseAmount = item.quantity * item.unit_price;
      const discountAmount = item.discount_percent > 0 
        ? (baseAmount * item.discount_percent) / 100
        : item.discount_amount || 0;
      return sum + discountAmount;
    }, 0);

    // Calculate VAT on subtotal (after discount)
    const taxAmount = (subtotal * (watchedTaxRate || 0)) / 100;
    
    // Calculate WHT on subtotal (before VAT)
    const whtAmount = (subtotal * (watchedWhtRate || 0)) / 100;
    
    // Total = Subtotal + VAT
    const total = subtotal + taxAmount;
    
    // Net Total = Total - WHT
    const netTotal = total - whtAmount;
    
    // Calculate deposit amount
    let depositAmount = watchedDepositAmount || 0;
    if (watchedDepositPercent > 0) {
      depositAmount = (total * watchedDepositPercent) / 100;
    }
    
    // Remaining amount after deposit
    const remainingAmount = netTotal - depositAmount;

    setTotals({
      subtotal,
      discount,
      taxAmount,
      whtAmount,
      total,
      netTotal,
      depositAmount,
      remainingAmount
    });
  };

  const showAlert = (message, severity = 'info') => {
    setAlerts({
      open: true,
      message,
      severity
    });
  };

  const closeAlert = () => {
    setAlerts({
      open: false,
      message: '',
      severity: 'info'
    });
  };

  const validateForm = () => {
    const formData = getValues();
    const errors = [];

    // Custom validations beyond yup schema
    if (formData.items.length === 0) {
      errors.push('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
    }

    // Check if deposit amount doesn't exceed total
    if (formData.deposit_amount > totals.total) {
      errors.push('มัดจำต้องไม่เกินยอดรวมทั้งสิ้น');
    }

    // Validate each item's discount doesn't exceed item total
    formData.items.forEach((item, index) => {
      const itemTotal = item.quantity * item.unit_price;
      const discountAmount = item.discount_percent > 0 
        ? (itemTotal * item.discount_percent) / 100
        : item.discount_amount || 0;
      
      if (discountAmount > itemTotal) {
        errors.push(`รายการที่ ${index + 1}: ส่วนลดต้องไม่เกินยอดรวมของรายการ`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAddItem = () => {
    setItemDialog({
      open: true,
      item: { ...DEFAULT_ITEM },
      editIndex: -1
    });
  };

  const handleEditItem = (index) => {
    const currentItems = getValues('items') || [];
    setItemDialog({
      open: true,
      item: { ...currentItems[index] },
      editIndex: index
    });
  };

  const handleDeleteItem = (index) => {
    const currentItems = getValues('items') || [];
    const newItems = currentItems.filter((_, i) => i !== index);
    setValue('items', newItems);
    trigger('items');
    showAlert('ลบรายการเรียบร้อยแล้ว', 'success');
  };

  const handleSaveItem = async () => {
    const { item, editIndex } = itemDialog;
    
    // Validate item using yup schema
    try {
      await itemSchema.validate(item, { abortEarly: false });
    } catch (validationError) {
      const errorMessages = validationError.inner.map(err => err.message);
      showAlert(errorMessages.join(', '), 'error');
      return;
    }
    
    // Calculate item total
    const baseAmount = item.quantity * item.unit_price;
    const discountAmount = item.discount_percent > 0 
      ? (baseAmount * item.discount_percent) / 100
      : item.discount_amount || 0;
    const itemTotal = baseAmount - discountAmount;
    
    // Set quantity_remaining to quantity for new items
    const itemWithTotal = { 
      ...item, 
      total_amount: itemTotal,
      quantity_remaining: item.quantity_remaining || item.quantity,
      discount_amount: discountAmount // Ensure consistent discount calculation
    };

    const currentItems = getValues('items') || [];
    let newItems;
    if (editIndex >= 0) {
      // Edit existing item
      newItems = [...currentItems];
      newItems[editIndex] = itemWithTotal;
    } else {
      // Add new item
      newItems = [...currentItems, itemWithTotal];
    }

    setValue('items', newItems);
    trigger('items');

    setItemDialog({
      open: false,
      item: { ...DEFAULT_ITEM },
      editIndex: -1
    });

    showAlert(
      editIndex >= 0 ? 'แก้ไขรายการเรียบร้อยแล้ว' : 'เพิ่มรายการเรียบร้อยแล้ว', 
      'success'
    );
  };

  const handleItemChange = (field, value) => {
    setItemDialog(prev => {
      const updatedItem = {
        ...prev.item,
        [field]: value
      };
      
      // Auto-calculate discount when discount_percent changes
      if (field === 'discount_percent') {
        const baseAmount = updatedItem.quantity * updatedItem.unit_price;
        updatedItem.discount_amount = (baseAmount * value) / 100;
      }
      
      // Auto-calculate discount_percent when discount_amount changes
      if (field === 'discount_amount') {
        const baseAmount = updatedItem.quantity * updatedItem.unit_price;
        if (baseAmount > 0) {
          updatedItem.discount_percent = (value / baseAmount) * 100;
        }
      }
      
      // Reset discount_percent when quantity or unit_price changes
      if (field === 'quantity' || field === 'unit_price') {
        if (updatedItem.discount_percent > 0) {
          const baseAmount = updatedItem.quantity * updatedItem.unit_price;
          updatedItem.discount_amount = (baseAmount * updatedItem.discount_percent) / 100;
        }
      }
      
      return {
        ...prev,
        item: updatedItem
      };
    });
  };

  const getItemSubtotal = (item) => {
    const baseAmount = item.quantity * item.unit_price;
    const discountAmount = item.discount_percent > 0 
      ? (baseAmount * item.discount_percent) / 100
      : item.discount_amount || 0;
    return baseAmount - discountAmount;
  };

  const ItemDialog = () => (
    <Dialog open={itemDialog.open} onClose={() => setItemDialog({ open: false, item: { ...DEFAULT_ITEM }, editIndex: -1 })} maxWidth="md" fullWidth>
      <DialogTitle>
        {itemDialog.editIndex >= 0 ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="ชื่อสินค้า/บริการ"
              value={itemDialog.item.item_name}
              onChange={(e) => handleItemChange('item_name', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="รายละเอียด"
              multiline
              rows={3}
              value={itemDialog.item.item_description}
              onChange={(e) => handleItemChange('item_description', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="จำนวน"
              type="number"
              value={itemDialog.item.quantity}
              onChange={(e) => handleItemChange('quantity', parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0, step: 0.01 }}
              required
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="หน่วย"
              value={itemDialog.item.unit}
              onChange={(e) => handleItemChange('unit', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="ราคาต่อหน่วย"
              type="number"
              value={itemDialog.item.unit_price}
              onChange={(e) => handleItemChange('unit_price', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position="start">฿</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
              required
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="ส่วนลด (%)"
              type="number"
              value={itemDialog.item.discount_percent}
              onChange={(e) => handleItemChange('discount_percent', parseFloat(e.target.value) || 0)}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{ min: 0, max: 100, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="ส่วนลด (฿)"
              type="number"
              value={itemDialog.item.discount_amount}
              onChange={(e) => handleItemChange('discount_amount', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position="start">฿</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>ประเภท VAT</InputLabel>
              <Select
                value={itemDialog.item.vat_type}
                label="ประเภท VAT"
                onChange={(e) => handleItemChange('vat_type', e.target.value)}
              >
                <MenuItem value="included">รวม VAT</MenuItem>
                <MenuItem value="excluded">แยก VAT</MenuItem>
                <MenuItem value="exempt">ยกเว้น VAT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="subtitle2">
                ยอดรวมรายการ: ฿{getItemSubtotal(itemDialog.item).toLocaleString()}
              </Typography>
              {itemDialog.item.discount_percent > 0 && (
                <Typography variant="body2" color="text.secondary">
                  ส่วนลด {itemDialog.item.discount_percent.toFixed(2)}% = ฿{((itemDialog.item.quantity * itemDialog.item.unit_price * itemDialog.item.discount_percent) / 100).toLocaleString()}
                </Typography>
              )}
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setItemDialog({ open: false, item: { ...DEFAULT_ITEM }, editIndex: -1 })}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleSaveItem}
          variant="contained"
          disabled={!itemDialog.item.item_name || itemDialog.item.quantity <= 0 || itemDialog.item.unit_price <= 0}
        >
          {itemDialog.editIndex >= 0 ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Typography variant="h5" gutterBottom>
          ข้อมูลใบเสนอราคา
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          กรอกรายละเอียดใบเสนอราคา รายการสินค้า และเงื่อนไขการชำระเงิน
        </Typography>

        {/* Summary from previous steps */}
        {(data.pricingDetails || data.customer) && (
          <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                สรุปข้อมูล
              </Typography>
              <Grid container spacing={2}>
                {data.pricingDetails && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">จากการขอราคา:</Typography>
                    <Typography variant="body2">
                      {data.pricingDetails.pr_no} - {data.pricingDetails.pr_work_name}
                    </Typography>
                  </Grid>
                )}
                {data.customer && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">ลูกค้า:</Typography>
                    <Typography variant="body2">
                      {data.customer.company_name || data.customer.name}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Basic Quotation Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              ข้อมูลพื้นฐาน
            </Typography>
            {/* Validation Errors Display */}
            {validationErrors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>ข้อผิดพลาดในการกรอกข้อมูล</AlertTitle>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="valid_until"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="วันที่ใช้ได้ถึง *"
                      value={field.value}
                      onChange={field.onChange}
                      minDate={dayjs().add(1, 'day')}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          required 
                          error={!!error}
                          helperText={error?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="payment_terms"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel>เงื่อนไขการชำระเงิน *</InputLabel>
                      <Select
                        {...field}
                        label="เงื่อนไขการชำระเงิน"
                      >
                        {PAYMENT_TERMS.map((term) => (
                          <MenuItem key={term.value} value={term.value}>
                            {term.label}
                            {term.deposit_percent > 0 && (
                              <Chip 
                                size="small" 
                                label={`มัดจำ ${term.deposit_percent}%`} 
                                sx={{ ml: 1 }}
                              />
                            )}
                          </MenuItem>
                        ))}
                      </Select>
                      {error && <Typography variant="caption" color="error">{error.message}</Typography>}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="deposit_amount"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="มัดจำ (จำนวนเงิน)"
                      type="number"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!error}
                      helperText={error?.message || `สูงสุด: ฿${totals.total.toLocaleString()}`}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                        // Auto-calculate percentage
                        if (totals.total > 0) {
                          setValue('deposit_percent', (value / totals.total) * 100);
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Controller
                  name="deposit_percent"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="มัดจำ (%)"
                      type="number"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                      error={!!error}
                      helperText={error?.message}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                        // Auto-calculate amount
                        setValue('deposit_amount', (totals.total * value) / 100);
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Controller
                  name="tax_rate"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="อัตราภาษี VAT"
                      type="number"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Controller
                  name="wht_rate"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="อัตราหัก ณ ที่จ่าย"
                      type="number"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="หมายเหตุ"
                      multiline
                      rows={3}
                      placeholder="หมายเหตุเพิ่มเติม เงื่อนไขพิเศษ หรือข้อควรระวัง"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Items Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                รายการสินค้า/บริการ
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                variant="contained"
              >
                เพิ่มรายการ
              </Button>
            </Box>

            {watchedItems && watchedItems.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>รายการ</TableCell>
                      <TableCell align="center">จำนวน</TableCell>
                      <TableCell align="center">หน่วย</TableCell>
                      <TableCell align="right">ราคาต่อหน่วย</TableCell>
                      <TableCell align="right">ส่วนลด</TableCell>
                      <TableCell align="right">ยอดรวม</TableCell>
                      <TableCell align="center" width={120}>จัดการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {watchedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="subtitle2">{item.item_name}</Typography>
                          {item.item_description && (
                            <Typography variant="body2" color="text.secondary">
                              {item.item_description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="center">{item.unit}</TableCell>
                        <TableCell align="right">฿{item.unit_price.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {item.discount_amount > 0 ? `฿${item.discount_amount.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          ฿{getItemSubtotal(item).toLocaleString()}
                          {item.quantity_remaining !== item.quantity && (
                            <Typography variant="caption" display="block" color="warning.main">
                              คงเหลือ: {item.quantity_remaining}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleEditItem(index)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteItem(index)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="warning">
                <Typography variant="subtitle1" fontWeight="bold">
                  ยังไม่มีรายการสินค้า
                </Typography>
                <Typography variant="body2">
                  กรุณาเพิ่มรายการสินค้าหรือบริการอย่างน้อย 1 รายการ
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Totals Summary */}
        {watchedItems && watchedItems.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                สรุปยอดเงิน
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>ยอดรวมก่อนภาษี:</Typography>
                    <Typography fontWeight="bold">฿{totals.subtotal.toLocaleString()}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>ส่วนลดรวม:</Typography>
                    <Typography color="error.main">-฿{totals.discount.toLocaleString()}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>ภาษี VAT ({watchedTaxRate}%):</Typography>
                    <Typography>฿{totals.taxAmount.toLocaleString()}</Typography>
                  </Box>
                  {watchedWhtRate > 0 && (
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography color="warning.main">หัก ณ ที่จ่าย ({watchedWhtRate}%):</Typography>
                      <Typography color="warning.main">-฿{totals.whtAmount.toLocaleString()}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" fontWeight="bold">ยอดรวมทั้งสิ้น:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      ฿{totals.total.toLocaleString()}
                    </Typography>
                  </Box>
                  {watchedWhtRate > 0 && (
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="subtitle1" fontWeight="bold" color="success.main">ยอดสุทธิ (หลังหัก ณ ที่จ่าย):</Typography>
                      <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                        ฿{totals.netTotal.toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  {(watchedDepositAmount > 0 || watchedDepositPercent > 0) && (
                    <Alert severity="info">
                      <Typography variant="subtitle2" fontWeight="bold">
                        การชำระเงิน
                      </Typography>
                      <Typography variant="body2">
                        มัดจำ: ฿{totals.depositAmount.toLocaleString()}
                        {watchedDepositPercent > 0 && ` (${watchedDepositPercent.toFixed(2)}%)`}
                      </Typography>
                      <Typography variant="body2">
                        คงเหลือ: ฿{totals.remainingAmount.toLocaleString()}
                      </Typography>
                      {totals.depositAmount > totals.netTotal && (
                        <Typography variant="body2" color="error">
                          ⚠️ มัดจำเกินยอดสุทธิ
                        </Typography>
                      )}
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Item Dialog */}
        <ItemDialog />
        
        {/* Validation Summary */}
        {!isValid && watchedItems && watchedItems.length > 0 && (
          <Card sx={{ mt: 2, bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography variant="h6" color="warning.dark" gutterBottom>
                <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ตรวจสอบข้อมูลก่อนดำเนินการต่อ
              </Typography>
              <Stack spacing={1}>
                {Object.keys(errors).map(field => (
                  errors[field] && (
                    <Typography key={field} variant="body2" color="text.secondary">
                      • {errors[field]?.message}
                    </Typography>
                  )
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Success Validation */}
        {isValid && watchedItems && watchedItems.length > 0 && (
          <Card sx={{ mt: 2, bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="h6" color="success.dark">
                <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ข้อมูลครบถ้วน พร้อมดำเนินการต่อ
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Alert Snackbar */}
        <Snackbar
          open={alerts.open}
          autoHideDuration={6000}
          onClose={closeAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={closeAlert} severity={alerts.severity} sx={{ width: '100%' }}>
            {alerts.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default QuotationStep; 