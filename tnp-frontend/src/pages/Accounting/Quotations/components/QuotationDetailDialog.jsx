import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Grid,
  Chip,
  TextField,
  Divider,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { useGetQuotationQuery, useGetPricingRequestAutofillQuery, useUpdateQuotationMutation, useGenerateQuotationPDFMutation, useUploadQuotationSignaturesMutation, useDeleteQuotationSignatureImageMutation, useUploadQuotationSampleImagesMutation } from '../../../../features/Accounting/accountingApi';
import { apiConfig } from '../../../../api/apiConfig';
import { Section, SectionHeader, SecondaryButton, InfoCard, tokens } from '../../PricingIntegration/components/quotation/styles/quotationTheme';
import { formatTHB } from '../utils/format';
import { formatDateTH } from '../../PricingIntegration/components/quotation/utils/date';
import CustomerEditDialog from '../../PricingIntegration/components/CustomerEditDialog';
// Replaced custom client-side preview with backend PDF generation
import { sanitizeInt } from '../../shared/inputSanitizers';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/accountingToast';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { pickQuotation, normalizeCustomer, getAllPrIdsFromQuotation, normalizeAndGroupItems, computeTotals, toISODate } from '../utils/quotationUtils';
import { useQuotationFinancials } from '../../shared/hooks/useQuotationFinancials';
import { useQuotationGroups } from '../hooks/useQuotationGroups';
// Reuse discount & withholding components from create form
import SpecialDiscountField from '../../PricingIntegration/components/quotation/CreateQuotationForm/components/SpecialDiscountField';
import WithholdingTaxField from '../../PricingIntegration/components/quotation/CreateQuotationForm/components/WithholdingTaxField';
import Calculation from '../../shared/components/Calculation';
import PaymentTerms from '../../shared/components/PaymentTerms';
import ImageUploadGrid from '../../shared/components/ImageUploadGrid';

// Child: Summary card per PR group (fetch PR info if group has no name)
const PRGroupSummaryCard = React.memo(function PRGroupSummaryCard({ group, index }) {
  const { data: prData } = useGetPricingRequestAutofillQuery(group.prId, { skip: !group.prId });
  const pr = prData?.data || prData || {};
  const name = group.name && group.name !== '-' ? group.name : (pr.pr_work_name || pr.work_name || '-');
  const pattern = group.pattern || pr.pr_pattern || '';
  const fabric = group.fabricType || pr.pr_fabric_type || '';
  const color = group.color || pr.pr_color || '';
  const size = group.size || pr.pr_sizes || '';
  const totalQty = (group.sizeRows || []).reduce((s, r) => s + Number(r.quantity || 0), 0);
  const unit = group.unit || 'ชิ้น';
  return (
    <InfoCard sx={{ p: 2, mb: 1.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>งานที่ {index + 1}: {name}</Typography>
        <Chip label={`${totalQty} ${unit}`} size="small" variant="outlined" sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} />
      </Box>
      <Grid container spacing={1}>
        {pattern && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">แพทเทิร์น</Typography>
            <Typography variant="body2" fontWeight={500}>{pattern}</Typography>
          </Grid>
        )}
        {fabric && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">ประเภทผ้า</Typography>
            <Typography variant="body2" fontWeight={500}>{fabric}</Typography>
          </Grid>
        )}
        {color && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">สี</Typography>
            <Typography variant="body2" fontWeight={500}>{color}</Typography>
          </Grid>
        )}
        {size && (
          <Grid item xs={6} md={3}>
            <Typography variant="caption" color="text.secondary">ขนาด</Typography>
            <Typography variant="body2" fontWeight={500}>{size}</Typography>
          </Grid>
        )}
      </Grid>
    </InfoCard>
  );
});

