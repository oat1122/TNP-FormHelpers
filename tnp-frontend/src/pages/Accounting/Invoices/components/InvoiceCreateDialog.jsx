import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Grid,
  Chip,
  TextField,
  CircularProgress,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Paper,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
  ExpandMore as ExpandMoreIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import {
  useGetQuotationQuery,
  useCreateInvoiceFromQuotationMutation,
} from '../../../../features/Accounting/accountingApi';
import { apiConfig } from '../../../../api/apiConfig';
import { Section, SectionHeader, SecondaryButton, InfoCard, tokens } from '../../PricingIntegration/components/quotation/styles/quotationTheme';
import SpecialDiscountField from '../../PricingIntegration/components/quotation/CreateQuotationForm/components/SpecialDiscountField';
import WithholdingTaxField from '../../PricingIntegration/components/quotation/CreateQuotationForm/components/WithholdingTaxField';
import VatField from '../../PricingIntegration/components/quotation/CreateQuotationForm/components/VatField';
import Calculation from '../../shared/components/Calculation';
import PaymentTerms from '../../shared/components/PaymentTerms';
import ImageUploadGrid from '../../shared/components/ImageUploadGrid';
import { pickQuotation, normalizeCustomer, getAllPrIdsFromQuotation, normalizeAndGroupItems, toISODate } from '../../Quotations/utils/quotationUtils';
import { useQuotationFinancials } from '../../shared/hooks/useQuotationFinancials';
import { useQuotationGroups } from '../../Quotations/hooks/useQuotationGroups';
import { formatTHB } from '../../Quotations/utils/format';
import { formatDateTH } from '../../PricingIntegration/components/quotation/utils/date';
import { sanitizeInt } from '../../shared/inputSanitizers';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/accountingToast';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * InvoiceCreateDialog
 * - Reuses the QuotationDetailDialog visual structure for consistency
 * - Preloads from an approved Quotation and lets user confirm terms before creating an invoice
 */
