import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Chip,
  TextField,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { 
  useGetInvoiceQuery, 
  useUpdateInvoiceMutation, 
  useGenerateInvoicePDFMutation 
} from '../../../../features/Accounting/accountingApi';
import { 
  DetailDialog,
  CustomerSection,
  WorkItemsSection,
  ActionsSection,
  FinancialSummarySection,
  Calculation,
  PaymentTerms,
} from '../../shared/components';
import { Section, SectionHeader, SecondaryButton, InfoCard, tokens } from '../../PricingIntegration/components/quotation/styles/quotationTheme';
import { formatTHB, formatDateTH } from '../utils/format';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/accountingToast';

// Format invoice type labels
const typeLabels = {
  full_amount: 'เต็มจำนวน',
  remaining: 'ยอดคงเหลือ (หลังหักมัดจำ)',
  deposit: 'มัดจำ',
  partial: 'เรียกเก็บบางส่วน'
};

// Status colors
const statusColors = {
  draft: 'default',
  pending: 'warning',
  pending_review: 'warning',
  approved: 'success',
  rejected: 'error',
  sent: 'info',
  partial_paid: 'warning',
  fully_paid: 'success',
  overdue: 'error',
};

const formatDate = (d) => {
  if (!d) return '-';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('th-TH');
  } catch { return '-'; }
};

// Normalize customer data from master_customers relationship
const normalizeCustomer = (invoice) => {
  if (!invoice) return {};
  
  // Use customer relationship data from master_customers table
  const customer = invoice.customer;
  if (!customer) return {};
  
  return {
    customer_type: customer.cus_company ? 'company' : 'individual',
    cus_name: customer.cus_name,
    cus_firstname: customer.cus_firstname,
    cus_lastname: customer.cus_lastname,
    cus_company: customer.cus_company,
    cus_tel_1: customer.cus_tel_1,
    cus_tel_2: customer.cus_tel_2,
    cus_email: customer.cus_email,
    cus_tax_id: customer.cus_tax_id,
    cus_address: customer.cus_address,
    cus_zip_code: customer.cus_zip_code,
    cus_depart: customer.cus_depart,
    contact_name: customer.cus_firstname && customer.cus_lastname 
      ? `${customer.cus_firstname} ${customer.cus_lastname}`.trim() 
      : customer.cus_name,
    contact_nickname: customer.cus_name,
  };
};

// Normalize items for display
const normalizeItems = (invoice) => {
  if (!invoice?.items) return [];
  
  // Group items by common properties to create work groups
  const groups = new Map();
  
  invoice.items.forEach((item, index) => {
    const groupKey = `${item.item_name}-${item.pattern}-${item.fabric_type}-${item.color}`;
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        id: `group-${index}`,
        name: item.item_name,
        pattern: item.pattern,
        fabric_type: item.fabric_type,
        color: item.color,
        unit: item.unit || 'ชิ้น',
        items: [],
      });
    }
    
    groups.get(groupKey).items.push({
      ...item,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: (item.quantity || 0) * (item.unit_price || 0),
    });
  });

  return Array.from(groups.values()).map(group => ({
    ...group,
    quantity: group.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    total: group.items.reduce((sum, item) => sum + (item.total || 0), 0),
  }));
};

