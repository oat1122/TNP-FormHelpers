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
} from '@mui/icons-material';
import {
  useGetQuotationQuery,
  useCreateInvoiceFromQuotationMutation,
} from '../../../../features/Accounting/accountingApi';
import { Section, SectionHeader, SecondaryButton, InfoCard, tokens } from '../../PricingIntegration/components/quotation/styles/quotationTheme';
import SpecialDiscountField from '../../PricingIntegration/components/quotation/CreateQuotationForm/components/SpecialDiscountField';
import WithholdingTaxField from '../../PricingIntegration/components/quotation/CreateQuotationForm/components/WithholdingTaxField';
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
const InvoiceCreateDialog = ({ open, onClose, quotationId, onCreated }) => {
  const { data, isLoading, isFetching } = useGetQuotationQuery(quotationId, { skip: !quotationId });
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceFromQuotationMutation();

  const q = pickQuotation(data);
  const prIdsAll = React.useMemo(() => getAllPrIdsFromQuotation(q), [q?.id]);
  const [customer] = React.useState(() => normalizeCustomer(q));
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
  const initialDiscountType = (Number(q?.special_discount_amount || 0) > 0 && Number(q?.special_discount_percentage || 0) === 0)
    ? 'amount'
    : 'percentage';
  const initialDiscountValue = initialDiscountType === 'amount'
    ? Number(q?.special_discount_amount || 0)
    : Number(q?.special_discount_percentage || 0);
  const [specialDiscountType, setSpecialDiscountType] = React.useState(initialDiscountType);
  const [specialDiscountValue, setSpecialDiscountValue] = React.useState(initialDiscountValue);
  const [hasWithholdingTax, setHasWithholdingTax] = React.useState(!!q?.has_withholding_tax);
  const [withholdingTaxPercentage, setWithholdingTaxPercentage] = React.useState(Number(q?.withholding_tax_percentage || 0));

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

  // Attachments (local only for now)
  const [attachments, setAttachments] = React.useState([]); // File[]

  // Financials from groups + discount-before-VAT + withholding
  const financials = useQuotationFinancials({
    items: groups,
    depositMode,
    depositPercentage: depositPct,
    depositAmountInput,
    specialDiscountType,
    specialDiscountValue,
    hasWithholdingTax,
    withholdingTaxPercentage,
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" scroll="paper">
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
                    <Typography variant="caption" color="text.secondary" gutterBottom>ที่อยู่สำหรับออกบิล</Typography>
                    <Typography variant="body2" fontWeight={500} className="long-text">{customer?.cus_address || '-'}</Typography>
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
                  {groups.map((g, gi) => (
                    <Paper key={g.id} elevation={1} sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip label={`กลุ่ม ${gi + 1}`} color="primary" variant="outlined" />
                          <Typography variant="h6" fontWeight={600}>{g.name || '-'}</Typography>
                        </Box>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => onAddRow(g.id)}>
                          เพิ่มแถว
                        </Button>
                      </Box>
                      
                      {/* Header Row */}
                      <Grid container spacing={2} sx={{ mb: 1 }}>
                        <Grid item xs={12} md={3}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>ไซซ์</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>จำนวน</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>ราคา/หน่วย</Typography>
                        </Grid>
                        <Grid item xs={10} md={2}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>รวมย่อย</Typography>
                        </Grid>
                        <Grid item xs={2} md={1}></Grid>
                      </Grid>
                      
                      {/* Data Rows */}
                      {(g.sizeRows || []).map((row) => (
                        <Grid container spacing={2} key={row.uuid} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={3}>
                            <TextField 
                              fullWidth 
                              size="small" 
                              label="ไซซ์" 
                              value={row.size || ''} 
                              onChange={(e) => onChangeRow(g.id, row.uuid, 'size', e.target.value)} 
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
                              onChange={(e) => onChangeRow(g.id, row.uuid, 'quantity', e.target.value)} 
                            />
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <TextField 
                              fullWidth 
                              size="small" 
                              type="text" 
                              inputProps={{ inputMode: 'decimal' }} 
                              label="ราคา/หน่วย" 
                              value={row.unitPrice ?? ''} 
                              onChange={(e) => onChangeRow(g.id, row.uuid, 'unitPrice', e.target.value)} 
                            />
                          </Grid>
                          <Grid item xs={10} md={2}>
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: 'primary.50', 
                              border: '1px solid', 
                              borderColor: 'primary.200', 
                              borderRadius: 1, 
                              textAlign: 'center',
                              minHeight: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.9rem' }}>
                                {(() => {
                                  const qv = typeof row.quantity === 'string' ? parseFloat(row.quantity || '0') : Number(row.quantity || 0);
                                  const pv = typeof row.unitPrice === 'string' ? parseFloat(row.unitPrice || '0') : Number(row.unitPrice || 0);
                                  const val = (isNaN(qv) || isNaN(pv)) ? 0 : qv * pv;
                                  return formatTHB(val);
                                })()}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={2} md={1}>
                            <Button 
                              size="small" 
                              color="error" 
                              onClick={() => onRemoveRow(g.id, row.uuid)}
                              sx={{ minWidth: 40 }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </Button>
                          </Grid>
                        </Grid>
                      ))}
                    </Paper>
                  ))}

                  {/* Discount and Tax */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <SpecialDiscountField
                        discountType={specialDiscountType}
                        discountValue={specialDiscountValue}
                        totalAmount={subtotal}
                        discountAmount={discountAmountComputed}
                        onDiscountTypeChange={setSpecialDiscountType}
                        onDiscountValueChange={setSpecialDiscountValue}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
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
        <Button onClick={onClose} disabled={isCreating} variant="outlined" size="large">
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
  );
};

export default InvoiceCreateDialog;
