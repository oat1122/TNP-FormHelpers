import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  TextField,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';

// THEME & SHARED UI
import {
  Section,
  SectionHeader,
  PrimaryButton,
  SecondaryButton,
  InfoCard,
  tokens,
} from '../styles/quotationTheme';

import CustomerEditCard from '../../CustomerEditCard';
import QuotationPreview from '../../QuotationPreview';
import PricingRequestNotesButton from '../../PricingRequestNotesButton';

// UTILS
import useQuotationCalc from '../hooks/useQuotationCalc';
import { formatTHB } from '../utils/currency';
import { formatDateTH } from '../utils/date';
import { sanitizeInt, sanitizeDecimal } from '../../../../shared/inputSanitizers';

/**
 * CreateQuotationForm — restyled to match QuotationDetailDialog
 * - ใช้โครงแบบ Section, SectionHeader, InfoCard เดียวกัน
 * - ส่วนคำนวณราคา (Calculation) เพิ่มปุ่ม "แก้ไข/ยกเลิกแก้ไข" และกล่องแยกไซซ์เหมือน Dialog
 * - เงื่อนไขการชำระเงินปรับเป็น select + ตัวเลือก "อื่นๆ (กำหนดเอง)" แบบเดียวกับ Dialog
 * - เติมช่องโน้ตรายบรรทัดในตารางไซซ์ และแสดง PR qty เปรียบเทียบด้วย Chip
 */

const PRNameResolver = ({ prId, currentName, onResolved }) => null; // keep placeholder if used elsewhere