const InvoiceCreateDialog = ({ open, onClose, quotationId, onCreated, onCancel }) => {
  const { data, isLoading, isFetching } = useGetQuotationQuery(quotationId, { skip: !quotationId });
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceFromQuotationMutation();

  const q = pickQuotation(data);
  const prIdsAll = React.useMemo(() => getAllPrIdsFromQuotation(q), [q?.id]);
  const customer = React.useMemo(() => normalizeCustomer(q), [q]);
  const items = React.useMemo(() => normalizeAndGroupItems(q, prIdsAll), [q?.id]);

  // Groups editor state (size/qty/unit price rows)
  const {
    groups,
    setGroups,
    isEditing,
    setIsEditing,
    onAddRow,
    onChangeRow,
    onRemoveRow,
    onDeleteGroup,
    onChangeGroup,
  } = useQuotationGroups(items);

  // Discount and withholding state (preload from quotation where possible)
  // Discount / withholding states, kept editable but synced with quotation on load/change
  const [specialDiscountType, setSpecialDiscountType] = React.useState('percentage');
  const [specialDiscountValue, setSpecialDiscountValue] = React.useState(0);
  const [hasWithholdingTax, setHasWithholdingTax] = React.useState(false);
  const [withholdingTaxPercentage, setWithholdingTaxPercentage] = React.useState(0);
  
  // VAT state (NEW)
  const [hasVat, setHasVat] = React.useState(true);
  const [vatPercentage, setVatPercentage] = React.useState(7);

  React.useEffect(() => {
    const qAmt = Number(q?.special_discount_amount || 0);
    const qPct = Number(q?.special_discount_percentage || 0);
    const nextType = (qAmt > 0 && qPct === 0) ? 'amount' : 'percentage';
    const nextVal = nextType === 'amount' ? qAmt : qPct;
    setSpecialDiscountType(nextType);
    setSpecialDiscountValue(nextVal);
    setHasWithholdingTax(!!q?.has_withholding_tax);
    setWithholdingTaxPercentage(Number(q?.withholding_tax_percentage || 0));
    
    // Initialize VAT from quotation or defaults
    setHasVat(q?.has_vat !== false); // Default to true if not specified
    setVatPercentage(Number(q?.vat_percentage || 7));
  }, [q?.id]);

  // Payment terms state
  const rawTerms = q?.payment_terms || 'cash';
  const knownTerms = new Set(['cash','credit_30','credit_60','other']);
  const isKnown = knownTerms.has(rawTerms);
  const [paymentTermsType, setPaymentTermsType] = React.useState(isKnown ? rawTerms : 'other');
  const [paymentTermsCustom, setPaymentTermsCustom] = React.useState(isKnown ? '' : (rawTerms || ''));
  const [depositMode, setDepositMode] = React.useState(q?.deposit_mode || 'percentage');
  const [depositPct, setDepositPct] = React.useState(Number(q?.deposit_percentage || 0));
  const [depositAmountInput, setDepositAmountInput] = React.useState(Number(q?.deposit_amount || 0));
  const [selectedDueDate, setSelectedDueDate] = React.useState(q?.due_date ? new Date(q.due_date) : null);

  // Sync payment/deposit/due date from quotation when it changes
  React.useEffect(() => {
    const newRaw = q?.payment_terms || 'cash';
    const newIsKnown = knownTerms.has(newRaw);
    setPaymentTermsType(newIsKnown ? newRaw : 'other');
    setPaymentTermsCustom(newIsKnown ? '' : (newRaw || ''));
    setDepositMode(q?.deposit_mode || 'percentage');
    setDepositPct(Number(q?.deposit_percentage || 0));
    setDepositAmountInput(Number(q?.deposit_amount || 0));
    setSelectedDueDate(q?.due_date ? new Date(q.due_date) : null);
  }, [q?.id]);

  // Attachments (local only for now)
  const [attachments, setAttachments] = React.useState([]); // File[]

  // Signature images preview state
  const [previewImage, setPreviewImage] = React.useState(null); // {url, filename, idx}
  const signatureImages = Array.isArray(q?.signature_images) ? q.signature_images : [];

  // Customer address editing state
  const [isEditingAddress, setIsEditingAddress] = React.useState(false);
  const [customAddress, setCustomAddress] = React.useState('');

  // Document header type state
  const [documentHeaderType, setDocumentHeaderType] = React.useState('ต้นฉบับ');
  const [customHeaderType, setCustomHeaderType] = React.useState('');

  // Initialize custom address when customer data changes
  React.useEffect(() => {
    if (customer?.cus_address) {
      setCustomAddress(customer.cus_address);
    }
  }, [customer?.cus_address]);

  // Financials from groups + discount-before-VAT + withholding + VAT
  const financials = useQuotationFinancials({
    items: groups,
    depositMode,
    depositPercentage: depositPct,
    depositAmountInput,
    specialDiscountType,
    specialDiscountValue,
    hasWithholdingTax,
    withholdingTaxPercentage,
    hasVat,
    vatPercentage,
  });

  const {
    subtotal,
    specialDiscountAmount: discountAmountComputed,
    discountedSubtotal: netAfterDiscount,
    vat,
    total,
    withholdingTaxAmount: withholdingTaxAmountComputed,
    finalTotal: finalNetAmountComputed,
    depositAmount,
    depositPercentage: liveDepositPercentage,
    remainingAmount,
  } = financials;

  const isCredit = paymentTermsType === 'credit_30' || paymentTermsType === 'credit_60';

  // Invoice type selection (full, remaining, deposit, partial)
  const [invoiceType, setInvoiceType] = React.useState('remaining');
  const [partialAmount, setPartialAmount] = React.useState('');

  // Map groups → invoice items-like structure (kept for potential backend expansion)
  const mapGroupsToItems = React.useCallback(() => {
    return groups.flatMap((g) => {
      const unit = g.unit || 'ชิ้น';
      const base = {
        pricing_request_id: g.prId || null,
        item_name: g.name || '-',
        pattern: g.pattern || '',
        fabric_type: g.fabricType || '',
        color: g.color || '',
        unit,
      };
      return (g.sizeRows || []).map((r, idx) => {
        const qty = typeof r.quantity === 'string' ? parseFloat(r.quantity || '0') : Number(r.quantity || 0);
        const price = typeof r.unitPrice === 'string' ? parseFloat(r.unitPrice || '0') : Number(r.unitPrice || 0);
        return {
          ...base,
          size: r.size || '',
          unit_price: isNaN(price) ? 0 : price,
          quantity: isNaN(qty) ? 0 : qty,
          notes: r.notes || '',
          sequence_order: idx + 1,
        };
      });
    });
  }, [groups]);

  const handleCreate = async () => {
    if (!q?.id) return;
    const loadingId = showLoading('กำลังสร้างใบแจ้งหนี้…');
    try {
      const itemsPayload = mapGroupsToItems();
      const payTerms = paymentTermsType === 'other' ? (paymentTermsCustom || '') : paymentTermsType;
      const dueDateForSave = isCredit ? (selectedDueDate ? toISODate(selectedDueDate) : null) : null;

      const payload = {
        quotationId: q.id,
        type: invoiceType,
        payment_terms: payTerms,
        notes: q?.notes || '',
        custom_billing_address: isEditingAddress ? customAddress : undefined,
        document_header_type: documentHeaderType === 'อื่นๆ' ? customHeaderType : documentHeaderType,
        // VAT configuration
        has_vat: hasVat,
        vat_percentage: vatPercentage,
        vat_amount: vat,
        // Financial fields for backend calculation validation
        subtotal,
        discount_amount: discountAmountComputed,
        net_after_discount: netAfterDiscount,
        total_amount: total,
        withholding_amount: withholdingTaxAmountComputed,
        final_total: finalNetAmountComputed,
      };
      if (invoiceType === 'partial') {
        const amt = Number(partialAmount || 0);
        if (!(amt > 0)) {
          dismissToast(loadingId);
          showError('กรุณากรอกจำนวนเงินสำหรับใบแจ้งหนี้แบบบางส่วน');
          return;
        }
        payload.custom_amount = amt;
      }
      if (dueDateForSave) payload.due_date = dueDateForSave;
      // Keep computed client-side summary for future server support
      payload.summary = {
        subtotal,
        discount_amount: discountAmountComputed,
        discounted_base: netAfterDiscount,
        vat,
        total_after_vat: total,
        withholding_amount: withholdingTaxAmountComputed,
        final_total: finalNetAmountComputed,
        deposit_mode: depositMode,
        deposit_percentage: liveDepositPercentage,
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        // VAT fields
        has_vat: hasVat,
        vat_percentage: vatPercentage,
        vat_amount: vat,
      };
      payload.invoice_items = itemsPayload;
      if (attachments?.length) {
        payload.images = attachments.map((f) => ({ name: f.name, size: f.size, type: f.type }));
      }

      const res = await createInvoice(payload).unwrap();
      dismissToast(loadingId);
      showSuccess('สร้างใบแจ้งหนี้เรียบร้อยแล้ว');
      onCreated?.(res);
      onClose?.();
    } catch (e) {
      dismissToast(loadingId);
      showError(e?.data?.message || e?.message || 'สร้างใบแจ้งหนี้ไม่สำเร็จ');
    }
  };

  return (
    <>
      <Dialog open={open} onClose={() => onCancel?.()} fullWidth maxWidth="lg" scroll="paper">
      <DialogTitle>สร้างใบแจ้งหนี้</DialogTitle>
      <DialogContent
        dividers
        sx={{
          minHeight: '70vh',
          '& .MuiGrid-container': { alignItems: 'flex-start' },
          '& .force-wrap': { flexWrap: 'wrap' },
          '& .long-text': { wordBreak: 'break-word', whiteSpace: 'pre-wrap' }
        }}
      >
        {isLoading || isFetching ? (
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (!q?.id) ? (
          <Typography color="text.secondary">ไม่พบใบเสนอราคาที่เลือก</Typography>
        ) : (
          <Stack spacing={3} sx={{ p: 1 }}>
            {/* Customer Info */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white }}>
                  <AssignmentIcon />
                </Avatar>
                <Typography variant="h6" fontWeight={700}>ข้อมูลลูกค้า</Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>ชื่อลูกค้า/บริษัท</Typography>
                    <Typography variant="subtitle1" fontWeight={700} className="long-text">{customer?.cus_company || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary" className="long-text">{customer?.cus_firstname || ''} {customer?.cus_lastname || ''}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="text.secondary">ที่อยู่สำหรับออกบิล</Typography>
                      <Button
                        size="small"
                        variant={isEditingAddress ? "contained" : "outlined"}
                        onClick={() => setIsEditingAddress(!isEditingAddress)}
                        sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                      >
                        {isEditingAddress ? 'ใช้ที่อยู่เดิม' : 'เปลี่ยนที่อยู่'}
                      </Button>
                    </Box>
                    {isEditingAddress ? (
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        placeholder="กรอกที่อยู่ใหม่สำหรับออกใบแจ้งหนี้"
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body2" fontWeight={500} className="long-text">{customer?.cus_address || '-'}</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>เลขประจำตัวผู้เสียภาษี</Typography>
                    <Typography variant="body2" fontWeight={500} className="long-text">{customer?.cus_tax_id || '-'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>เบอร์โทรศัพท์</Typography>
                    <Typography variant="body2" fontWeight={500} className="long-text">{customer?.cus_tel_1 || '-'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>หัวกระดาษ</Typography>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      {['ต้นฉบับ', 'สำเนา', 'อื่นๆ'].map((type) => (
                        <Button
                          key={type}
                          size="small"
                          variant={documentHeaderType === type ? "contained" : "outlined"}
                          onClick={() => setDocumentHeaderType(type)}
                          sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5, minWidth: 'auto' }}
                        >
                          {type}
                        </Button>
                      ))}
                    </Box>
                    {documentHeaderType === 'อื่นๆ' && (
                      <TextField
                        fullWidth
                        size="small"
                        value={customHeaderType}
                        onChange={(e) => setCustomHeaderType(e.target.value)}
                        placeholder="ระบุประเภทหัวกระดาษ"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Items & Calculation - Using Accordion */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white }}>
                    <CalculateIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>รายการ & การคำนวณ</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  {groups.map((g, gi) => {
                    const totalQty = (g.sizeRows || []).reduce((s, r) => s + Number(r.quantity || 0), 0);
                    const itemTotal = (g.sizeRows || []).reduce((s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0), 0);
                    const unit = g.unit || 'ชิ้น';
                    
                    return (
                      <Paper key={g.id} elevation={1} sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="subtitle1" fontWeight={700} color="primary">งานที่ {gi + 1}</Typography>
                            <Typography variant="body2" color="text.secondary">{g.name || '-'}</Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip label={`${totalQty} ${unit}`} size="small" variant="outlined" />
                          </Box>
                        </Box>
                        
                        {/* Group Details */}
                        <Grid container spacing={1.5} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="แพทเทิร์น"
                              value={g.pattern || ''}
                              disabled
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="ประเภทผ้า"
                              value={g.fabricType || ''}
                              disabled
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="สี"
                              value={g.color || ''}
                              disabled
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="ขนาด (สรุป)"
                              value={g.size || ''}
                              disabled
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              size="small"
                              select
                              SelectProps={{ native: true }}
                              label="หน่วย"
                              value={unit}
                              disabled
                            >
                              <option value="ชิ้น">ชิ้น</option>
                              <option value="ตัว">ตัว</option>
                              <option value="ชุด">ชุด</option>
                              <option value="กล่อง">กล่อง</option>
                              <option value="แพ็ค">แพ็ค</option>
                              <option value="อื่นๆ">อื่นๆ</option>
                            </TextField>
                          </Grid>
                        </Grid>

                        {/* Size Breakdown */}
                        <Grid item xs={12}>
                          <Box sx={{ p: 1.5, border: '1px dashed #e0e0e0', borderRadius: 1, bgcolor: '#fafafa' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                              <Typography variant="subtitle2" fontWeight={700}>แยกตามขนาด</Typography>
                            </Box>
                            
                            {/* Header Row */}
                            <Grid container spacing={1} sx={{ px: 0.5, pb: 0.5 }}>
                              <Grid item xs={12} md={3}>
                                <Typography variant="caption" color="text.secondary">ขนาด</Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">จำนวน</Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">ราคาต่อหน่วย</Typography>
                              </Grid>
                              <Grid item xs={10} md={2}>
                                <Typography variant="caption" color="text.secondary">ยอดรวม</Typography>
                              </Grid>
                              <Grid item xs={2} md={1}></Grid>
                            </Grid>
                            
                            {/* Data Rows */}
                            <Grid container spacing={1}>
                              {(g.sizeRows || []).map((row) => (
                                <React.Fragment key={row.uuid}>
                                  <Grid item xs={12} md={3}>
                                    <TextField 
                                      fullWidth 
                                      size="small" 
                                      inputProps={{ inputMode: 'text' }}
                                      label="ขนาด" 
                                      value={row.size || ''} 
                                      disabled
                                    />
                                  </Grid>
                                  <Grid item xs={6} md={3}>
                                    <TextField 
                                      fullWidth 
                                      size="small" 
                                      type="text" 
                                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} 
                                      label="จำนวน" 
                                      value={row.quantity ?? ''} 
                                      disabled
                                    />
                                  </Grid>
                                  <Grid item xs={6} md={3}>
                                    <TextField 
                                      fullWidth 
                                      size="small" 
                                      type="text" 
                                      inputProps={{ inputMode: 'decimal' }} 
                                      label="ราคาต่อหน่วย" 
                                      value={row.unitPrice ?? ''} 
                                      disabled
                                    />
                                  </Grid>
                                  <Grid item xs={10} md={2}>
                                    <Box sx={{ 
                                      p: 1, 
                                      bgcolor: '#fff', 
                                      border: '1px solid #e0e0e0', 
                                      borderRadius: 1, 
                                      textAlign: 'center'
                                    }}>
                                      <Typography variant="subtitle2" fontWeight={800}>
                                        {(() => {
                                          const qv = typeof row.quantity === 'string' ? parseFloat(row.quantity || '0') : Number(row.quantity || 0);
                                          const pv = typeof row.unitPrice === 'string' ? parseFloat(row.unitPrice || '0') : Number(row.unitPrice || 0);
                                          const val = (isNaN(qv) || isNaN(pv)) ? 0 : qv * pv;
                                          return formatTHB(val);
                                        })()}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={2} md={1}></Grid>
                                  <Grid item xs={12}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="หมายเหตุ (บรรทัดนี้)"
                                      multiline
                                      minRows={1}
                                      value={row.notes || ''}
                                      disabled
                                    />
                                  </Grid>
                                </React.Fragment>
                              ))}
                            </Grid>
                          </Box>
                        </Grid>

                        {/* Item Total */}
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          <Grid item xs={6} md={4}>
                            <Box sx={{ 
                              p: 1.5, 
                              border: '1px solid #e0e0e0', 
                              borderRadius: 1.5, 
                              textAlign: 'center', 
                              bgcolor: '#fafafa' 
                            }}>
                              <Typography variant="caption" color="text.secondary">ยอดรวม</Typography>
                              <Typography variant="h6" fontWeight={800}>{formatTHB(itemTotal)}</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    );
                  })}

                  {/* VAT, Discount and Tax */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <VatField
                        hasVat={hasVat}
                        vatPercentage={vatPercentage}
                        vatAmount={vat}
                        subtotalAmount={netAfterDiscount}
                        onToggleVat={setHasVat}
                        onVatPercentageChange={setVatPercentage}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <SpecialDiscountField
                        discountType={specialDiscountType}
                        discountValue={specialDiscountValue}
                        totalAmount={subtotal}
                        discountAmount={discountAmountComputed}
                        onDiscountTypeChange={setSpecialDiscountType}
                        onDiscountValueChange={setSpecialDiscountValue}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <WithholdingTaxField
                        hasWithholdingTax={hasWithholdingTax}
                        taxPercentage={withholdingTaxPercentage}
                        taxAmount={withholdingTaxAmountComputed}
                        subtotalAmount={subtotal}
                        onToggleWithholdingTax={setHasWithholdingTax}
                        onTaxPercentageChange={setWithholdingTaxPercentage}
                      />
                    </Grid>
                  </Grid>

                  {/* Calculation Summary */}
                  <Paper elevation={2} sx={{ p: 3, bgcolor: 'primary.50' }}>
                    <Calculation
                      subtotal={subtotal}
                      discountAmount={discountAmountComputed}
                      discountedBase={netAfterDiscount}
                      vat={vat}
                      totalAfterVat={total}
                      withholdingAmount={withholdingTaxAmountComputed}
                      finalTotal={finalNetAmountComputed}
                      vatPercentage={vatPercentage}
                      hasVat={hasVat}
                    />
                  </Paper>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Payment Terms - Using Accordion */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white }}>
                    <PaymentIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>เงื่อนไขการชำระเงิน</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <PaymentTerms
                    isEditing={true}
                    paymentTermsType={paymentTermsType}
                    paymentTermsCustom={paymentTermsCustom}
                    onChangePaymentTermsType={setPaymentTermsType}
                    onChangePaymentTermsCustom={setPaymentTermsCustom}
                    depositMode={depositMode}
                    onChangeDepositMode={setDepositMode}
                    depositPercentage={depositPct}
                    depositAmountInput={depositAmountInput}
                    onChangeDepositPercentage={(v) => setDepositPct(sanitizeInt(v))}
                    onChangeDepositAmount={setDepositAmountInput}
                    isCredit={isCredit}
                    dueDateNode={isCredit ? (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="body1">วันครบกำหนด</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                              value={selectedDueDate}
                              onChange={(newVal) => setSelectedDueDate(newVal)}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                          </LocalizationProvider>
                        </Grid>
                      </Grid>
                    ) : null}
                    finalTotal={finalNetAmountComputed}
                    depositAmount={depositAmount}
                    remainingAmount={remainingAmount}
                  />

                  <Box>
                    <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>ประเภทการเรียกเก็บ</Typography>
                    <Grid container spacing={2}>
                      {[
                        { value: 'full_amount', label: 'เต็มจำนวน' },
                        { value: 'remaining', label: 'ยอดคงเหลือ (หักมัดจำ)' },
                        { value: 'deposit', label: 'มัดจำ' },
                        { value: 'partial', label: 'บางส่วน (กำหนดเอง)' },
                      ].map(opt => (
                        <Grid item xs={12} md={6} key={opt.value}>
                          <Button
                            fullWidth
                            size="large"
                            variant={invoiceType === opt.value ? 'contained' : 'outlined'}
                            onClick={() => setInvoiceType(opt.value)}
                            sx={{ py: 1.5 }}
                          >
                            {opt.label}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                    {invoiceType === 'partial' && (
                      <Box sx={{ mt: 2 }}>
                        <TextField 
                          fullWidth 
                          type="text" 
                          inputProps={{ inputMode:'decimal' }} 
                          label="จำนวนเงิน (บางส่วน)" 
                          value={partialAmount} 
                          onChange={(e)=>setPartialAmount(e.target.value)} 
                        />
                      </Box>
                    )}
                  </Box>

                  <Box>
                    <TextField 
                      fullWidth 
                      multiline 
                      rows={4} 
                      label="หมายเหตุ" 
                      defaultValue={q?.notes || ''} 
                    />
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Signature Images */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white }}>
                  <BadgeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>หลักฐานการเซ็น</Typography>
                  <Typography variant="caption" color="text.secondary">รูปภาพหลักฐานการเซ็นจากใบเสนอราคา</Typography>
                </Box>
              </Box>
              
              {signatureImages.length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">ยังไม่มีรูปหลักฐานการเซ็น</Typography>
                </Box>
              )}
              
              {signatureImages.length > 0 && (
                <Grid container spacing={2}>
                  {signatureImages.map((img, idx) => {
                    const apiBase = apiConfig.baseUrl || '';
                    // Derive origin root (strip /api/... if present)
                    const origin = (() => {
                      try {
                        if (!apiBase) return '';
                        const u = new URL(apiBase);
                        return u.origin; // http://localhost:8000
                      } catch { return apiBase.replace(/\/api\b.*$/, ''); }
                    })();
                    const normalize = (u) => {
                      if (!u) return '';
                      if (/^https?:/i.test(u)) return u; // absolute
                      if (u.startsWith('//')) return window.location.protocol + u; // protocol-relative
                      if (u.startsWith('/')) return origin + u; // backend relative root
                      // maybe "storage/..." without leading slash
                      if (u.startsWith('storage/')) return origin + '/' + u;
                      return u; // fallback
                    };
                    let urlCandidate = img?.url || '';
                    if (!urlCandidate && img?.path) {
                      urlCandidate = 'storage/' + img.path.replace(/^public\//,'');
                    }
                    const finalUrl = normalize(urlCandidate);
                    return (
                      <Grid item key={idx} xs={6} md={3}>
                        <Box 
                          sx={{ 
                            border: '1px solid ' + tokens.border, 
                            borderRadius: 1, 
                            p: 1, 
                            bgcolor: '#fff', 
                            cursor: 'pointer' 
                          }} 
                          onClick={() => setPreviewImage({ url: finalUrl, filename: img.original_filename || img.filename, idx })}
                        >
                          <Box 
                            sx={{ 
                              position: 'relative', 
                              pb: '70%', 
                              overflow: 'hidden', 
                              borderRadius: 1, 
                              mb: 1, 
                              background: '#fafafa' 
                            }}
                          >
                            <img 
                              src={finalUrl} 
                              alt={img.filename} 
                              style={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain' 
                              }} 
                            />
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', wordBreak: 'break-all' }}>
                            {img.original_filename || img.filename}
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Paper>

            {/* Attachments */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white }}>
                  <AddIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>รูปภาพแนบ/ไฟล์ประกอบ</Typography>
                  <Typography variant="caption" color="text.secondary">อัปโหลดได้หลายรูป ดูพรีวิวได้</Typography>
                </Box>
              </Box>
              <ImageUploadGrid
                images={attachments}
                onUpload={async (files) => { setAttachments((prev) => [...prev, ...files]); }}
                helperText="รองรับ JPG/PNG ขนาดไม่เกิน 5MB ต่อไฟล์"
              />
            </Paper>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => onCancel?.()} disabled={isCreating} variant="outlined" size="large">
          ปิด
        </Button>
        <Button 
          onClick={handleCreate} 
          disabled={isCreating || !q?.id} 
          variant="contained" 
          size="large"
          sx={{ minWidth: 120 }}
        >
          {isCreating ? 'กำลังสร้าง…' : 'สร้างใบแจ้งหนี้'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Image Preview Dialog */}
    <Dialog
      open={!!previewImage}
      onClose={() => setPreviewImage(null)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {previewImage?.filename || 'ดูรูปภาพ'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          {previewImage && (
            <img
              src={previewImage.url}
              alt={previewImage.filename}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPreviewImage(null)}>ปิด</Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default InvoiceCreateDialog;
