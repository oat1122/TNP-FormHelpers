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
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>สร้างใบแจ้งหนี้</DialogTitle>
      <DialogContent dividers>
        {isLoading || isFetching ? (
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (!q?.id) ? (
          <Typography color="text.secondary">ไม่พบใบเสนอราคาที่เลือก</Typography>
        ) : (
          <Box>
            {/* Customer Info */}
            <Section sx={{ mb: 2 }}>
              <SectionHeader>
                <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                  <AssignmentIcon fontSize="small" />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>ข้อมูลลูกค้า</Typography>
              </SectionHeader>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <InfoCard sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">ชื่อลูกค้า/บริษัท</Typography>
                      <Typography variant="subtitle1" fontWeight={700}>{customer?.cus_company || '-'}</Typography>
                      <Typography variant="body2" color="text.secondary">{customer?.cus_firstname || ''} {customer?.cus_lastname || ''}</Typography>
                    </InfoCard>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <InfoCard sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">ที่อยู่สำหรับออกบิล</Typography>
                      <Typography variant="body2" fontWeight={500}>{customer?.cus_address || '-'}</Typography>
                    </InfoCard>
                  </Grid>
                </Grid>
              </Box>
            </Section>

            {/* Items & Calculation */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <Section>
                  <SectionHeader>
                    <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                      <CalculateIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight={700}>รายการ & การคำนวณ</Typography>
                  </SectionHeader>
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={1.5}>
                      {groups.map((g, gi) => (
                        <Grid item xs={12} key={g.id}>
                          <InfoCard sx={{ p: 1.5 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip label={`กลุ่ม ${gi + 1}`} size="small" />
                                <Typography variant="subtitle2" fontWeight={700}>{g.name || '-'}</Typography>
                              </Box>
                              <SecondaryButton size="small" startIcon={<AddIcon />} onClick={() => onAddRow(g.id)}>
                                เพิ่มแถว
                              </SecondaryButton>
                            </Box>
                            <Grid container spacing={1} sx={{ px: 0.5, pb: 0.5 }}>
                              <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">ไซซ์</Typography></Grid>
                              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">จำนวน</Typography></Grid>
                              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">ราคา/หน่วย</Typography></Grid>
                              <Grid item xs={10} md={2}><Typography variant="caption" color="text.secondary">รวมย่อย</Typography></Grid>
                              <Grid item xs={2} md={1}></Grid>
                            </Grid>
                            {(g.sizeRows || []).map((row) => (
                              <Grid container spacing={1} key={row.uuid}>
                                <Grid item xs={12} md={3}>
                                  <TextField fullWidth size="small" label="ไซซ์" value={row.size || ''} onChange={(e) => onChangeRow(g.id, row.uuid, 'size', e.target.value)} />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <TextField fullWidth size="small" type="text" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} label="จำนวน" value={row.quantity ?? ''} onChange={(e) => onChangeRow(g.id, row.uuid, 'quantity', e.target.value)} />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <TextField fullWidth size="small" type="text" inputProps={{ inputMode: 'decimal' }} label="ราคา/หน่วย" value={row.unitPrice ?? ''} onChange={(e) => onChangeRow(g.id, row.uuid, 'unitPrice', e.target.value)} />
                                </Grid>
                                <Grid item xs={10} md={2}>
                                  <Box sx={{ p: 1, bgcolor: '#fff', border: `1px solid ${tokens.border}`, borderRadius: 1, textAlign: 'center' }}>
                                    <Typography variant="subtitle2" fontWeight={800}>{(() => {
                                      const qv = typeof row.quantity === 'string' ? parseFloat(row.quantity || '0') : Number(row.quantity || 0);
                                      const pv = typeof row.unitPrice === 'string' ? parseFloat(row.unitPrice || '0') : Number(row.unitPrice || 0);
                                      const val = (isNaN(qv) || isNaN(pv)) ? 0 : qv * pv;
                                      return formatTHB(val);
                                    })()}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={2} md={1}>
                                  <SecondaryButton size="small" color="error" onClick={() => onRemoveRow(g.id, row.uuid)}>
                                    <DeleteOutlineIcon fontSize="small" />
                                  </SecondaryButton>
                                </Grid>
                              </Grid>
                            ))}
                          </InfoCard>
                        </Grid>
                      ))}
                      <Grid item xs={12}>
                        <Grid container spacing={1.5}>
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
                      </Grid>
                      <Grid item xs={12}>
                        <Calculation
                          subtotal={subtotal}
                          discountAmount={discountAmountComputed}
                          discountedBase={netAfterDiscount}
                          vat={vat}
                          totalAfterVat={total}
                          withholdingAmount={withholdingTaxAmountComputed}
                          finalTotal={finalNetAmountComputed}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Section>
              </Grid>
              <Grid item xs={12} md={5}>
                <Section>
                  <SectionHeader>
                    <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                      <PaymentIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight={700}>เงื่อนไขการชำระเงิน</Typography>
                  </SectionHeader>
                  <Box sx={{ p: 2 }}>
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
                        <>
                          <Grid item xs={6}><Typography>วันครบกำหนด</Typography></Grid>
                          <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                              <DatePicker
                                value={selectedDueDate}
                                onChange={(newVal) => setSelectedDueDate(newVal)}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                              />
                            </LocalizationProvider>
                          </Grid>
                        </>
                      ) : null}
                      finalTotal={finalNetAmountComputed}
                      depositAmount={depositAmount}
                      remainingAmount={remainingAmount}
                    />

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} color={tokens.primary} gutterBottom>ประเภทการเรียกเก็บ</Typography>
                      <Grid container spacing={1}>
                        {[
                          { value: 'full_amount', label: 'เต็มจำนวน' },
                          { value: 'remaining', label: 'ยอดคงเหลือ (หักมัดจำ)' },
                          { value: 'deposit', label: 'มัดจำ' },
                          { value: 'partial', label: 'บางส่วน (กำหนดเอง)' },
                        ].map(opt => (
                          <Grid item xs={6} key={opt.value}>
                            <Button
                              fullWidth
                              variant={invoiceType === opt.value ? 'contained' : 'outlined'}
                              onClick={() => setInvoiceType(opt.value)}
                            >
                              {opt.label}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                      {invoiceType === 'partial' && (
                        <Box sx={{ mt: 1.5 }}>
                          <TextField fullWidth size="small" type="text" inputProps={{ inputMode:'decimal' }} label="จำนวนเงิน (บางส่วน)" value={partialAmount} onChange={(e)=>setPartialAmount(e.target.value)} />
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <TextField fullWidth multiline rows={3} label="หมายเหตุ" defaultValue={q?.notes || ''} />
                    </Box>
                  </Box>
                </Section>
              </Grid>
            </Grid>

            {/* Attachments */}
            <Section sx={{ mt: 2 }}>
              <SectionHeader>
                <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                  <AddIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>รูปภาพแนบ/ไฟล์ประกอบ</Typography>
                  <Typography variant="caption" color="text.secondary">อัปโหลดได้หลายรูป ดูพรีวิวได้</Typography>
                </Box>
              </SectionHeader>
              <Box sx={{ p:2 }}>
                <ImageUploadGrid
                  images={attachments}
                  onUpload={async (files) => { setAttachments((prev) => [...prev, ...files]); }}
                  helperText="รองรับ JPG/PNG ขนาดไม่เกิน 5MB ต่อไฟล์"
                />
              </Box>
            </Section>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <SecondaryButton onClick={onClose} disabled={isCreating}>ปิด</SecondaryButton>
        <SecondaryButton onClick={handleCreate} disabled={isCreating || !q?.id}>{isCreating ? 'กำลังสร้าง…' : 'สร้างใบแจ้งหนี้'}</SecondaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceCreateDialog;
