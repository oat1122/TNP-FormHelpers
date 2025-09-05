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

  const handleSave = async () => {
    try {
      const loadingId = showLoading('กำลังบันทึกใบแจ้งหนี้…');
      await updateInvoice({
        id: invoice.id,
        notes: notes || '',
      }).unwrap();
      setIsEditing(false);
      dismissToast(loadingId);
      showSuccess('บันทึกใบแจ้งหนี้เรียบร้อย');
    } catch (e) {
      showError(e?.data?.message || e?.message || 'บันทึกใบแจ้งหนี้ไม่สำเร็จ');
    }
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
                        <Typography variant="body1" fontWeight={700}>
                          {typeLabels[invoice.type] || invoice.type || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">สถานะ</Typography>
                        <Box>
                          <Chip
                            label={invoice.status || 'draft'}
                            color={statusColors[invoice.status] || 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="caption" color="text.secondary">วันที่ออกใบแจ้งหนี้</Typography>
                        <Typography variant="body1">{formatDate(invoice.invoice_date)}</Typography>
                      </Grid>
                      {invoice.due_date && (
                        <Grid item xs={12} md={3}>
                          <Typography variant="caption" color="text.secondary">วันครบกำหนด</Typography>
                          <Typography variant="body1" color={invoice.status === 'overdue' ? 'error' : 'inherit'}>
                            {formatDate(invoice.due_date)}
                          </Typography>
                        </Grid>
                      )}
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
              <CustomerSection
                customer={customer}
                quotationNumber={invoice.number}
                workName={invoice.work_name}
                showEditButton={false} // No customer edit for invoices
              />
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
              <FinancialSummarySection invoice={invoice} />
            </Grid>

            {/* Payment Information */}
            {(invoice.payment_terms || invoice.deposit_amount) && (
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
                    <SecondaryButton 
                      size="small" 
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? 'ยกเลิกแก้ไข' : 'แก้ไข'}
                    </SecondaryButton>
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