// Child: Calculation card per PR group
const PRGroupCalcCard = React.memo(function PRGroupCalcCard({ group, index, isEditing, onAddRow, onChangeRow, onRemoveRow, onDeleteGroup, onChangeGroup }) {
  const { data: prData } = useGetPricingRequestAutofillQuery(group.prId, { skip: !group.prId });
  const pr = prData?.data || prData || {};
  const name = group.name && group.name !== '-' ? group.name : (pr.pr_work_name || pr.work_name || '-');
  const pattern = group.pattern || pr.pr_pattern || '';
  const fabric = group.fabricType || pr.pr_fabric_type || '';
  const color = group.color || pr.pr_color || '';
  const size = group.size || pr.pr_sizes || '';
  const rows = Array.isArray(group.sizeRows) ? group.sizeRows : [];
  const unit = group.unit || 'ชิ้น';
  const knownUnits = ['ชิ้น', 'ตัว', 'ชุด', 'กล่อง', 'แพ็ค'];
  const unitSelectValue = knownUnits.includes(group.unit) ? group.unit : 'อื่นๆ';
  const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const itemTotal = rows.reduce((s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0), 0);
  const prQty = Number(pr?.pr_quantity ?? pr?.quantity ?? 0) || 0;
  const hasPrQty = prQty > 0;
  const qtyMatches = hasPrQty ? totalQty === prQty : true;

  return (
    <Box component={InfoCard} sx={{ p: 2, mb: 1.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>งานที่ {index + 1}</Typography>
          <Typography variant="body2" color="text.secondary">{name}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip label={`${totalQty} ${unit}`} size="small" variant="outlined" sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} />
          {hasPrQty && (
            <Chip
              label={`PR: ${prQty} ${unit}`}
              size="small"
              color={qtyMatches ? 'success' : 'error'}
              variant={qtyMatches ? 'outlined' : 'filled'}
            />
          )}
          {isEditing && (
            <SecondaryButton size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => onDeleteGroup(group.id)}>
              ลบงานนี้
            </SecondaryButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="แพทเทิร์น"
            value={pattern}
            disabled={!isEditing}
            onChange={(e) => onChangeGroup(group.id, 'pattern', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="ประเภทผ้า"
            value={fabric}
            disabled={!isEditing}
            onChange={(e) => onChangeGroup(group.id, 'fabricType', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="สี"
            value={color}
            disabled={!isEditing}
            onChange={(e) => onChangeGroup(group.id, 'color', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField fullWidth size="small" label="ขนาด (สรุป)" value={size} disabled />
        </Grid>

        {/* Unit editor */}
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            select
            SelectProps={{ native: true }}
            label="หน่วย"
            value={unitSelectValue}
            disabled={!isEditing}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'อื่นๆ') {
                onChangeGroup(group.id, 'unit', (group.unit && !knownUnits.includes(group.unit)) ? group.unit : '');
              } else {
                onChangeGroup(group.id, 'unit', val);
              }
            }}
          >
            <option value="ชิ้น">ชิ้น</option>
            <option value="ตัว">ตัว</option>
            <option value="ชุด">ชุด</option>
            <option value="กล่อง">กล่อง</option>
            <option value="แพ็ค">แพ็ค</option>
            <option value="อื่นๆ">อื่นๆ</option>
          </TextField>
        </Grid>
        {unitSelectValue === 'อื่นๆ' && (
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="หน่วย (กำหนดเอง)"
              placeholder="พิมพ์หน่วย เช่น โหล, ตร.ม., แผ่น"
              value={group.unit || ''}
              disabled={!isEditing}
              onChange={(e) => onChangeGroup(group.id, 'unit', e.target.value)}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <Box sx={{ p: 1.5, border: `1px dashed ${tokens.border}`, borderRadius: 1, bgcolor: tokens.bg }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2" fontWeight={700}>แยกตามขนาด</Typography>
              {isEditing && (
                <SecondaryButton size="small" startIcon={<AddIcon />} onClick={() => onAddRow(group.id)}>
                  เพิ่มแถว
                </SecondaryButton>
              )}
            </Box>
            <Grid container spacing={1} sx={{ px: 0.5, pb: 0.5 }}>
              <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">ขนาด</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">จำนวน</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">ราคาต่อหน่วย</Typography></Grid>
              <Grid item xs={10} md={2}><Typography variant="caption" color="text.secondary">ยอดรวม</Typography></Grid>
              <Grid item xs={2} md={1}></Grid>
            </Grid>
            {rows.length === 0 ? (
              <Box sx={{ p: 1, color: 'text.secondary' }}>
                <Typography variant="body2">ไม่มีรายละเอียดรายการสำหรับงานนี้</Typography>
              </Box>
            ) : (
              <Grid container spacing={1}>
                {rows.map((row) => (
                  <React.Fragment key={row.uuid}>
                    <Grid item xs={12} md={3}>
                      <TextField fullWidth size="small" inputProps={{ inputMode: 'text' }} label="ขนาด" value={row.size || ''} disabled={!isEditing} onChange={(e) => onChangeRow(group.id, row.uuid, 'size', e.target.value)} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="จำนวน"
                        type="text"
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        value={row.quantity ?? ''}
                        disabled={!isEditing}
                        onChange={(e) => onChangeRow(group.id, row.uuid, 'quantity', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="ราคาต่อหน่วย"
                        type="text"
                        inputProps={{ inputMode: 'decimal' }}
                        value={row.unitPrice ?? ''}
                        disabled={!isEditing}
                        onChange={(e) => onChangeRow(group.id, row.uuid, 'unitPrice', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={10} md={2}>
                      <Box sx={{ p: 1, bgcolor: '#fff', border: `1px solid ${tokens.border}`, borderRadius: 1, textAlign: 'center' }}>
                        <Typography variant="subtitle2" fontWeight={800}>{(() => {
                          const q = typeof row.quantity === 'string' ? parseFloat(row.quantity || '0') : Number(row.quantity || 0);
                          const p = typeof row.unitPrice === 'string' ? parseFloat(row.unitPrice || '0') : Number(row.unitPrice || 0);
                          const val = (isNaN(q) || isNaN(p)) ? 0 : q * p;
                          return formatTHB(val);
                        })()}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={2} md={1}>
                      {isEditing && (
                        <SecondaryButton size="small" color="error" onClick={() => onRemoveRow(group.id, row.uuid)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </SecondaryButton>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="หมายเหตุ (บรรทัดนี้)"
                        multiline
                        minRows={1}
                        value={row.notes || ''}
                        disabled={!isEditing}
                        onChange={(e) => onChangeRow(group.id, row.uuid, 'notes', e.target.value)}
                      />
                    </Grid>
                  </React.Fragment>
                ))}
                {hasPrQty && !qtyMatches && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: 'error.main' }}>
                      จำนวนรวมทุกขนาด ({totalQty} {unit}) {totalQty > prQty ? 'มากกว่า' : 'น้อยกว่า'} จำนวนในงาน Pricing ({prQty} {unit})
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        </Grid>

        <Grid item xs={6} md={4}>
          <Box sx={{ p: 1.5, border: `1px solid ${tokens.border}`, borderRadius: 1.5, textAlign: 'center', bgcolor: tokens.bg }}>
            <Typography variant="caption" color="text.secondary">ยอดรวม</Typography>
            <Typography variant="h6" fontWeight={800}>{formatTHB(itemTotal)}</Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
});


// sanitizers imported from shared to keep behavior consistent across forms

const QuotationDetailDialog = ({ open, onClose, quotationId }) => {
  const { data, isLoading, error } = useGetQuotationQuery(quotationId, { skip: !open || !quotationId });
  const q = pickQuotation(data);
  const [updateQuotation, { isLoading: isSaving }] = useUpdateQuotationMutation();
  const [editCustomerOpen, setEditCustomerOpen] = React.useState(false);
  const [customer, setCustomer] = React.useState(() => normalizeCustomer(q));
  const prIdsAll = getAllPrIdsFromQuotation(q);
  const items = normalizeAndGroupItems(q, prIdsAll);
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
  const [quotationNotes, setQuotationNotes] = React.useState(q?.notes || '');
  const [selectedDueDate, setSelectedDueDate] = React.useState(q?.due_date ? new Date(q.due_date) : null);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState('');
  const [showPdfViewer, setShowPdfViewer] = React.useState(false);
  const [generateQuotationPDF] = useGenerateQuotationPDFMutation();
  const [uploadSignatures, { isLoading: isUploadingSignatures }] = useUploadQuotationSignaturesMutation();
  const [deleteSignatureImage, { isLoading: isDeletingSignature }] = useDeleteQuotationSignatureImageMutation();
  const [uploadSampleImages, { isLoading: isUploadingSamples }] = useUploadQuotationSampleImagesMutation();
  const [previewImage, setPreviewImage] = React.useState(null); // {url, filename, idx}
  const userData = React.useMemo(() => JSON.parse(localStorage.getItem('userData') || '{}'), []);
  const canUploadSignatures = ['admin','sale'].includes(userData?.role) && q?.status === 'approved';
  const signatureImages = Array.isArray(q?.signature_images) ? q.signature_images : [];
  const sampleImages = Array.isArray(q?.sample_images) ? q.sample_images : [];
  // Optimistic local selection for faster radio response
  const [selectedSampleForPdfLocal, setSelectedSampleForPdfLocal] = React.useState('');
  React.useEffect(() => {
    const initial = (sampleImages.find?.(it => !!it.selected_for_pdf)?.filename) || '';
    setSelectedSampleForPdfLocal(initial);
  }, [q?.id, JSON.stringify(sampleImages)]);
  const handleUploadSignatures = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const loadingId = showLoading('กำลังอัปโหลดหลักฐานการเซ็น…');
      await uploadSignatures({ id: q.id, files }).unwrap();
      dismissToast(loadingId);
      showSuccess('อัปโหลดสำเร็จ');
    } catch (err) {
      showError(err?.data?.message || err?.message || 'อัปโหลดไม่สำเร็จ');
    } finally {
      e.target.value = '';
    }
  };
  // Payment terms: support predefined codes and a custom (อื่นๆ) value
  const initialRawTerms = q?.payment_terms || q?.payment_method || (q?.credit_days === 30 ? 'credit_30' : q?.credit_days === 60 ? 'credit_60' : 'cash');
  const isKnownTerms = ['cash', 'credit_30', 'credit_60'].includes(initialRawTerms);
  const [paymentTermsType, setPaymentTermsType] = React.useState(isKnownTerms ? initialRawTerms : 'other');
  const [paymentTermsCustom, setPaymentTermsCustom] = React.useState(isKnownTerms ? '' : (initialRawTerms || ''));
  const inferredDepositPct = q?.deposit_percentage ?? ((q?.payment_terms || q?.payment_method || (q?.credit_days === 30 ? 'credit_30' : q?.credit_days === 60 ? 'credit_60' : 'cash')) === 'cash' ? 0 : 50);
  // Deposit state (supports percentage | amount)
  const [depositMode, setDepositMode] = React.useState(q?.deposit_mode || 'percentage');
  const [depositPct, setDepositPct] = React.useState(inferredDepositPct);
  const [depositAmountInput, setDepositAmountInput] = React.useState(q?.deposit_mode === 'amount' ? (q?.deposit_amount ?? '') : '');
  React.useEffect(() => {
    setCustomer(normalizeCustomer(q));
  }, [q?.id, q?.customer_name, q?.customer]);
  React.useEffect(() => {
    // Sync notes from server when quotation changes/opened
    setQuotationNotes(q?.notes || '');
  const raw = q?.payment_terms || q?.payment_method || (q?.credit_days === 30 ? 'credit_30' : q?.credit_days === 60 ? 'credit_60' : 'cash');
  const known = ['cash', 'credit_30', 'credit_60'].includes(raw);
  setPaymentTermsType(known ? raw : 'other');
  setPaymentTermsCustom(known ? '' : (raw || ''));
  setDepositPct(q?.deposit_percentage ?? ((q?.payment_terms || q?.payment_method || (q?.credit_days === 30 ? 'credit_30' : q?.credit_days === 60 ? 'credit_60' : 'cash')) === 'cash' ? 0 : 50));
  setDepositMode(q?.deposit_mode || 'percentage');
  setDepositAmountInput(q?.deposit_mode === 'amount' ? (q?.deposit_amount ?? '') : '');
    setSelectedDueDate(q?.due_date ? new Date(q.due_date) : null);
  }, [open, q?.id, q?.notes]);

  // Sync financial fields (special discount & withholding tax) after data fetched unless user is editing
  React.useEffect(() => {
    if (!q?.id) return; // nothing yet
    if (isEditing) return; // don't override while editing

    // Re-infer special discount type/value from latest quotation data
    if ((q.special_discount_percentage ?? 0) > 0) {
      setSpecialDiscountType('percentage');
      setSpecialDiscountValue(Number(q.special_discount_percentage));
    } else if ((q.special_discount_amount ?? 0) > 0) {
      setSpecialDiscountType('amount');
      setSpecialDiscountValue(Number(q.special_discount_amount));
    } else {
      setSpecialDiscountType('percentage');
      setSpecialDiscountValue(0);
    }

    // Withholding tax
    setHasWithholdingTax(!!q.has_withholding_tax);
    setWithholdingTaxPercentage(Number(q.withholding_tax_percentage || 0));
  }, [q?.id, q?.special_discount_percentage, q?.special_discount_amount, q?.has_withholding_tax, q?.withholding_tax_percentage, isEditing]);
  const activeGroups = isEditing ? groups : items;

  // components are hoisted above
  const workName = q.work_name || q.workname || q.title || '';
  const quotationNumber = q.number || '';
  // Prefer quotations.payment_terms when available
  const paymentMethod = isEditing
    ? (paymentTermsType === 'other' ? (paymentTermsCustom || '') : paymentTermsType)
    : (q.payment_terms || q.payment_method || (q.credit_days === 30 ? 'credit_30' : q.credit_days === 60 ? 'credit_60' : 'cash'));
  const depositPercentage = isEditing
    ? (depositMode === 'percentage' ? Number(depositPct || 0) : undefined)
    : (q.deposit_percentage ?? (paymentMethod === 'cash' ? 0 : 50));
  const dueDate = q.due_date ? new Date(q.due_date) : null;
  const computed = computeTotals(activeGroups, (depositPercentage ?? 0));
  const subtotal = q.subtotal != null ? Number(q.subtotal) : computed.subtotal;
  const vat = q.tax_amount != null ? Number(q.tax_amount) : computed.vat;
  const total = q.total_amount != null ? Number(q.total_amount) : computed.total;

  // ===== Extended financial states (editable) =====
  const [specialDiscountType, setSpecialDiscountType] = React.useState(() => {
    // infer type from existing data
    if ((q.special_discount_percentage ?? 0) > 0) return 'percentage';
    if ((q.special_discount_amount ?? 0) > 0) return 'amount';
    return 'percentage';
  });
  const [specialDiscountValue, setSpecialDiscountValue] = React.useState(() => {
    if ((q.special_discount_percentage ?? 0) > 0) return Number(q.special_discount_percentage);
    if ((q.special_discount_amount ?? 0) > 0) return Number(q.special_discount_amount);
    return 0;
  });
  const [hasWithholdingTax, setHasWithholdingTax] = React.useState(() => !!q.has_withholding_tax);
  const [withholdingTaxPercentage, setWithholdingTaxPercentage] = React.useState(() => Number(q.withholding_tax_percentage || 0));

  // Recompute dynamic amounts based on current edit inputs (mirroring logic in useQuotationCalc)
  // Use unified financials hook (discount applied to subtotal BEFORE VAT)
  const financials = useQuotationFinancials({
    items: activeGroups,
    depositMode: isEditing ? depositMode : (q?.deposit_mode || 'percentage'),
    depositPercentage: isEditing
      ? (depositMode === 'percentage' ? depositPct : undefined)
      : (q?.deposit_mode === 'percentage' ? q?.deposit_percentage : undefined),
    depositAmountInput: isEditing
      ? (depositMode === 'amount' ? depositAmountInput : undefined)
      : (q?.deposit_mode === 'amount' ? q?.deposit_amount : undefined),
    specialDiscountType,
    specialDiscountValue,
    hasWithholdingTax,
    withholdingTaxPercentage,
  });
  const {
    specialDiscountAmount: discountAmountComputed,
    discountedSubtotal: netAfterDiscount, // net after discount before VAT
    vat: vatRecalc,
    total: totalAfterDiscountAndVat,
    withholdingTaxAmount: withholdingTaxAmountComputed,
    finalTotal: finalNetAmountComputed,
    depositAmount,
    depositPercentage: liveDepositPercentage,
    remainingAmount,
  } = financials;

  // using toISODate util

  const handleSave = async () => {
    // Map editable groups back to API items
    const flatItems = groups.flatMap((g) => {
      const unit = g.unit || 'ชิ้น';
      const base = {
        pricing_request_id: g.prId || null,
        item_name: g.name || 'ไม่ระบุชื่องาน',
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

    const totals = computeTotals(groups, depositPercentage);
    const isCredit = paymentTermsType === 'credit_30' || paymentTermsType === 'credit_60';
    const dueDateForSave = isCredit ? (selectedDueDate ? toISODate(selectedDueDate) : null) : null;
  const loadingId = showLoading('กำลังบันทึกใบเสนอราคา…');
  try {
      await updateQuotation({
        id: q.id,
        items: flatItems,
        subtotal: totals.subtotal,
  // Recalculate tax & total based on discount-before-VAT logic
  tax_amount: vatRecalc,
  total_amount: totalAfterDiscountAndVat,
  // ⭐ Extended financial fields (from local editable states)
  special_discount_percentage: specialDiscountType === 'percentage' ? Number(specialDiscountValue || 0) : 0,
  special_discount_amount: specialDiscountType === 'amount' ? Number(specialDiscountValue || 0) : discountAmountComputed,
  has_withholding_tax: hasWithholdingTax,
  withholding_tax_percentage: hasWithholdingTax ? Number(withholdingTaxPercentage || 0) : 0,
  withholding_tax_amount: withholdingTaxAmountComputed,
  final_total_amount: finalNetAmountComputed,
  deposit_percentage: depositMode === 'percentage' ? Number(depositPct || 0) : Number(liveDepositPercentage || 0),
  deposit_amount: depositAmount,
  deposit_mode: depositMode,
  payment_terms: paymentTermsType === 'other' ? (paymentTermsCustom || '') : paymentTermsType,
  due_date: dueDateForSave,
  notes: quotationNotes || '',
      }).unwrap();
      setIsEditing(false);
      dismissToast(loadingId);
      showSuccess('บันทึกใบเสนอราคาเรียบร้อย');
    } catch (e) {
      dismissToast(loadingId);
      showError(e?.data?.message || e?.message || 'บันทึกใบเสนอราคาไม่สำเร็จ');
    }
  };

  // client-side preview removed; using backend PDF instead

  const handlePreviewPdf = async () => {
    if (!q?.id) return;
    // If editing, ask to save changes first so PDF reflects latest data
    if (isEditing) {
      const confirmSave = window.confirm('คุณกำลังแก้ไขข้อมูล ต้องการบันทึกก่อนสร้าง PDF หรือไม่?');
      if (confirmSave) {
        await handleSave();
      }
    }
    setIsGeneratingPdf(true);
    const loadingId = showLoading('กำลังสร้าง PDF ใบเสนอราคา…');
    try {
      // Request mPDF with preview watermark if not final
      const isFinal = ['approved', 'sent', 'completed'].includes(String(q?.status || ''));
      const res = await generateQuotationPDF({ id: q.id, format: 'A4', orientation: 'P', showWatermark: !isFinal }).unwrap();
      const dataObj = res?.data || res; // support either wrapped or direct
      const url = dataObj?.pdf_url || dataObj?.url;
      if (!url) throw new Error('ไม่พบลิงก์ไฟล์ PDF');
      setPdfUrl(url);
      setShowPdfViewer(true);
      const engine = (dataObj?.engine || '').toLowerCase();
      if (engine === 'fpdf') {
        showError('ระบบใช้ FPDF (fallback) ชั่วคราว เนื่องจาก mPDF ไม่พร้อมใช้งาน');
      } else {
        showSuccess('PDF สร้างด้วย mPDF สำเร็จ');
      }
      dismissToast(loadingId);
    } catch (e) {
      dismissToast(loadingId);
      const msg = e?.data?.message || e?.message || 'ไม่สามารถสร้าง PDF ได้';
      showError(msg);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        รายละเอียดใบเสนอราคา
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2, bgcolor: tokens.bg }}>
        {isLoading ? (
          <Box display="flex" alignItems="center" gap={1} p={2}>
            <CircularProgress size={22} />
            <Typography variant="body2">กำลังโหลดรายละเอียดใบเสนอราคา…</Typography>
          </Box>
        ) : error ? (
          <Box p={2}><Typography color="error">ไม่สามารถโหลดข้อมูลได้</Typography></Box>
        ) : (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Section>
                  <SectionHeader>
                    <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                      <AssignmentIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>ข้อมูลจาก Pricing Request</Typography>
                      <Typography variant="caption" color="text.secondary">ดึงข้อมูลอัตโนมัติจาก PR</Typography>
                    </Box>
                  </SectionHeader>
                  <Box sx={{ p: 2 }}>
                    {/* Customer brief card */}
                    <InfoCard sx={{ p: 2, mb: 1.5 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">{customer?.customer_type === 'individual' ? 'ชื่อผู้ติดต่อ' : 'ชื่อบริษัท'}</Typography>
                          <Typography variant="body1" fontWeight={700}>
                            {customer?.customer_type === 'individual'
                              ? `${customer?.cus_firstname || ''} ${customer?.cus_lastname || ''}`.trim() || customer?.cus_name || '-'
                              : (customer?.cus_company || '-')}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          {customer.cus_tel_1 ? (
                            <Chip size="small" variant="outlined" label={customer.cus_tel_1} sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} />
                          ) : null}
                          <SecondaryButton size="small" startIcon={<EditIcon />} onClick={() => setEditCustomerOpen(true)}>
                            แก้ไขลูกค้า
                          </SecondaryButton>
                        </Box>
                      </Box>
                      {(customer.contact_name || customer.cus_email) && (
                        <Grid container spacing={1}>
                          {customer.contact_name && (
                            <Grid item xs={12} md={4}>
                              <Typography variant="caption" color="text.secondary">ผู้ติดต่อ</Typography>
                              <Typography variant="body2">{customer.contact_name} {customer.contact_nickname ? `(${customer.contact_nickname})` : ''}</Typography>
                            </Grid>
                          )}
                          {customer.cus_email && (
                            <Grid item xs={12} md={4}>
                              <Typography variant="caption" color="text.secondary">อีเมล</Typography>
                              <Typography variant="body2">{customer.cus_email}</Typography>
                            </Grid>
                          )}
                          {customer.cus_tax_id && (
                            <Grid item xs={12} md={4}>
                              <Typography variant="caption" color="text.secondary">เลขประจำตัวผู้เสียภาษี</Typography>
                              <Typography variant="body2">{customer.cus_tax_id}</Typography>
                            </Grid>
                          )}
                          {customer.cus_address && (
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">ที่อยู่</Typography>
                              <Typography variant="body2">{customer.cus_address}</Typography>
                            </Grid>
                          )}
                        </Grid>
                      )}
                    </InfoCard>

                    {/* Main work summary from quotations.work_name */}
                    {(workName || quotationNumber) && (
                      <InfoCard sx={{ p: 2, mb: 1.5 }}>
                        <Grid container spacing={1}>
                          {quotationNumber && (
                            <Grid item xs={12} md={4}>
                              <Typography variant="caption" color="text.secondary">เลขที่ใบเสนอราคา</Typography>
                              <Typography variant="body2" fontWeight={700}>{quotationNumber}</Typography>
                            </Grid>
                          )}
                          {workName && (
                            <Grid item xs={12} md={8}>
                              <Typography variant="caption" color="text.secondary">ใบงานหลัก</Typography>
                              <Typography variant="body1" fontWeight={700}>{workName}</Typography>
                            </Grid>
                          )}
                        </Grid>
                      </InfoCard>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>รายละเอียดงาน ({items.length})</Typography>
                    </Box>

                    {items.length === 0 ? (
                      <InfoCard sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary">ไม่พบข้อมูลงาน</Typography>
                      </InfoCard>
                    ) : (
                      items.map((item, idx) => (
                        <PRGroupSummaryCard key={item.id} group={item} index={idx} />
                      ))
                    )}
                  </Box>
                </Section>
              </Grid>

              <Grid item xs={12}>
                <Section>
                  <SectionHeader>
                    <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                      <CalculateIcon fontSize="small" />
                    </Avatar>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight={700}>การคำนวณราคา</Typography>
                      <SecondaryButton size="small" startIcon={<EditIcon />} onClick={() => {
                        const el = document.getElementById('calc-section');
                        const y = el ? el.scrollTop : null;
                        setIsEditing(v => !v);
                        // restore scroll shortly after DOM updates
                        setTimeout(() => {
                          const el2 = document.getElementById('calc-section');
                          if (el2 != null && y != null) el2.scrollTop = y;
                        }, 0);
                      }}>
                        {isEditing ? 'ยกเลิกแก้ไข' : 'แก้ไข'}
                      </SecondaryButton>
                    </Box>
                  </SectionHeader>
                    <Box sx={{ p: 2 }} id="calc-section">
          { (isEditing ? groups : items).map((item, idx) => (
                      <PRGroupCalcCard
                        key={`calc-${item.id}`}
                        group={item}
                        index={idx}
                        isEditing={isEditing}
                        onAddRow={onAddRow}
                        onChangeRow={onChangeRow}
                        onRemoveRow={onRemoveRow}
                        onDeleteGroup={onDeleteGroup}
            onChangeGroup={onChangeGroup}
                      />
                    ))}

                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={6}>
                        <SpecialDiscountField
                          discountType={specialDiscountType}
                          discountValue={specialDiscountValue}
                          totalAmount={total}
                          discountAmount={discountAmountComputed}
                          onDiscountTypeChange={(t) => { if (!isEditing) return; setSpecialDiscountType(t); }}
                          onDiscountValueChange={(v) => { if (!isEditing) return; setSpecialDiscountValue(v); }}
                          disabled={!isEditing}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <WithholdingTaxField
                          hasWithholdingTax={hasWithholdingTax}
                          taxPercentage={withholdingTaxPercentage}
                          taxAmount={withholdingTaxAmountComputed}
                          subtotalAmount={subtotal}
                          onToggleWithholdingTax={(en) => isEditing && setHasWithholdingTax(en)}
                          onTaxPercentageChange={(p) => isEditing && setWithholdingTaxPercentage(p)}
                          disabled={!isEditing}
                        />
                      </Grid>
                    </Grid>

                    <Calculation
                      subtotal={subtotal}
                      discountAmount={discountAmountComputed}
                      discountedBase={netAfterDiscount}
                      vat={vatRecalc}
                      totalAfterVat={totalAfterDiscountAndVat}
                      withholdingAmount={withholdingTaxAmountComputed}
                      finalTotal={finalNetAmountComputed}
                    />
                  </Box>
                </Section>
              </Grid>

              <Grid item xs={12}>
                <Section>
                  <SectionHeader>
                    <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                      <PaymentIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight={700}>เงื่อนไขการชำระเงิน</Typography>
                  </SectionHeader>
                  <Box sx={{ p: 2 }}>
                    <PaymentTerms
                      isEditing={isEditing}
                      paymentTermsType={paymentTermsType}
                      paymentTermsCustom={paymentTermsCustom}
                      onChangePaymentTermsType={(v) => isEditing && setPaymentTermsType(v)}
                      onChangePaymentTermsCustom={(v) => isEditing && setPaymentTermsCustom(v)}
                      depositMode={depositMode}
                      onChangeDepositMode={(v) => isEditing && setDepositMode(v)}
                      depositPercentage={depositPct}
                      depositAmountInput={depositAmountInput}
                      onChangeDepositPercentage={(v) => isEditing && setDepositPct(sanitizeInt(v))}
                      onChangeDepositAmount={(v) => isEditing && setDepositAmountInput(v)}
                      isCredit={isEditing ? (paymentTermsType === 'credit_30' || paymentTermsType === 'credit_60') : (paymentMethod !== 'cash')}
                      dueDateNode={(isEditing ? (paymentTermsType === 'credit_30' || paymentTermsType === 'credit_60') : (paymentMethod !== 'cash')) ? (
                        <>
                          <Grid item xs={6}><Typography>วันครบกำหนด</Typography></Grid>
                          <Grid item xs={6}>
                            {isEditing && (paymentTermsType === 'credit_30' || paymentTermsType === 'credit_60') ? (
                              <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                  value={selectedDueDate}
                                  onChange={(newVal) => setSelectedDueDate(newVal)}
                                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                              </LocalizationProvider>
                            ) : (
                              <Typography textAlign="right" fontWeight={700}>{formatDateTH(dueDate)}</Typography>
                            )}
                          </Grid>
                        </>
                      ) : null}
                      finalTotal={finalNetAmountComputed}
                      depositAmount={depositAmount}
                      remainingAmount={remainingAmount}
                    />
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="หมายเหตุ"
                        value={isEditing ? (quotationNotes ?? '') : (q?.notes ?? '')}
                        disabled={!isEditing}
                        onChange={(e) => setQuotationNotes(e.target.value)}
                      />
                    </Box>
                  </Box>
                </Section>
              </Grid>
            </Grid>

            {/* Sample Images (always visible) */}
            <Section>
              <SectionHeader>
                <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                  <AddIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>รูปภาพตัวอย่าง</Typography>
                  <Typography variant="caption" color="text.secondary">ไฟล์จะถูกแทรกลงใน PDF ใบเสนอราคา</Typography>
                </Box>
              </SectionHeader>
              <Box sx={{ p:2 }}>
                <ImageUploadGrid
                  title="รูปภาพตัวอย่าง"
                  images={sampleImages}
                  disabled={isUploadingSamples}
                  onUpload={async (files) => {
                    await uploadSampleImages({ id: q.id, files }).unwrap();
                    // RTK invalidates Quotation tag; UI will refresh from server
                  }}
                  helperText="รองรับ JPG/PNG สูงสุด 5MB ต่อไฟล์"
                />
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">เลือกรูปแสดงบน PDF (เลือกได้ 1 รูป)</Typography>
                  <Box sx={{ display:'flex', flexWrap:'wrap', gap: 1, mt: 1 }}>
                    {(sampleImages || []).map((img) => {
                      const value = img.filename || '';
                      const src = img.url || '';
                      const checked = selectedSampleForPdfLocal ? (selectedSampleForPdfLocal === value) : !!img.selected_for_pdf;
                      return (
                        <label key={value || src} style={{ display:'inline-flex', alignItems:'center', gap:8, border: checked ? `2px solid ${tokens.primary}` : '1px solid #ddd', padding:6, borderRadius:6 }}>
                          <input
                            type="radio"
                            name="selectedSampleForPdf"
                            checked={checked}
                            onChange={async () => {
                              try {
                                // Optimistic local update for instant feedback
                                setSelectedSampleForPdfLocal(value);
                                const updated = (sampleImages || []).map(it => ({
                                  ...it,
                                  selected_for_pdf: (it.filename || '') === value,
                                }));
                                await updateQuotation({ id: q.id, sample_images: updated }).unwrap();
                              } catch (err) {
                                // ignore
                              }
                            }}
                            style={{ margin: 0 }}
                          />
                          {src ? (
                            <img src={src} alt="sample" style={{ width: 72, height: 72, objectFit: 'cover', display:'block' }} />
                          ) : null}
                        </label>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Section>

              {q?.status === 'approved' && (
                <Grid item xs={12}>
                  <Section>
                    <SectionHeader>
                      <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                        S
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>หลักฐานการเซ็น / Signed Evidence</Typography>
                        <Typography variant="caption" color="text.secondary">ไฟล์รูปภาพที่ยืนยันการเซ็นใบเสนอราคา</Typography>
                      </Box>
                    </SectionHeader>
                    <Box sx={{ p:2 }}>
                      {signatureImages.length === 0 && (
                        <InfoCard sx={{ p:2, textAlign:'center', mb:2 }}>
                          <Typography variant="body2" color="text.secondary">ยังไม่มีรูปหลักฐานการเซ็น</Typography>
                        </InfoCard>
                      )}
                      {signatureImages.length > 0 && (
                        <Grid container spacing={2} sx={{ mb: 2 }}>
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
                              <Box sx={{ border:'1px solid '+tokens.border, borderRadius:1, p:1, bgcolor:'#fff', cursor:'pointer', position:'relative', '&:hover .hover-actions':{opacity:1} }} onClick={() => setPreviewImage({ url: finalUrl, filename: img.original_filename || img.filename, idx })}>
                                <Box sx={{ position:'relative', pb:'70%', overflow:'hidden', borderRadius:1, mb:1, background:'#fafafa' }}>
                                  <img src={finalUrl} alt={img.filename} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'contain' }} />
                                  {canUploadSignatures && (
                                    <Box className="hover-actions" sx={{ position:'absolute', top:4, right:4, display:'flex', gap:0.5, opacity:0, transition:'opacity 0.2s' }} onClick={(e)=>e.stopPropagation()}>
                                      <SecondaryButton size="small" color="error" disabled={isDeletingSignature} onClick={async ()=>{
                                        if (!window.confirm('ลบรูปนี้หรือไม่?')) return;
                                        try {
                                          const loadingId = showLoading('กำลังลบรูป…');
                                          await deleteSignatureImage({ id: q.id, identifier: img.filename }).unwrap();
                                          dismissToast(loadingId);
                                          showSuccess('ลบรูปสำเร็จ');
                                        } catch (err) {
                                          showError(err?.data?.message || err?.message || 'ลบรูปไม่สำเร็จ');
                                        }
                                      }}>ลบ</SecondaryButton>
                                    </Box>
                                  )}
                                </Box>
                                <Typography variant="caption" sx={{ display:'block', wordBreak:'break-all' }}>{img.original_filename || img.filename}</Typography>
                              </Box>
                            </Grid>
                          );})}
                        </Grid>
                      )}
                      {canUploadSignatures && (
                        <Box>
                          <SecondaryButton component="label" disabled={isUploadingSignatures}>
                            {isUploadingSignatures ? 'กำลังอัปโหลด…' : 'อัปโหลดรูปหลักฐานการเซ็น'}
                            <input type="file" accept="image/*" multiple hidden onChange={handleUploadSignatures} />
                          </SecondaryButton>
                          <Typography variant="caption" color="text.secondary" sx={{ ml:1 }}>รองรับ JPG / PNG สูงสุด 5MB ต่อไฟล์</Typography>
                        </Box>
                      )}
                    </Box>
                  </Section>
                </Grid>
              )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {isEditing ? (
          <>
            <SecondaryButton onClick={handlePreviewPdf} disabled={isGeneratingPdf}>{isGeneratingPdf ? 'กำลังสร้าง…' : 'ดูตัวอย่าง PDF'}</SecondaryButton>
            <SecondaryButton onClick={() => setIsEditing(false)}>ยกเลิก</SecondaryButton>
            <SecondaryButton onClick={handleSave} disabled={isSaving}>{isSaving ? 'กำลังบันทึก…' : 'บันทึก'}</SecondaryButton>
          </>
        ) : (
          <>
            <SecondaryButton onClick={handlePreviewPdf} disabled={isGeneratingPdf}>{isGeneratingPdf ? 'กำลังสร้าง…' : 'ดูตัวอย่าง PDF'}</SecondaryButton>
            <SecondaryButton onClick={onClose}>ปิด</SecondaryButton>
          </>
        )}
      </DialogActions>
      <CustomerEditDialog
        open={editCustomerOpen}
        onClose={() => setEditCustomerOpen(false)}
        customer={customer}
        onUpdated={(c) => {
          setCustomer(c);
          setEditCustomerOpen(false);
        }}
      />
    </Dialog>

    {/* Backend PDF Viewer Dialog */}
    <Dialog open={showPdfViewer} onClose={() => setShowPdfViewer(false)} maxWidth="lg" fullWidth>
      <DialogTitle>ดูตัวอย่าง PDF</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {pdfUrl ? (
          <iframe title="quotation-pdf" src={pdfUrl} style={{ width: '100%', height: '80vh', border: 0 }} />
        ) : (
          <Box display="flex" alignItems="center" gap={1} p={2}>
            <CircularProgress size={22} />
            <Typography variant="body2">กำลังโหลดตัวอย่าง PDF…</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {pdfUrl && (
          <SecondaryButton onClick={() => window.open(pdfUrl, '_blank')}>เปิดในแท็บใหม่</SecondaryButton>
        )}
        <SecondaryButton onClick={() => setShowPdfViewer(false)}>ปิด</SecondaryButton>
      </DialogActions>
    </Dialog>

    {/* Sample Images Section inside details (above footer actions) */}

    {/* Signature Image Preview Dialog */}
    <Dialog open={!!previewImage} onClose={()=>setPreviewImage(null)} maxWidth="md" fullWidth>
      <DialogTitle>{previewImage?.filename || 'ภาพตัวอย่าง'}</DialogTitle>
      <DialogContent dividers sx={{ bgcolor:'#000' }}>
        {previewImage && (
          <Box sx={{ position:'relative', width:'100%', textAlign:'center' }}>
            <img src={previewImage.url} alt={previewImage.filename} style={{ maxWidth:'100%', maxHeight:'75vh', objectFit:'contain' }} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {canUploadSignatures && previewImage && (
          <SecondaryButton color="error" disabled={isDeletingSignature} onClick={async ()=>{
            if (!window.confirm('ยืนยันลบรูปนี้หรือไม่?')) return;
            try {
              const loadingId = showLoading('กำลังลบรูป…');
              await deleteSignatureImage({ id: q.id, identifier: (previewImage.filename || '') }).unwrap();
              dismissToast(loadingId);
              showSuccess('ลบรูปสำเร็จ');
              setPreviewImage(null);
            } catch (err) {
              showError(err?.data?.message || err?.message || 'ลบรูปไม่สำเร็จ');
            }
          }}>ลบรูปนี้</SecondaryButton>
        )}
        <SecondaryButton onClick={()=>setPreviewImage(null)}>ปิด</SecondaryButton>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default QuotationDetailDialog;
