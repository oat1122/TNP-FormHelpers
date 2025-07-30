import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { productService } from '../../../../features/Accounting';

// Import split components
import ItemDialog from './ItemDialog';
import ItemTable from './ItemTable';
import PaymentTermsSection from './PaymentTermsSection';
import TotalsSummary from './TotalsSummary';
import ValidationAlert from './ValidationAlert';
import QuotationInfoCard from './QuotationInfoCard';

// Define payment terms for auto-calculating deposits
const PAYMENT_TERMS = [
  { value: 'Cash on Delivery', label: 'เงินสดเมื่อจัดส่ง', deposit_percent: 0 },
  { value: 'Advance Payment', label: 'เงินสดล่วงหน้า 100%', deposit_percent: 100 },
  { value: '50% Advance', label: 'มัดจำ 50% ชำระที่เหลือเมื่อจัดส่ง', deposit_percent: 50 }
];

// Moved to the QuotationStep component function

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
  // Define DEFAULT_ITEM for use with dialog
  const DEFAULT_ITEM = {
    product_id: '', 
    item_name: '', 
    item_description: '', 
    quantity: 1,
    unit: 'ชิ้น',
    unit_price: 0,
    discount_amount: 0,
    discount_percent: 0,
    total_amount: 0,
    quantity_remaining: 1,
    vat_type: 'included'
  };
  
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
    // Always set tax_rate to 7% as shown in the UI
    const tax_rate = 7;
    
    return {
      // Map to backend quotation fields based on DATABASE_SCHEMA_ALIGNMENT.md
      customer_id: data.customer?.cus_id || data.customer?.id, // Maps to cus_id in master_customers
      pr_id: data.pricingDetails?.pr_id || null, // Link to pricing request
      quotation_no: '', // Will be auto-generated by backend
      valid_until: formData.valid_until ? dayjs(formData.valid_until).format('YYYY-MM-DD') : null,
      payment_terms: formData.payment_terms,
      deposit_amount: formData.deposit_amount || 0,
      deposit_percent: formData.deposit_percent || 0,
      tax_rate: tax_rate,
      wht_rate: formData.wht_rate || 0,
      remarks: formData.remarks || '',
      status: 'draft',
      items: formData.items.map(item => ({
        product_id: item.product_id || null, // Maps to mpc_id if selected from catalog
        item_name: item.item_name,
        item_description: item.item_description || '',
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_amount: 0, // We're removing discounts from the UI
        discount_percent: 0, // We're removing discounts from the UI
        total_amount: item.quantity * item.unit_price,
        quantity_remaining: item.quantity,
        vat_type: 'included' // Always included as per UI
      })),
      // Calculated totals for backend verification
      subtotal: totals.subtotal,
      total_discount: 0, // No discounts in the new UI
      tax_amount: totals.taxAmount,
      wht_amount: 0, // No WHT in the new UI
      total_amount: totals.total,
      net_amount: totals.total // Same as total since no WHT
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
    
    // Calculate item totals - no discounts in the simplified UI
    const itemTotals = items.map(item => {
      return item.quantity * item.unit_price;
    });

    const subtotal = itemTotals.reduce((sum, total) => sum + total, 0);

    // Always use 7% VAT as per UI
    const taxRate = 7;
    const taxAmount = (subtotal * taxRate) / 100;
    
    // Total = Subtotal + VAT
    const total = subtotal + taxAmount;
    
    // Calculate deposit amount
    let depositAmount = watchedDepositAmount || 0;
    if (watchedDepositPercent > 0) {
      depositAmount = (total * watchedDepositPercent) / 100;
    }
    
    // Remaining amount after deposit
    const remainingAmount = total - depositAmount;

    setTotals({
      subtotal,
      discount: 0, // No discounts in the simplified UI
      taxAmount,
      whtAmount: 0, // No WHT in the simplified UI
      total,
      netTotal: total, // Same as total since no WHT
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
    
    // Basic validation
    if (!item.item_name || item.quantity <= 0 || item.unit_price < 0) {
      showAlert('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }
    
    // Calculate item total - no discounts in the simplified UI
    const itemTotal = item.quantity * item.unit_price;
    
    // Set quantity_remaining to quantity for new items
    const itemWithTotal = { 
      ...item, 
      total_amount: itemTotal,
      quantity_remaining: item.quantity,
      discount_amount: 0,
      discount_percent: 0,
      vat_type: 'included'
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
  
  // Helper function to update an item field in the items array
  const handleItemFieldChange = (index, field, value) => {
    const updatedItems = [...watchedItems];
    const item = { ...updatedItems[index] };
    
    item[field] = value;
    
    // Recalculate totals if quantity or price changes
    if (field === 'quantity' || field === 'unit_price') {
      const baseAmount = (field === 'quantity' ? value : item.quantity) * 
                         (field === 'unit_price' ? value : item.unit_price);
      item.total_amount = baseAmount;
      if (field === 'quantity') {
        item.quantity_remaining = value;
      }
    }
    
    updatedItems[index] = item;
    setValue('items', updatedItems);
  };

  // Handle closing dialog
  const handleCloseDialog = () => {
    setItemDialog({
      open: false,
      item: { ...DEFAULT_ITEM },
      editIndex: -1
    });
  };

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
        <QuotationInfoCard 
          pricingDetails={data.pricingDetails} 
          customer={data.customer} 
        />

        {/* Basic Quotation Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              ข้อมูลพื้นฐาน
            </Typography>
            
            <ValidationAlert 
              validationErrors={validationErrors}
              isValid={isValid}
              errors={errors}
            />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  สรุปยอดเงิน
                </Typography>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    ยอดรวม
                  </Typography>
                  <Typography variant="body2">
                    ฿{totals.subtotal.toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    ภาษีมูลค่าเพิ่ม 7%
                  </Typography>
                  <Typography variant="body2">
                    ฿{totals.taxAmount.toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body1" fontWeight="bold">
                    ยอดรวมทั้งสิ้น
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    ฿{totals.total.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <PaymentTermsSection 
                  control={control}
                  setValue={setValue}
                  totals={totals}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  หมายเหตุการขาย
                </Typography>
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Grid>
              
              {/* Keep tax rate but make it hidden since it's fixed at 7% in the UI */}
              <input type="hidden" name="tax_rate" value="7" />
              
              {/* Keep these fields hidden but available for the backend */}
              <Grid item xs={12} sx={{ display: 'none' }}>
                <Controller
                  name="tax_rate"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} type="hidden" />
                  )}
                />
                <Controller
                  name="wht_rate"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} type="hidden" />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Items Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <ItemTable 
              items={watchedItems || []}
              onAddItem={handleAddItem}
              onItemChange={handleItemFieldChange}
              onDeleteItem={handleDeleteItem}
              getItemSubtotal={getItemSubtotal}
            />
          </CardContent>
        </Card>

        {/* Totals Summary */}
        {watchedItems && watchedItems.length > 0 && (
          <TotalsSummary
            subtotal={totals.subtotal}
            taxAmount={totals.taxAmount}
            taxRate={watchedTaxRate}
            total={totals.total}
          />
        )}

        {/* Item Dialog */}
        <ItemDialog 
          open={itemDialog.open}
          item={itemDialog.item}
          onChange={handleItemChange}
          onClose={handleCloseDialog}
          onSave={handleSaveItem}
          isEdit={itemDialog.editIndex >= 0}
        />
        
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