const InvoiceDetailDialog = ({ open, onClose, invoiceId }) => {
  const { data, isLoading, error } = useGetInvoiceQuery(invoiceId, { skip: !open || !invoiceId });
  const [updateInvoice, { isLoading: isSaving }] = useUpdateInvoiceMutation();
  const [generateInvoicePDF, { isLoading: isGeneratingPdf }] = useGenerateInvoicePDFMutation();
  
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [customerDataSource, setCustomerDataSource] = useState('master'); // 'master' or 'invoice'
  
  // Form fields for editing
  const [formData, setFormData] = useState({
    type: '',
    status: '',
    customer_company: '',
    customer_tax_id: '',
    customer_address: '',
    customer_zip_code: '',
    customer_tel_1: '',
    customer_email: '',
    customer_firstname: '',
    customer_lastname: '',
    special_discount_percentage: 0,
    special_discount_amount: 0,
    has_vat: true,
    vat_percentage: 7.00,
    has_withholding_tax: false,
    withholding_tax_percentage: 0,
    deposit_percentage: 0,
    deposit_amount: 0,
    deposit_mode: 'percentage',
    due_date: '',
    payment_method: '',
    payment_terms: '',
    document_header_type: 'ต้นฉบับ',
  });

  // Get invoice data
  const invoice = data?.data || data || {};
  const customer = normalizeCustomer(invoice);
  const items = normalizeItems(invoice);

  // Update notes when invoice changes
  React.useEffect(() => {
    if (invoice?.notes) {
      setNotes(invoice.notes);
    }
  }, [invoice?.notes]);

  // Update form data when invoice changes
  React.useEffect(() => {
    if (invoice && Object.keys(invoice).length > 0) {
      setFormData({
        type: invoice.type || 'full_amount',
        status: invoice.status || 'draft',
        customer_company: invoice.customer_company || '',
        customer_tax_id: invoice.customer_tax_id || '',
        customer_address: invoice.customer_address || '',
        customer_zip_code: invoice.customer_zip_code || '',
        customer_tel_1: invoice.customer_tel_1 || '',
        customer_email: invoice.customer_email || '',
        customer_firstname: invoice.customer_firstname || '',
        customer_lastname: invoice.customer_lastname || '',
        special_discount_percentage: invoice.special_discount_percentage || 0,
        special_discount_amount: invoice.special_discount_amount || 0,
        has_vat: invoice.has_vat !== undefined ? invoice.has_vat : true,
        vat_percentage: invoice.vat_percentage || 7.00,
        has_withholding_tax: invoice.has_withholding_tax || false,
        withholding_tax_percentage: invoice.withholding_tax_percentage || 0,
        deposit_percentage: invoice.deposit_percentage || 0,
        deposit_amount: invoice.deposit_amount || 0,
        deposit_mode: invoice.deposit_mode || 'percentage',
        due_date: invoice.due_date || '',
        payment_method: invoice.payment_method || '',
        payment_terms: invoice.payment_terms || '',
        document_header_type: invoice.document_header_type || 'ต้นฉบับ',
      });

      // Check if invoice has customer override data
      const hasCustomerOverride = invoice.customer_company || invoice.customer_tax_id || 
                                  invoice.customer_address || invoice.customer_firstname || 
                                  invoice.customer_lastname;
      setCustomerDataSource(hasCustomerOverride ? 'invoice' : 'master');
    }
  }, [invoice]);

  const handleSave = async () => {
    try {
      const loadingId = showLoading('กำลังบันทึกใบแจ้งหนี้…');
      
      const updateData = {
        id: invoice.id,
        notes: notes || '',
        ...formData,
      };

      // If using master customer data, clear invoice customer fields
      if (customerDataSource === 'master') {
        updateData.customer_company = null;
        updateData.customer_tax_id = null;
        updateData.customer_address = null;
        updateData.customer_zip_code = null;
        updateData.customer_tel_1 = null;
        updateData.customer_email = null;
        updateData.customer_firstname = null;
        updateData.customer_lastname = null;
      }

      await updateInvoice(updateData).unwrap();
      setIsEditing(false);
      dismissToast(loadingId);
      showSuccess('บันทึกใบแจ้งหนี้เรียบร้อย');
    } catch (e) {
      showError(e?.data?.message || e?.message || 'บันทึกใบแจ้งหนี้ไม่สำเร็จ');
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerDataSourceChange = (event) => {
    const newSource = event.target.value;
    setCustomerDataSource(newSource);
    
    // If switching to master, populate from customer relationship
    if (newSource === 'master' && customer) {
      setFormData(prev => ({
        ...prev,
        customer_company: customer.cus_company || '',
        customer_tax_id: customer.cus_tax_id || '',
        customer_address: customer.cus_address || '',
        customer_zip_code: customer.cus_zip_code || '',
        customer_tel_1: customer.cus_tel_1 || '',
        customer_email: customer.cus_email || '',
        customer_firstname: customer.cus_firstname || '',
        customer_lastname: customer.cus_lastname || '',
      }));
    }
    // If switching to invoice, keep current form data
  };

  const handlePreviewPdf = async () => {
    if (!invoice?.id) return;
    
    try {
      const loadingId = showLoading('กำลังสร้าง PDF ใบแจ้งหนี้…');
      const res = await generateInvoicePDF(invoice.id).unwrap();
      const url = res?.pdf_url || res?.url;
      if (url) {
        setPdfUrl(url);
        setShowPdfViewer(true);
        showSuccess('สร้าง PDF สำเร็จ');
      }
      dismissToast(loadingId);
    } catch (e) {
      showError(e?.data?.message || e?.message || 'ไม่สามารถสร้าง PDF ได้');
    }
  };

  const actions = (
    <>
      {isEditing ? (
        <>
          <SecondaryButton onClick={handlePreviewPdf} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? 'กำลังสร้าง…' : 'ดูตัวอย่าง PDF'}
          </SecondaryButton>
          <SecondaryButton onClick={() => setIsEditing(false)}>ยกเลิก</SecondaryButton>
          <SecondaryButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'กำลังบันทึก…' : 'บันทึก'}
          </SecondaryButton>
        </>
      ) : (
        <>
          <SecondaryButton onClick={handlePreviewPdf} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? 'กำลังสร้าง…' : 'ดูตัวอย่าง PDF'}
          </SecondaryButton>
          <SecondaryButton onClick={() => setIsEditing(true)}>แก้ไข</SecondaryButton>
          <SecondaryButton onClick={onClose}>ปิด</SecondaryButton>
        </>
      )}
    </>
  );

  return (
    <>
      <DetailDialog
        open={open}
        onClose={onClose}
        title="รายละเอียดใบแจ้งหนี้"
        isLoading={isLoading}
        error={error}
        actions={actions}
      >
        <Box>
          <Grid container spacing={2}>
            {/* Invoice Status & Info */}
            <Grid item xs={12}>
              <Section>
                <SectionHeader>
                  <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                    <ReceiptIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>ข้อมูลใบแจ้งหนี้</Typography>
                    <Typography variant="caption" color="text.secondary">สถานะและรายละเอียด</Typography>
                  </Box>
                </SectionHeader>
                <Box sx={{ p: 2 }}>
                  <InfoCard sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">เลขที่ใบแจ้งหนี้</Typography>
                        <Typography variant="body1" fontWeight={700}>{invoice.number || '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">ประเภท</Typography>
                        {isEditing ? (
                          <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                            <Select
                              value={formData.type}
                              onChange={(e) => handleFieldChange('type', e.target.value)}
                            >
                              <MenuItem value="full_amount">เต็มจำนวน</MenuItem>
                              <MenuItem value="remaining">ยอดคงเหลือ (หลังหักมัดจำ)</MenuItem>
                              <MenuItem value="deposit">มัดจำ</MenuItem>
                              <MenuItem value="partial">เรียกเก็บบางส่วน</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography variant="body1" fontWeight={700}>
                            {typeLabels[invoice.type] || invoice.type || '-'}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">สถานะ</Typography>
                        {isEditing ? (
                          <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                            <Select
                              value={formData.status}
                              onChange={(e) => handleFieldChange('status', e.target.value)}
                            >
                              <MenuItem value="draft">ร่าง</MenuItem>
                              <MenuItem value="pending">รอดำเนินการ</MenuItem>
                              <MenuItem value="approved">อนุมัติแล้ว</MenuItem>
                              <MenuItem value="sent">ส่งแล้ว</MenuItem>
                              <MenuItem value="partial_paid">ชำระบางส่วน</MenuItem>
                              <MenuItem value="fully_paid">ชำระครบแล้ว</MenuItem>
                              <MenuItem value="overdue">เกินกำหนด</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Box>
                            <Chip
                              label={invoice.status || 'draft'}
                              color={statusColors[invoice.status] || 'default'}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">วันที่ออกใบแจ้งหนี้</Typography>
                        <Typography variant="body1">{formatDate(invoice.invoice_date)}</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">วันครบกำหนด</Typography>
                        {isEditing ? (
                          <TextField
                            type="date"
                            size="small"
                            fullWidth
                            value={formData.due_date}
                            onChange={(e) => handleFieldChange('due_date', e.target.value)}
                            sx={{ mt: 0.5 }}
                          />
                        ) : (
                          <Typography variant="body1" color={invoice.status === 'overdue' ? 'error' : 'inherit'}>
                            {formatDate(invoice.due_date)}
                          </Typography>
                        )}
                      </Grid>
                      {invoice.quotation_number && (
                        <Grid item xs={12} md={3}>
                          <Typography variant="caption" color="text.secondary">เลขที่ใบเสนอราคา</Typography>
                          <Typography variant="body1">{invoice.quotation_number}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </InfoCard>
                </Box>
              </Section>
            </Grid>

            {/* Customer Section */}
            <Grid item xs={12}>
              {isEditing ? (
                <Section>
                  <SectionHeader>
                    <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                      <BusinessIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>ข้อมูลลูกค้า</Typography>
                      <Typography variant="caption" color="text.secondary">แก้ไขข้อมูลลูกค้า</Typography>
                    </Box>
                  </SectionHeader>
                  <Box sx={{ p: 2 }}>
                    {/* Radio buttons for data source selection */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        เลือกแหล่งข้อมูลลูกค้า
                      </Typography>
                      <RadioGroup
                        value={customerDataSource}
                        onChange={handleCustomerDataSourceChange}
                        row
                      >
                        <FormControlLabel
                          value="master"
                          control={<Radio />}
                          label="ใช้ข้อมูลจากฐานข้อมูลลูกค้า (master_customers)"
                        />
                        <FormControlLabel
                          value="invoice"
                          control={<Radio />}
                          label="แก้ไขข้อมูลเฉพาะใบแจ้งหนี้นี้ (invoices)"
                        />
                      </RadioGroup>
                      {customerDataSource === 'master' && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          ข้อมูลจะถูกดึงมาจากฐานข้อมูลลูกค้าหลัก การเปลี่ยนแปลงจะส่งผลต่อลูกค้ารายนี้ทั้งหมด
                        </Typography>
                      )}
                      {customerDataSource === 'invoice' && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          ข้อมูลจะถูกบันทึกเฉพาะในใบแจ้งหนี้นี้เท่านั้น ไม่ส่งผลต่อข้อมูลลูกค้าหลัก
                        </Typography>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="ชื่อบริษัท"
                          value={customerDataSource === 'master' ? (customer.cus_company || '') : formData.customer_company}
                          onChange={(e) => customerDataSource === 'invoice' && handleFieldChange('customer_company', e.target.value)}
                          size="small"
                          disabled={customerDataSource === 'master'}
                          helperText={customerDataSource === 'master' ? 'ข้อมูลจากฐานข้อมูลลูกค้า' : ''}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="เลขประจำตัวผู้เสียภาษี"
                          value={customerDataSource === 'master' ? (customer.cus_tax_id || '') : formData.customer_tax_id}
                          onChange={(e) => customerDataSource === 'invoice' && handleFieldChange('customer_tax_id', e.target.value)}
                          size="small"
                          disabled={customerDataSource === 'master'}
                          helperText={customerDataSource === 'master' ? 'ข้อมูลจากฐานข้อมูลลูกค้า' : ''}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="ชื่อ"
                          value={customerDataSource === 'master' ? (customer.cus_firstname || '') : formData.customer_firstname}
                          onChange={(e) => customerDataSource === 'invoice' && handleFieldChange('customer_firstname', e.target.value)}
                          size="small"
                          disabled={customerDataSource === 'master'}
                          helperText={customerDataSource === 'master' ? 'ข้อมูลจากฐานข้อมูลลูกค้า' : ''}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="นามสกุล"
                          value={customerDataSource === 'master' ? (customer.cus_lastname || '') : formData.customer_lastname}
                          onChange={(e) => customerDataSource === 'invoice' && handleFieldChange('customer_lastname', e.target.value)}
                          size="small"
                          disabled={customerDataSource === 'master'}
                          helperText={customerDataSource === 'master' ? 'ข้อมูลจากฐานข้อมูลลูกค้า' : ''}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="ที่อยู่"
                          value={customerDataSource === 'master' ? (customer.cus_address || '') : formData.customer_address}
                          onChange={(e) => customerDataSource === 'invoice' && handleFieldChange('customer_address', e.target.value)}
                          multiline
                          rows={2}
                          size="small"
                          disabled={customerDataSource === 'master'}
                          helperText={customerDataSource === 'master' ? 'ข้อมูลจากฐานข้อมูลลูกค้า' : ''}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="รหัสไปรษณีย์"
                          value={customerDataSource === 'master' ? (customer.cus_zip_code || '') : formData.customer_zip_code}
                          onChange={(e) => customerDataSource === 'invoice' && handleFieldChange('customer_zip_code', e.target.value)}
                          size="small"
                          disabled={customerDataSource === 'master'}
                          helperText={customerDataSource === 'master' ? 'ข้อมูลจากฐานข้อมูลลูกค้า' : ''}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="เบอร์โทรศัพท์"
                          value={customerDataSource === 'master' ? (customer.cus_tel_1 || '') : formData.customer_tel_1}
                          onChange={(e) => customerDataSource === 'invoice' && handleFieldChange('customer_tel_1', e.target.value)}
                          size="small"
                          disabled={customerDataSource === 'master'}
                          helperText={customerDataSource === 'master' ? 'ข้อมูลจากฐานข้อมูลลูกค้า' : ''}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="อีเมล์"
                          value={customerDataSource === 'master' ? (customer.cus_email || '') : formData.customer_email}
                          onChange={(e) => customerDataSource === 'invoice' && handleFieldChange('customer_email', e.target.value)}
                          size="small"
                          disabled={customerDataSource === 'master'}
                          helperText={customerDataSource === 'master' ? 'ข้อมูลจากฐานข้อมูลลูกค้า' : ''}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Section>
              ) : (
                <CustomerSection
                  customer={customer}
                  quotationNumber={invoice.number}
                  workName={invoice.work_name}
                  showEditButton={false} // No customer edit for invoices
                />
              )}
            </Grid>

            {/* Work Items */}
            <Grid item xs={12}>
              <WorkItemsSection
                items={items}
                title="รายการสินค้า/บริการ"
                icon={<BusinessIcon fontSize="small" />}
              >
                {items.map((item, idx) => (
                  <InfoCard key={item.id} sx={{ p: 2, mb: 1.5 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
                        รายการที่ {idx + 1}: {item.name}
                      </Typography>
                      <Chip 
                        label={`${item.quantity} ${item.unit}`} 
                        size="small" 
                        variant="outlined" 
                        sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} 
                      />
                    </Box>
                    <Grid container spacing={1}>
                      {item.pattern && (
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">แพทเทิร์น</Typography>
                          <Typography variant="body2" fontWeight={500}>{item.pattern}</Typography>
                        </Grid>
                      )}
                      {item.fabric_type && (
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">ประเภทผ้า</Typography>
                          <Typography variant="body2" fontWeight={500}>{item.fabric_type}</Typography>
                        </Grid>
                      )}
                      {item.color && (
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">สี</Typography>
                          <Typography variant="body2" fontWeight={500}>{item.color}</Typography>
                        </Grid>
                      )}
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">ยอดรวม</Typography>
                        <Typography variant="body1" fontWeight={800}>{formatTHB(item.total)}</Typography>
                      </Grid>
                    </Grid>
                  </InfoCard>
                ))}
              </WorkItemsSection>
            </Grid>

            {/* Financial Summary */}
            <Grid item xs={12}>
              {isEditing ? (
                <Section>
                  <SectionHeader>
                    <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                      <CalculateIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>การคำนวณทางการเงิน</Typography>
                      <Typography variant="caption" color="text.secondary">แก้ไขข้อมูลการคำนวณ</Typography>
                    </Box>
                  </SectionHeader>
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="ส่วนลดพิเศษ (%)"
                          type="number"
                          value={formData.special_discount_percentage}
                          onChange={(e) => handleFieldChange('special_discount_percentage', parseFloat(e.target.value) || 0)}
                          size="small"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="ส่วนลดพิเศษ (บาท)"
                          type="number"
                          value={formData.special_discount_amount}
                          onChange={(e) => handleFieldChange('special_discount_amount', parseFloat(e.target.value) || 0)}
                          size="small"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">บาท</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.has_vat}
                              onChange={(e) => handleFieldChange('has_vat', e.target.checked)}
                            />
                          }
                          label="มีภาษีมูลค่าเพิ่ม"
                        />
                        {formData.has_vat && (
                          <TextField
                            fullWidth
                            label="อัตราภาษีมูลค่าเพิ่ม"
                            type="number"
                            value={formData.vat_percentage}
                            onChange={(e) => handleFieldChange('vat_percentage', parseFloat(e.target.value) || 0)}
                            size="small"
                            sx={{ mt: 1 }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                          />
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.has_withholding_tax}
                              onChange={(e) => handleFieldChange('has_withholding_tax', e.target.checked)}
                            />
                          }
                          label="มีหักภาษี ณ ที่จ่าย"
                        />
                        {formData.has_withholding_tax && (
                          <TextField
                            fullWidth
                            label="อัตราภาษีหัก ณ ที่จ่าย"
                            type="number"
                            value={formData.withholding_tax_percentage}
                            onChange={(e) => handleFieldChange('withholding_tax_percentage', parseFloat(e.target.value) || 0)}
                            size="small"
                            sx={{ mt: 1 }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                          />
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>รูปแบบมัดจำ</InputLabel>
                          <Select
                            value={formData.deposit_mode}
                            onChange={(e) => handleFieldChange('deposit_mode', e.target.value)}
                            label="รูปแบบมัดจำ"
                          >
                            <MenuItem value="percentage">เปอร์เซ็นต์</MenuItem>
                            <MenuItem value="amount">จำนวนเงิน</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label={formData.deposit_mode === 'percentage' ? 'เปอร์เซ็นต์มัดจำ' : 'จำนวนเงินมัดจำ'}
                          type="number"
                          value={formData.deposit_mode === 'percentage' ? formData.deposit_percentage : formData.deposit_amount}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (formData.deposit_mode === 'percentage') {
                              handleFieldChange('deposit_percentage', value);
                            } else {
                              handleFieldChange('deposit_amount', value);
                            }
                          }}
                          size="small"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">
                              {formData.deposit_mode === 'percentage' ? '%' : 'บาท'}
                            </InputAdornment>,
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Section>
              ) : (
                <FinancialSummarySection invoice={invoice} />
              )}
            </Grid>

            {/* Payment Information */}
            {(invoice.payment_terms || invoice.deposit_amount || isEditing) && (
              <Grid item xs={12}>
                <Section>
                  <SectionHeader>
                    <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                      <PaymentIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>ข้อมูลการชำระเงิน</Typography>
                      <Typography variant="caption" color="text.secondary">เงื่อนไขการชำระและมัดจำ</Typography>
                    </Box>
                  </SectionHeader>
                  <Box sx={{ p: 2 }}>
                    {isEditing ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>เงื่อนไขการชำระ</InputLabel>
                            <Select
                              value={formData.payment_terms}
                              onChange={(e) => handleFieldChange('payment_terms', e.target.value)}
                              label="เงื่อนไขการชำระ"
                            >
                              <MenuItem value="">ไม่ระบุ</MenuItem>
                              <MenuItem value="cash">เงินสด</MenuItem>
                              <MenuItem value="credit_30">เครดิต 30 วัน</MenuItem>
                              <MenuItem value="credit_60">เครดิต 60 วัน</MenuItem>
                              <MenuItem value="credit_90">เครดิต 90 วัน</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="วิธีการชำระเงิน"
                            value={formData.payment_method}
                            onChange={(e) => handleFieldChange('payment_method', e.target.value)}
                            size="small"
                            placeholder="เช่น โอนเงิน, เงินสด, เช็ค"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>ประเภทหัวกระดาษ</InputLabel>
                            <Select
                              value={formData.document_header_type}
                              onChange={(e) => handleFieldChange('document_header_type', e.target.value)}
                              label="ประเภทหัวกระดาษ"
                            >
                              <MenuItem value="ต้นฉบับ">ต้นฉบับ</MenuItem>
                              <MenuItem value="สำเนา">สำเนา</MenuItem>
                              <MenuItem value="กำหนดเอง">กำหนดเอง</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    ) : (
                      <Grid container spacing={2}>
                        {invoice.payment_terms && (
                          <Grid item xs={12} md={6}>
                            <InfoCard sx={{ p: 2 }}>
                              <Typography variant="caption" color="text.secondary">เงื่อนไขการชำระ</Typography>
                              <Typography variant="body1" fontWeight={700}>
                                {invoice.payment_terms === 'cash' ? 'เงินสด' : 
                                 invoice.payment_terms === 'credit_30' ? 'เครดิต 30 วัน' : 
                                 invoice.payment_terms === 'credit_60' ? 'เครดิต 60 วัน' : 
                                 invoice.payment_terms}
                              </Typography>
                            </InfoCard>
                          </Grid>
                        )}
                        {invoice.deposit_amount && (
                          <Grid item xs={12} md={6}>
                            <InfoCard sx={{ p: 2 }}>
                              <Typography variant="caption" color="text.secondary">เงินมัดจำ</Typography>
                              <Typography variant="body1" fontWeight={700}>
                                {formatTHB(invoice.deposit_amount)}
                                {invoice.deposit_percentage && ` (${invoice.deposit_percentage}%)`}
                              </Typography>
                            </InfoCard>
                          </Grid>
                        )}
                      </Grid>
                    )}
                  </Box>
                </Section>
              </Grid>
            )}

            {/* Notes */}
            <Grid item xs={12}>
              <Section>
                <SectionHeader>
                  <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                    📝
                  </Avatar>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1" fontWeight={700}>หมายเหตุ</Typography>
                    {!isEditing && (
                      <SecondaryButton 
                        size="small" 
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        แก้ไข
                      </SecondaryButton>
                    )}
                  </Box>
                </SectionHeader>
                <Box sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="หมายเหตุ"
                    value={isEditing ? notes : (invoice.notes || '')}
                    disabled={!isEditing}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="เพิ่มหมายเหตุสำหรับใบแจ้งหนี้นี้..."
                  />
                </Box>
              </Section>
            </Grid>
          </Grid>
        </Box>
      </DetailDialog>

      {/* PDF Viewer Dialog */}
      <DetailDialog
        open={showPdfViewer}
        onClose={() => setShowPdfViewer(false)}
        title="ดูตัวอย่าง PDF ใบแจ้งหนี้"
        maxWidth="lg"
        actions={
          <>
            {pdfUrl && (
              <SecondaryButton onClick={() => window.open(pdfUrl, '_blank')}>
                เปิดในแท็บใหม่
              </SecondaryButton>
            )}
            <SecondaryButton onClick={() => setShowPdfViewer(false)}>
              ปิด
            </SecondaryButton>
          </>
        }
      >
        {pdfUrl ? (
          <iframe 
            title="invoice-pdf" 
            src={pdfUrl} 
            style={{ width: '100%', height: '80vh', border: 0 }} 
          />
        ) : (
          <Box display="flex" alignItems="center" gap={1} p={2}>
            <Typography variant="body2">ไม่พบไฟล์ PDF</Typography>
          </Box>
        )}
      </DetailDialog>
    </>
  );
};

export default InvoiceDetailDialog;
