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
import { useGetQuotationQuery, useGetPricingRequestAutofillQuery, useUpdateQuotationMutation } from '../../../../features/Accounting/accountingApi';
import { Section, SectionHeader, SecondaryButton, InfoCard, tokens } from '../../PricingIntegration/components/quotation/styles/quotationTheme';
import { formatTHB } from '../utils/format';
import { formatDateTH } from '../../PricingIntegration/components/quotation/utils/date';
import CustomerEditDialog from '../../PricingIntegration/components/CustomerEditDialog';

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
const PRGroupCalcCard = React.memo(function PRGroupCalcCard({ group, index, isEditing, onAddRow, onChangeRow, onRemoveRow, onDeleteGroup }) {
  const { data: prData } = useGetPricingRequestAutofillQuery(group.prId, { skip: !group.prId });
  const pr = prData?.data || prData || {};
  const name = group.name && group.name !== '-' ? group.name : (pr.pr_work_name || pr.work_name || '-');
  const pattern = group.pattern || pr.pr_pattern || '';
  const fabric = group.fabricType || pr.pr_fabric_type || '';
  const color = group.color || pr.pr_color || '';
  const size = group.size || pr.pr_sizes || '';
  const rows = Array.isArray(group.sizeRows) ? group.sizeRows : [];
  const unit = group.unit || 'ชิ้น';
  const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const itemTotal = rows.reduce((s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0), 0);

  return (
    <Box component={InfoCard} sx={{ p: 2, mb: 1.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>งานที่ {index + 1}</Typography>
          <Typography variant="body2" color="text.secondary">{name}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip label={`${totalQty} ${unit}`} size="small" variant="outlined" sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} />
          {isEditing && (
            <SecondaryButton size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => onDeleteGroup(group.id)}>
              ลบงานนี้
            </SecondaryButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={3}>
          <TextField fullWidth size="small" label="แพทเทิร์น" value={pattern} disabled />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField fullWidth size="small" label="ประเภทผ้า" value={fabric} disabled />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField fullWidth size="small" label="สี" value={color} disabled />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField fullWidth size="small" label="ขนาด (สรุป)" value={size} disabled />
        </Grid>

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
                  </React.Fragment>
                ))}
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


// Normalize API response
const pickQuotation = (resp) => (resp && resp.data) || resp || {};

const normalizeCustomer = (q) => {
  const c = q.customer || {};
  return {
    cus_company: c.cus_company || q.customer_name || '-',
    cus_tax_id: c.cus_tax_id || q.customer_tax_id || '-',
    cus_address: c.cus_address || q.customer_address || '-',
    cus_phone: c.cus_phone || q.customer_phone || '-',
    cus_email: c.cus_email || q.customer_email || '-',
    contact_name: c.contact_name || q.contact_name || c.cus_contact_name || '',
    contact_nickname: c.contact_nickname || q.contact_nickname || '',
    contact_position: c.contact_position || q.contact_position || '',
    contact_phone_alt: c.contact_phone_alt || q.contact_phone_alt || '',
  };
};

// Build normalized quotation_items then group them by pricing_request_id
const normalizeAndGroupItems = (q, prIdsAll = []) => {
  const items = Array.isArray(q.items) ? q.items : [];
  const sorted = [...items].sort((a, b) => (Number(a?.sequence_order ?? 0) - Number(b?.sequence_order ?? 0)));

  // Step 1: normalize raw items
  const normalized = sorted.map((it, idx) => {
    const nameRaw = it.item_name || it.work_name || it.name || it.item_description || it.description || '';
    const name = nameRaw || '-';
    const unit = it.unit || it.unit_name || 'ชิ้น';
    const unitPrice = Number(it.unit_price || 0);
    const baseRow = { uuid: `${it.id || idx}-row-1`, size: it.size || '', quantity: Number(it.quantity || 0), unitPrice };
    const sizeRows = Array.isArray(it.size_rows) && it.size_rows.length
      ? it.size_rows.map((r, rIdx) => ({
          uuid: r.uuid || `${it.id || idx}-row-${rIdx + 1}`,
          size: r.size || '',
          quantity: Number(r.quantity || 0),
          unitPrice: Number(r.unit_price || unitPrice || 0),
        }))
      : [baseRow];
    return {
      id: it.id || `qitem_${idx}`,
      prId: it.pricing_request_id || null,
      name,
      pattern: it.pattern || '',
      fabricType: it.fabric_type || it.material || '',
      color: it.color || '',
      size: it.size || '',
      unit,
      unitPrice,
      sizeRows,
      sequence: Number(it?.sequence_order ?? idx + 1),
    };
  });

  // Step 2: group by PR
  const groupMap = new Map();
  for (const it of normalized) {
    const key = it.prId || `misc-${it.sequence}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        id: key,
        prId: it.prId || null,
        nameCandidates: [],
        patterns: new Set(),
        fabrics: new Set(),
        colors: new Set(),
        sizes: new Set(),
        unitCandidates: new Set(),
        sizeRows: [],
        sequenceMin: it.sequence,
      });
    }
    const g = groupMap.get(key);
    g.sequenceMin = Math.min(g.sequenceMin, it.sequence);
    // Try to keep base name without trailing size info like " - S-XL"
    const baseName = (it.name || '').split(' - ')[0] || it.name;
    if (baseName) g.nameCandidates.push(baseName);
    if (it.pattern) g.patterns.add(it.pattern);
    if (it.fabricType) g.fabrics.add(it.fabricType);
    if (it.color) g.colors.add(it.color);
    if (it.size) g.sizes.add(it.size);
    if (it.unit) g.unitCandidates.add(it.unit);
    if (Array.isArray(it.sizeRows)) g.sizeRows.push(...it.sizeRows);
  }

  // Ensure all PR IDs in quotation are represented (even if no items)
  for (let i = 0; i < prIdsAll.length; i++) {
    const pid = prIdsAll[i];
    if (!groupMap.has(pid)) {
      groupMap.set(pid, {
        id: pid,
        prId: pid,
        nameCandidates: [],
        patterns: new Set(),
        fabrics: new Set(),
        colors: new Set(),
        sizes: new Set(),
        unitCandidates: new Set(['ชิ้น']),
        sizeRows: [],
        sequenceMin: Number.MAX_SAFE_INTEGER - (prIdsAll.length - i),
      });
    }
  }

  // Step 3: finalize groups to UI model
  const groups = Array.from(groupMap.values())
    .sort((a, b) => a.sequenceMin - b.sequenceMin)
    .map((g, idx) => {
      const name = g.nameCandidates.find(Boolean) || '-';
      const unit = g.unitCandidates.size === 1 ? Array.from(g.unitCandidates)[0] : 'ชิ้น';
      const sizeSummarySet = new Set([
        ...Array.from(g.sizes),
        ...g.sizeRows.map(r => r.size).filter(Boolean),
      ]);
      const sizeSummary = Array.from(sizeSummarySet).join(', ');
      return {
        id: g.id || `group_${idx}`,
        prId: g.prId,
        name,
        pattern: Array.from(g.patterns).join(', '),
        fabricType: Array.from(g.fabrics).join(', '),
        color: Array.from(g.colors).join(', '),
        size: sizeSummary,
        unit,
        sizeRows: g.sizeRows,
      };
    });

  return groups;
};

// Collect all PR ids referenced by a quotation (primary + array + from items)
const getAllPrIdsFromQuotation = (q) => {
  const set = new Set();
  const primary = q.primary_pricing_request_id || q.primary_pricing_request || null;
  if (primary) set.add(primary);
  let arr = [];
  if (Array.isArray(q.primary_pricing_request_ids)) arr = q.primary_pricing_request_ids;
  else if (typeof q.primary_pricing_request_ids === 'string' && q.primary_pricing_request_ids.trim()) {
    try { arr = JSON.parse(q.primary_pricing_request_ids); } catch (e) { /* ignore */ }
  }
  arr.forEach((id) => id && set.add(id));
  const items = Array.isArray(q.items) ? q.items : [];
  items.forEach((it) => { if (it?.pricing_request_id) set.add(it.pricing_request_id); });
  return Array.from(set);
};

const computeTotals = (items, depositPercentage) => {
  const subtotal = items.reduce((s, it) => {
    const itemTotal = (it.sizeRows || []).reduce((ss, r) => {
      const q = typeof r.quantity === 'string' ? parseFloat(r.quantity || '0') : Number(r.quantity || 0);
      const p = typeof r.unitPrice === 'string' ? parseFloat(r.unitPrice || '0') : Number(r.unitPrice || 0);
      return ss + (isNaN(q) || isNaN(p) ? 0 : q * p);
    }, 0);
    return s + itemTotal;
  }, 0);
  const vat = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + vat).toFixed(2);
  const depPct = Math.max(0, Math.min(100, Number(depositPercentage || 0)));
  const depositAmount = +(total * (depPct / 100)).toFixed(2);
  const remainingAmount = +(total - depositAmount).toFixed(2);
  return { subtotal, vat, total, depositAmount, remainingAmount };
};

// Sanitizers to keep typing smooth and prevent re-mounts on invalid values
const sanitizeInt = (val) => {
  if (val == null) return '';
  let s = String(val);
  // keep only digits
  s = s.replace(/\D+/g, '');
  return s;
};

const sanitizeDecimal = (val) => {
  if (val == null) return '';
  let s = String(val).replace(/,/g, '.');
  // allow only digits and one dot
  s = s.replace(/[^0-9.]/g, '');
  const parts = s.split('.');
  if (parts.length <= 1) return parts[0];
  return `${parts[0]}.${parts.slice(1).join('').replace(/\./g, '')}`;
};

const QuotationDetailDialog = ({ open, onClose, quotationId }) => {
  const { data, isLoading, error } = useGetQuotationQuery(quotationId, { skip: !open || !quotationId });
  const q = pickQuotation(data);
  const [updateQuotation, { isLoading: isSaving }] = useUpdateQuotationMutation();
  const [editCustomerOpen, setEditCustomerOpen] = React.useState(false);
  const [customer, setCustomer] = React.useState(() => normalizeCustomer(q));
  const [isEditing, setIsEditing] = React.useState(false);
  const [groups, setGroups] = React.useState([]);
  React.useEffect(() => {
    setCustomer(normalizeCustomer(q));
  }, [q?.id, q?.customer_name, q?.customer]);
  const prIdsAll = getAllPrIdsFromQuotation(q);
  const items = normalizeAndGroupItems(q, prIdsAll);
  React.useEffect(() => {
    // Initialize editable groups on open or when quotation changes
    const editable = items.map(g => ({ ...g, sizeRows: (g.sizeRows || []).map(r => ({ ...r })) }));
    setGroups(editable);
    setIsEditing(false);
  }, [open, q?.id]);

  const onAddRow = React.useCallback((groupId) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const newRow = { uuid: `${groupId}-${Date.now()}`, size: '', quantity: '', unitPrice: '' };
      return { ...g, sizeRows: [...(g.sizeRows || []), newRow] };
    }));
  }, []);
  const onChangeRow = React.useCallback((groupId, rowUuid, field, value) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const rows = (g.sizeRows || []).map(r => {
        if (r.uuid !== rowUuid) return r;
        if (field === 'size') return { ...r, size: value };
        // Keep numeric fields as strings during editing to avoid caret/focus issues
        if (field === 'quantity') return { ...r, quantity: sanitizeInt(value) };
        if (field === 'unitPrice') return { ...r, unitPrice: sanitizeDecimal(value) };
        return { ...r, [field]: value };
      });
      return { ...g, sizeRows: rows };
    }));
  }, []);
  const onRemoveRow = React.useCallback((groupId, rowUuid) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const rows = (g.sizeRows || []).filter(r => r.uuid !== rowUuid);
      return { ...g, sizeRows: rows };
    }));
  }, []);
  const onDeleteGroup = React.useCallback((groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
  }, []);
  const activeGroups = isEditing ? groups : items;

  // components are hoisted above
  const workName = q.work_name || q.workname || q.title || '';
  const quotationNumber = q.number || '';
  // Prefer quotations.payment_terms when available
  const paymentMethod = q.payment_terms || q.payment_method || (q.credit_days === 30 ? 'credit_30' : q.credit_days === 60 ? 'credit_60' : 'cash');
  const depositPercentage = q.deposit_percentage ?? (paymentMethod === 'cash' ? 0 : 50);
  const dueDate = q.due_date ? new Date(q.due_date) : null;
  const computed = computeTotals(activeGroups, depositPercentage);
  const subtotal = q.subtotal != null ? Number(q.subtotal) : computed.subtotal;
  const vat = q.tax_amount != null ? Number(q.tax_amount) : computed.vat;
  const total = q.total_amount != null ? Number(q.total_amount) : computed.total;
  const depositAmount = q.deposit_amount != null ? Number(q.deposit_amount) : computed.depositAmount;
  const remainingAmount = +(total - depositAmount).toFixed(2);

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
          sequence_order: idx + 1,
        };
      });
    });

    const totals = computeTotals(groups, depositPercentage);
    try {
      await updateQuotation({
        id: q.id,
        items: flatItems,
        subtotal: totals.subtotal,
        tax_amount: totals.vat,
        total_amount: totals.total,
        deposit_percentage: q.deposit_percentage ?? 0,
      }).unwrap();
      setIsEditing(false);
    } catch (e) {}
  };

  return (
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
                          <Typography variant="body2" color="text.secondary">ชื่อบริษัท</Typography>
                          <Typography variant="body1" fontWeight={700}>{customer.cus_company}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          {customer.cus_phone ? (
                            <Chip size="small" variant="outlined" label={customer.cus_phone} sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} />
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
                      />
                    ))}

                    <Divider sx={{ my: 2 }} />

                    <InfoCard sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight={700} color={tokens.primary} gutterBottom>
                        สรุปยอดเงิน
                      </Typography>
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
                          <Typography variant="body1" fontWeight={700}>
                            {paymentMethod === 'cash' ? 'เงินสด' : paymentMethod === 'credit_60' ? 'เครดิต 60 วัน' : 'เครดิต 30 วัน'}
                          </Typography>
                        </InfoCard>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <InfoCard sx={{ p: 2 }}>
                          <Typography variant="caption" color="text.secondary">เงินมัดจำ</Typography>
                          <Typography variant="body1" fontWeight={700}>{Number(depositPercentage)}%</Typography>
                        </InfoCard>
                      </Grid>

                      <Grid item xs={12}>
                        <InfoCard sx={{ p: 2 }}>
                          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary} gutterBottom>
                            สรุปการชำระเงิน
                          </Typography>
                          <Grid container>
                            <Grid item xs={6}><Typography>จำนวนมัดจำ</Typography></Grid>
                            <Grid item xs={6}><Typography textAlign="right" fontWeight={700}>{formatTHB(depositAmount)}</Typography></Grid>
                            <Grid item xs={6}><Typography>ยอดคงเหลือ</Typography></Grid>
                            <Grid item xs={6}><Typography textAlign="right" fontWeight={700}>{formatTHB(remainingAmount)}</Typography></Grid>
                            {paymentMethod !== 'cash' && (
                              <>
                                <Grid item xs={6}><Typography>วันครบกำหนด</Typography></Grid>
                                <Grid item xs={6}><Typography textAlign="right" fontWeight={700}>{formatDateTH(dueDate)}</Typography></Grid>
                              </>
                            )}
                          </Grid>
                        </InfoCard>
                      </Grid>

                      {q.notes && (
                        <Grid item xs={12}>
                          <TextField fullWidth multiline rows={3} label="หมายเหตุ" value={q.notes} disabled />
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Section>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {isEditing ? (
          <>
            <SecondaryButton onClick={() => setIsEditing(false)}>ยกเลิก</SecondaryButton>
            <SecondaryButton onClick={handleSave} disabled={isSaving}>{isSaving ? 'กำลังบันทึก…' : 'บันทึก'}</SecondaryButton>
          </>
        ) : (
          <SecondaryButton onClick={onClose}>ปิด</SecondaryButton>
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
  );
};

export default QuotationDetailDialog;
