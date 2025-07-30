import React, { useState, useEffect } from 'react';
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
  Chip
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
  Percent as PercentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { productService } from '../../../../features/Accounting';

const PAYMENT_TERMS = [
  { value: 'Cash on Delivery', label: 'เงินสดเมื่อจัดส่ง' },
  { value: 'Net 7', label: '7 วัน' },
  { value: 'Net 15', label: '15 วัน' },
  { value: 'Net 30', label: '30 วัน' },
  { value: 'Net 45', label: '45 วัน' },
  { value: 'Net 60', label: '60 วัน' },
  { value: 'Advance Payment', label: 'จ่ายล่วงหน้า 100%' },
  { value: '50% Advance', label: 'จ่ายล่วงหน้า 50%' }
];

const DEFAULT_ITEM = {
  item_name: '',
  item_description: '',
  quantity: 1,
  unit: 'ชิ้น',
  unit_price: 0,
  discount_amount: 0,
  total_amount: 0
};

const QuotationStep = ({ data, onChange, loading }) => {
  const [quotationData, setQuotationData] = useState({
    valid_until: null,
    deposit_amount: 0,
    payment_terms: '',
    remarks: '',
    tax_rate: 7,
    items: [],
    ...data.quotationData
  });

  const [itemDialog, setItemDialog] = useState({
    open: false,
    item: { ...DEFAULT_ITEM },
    editIndex: -1
  });

  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    taxAmount: 0,
    total: 0
  });

  useEffect(() => {
    setQuotationData({
      valid_until: null,
      deposit_amount: 0,
      payment_terms: '',
      remarks: '',
      tax_rate: 7,
      items: [],
      ...data.quotationData
    });
  }, [data.quotationData]);

  useEffect(() => {
    calculateTotals();
  }, [quotationData.items, quotationData.tax_rate]);

  useEffect(() => {
    onChange(quotationData);
  }, [quotationData]);

  const calculateTotals = () => {
    const subtotal = quotationData.items.reduce((sum, item) => {
      const itemTotal = (item.quantity * item.unit_price) - (item.discount_amount || 0);
      return sum + itemTotal;
    }, 0);

    const discount = quotationData.items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
    const taxAmount = (subtotal * quotationData.tax_rate) / 100;
    const total = subtotal + taxAmount;

    setTotals({
      subtotal,
      discount,
      taxAmount,
      total
    });
  };

  const handleQuotationDataChange = (field, value) => {
    setQuotationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddItem = () => {
    setItemDialog({
      open: true,
      item: { ...DEFAULT_ITEM },
      editIndex: -1
    });
  };

  const handleEditItem = (index) => {
    setItemDialog({
      open: true,
      item: { ...quotationData.items[index] },
      editIndex: index
    });
  };

  const handleDeleteItem = (index) => {
    const newItems = quotationData.items.filter((_, i) => i !== index);
    setQuotationData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const handleSaveItem = () => {
    const { item, editIndex } = itemDialog;
    
    // Calculate item total
    const itemTotal = (item.quantity * item.unit_price) - (item.discount_amount || 0);
    const itemWithTotal = { ...item, total_amount: itemTotal };

    let newItems;
    if (editIndex >= 0) {
      // Edit existing item
      newItems = [...quotationData.items];
      newItems[editIndex] = itemWithTotal;
    } else {
      // Add new item
      newItems = [...quotationData.items, itemWithTotal];
    }

    setQuotationData(prev => ({
      ...prev,
      items: newItems
    }));

    setItemDialog({
      open: false,
      item: { ...DEFAULT_ITEM },
      editIndex: -1
    });
  };

  const handleItemChange = (field, value) => {
    setItemDialog(prev => ({
      ...prev,
      item: {
        ...prev.item,
        [field]: value
      }
    }));
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
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="ส่วนลด"
              type="number"
              value={itemDialog.item.discount_amount}
              onChange={(e) => handleItemChange('discount_amount', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position="start">฿</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="subtitle2">
                ยอดรวมรายการ: ฿{((itemDialog.item.quantity * itemDialog.item.unit_price) - (itemDialog.item.discount_amount || 0)).toLocaleString()}
              </Typography>
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
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="วันที่ใช้ได้ถึง *"
                  value={quotationData.valid_until}
                  onChange={(newValue) => handleQuotationDataChange('valid_until', newValue)}
                  minDate={dayjs().add(1, 'day')}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>เงื่อนไขการชำระเงิน</InputLabel>
                  <Select
                    value={quotationData.payment_terms}
                    label="เงื่อนไขการชำระเงิน"
                    onChange={(e) => handleQuotationDataChange('payment_terms', e.target.value)}
                  >
                    {PAYMENT_TERMS.map((term) => (
                      <MenuItem key={term.value} value={term.value}>
                        {term.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="มัดจำ"
                  type="number"
                  value={quotationData.deposit_amount}
                  onChange={(e) => handleQuotationDataChange('deposit_amount', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="อัตราภาษี"
                  type="number"
                  value={quotationData.tax_rate}
                  onChange={(e) => handleQuotationDataChange('tax_rate', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="หมายเหตุ"
                  multiline
                  rows={3}
                  value={quotationData.remarks}
                  onChange={(e) => handleQuotationDataChange('remarks', e.target.value)}
                  placeholder="หมายเหตุเพิ่มเติม เงื่อนไขพิเศษ หรือข้อควรระวัง"
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

            {quotationData.items.length > 0 ? (
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
                    {quotationData.items.map((item, index) => (
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
                          ฿{((item.quantity * item.unit_price) - (item.discount_amount || 0)).toLocaleString()}
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
        {quotationData.items.length > 0 && (
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
                    <Typography>ภาษี ({quotationData.tax_rate}%):</Typography>
                    <Typography>฿{totals.taxAmount.toLocaleString()}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" fontWeight="bold">ยอดรวมทั้งสิ้น:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      ฿{totals.total.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  {quotationData.deposit_amount > 0 && (
                    <Alert severity="info">
                      <Typography variant="subtitle2" fontWeight="bold">
                        การชำระเงิน
                      </Typography>
                      <Typography variant="body2">
                        มัดจำ: ฿{quotationData.deposit_amount.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        คงเหลือ: ฿{(totals.total - quotationData.deposit_amount).toLocaleString()}
                      </Typography>
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Item Dialog */}
        <ItemDialog />
      </Box>
    </LocalizationProvider>
  );
};

export default QuotationStep; 