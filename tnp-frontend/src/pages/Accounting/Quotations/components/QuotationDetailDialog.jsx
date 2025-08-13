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
} from '@mui/icons-material';
import { useGetQuotationQuery } from '../../../../features/Accounting/accountingApi';
import { Section, SectionHeader, SecondaryButton, InfoCard, tokens } from '../../PricingIntegration/components/quotation/styles/quotationTheme';
import { formatTHB } from '../utils/format';
import { formatDateTH } from '../../PricingIntegration/components/quotation/utils/date';
import CustomerEditDialog from '../../PricingIntegration/components/CustomerEditDialog';

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

const normalizeItems = (q) => {
  const items = Array.isArray(q.items) ? q.items : [];
  const sorted = [...items].sort((a, b) => (Number(a?.sequence_order ?? 0) - Number(b?.sequence_order ?? 0)));
  return sorted.map((it, idx) => ({
    id: it.id || it.pricing_request_id || `qitem_${idx}`,
  // Prefer quotation_items.item_name when present, then other common fallbacks
  name: it.item_name || it.work_name || it.name || it.item_description || it.description || '-',
    pattern: it.pattern || '',
    fabricType: it.fabric_type || it.material || '',
    color: it.color || '',
    size: it.size || '',
    quantity: Number(it.quantity || 0),
  unit: it.unit || it.unit_name || 'ชิ้น',
    unitPrice: Number(it.unit_price || 0),
    // If backend ever provides detailed sizes, prefer them; else fall back to one row
    sizeRows: Array.isArray(it.size_rows) && it.size_rows.length
      ? it.size_rows.map((r, rIdx) => ({
          uuid: r.uuid || `${it.id || idx}-row-${rIdx + 1}`,
          size: r.size || '',
          quantity: Number(r.quantity || 0),
          unitPrice: Number(r.unit_price || it.unit_price || 0),
        }))
      : [{ uuid: `${it.id || idx}-row-1`, size: it.size || '', quantity: Number(it.quantity || 0), unitPrice: Number(it.unit_price || 0) }],
  }));
};

const computeTotals = (items, depositPercentage) => {
  const subtotal = items.reduce((s, it) => {
    const itemTotal = (it.sizeRows || []).reduce((ss, r) => ss + Number(r.quantity || 0) * Number(r.unitPrice || 0), 0);
    return s + itemTotal;
  }, 0);
  const vat = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + vat).toFixed(2);
  const depPct = Math.max(0, Math.min(100, Number(depositPercentage || 0)));
  const depositAmount = +(total * (depPct / 100)).toFixed(2);
  const remainingAmount = +(total - depositAmount).toFixed(2);
  return { subtotal, vat, total, depositAmount, remainingAmount };
};