const CreateQuotationForm = ({ selectedPricingRequests = [], onBack, onSave, onSubmit, readOnly = false }) => {
  // ======== STATE ========
  const [formData, setFormData] = useState({
    customer: {},
    pricingRequests: selectedPricingRequests,
    items: [],
    notes: '',
    // terms (UI-facing)
    paymentTermsType: 'credit_30', // 'cash' | 'credit_30' | 'credit_60' | 'other'
    paymentTermsCustom: '',
    depositPct: 50,
    dueDate: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [isCalcEditing, setIsCalcEditing] = useState(!readOnly);

  // ======== INIT FROM PR ========
  useEffect(() => {
    if (!selectedPricingRequests?.length) return;
    const customer = selectedPricingRequests[0]?.customer || {};
    const items = selectedPricingRequests.map((pr, idx) => ({
      id: pr.pr_id || pr.id || `temp_${idx}`,
      pricingRequestId: pr.pr_id,
      name: pr.pr_work_name || pr.work_name || 'ไม่ระบุชื่องาน',
      pattern: pr.pr_pattern || pr.pattern || '',
      fabricType: pr.pr_fabric_type || pr.fabric_type || pr.material || '',
      color: pr.pr_color || pr.color || '',
      size: pr.pr_sizes || pr.sizes || pr.size || '',
      unit: 'ชิ้น',
      quantity: parseInt(pr.pr_quantity || pr.quantity || 1, 10),
      unitPrice: pr.pr_unit_price ? Number(pr.pr_unit_price) : 0,
      notes: pr.pr_notes || pr.notes || '',
      originalData: pr,
      sizeRows: [
        {
          uuid: `${pr.pr_id || pr.id || idx}-size-1`,
          size: pr.pr_sizes || 'S-XL',
          quantity: parseInt(pr.pr_quantity || 1, 10),
          unitPrice: pr.pr_unit_price ? Number(pr.pr_unit_price) : 0,
          notes: '',
        },
      ],
    }));
    const dd = new Date();
    dd.setDate(dd.getDate() + 30);
    setFormData((prev) => ({
      ...prev,
      customer,
      items,
      dueDate: dd,
      paymentTermsType: 'credit_30',
      depositPct: 50,
    }));
  }, [selectedPricingRequests]);

  // ======== CALC ========
  const { subtotal, vat, total, depositAmount, remainingAmount, warnings } = useQuotationCalc(
    formData.items,
    String(formData.depositPct),
    formData.paymentTermsType === 'other' ? '' : ''
  );

  // ======== HELPERS ========
  const prQtyOf = useCallback((it) => {
    const q = Number(it?.originalData?.pr_quantity ?? it?.originalData?.quantity ?? 0);
    return isNaN(q) ? 0 : q;
  }, []);

  const setItem = (itemId, patch) =>
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              ...patch,
              // recompute total from sizeRows if provided
              total: Array.isArray(patch.sizeRows ?? i.sizeRows)
                ? (patch.sizeRows ?? i.sizeRows).reduce((s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0), 0)
                : (((patch.unitPrice ?? i.unitPrice) || 0) * ((patch.quantity ?? i.quantity) || 0)),
            }
          : i
      ),
    }));

  const addSizeRow = (itemId) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) => {
        if (i.id !== itemId) return i;
        const newRow = { uuid: `${itemId}-size-${(i.sizeRows?.length || 0) + 1}`, size: '', quantity: '', unitPrice: String(i.unitPrice || ''), notes: '' };
        const sizeRows = [...(i.sizeRows || []), newRow];
        const total = sizeRows.reduce((s, r) => {
          const q = typeof r.quantity === 'string' ? parseFloat(r.quantity || '0') : Number(r.quantity || 0);
          const p = typeof r.unitPrice === 'string' ? parseFloat(r.unitPrice || '0') : Number(r.unitPrice || 0);
          return s + (isNaN(q) || isNaN(p) ? 0 : q * p);
        }, 0);
        const quantity = sizeRows.reduce((s, r) => {
          const q = typeof r.quantity === 'string' ? parseFloat(r.quantity || '0') : Number(r.quantity || 0);
          return s + (isNaN(q) ? 0 : q);
        }, 0);
        return { ...i, sizeRows, total, quantity };
      }),
    }));
  };

  const updateSizeRow = (itemId, rowUuid, patch) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) => {
        if (i.id !== itemId) return i;
        const sizeRows = (i.sizeRows || []).map((r) => (r.uuid === rowUuid ? { ...r, ...patch } : r));
        const total = sizeRows.reduce((s, r) => {
          const q = typeof r.quantity === 'string' ? parseFloat(r.quantity || '0') : Number(r.quantity || 0);
          const p = typeof r.unitPrice === 'string' ? parseFloat(r.unitPrice || '0') : Number(r.unitPrice || 0);
          return s + (isNaN(q) || isNaN(p) ? 0 : q * p);
        }, 0);
        const quantity = sizeRows.reduce((s, r) => {
          const q = typeof r.quantity === 'string' ? parseFloat(r.quantity || '0') : Number(r.quantity || 0);
          return s + (isNaN(q) ? 0 : q);
        }, 0);
        return { ...i, sizeRows, total, quantity };
      }),
    }));
  };

  const removeSizeRow = (itemId, rowUuid) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) => {
        if (i.id !== itemId) return i;
        const sizeRows = (i.sizeRows || []).filter((r) => r.uuid !== rowUuid);
        const total = sizeRows.reduce((s, r) => {
          const q = typeof r.quantity === 'string' ? parseFloat(r.quantity || '0') : Number(r.quantity || 0);
          const p = typeof r.unitPrice === 'string' ? parseFloat(r.unitPrice || '0') : Number(r.unitPrice || 0);
          return s + (isNaN(q) || isNaN(p) ? 0 : q * p);
        }, 0);
        const quantity = sizeRows.reduce((s, r) => {
          const q = typeof r.quantity === 'string' ? parseFloat(r.quantity || '0') : Number(r.quantity || 0);
          return s + (isNaN(q) ? 0 : q);
        }, 0);
        return { ...i, sizeRows, total, quantity };
      }),
    }));
  };

  // compute view-model for calc section depending on edit toggle (here form always editable, but we mimic dialog UX)
  const activeItems = useMemo(() => formData.items, [formData.items]);

  const handleSubmit = async (action) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        subtotal,
        vat,
        total,
        depositAmount,
        remainingAmount,
        // normalize terms for caller
        paymentMethod: formData.paymentTermsType === 'other' ? formData.paymentTermsCustom : formData.paymentTermsType,
        depositPercentage: String(formData.depositPct ?? 0),
        action,
      };
      if (action === 'draft') await onSave?.(payload);
      else await onSubmit?.(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCredit = formData.paymentTermsType === 'credit_30' || formData.paymentTermsType === 'credit_60';

  return (
    <Box sx={{ bgcolor: tokens.bg, minHeight: '100vh', py: 3 }}>
      <Container maxWidth="lg">
        {/* Resolve missing work_name if needed (same as original) */}
        {activeItems.map((it) => (
          <PRNameResolver
            key={`resolver-${it.id}`}
            prId={it.pricingRequestId || it.pr_id}
            currentName={it.name}
            onResolved={(name) => {
              if (!name) return;
              setFormData((prev) => ({
                ...prev,
                items: prev.items.map((x) => (x.id === it.id ? { ...x, name } : x)),
              }));
            }}
          />
        ))}

        {/* HEADER */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="ย้อนกลับ">
              <IconButton onClick={onBack} size="small" sx={{ color: tokens.primary, border: `1px solid ${tokens.primary}` }}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box>
              <Typography variant="h5" fontWeight={700} color={tokens.primary}>สร้างใบเสนอราคา</Typography>
              <Typography variant="body2" color="text.secondary">จาก {activeItems.length} งาน • {formData.customer?.cus_company || 'กำลังโหลด…'}</Typography>
            </Box>
          </Box>
          <Tooltip title={isCalcEditing ? 'กำลังแก้ไข' : 'โหมดดู'}>
            <IconButton aria-label="toggle-edit" size="small" onClick={() => setIsCalcEditing((v) => !v)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          {/* SECTION: PR INFO + CUSTOMER */}
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
                <CustomerEditCard
                  customer={formData.customer}
                  onUpdate={(c) => setFormData((prev) => ({ ...prev, customer: c }))}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <SecondaryButton size="small" startIcon={<EditIcon />} onClick={() => setEditCustomerOpen(true)}>
                    แก้ไขลูกค้า
                  </SecondaryButton>
                </Box>

                {/* งานสรุป */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>รายละเอียดงาน ({activeItems.length})</Typography>
                </Box>

                {activeItems.length === 0 ? (
                  <InfoCard sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary">ไม่พบข้อมูลงาน</Typography>
                  </InfoCard>
                ) : (
                  activeItems.map((item, idx) => {
                    const rows = Array.isArray(item.sizeRows) ? item.sizeRows : [];
                    const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
                    const prQty = prQtyOf(item);
                    const hasPrQty = prQty > 0;
                    const qtyMatches = hasPrQty ? totalQty === prQty : true;
                    return (
                      <InfoCard key={item.id} sx={{ p: 2, mb: 1.5 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>งานที่ {idx + 1}: {item.name}</Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip label={`${totalQty} ${item.unit || 'ชิ้น'}`} size="small" variant="outlined" sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} />
                            {hasPrQty && (
                              <Chip label={`PR: ${prQty} ${item.unit || 'ชิ้น'}`} size="small" color={qtyMatches ? 'success' : 'error'} variant={qtyMatches ? 'outlined' : 'filled'} />
                            )}
                          </Box>
                        </Box>

                        <Grid container spacing={1}>
                          {item.pattern && (
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" color="text.secondary">แพทเทิร์น</Typography>
                              <Typography variant="body2" fontWeight={500}>{item.pattern}</Typography>
                            </Grid>
                          )}
                          {item.fabricType && (
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" color="text.secondary">ประเภทผ้า</Typography>
                              <Typography variant="body2" fontWeight={500}>{item.fabricType}</Typography>
                            </Grid>
                          )}
                          {item.color && (
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" color="text.secondary">สี</Typography>
                              <Typography variant="body2" fontWeight={500}>{item.color}</Typography>
                            </Grid>
                          )}
                          {item.size && (
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" color="text.secondary">ขนาด</Typography>
                              <Typography variant="body2" fontWeight={500}>{item.size}</Typography>
                            </Grid>
                          )}
                        </Grid>

                        {item.notes && (
                          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: tokens.bg, borderRadius: 1, borderLeft: `3px solid ${tokens.primary}` }}>
                            <Typography variant="caption" color={tokens.primary} fontWeight={700}>หมายเหตุจาก PR</Typography>
                            <Typography variant="body2" color="text.secondary">{item.notes}</Typography>
                          </Box>
                        )}
                      </InfoCard>
                    );
                  })
                )}
              </Box>
            </Section>
          </Grid>

          {/* SECTION: CALCULATION */}
          <Grid item xs={12}>
            <Section>
              <SectionHeader>
                <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                  <CalculateIcon fontSize="small" />
                </Avatar>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight={700}>การคำนวณราคา</Typography>
                  <SecondaryButton size="small" startIcon={<EditIcon />} onClick={() => setIsCalcEditing((v) => !v)}>
                    {isCalcEditing ? 'ยกเลิกแก้ไข' : 'แก้ไข'}
                  </SecondaryButton>
                </Box>
              </SectionHeader>

              <Box sx={{ p: 2 }} id="calc-section">
                {activeItems.map((item, idx) => {
                  const rows = Array.isArray(item.sizeRows) ? item.sizeRows : [];
                  const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
                  const itemTotal = rows.reduce((s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0), 0);

                  return (
                    <InfoCard key={`calc-${item.id}`} sx={{ p: 2, mb: 1.5 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>งานที่ {idx + 1}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.name}</Typography>
                          <PricingRequestNotesButton pricingRequestId={item.pricingRequestId || item.pr_id} workName={item.name} variant="icon" size="small" />
                        </Box>
                        <Chip label={`${totalQty} ${item.unit || 'ชิ้น'}`} size="small" variant="outlined" sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} />
                      </Box>

                      <Grid container spacing={1.5}>
                        <Grid item xs={12} md={3}>
                          <TextField fullWidth size="small" label="แพทเทิร์น" value={item.pattern} disabled={!isCalcEditing} onChange={(e) => setItem(item.id, { pattern: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField fullWidth size="small" label="ประเภทผ้า" value={item.fabricType} disabled={!isCalcEditing} onChange={(e) => setItem(item.id, { fabricType: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField fullWidth size="small" label="สี" value={item.color} disabled={!isCalcEditing} onChange={(e) => setItem(item.id, { color: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField fullWidth size="small" label="ขนาด (สรุป)" value={item.size} disabled={!isCalcEditing} onChange={(e) => setItem(item.id, { size: e.target.value })} />
                        </Grid>

                        {/* Size rows editor */}
                        <Grid item xs={12}>
                          <Box sx={{ p: 1.5, border: `1px dashed ${tokens.border}`, borderRadius: 1, bgcolor: tokens.bg }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                              <Typography variant="subtitle2" fontWeight={700}>แยกตามขนาด</Typography>
                              {isCalcEditing && (
                                <SecondaryButton size="small" startIcon={<AddIcon />} onClick={() => addSizeRow(item.id)}>
                                  เพิ่มแถว
                                </SecondaryButton>
                              )}
                            </Box>

                            {/* header */}
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
                                      <TextField fullWidth size="small" label="ขนาด" value={row.size || ''} disabled={!isCalcEditing} onChange={(e) => updateSizeRow(item.id, row.uuid, { size: e.target.value })} />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="จำนวน"
                                        type="text"
                                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                        value={String(row.quantity ?? '')}
                                        disabled={!isCalcEditing}
                                        onChange={(e) => updateSizeRow(item.id, row.uuid, { quantity: sanitizeInt(e.target.value) })}
                                      />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="ราคาต่อหน่วย"
                                        type="text"
                                        inputProps={{ inputMode: 'decimal' }}
                                        value={String(row.unitPrice ?? '')}
                                        disabled={!isCalcEditing}
                                        onChange={(e) => updateSizeRow(item.id, row.uuid, { unitPrice: sanitizeDecimal(e.target.value) })}
                                      />
                                    </Grid>
                                    <Grid item xs={10} md={2}>
                                      <Box sx={{ p: 1, bgcolor: '#fff', border: `1px solid ${tokens.border}`, borderRadius: 1, textAlign: 'center' }}>
                                        <Typography variant="subtitle2" fontWeight={800}>{(() => {
                                          const q = typeof row.quantity === 'string' ? parseFloat(row.quantity || '0') : Number(row.quantity || 0);
                                          const p = typeof row.unitPrice === 'string' ? parseFloat(row.unitPrice || '0') : Number(row.unitPrice || 0);
                                          const sum = isNaN(q) || isNaN(p) ? 0 : q * p;
                                          return formatTHB(sum);
                                        })()}</Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={2} md={1}>
                                      {isCalcEditing && (
                                        <SecondaryButton size="small" color="error" onClick={() => removeSizeRow(item.id, row.uuid)}>
                                          <DeleteOutlineIcon fontSize="small" />
                                        </SecondaryButton>
                                      )}
                                    </Grid>

                                    {/* line note */}
                                    <Grid item xs={12}>
                                      <TextField fullWidth size="small" label="หมายเหตุ (บรรทัดนี้)" multiline minRows={1} value={row.notes || ''} disabled={!isCalcEditing} onChange={(e) => updateSizeRow(item.id, row.uuid, { notes: e.target.value })} />
                                    </Grid>
                                  </React.Fragment>
                                ))}

                                {!!warnings?.[item.id] && (
                                  <Grid item xs={12}>
                                    <Typography variant="caption" sx={{ color: warnings[item.id].type === 'error' ? 'error.main' : 'warning.main' }}>
                                      {warnings[item.id].message}
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
                    </InfoCard>
                  );
                })}

                <Divider sx={{ my: 2 }} />

                <InfoCard sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color={tokens.primary} gutterBottom>สรุปยอดเงิน</Typography>
                  <Grid container>
                    <Grid item xs={6}><Typography>ยอดก่อนภาษี</Typography></Grid>
                    <Grid item xs={6}><Typography textAlign="right" fontWeight={700}>{formatTHB(subtotal)}</Typography></Grid>
                    <Grid item xs={6}><Typography>VAT 7%</Typography></Grid>
                    <Grid item xs={6}><Typography textAlign="right" fontWeight={700}>{formatTHB(vat)}</Typography></Grid>
                    <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                    <Grid item xs={6}><Typography variant="subtitle1" fontWeight={800}>ยอดรวมทั้งสิ้น</Typography></Grid>
                    <Grid item xs={6}><Typography variant="subtitle1" fontWeight={800} textAlign="right">{formatTHB(total)}</Typography></Grid>
                  </Grid>
                </InfoCard>
              </Box>
            </Section>
          </Grid>

          {/* SECTION: PAYMENT TERMS */}
          <Grid item xs={12}>
            <Section>
              <SectionHeader>
                <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
                  <PaymentIcon fontSize="small" />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>เงื่อนไขการชำระเงิน</Typography>
              </SectionHeader>

              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <InfoCard sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">การชำระเงิน</Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        SelectProps={{ native: true }}
                        value={formData.paymentTermsType}
                        onChange={(e) => setFormData((p) => ({ ...p, paymentTermsType: e.target.value }))}
                        sx={{ mb: formData.paymentTermsType === 'other' ? 1 : 0 }}
                      >
                        <option value="cash">เงินสด</option>
                        <option value="credit_30">เครดิต 30 วัน</option>
                        <option value="credit_60">เครดิต 60 วัน</option>
                        <option value="other">อื่นๆ (กำหนดเอง)</option>
                      </TextField>
                      {formData.paymentTermsType === 'other' && (
                        <TextField fullWidth size="small" placeholder="พิมพ์วิธีการชำระเงิน" value={formData.paymentTermsCustom} onChange={(e) => setFormData((p) => ({ ...p, paymentTermsCustom: e.target.value }))} />
                      )}
                    </InfoCard>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <InfoCard sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">เงินมัดจำ</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="text"
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        value={String(formData.depositPct ?? '')}
                        onChange={(e) => setFormData((p) => ({ ...p, depositPct: sanitizeInt(e.target.value) }))}
                        helperText="เป็นเปอร์เซ็นต์ (0-100)"
                      />
                    </InfoCard>
                  </Grid>

                  <Grid item xs={12}>
                    <InfoCard sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight={700} color={tokens.primary} gutterBottom>สรุปการชำระเงิน</Typography>
                      <Grid container>
                        <Grid item xs={6}><Typography>จำนวนมัดจำ</Typography></Grid>
                        <Grid item xs={6}><Typography textAlign="right" fontWeight={700}>{formatTHB(depositAmount)}</Typography></Grid>
                        <Grid item xs={6}><Typography>ยอดคงเหลือ</Typography></Grid>
                        <Grid item xs={6}><Typography textAlign="right" fontWeight={700}>{formatTHB(remainingAmount)}</Typography></Grid>
                        {isCredit && (
                          <>
                            <Grid item xs={6}><Typography>วันครบกำหนด</Typography></Grid>
                            <Grid item xs={6}><Typography textAlign="right" fontWeight={700}>{formatDateTH(formData.dueDate)}</Typography></Grid>
                          </>
                        )}
                      </Grid>
                    </InfoCard>
                  </Grid>

                  {isCredit && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="วันครบกำหนด (พิมพ์ได้)"
                        value={formatDateTH(formData.dueDate) || ''}
                        onChange={() => {}}
                        helperText="ระบบจะบันทึกค่า date เดิมของแบบฟอร์ม"
                        disabled
                      />
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={3} label="หมายเหตุ" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} placeholder="เช่น ราคานี้รวมค่าจัดส่งและติดตั้งแล้ว…" />
                  </Grid>
                </Grid>
              </Box>
            </Section>
          </Grid>
        </Grid>

        {/* FOOTER ACTIONS */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <SecondaryButton onClick={onBack} startIcon={<ArrowBackIcon />}>ยกเลิก</SecondaryButton>
          <Box display="flex" gap={1}>
            <SecondaryButton startIcon={<VisibilityIcon />} onClick={() => setShowPreview(true)} disabled={total === 0}>
              ดูตัวอย่าง
            </SecondaryButton>
            <PrimaryButton onClick={() => handleSubmit('review')} disabled={isSubmitting || total === 0}>
              {isSubmitting ? 'กำลังส่ง…' : 'ส่งตรวจสอบ'}
            </PrimaryButton>
          </Box>
        </Box>

        {/* PREVIEW DIALOG */}
        {showPreview && (
          <QuotationPreview
            formData={{ ...formData, subtotal, vat, total, depositAmount, remainingAmount }}
            quotationNumber="QT-2025-XXX"
            showActions
          />
        )}
      </Container>
    </Box>
  );
};

export default CreateQuotationForm;