const QuotationDetailDialog = ({ open, onClose, quotationId }) => {
  const { data, isLoading, error } = useGetQuotationQuery(quotationId, { skip: !open || !quotationId });
  const q = pickQuotation(data);
  const [editCustomerOpen, setEditCustomerOpen] = React.useState(false);
  const [customer, setCustomer] = React.useState(() => normalizeCustomer(q));
  React.useEffect(() => {
    setCustomer(normalizeCustomer(q));
  }, [q?.id, q?.customer_name, q?.customer]);
  const items = normalizeItems(q);
  const workName = q.work_name || q.workname || q.title || '';
  const quotationNumber = q.number || '';
  // Prefer quotations.payment_terms when available
  const paymentMethod = q.payment_terms || q.payment_method || (q.credit_days === 30 ? 'credit_30' : q.credit_days === 60 ? 'credit_60' : 'cash');
  const depositPercentage = q.deposit_percentage ?? (paymentMethod === 'cash' ? 0 : 50);
  const dueDate = q.due_date ? new Date(q.due_date) : null;
  const computed = computeTotals(items, depositPercentage);
  const subtotal = q.subtotal != null ? Number(q.subtotal) : computed.subtotal;
  const vat = q.tax_amount != null ? Number(q.tax_amount) : computed.vat;
  const total = q.total_amount != null ? Number(q.total_amount) : computed.total;
  const depositAmount = q.deposit_amount != null ? Number(q.deposit_amount) : computed.depositAmount;
  const remainingAmount = +(total - depositAmount).toFixed(2);

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
                        <InfoCard key={item.id} sx={{ p: 2, mb: 1.5 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>งานที่ {idx + 1}: {item.name}</Typography>
                            <Chip label={`${item.sizeRows.reduce((s, r) => s + Number(r.quantity || 0), 0)} ${item.unit || 'ชิ้น'}`} size="small" variant="outlined" sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} />
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
                        </InfoCard>
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
                    <Typography variant="subtitle1" fontWeight={700}>การคำนวณราคา</Typography>
                  </SectionHeader>
                  <Box sx={{ p: 2 }}>
                    {items.map((item, idx) => {
                      const itemTotal = item.sizeRows.reduce((s, r) => s + Number(r.quantity || 0) * Number(r.unitPrice || 0), 0);
                      return (
                        <Box key={`calc-${item.id}`} component={InfoCard} sx={{ p: 2, mb: 1.5 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>งานที่ {idx + 1}</Typography>
                              <Typography variant="body2" color="text.secondary">{item.name}</Typography>
                            </Box>
                            <Chip label={`${item.sizeRows.reduce((s, r) => s + Number(r.quantity || 0), 0)} ${item.unit || 'ชิ้น'}`} size="small" variant="outlined" sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} />
                          </Box>

                          <Grid container spacing={1.5}>
                            <Grid item xs={12} md={3}>
                              <TextField fullWidth size="small" label="แพทเทิร์น" value={item.pattern} disabled />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField fullWidth size="small" label="ประเภทผ้า" value={item.fabricType} disabled />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField fullWidth size="small" label="สี" value={item.color} disabled />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField fullWidth size="small" label="ขนาด (สรุป)" value={item.size} disabled />
                            </Grid>

                            <Grid item xs={12}>
                              <Box sx={{ p: 1.5, border: `1px dashed ${tokens.border}`, borderRadius: 1, bgcolor: tokens.bg }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                  <Typography variant="subtitle2" fontWeight={700}>แยกตามขนาด</Typography>
                                </Box>
                                {/* Header row */}
                                <Grid container spacing={1} sx={{ px: 0.5, pb: 0.5 }}>
                                  <Grid item xs={12} md={3}><Typography variant="caption" color="text.secondary">ขนาด</Typography></Grid>
                                  <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">จำนวน</Typography></Grid>
                                  <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">ราคาต่อหน่วย</Typography></Grid>
                                  <Grid item xs={10} md={2}><Typography variant="caption" color="text.secondary">ยอดรวม</Typography></Grid>
                                  <Grid item xs={2} md={1}></Grid>
                                </Grid>
                                <Grid container spacing={1}>
                                  {(item.sizeRows || []).map((row) => (
                                    <React.Fragment key={row.uuid}>
                                      <Grid item xs={12} md={3}>
                                        <TextField fullWidth size="small" label="ขนาด" value={row.size} disabled />
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <TextField fullWidth size="small" label="จำนวน" type="number" value={row.quantity} disabled />
                                      </Grid>
                                      <Grid item xs={6} md={3}>
                                        <TextField fullWidth size="small" label="ราคาต่อหน่วย" type="number" value={row.unitPrice} disabled />
                                      </Grid>
                                      <Grid item xs={10} md={2}>
                                        <Box sx={{ p: 1, bgcolor: '#fff', border: `1px solid ${tokens.border}`, borderRadius: 1, textAlign: 'center' }}>
                                          <Typography variant="subtitle2" fontWeight={800}>{formatTHB((Number(row.quantity || 0) * Number(row.unitPrice || 0)) || 0)}</Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={2} md={1}></Grid>
                                    </React.Fragment>
                                  ))}
                                </Grid>
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
                    })}

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
        <SecondaryButton onClick={onClose}>ปิด</SecondaryButton>
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
