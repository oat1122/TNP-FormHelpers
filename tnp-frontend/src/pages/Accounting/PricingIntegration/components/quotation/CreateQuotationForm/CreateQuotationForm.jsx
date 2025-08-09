import React, { useEffect, useState } from 'react';
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
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Assignment as AssignmentIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import {
  Section,
  SectionHeader,
  PrimaryButton,
  SecondaryButton,
  InfoCard,
  tokens,
} from '../styles/quotationTheme';
import useQuotationCalc from '../hooks/useQuotationCalc';
import { formatTHB } from '../utils/currency';
import { formatDateTH } from '../utils/date';

import PricingRequestNotesButton from '../../PricingRequestNotesButton';
import QuotationPreview from '../../QuotationPreview';
import CustomerEditCard from '../../CustomerEditCard';

const CreateQuotationForm = ({ selectedPricingRequests = [], onBack, onSave, onSubmit }) => {
  const [formData, setFormData] = useState({
    customer: {},
    pricingRequests: selectedPricingRequests,
    items: [],
    paymentMethod: 'credit_30',
    depositPercentage: '50',
    customDepositPercentage: '',
    dueDate: null,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
      quantity: parseInt(pr.pr_quantity || pr.quantity || 1, 10),
      unitPrice: pr.pr_unit_price ? Number(pr.pr_unit_price) : 0,
      total: (Number(pr.pr_unit_price) || 0) * (parseInt(pr.pr_quantity || pr.quantity || 1, 10)),
      notes: pr.pr_notes || pr.notes || '',
      originalData: pr,
    }));
    const dd = new Date();
    dd.setDate(dd.getDate() + 30);
    setFormData((prev) => ({ ...prev, customer, items, dueDate: dd }));
  }, [selectedPricingRequests]);

  const { subtotal, vat, total, depositAmount, remainingAmount } = useQuotationCalc(
    formData.items,
    formData.depositPercentage,
    formData.customDepositPercentage
  );

  const setItem = (itemId, patch) =>
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              ...patch,
              total:
                ((patch.unitPrice ?? i.unitPrice) || 0) *
                ((patch.quantity ?? i.quantity) || 0),
            }
          : i
      ),
    }));

  const onChangePaymentMethod = (method) => {
    let due = null;
    const now = new Date();
    if (method === 'credit_30') {
      now.setDate(now.getDate() + 30);
      due = now;
    }
    if (method === 'credit_60') {
      now.setDate(now.getDate() + 60);
      due = now;
    }
    setFormData((prev) => ({ ...prev, paymentMethod: method, dueDate: due }));
  };

  const submit = async (action) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        subtotal,
        vat,
        total,
        depositAmount,
        remainingAmount,
        action,
      };
      if (action === 'draft') await onSave?.(payload);
      else await onSubmit?.(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ bgcolor: tokens.bg, minHeight: '100vh', py: 3 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="ย้อนกลับ">
            <IconButton
              onClick={onBack}
              size="small"
              sx={{ color: tokens.primary, border: `1px solid ${tokens.primary}` }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h5" fontWeight={700} color={tokens.primary}>
              สร้างใบเสนอราคา
            </Typography>
            <Typography variant="body2" color="text.secondary">
              จาก {formData.items.length} งาน • {formData.customer?.cus_company || 'กำลังโหลด…'}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Section>
              <SectionHeader>
                <Avatar
                  sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                >
                  <AssignmentIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    ข้อมูลจาก Pricing Request
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ดึงข้อมูลอัตโนมัติจาก PR
                  </Typography>
                </Box>
              </SectionHeader>

              <Box sx={{ p: 2 }}>
                <CustomerEditCard
                  customer={formData.customer}
                  onUpdate={(c) => setFormData((prev) => ({ ...prev, customer: c }))}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
                    รายละเอียดงาน ({formData.items.length})
                  </Typography>
                </Box>

                {formData.items.length === 0 ? (
                  <InfoCard sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      ไม่พบข้อมูลงาน
                    </Typography>
                  </InfoCard>
                ) : (
                  formData.items.map((item, idx) => (
                    <InfoCard key={item.id} sx={{ p: 2, mb: 1.5 }}>
                      <Box
                        display="flex"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        mb={1}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color={tokens.primary}
                        >
                          งานที่ {idx + 1}: {item.name}
                        </Typography>
                        <Chip
                          label={`${item.quantity} ชิ้น`}
                          size="small"
                          sx={{ bgcolor: tokens.primary, color: tokens.white }}
                        />
                      </Box>

                      <Grid container spacing={1}>
                        {item.pattern && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              แพทเทิร์น
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {item.pattern}
                            </Typography>
                          </Grid>
                        )}
                        {item.fabricType && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              ประเภทผ้า
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {item.fabricType}
                            </Typography>
                          </Grid>
                        )}
                        {item.color && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              สี
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {item.color}
                            </Typography>
                          </Grid>
                        )}
                        {item.size && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              ขนาด
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {item.size}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>

                      {item.notes && (
                        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#fff5f5', borderRadius: 1 }}>
                          <Typography variant="caption" color={tokens.primary} fontWeight={700}>
                            หมายเหตุจาก PR
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.notes}
                          </Typography>
                        </Box>
                      )}
                    </InfoCard>
                  ))
                )}
              </Box>
            </Section>
          </Grid>

          <Grid item xs={12}>
            <Section>
              <SectionHeader>
                <Avatar
                  sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                >
                  <CalculateIcon fontSize="small" />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>
                  การคำนวณราคา
                </Typography>
              </SectionHeader>

              <Box sx={{ p: 2 }}>
                {formData.items.map((item, idx) => (
                  <Card key={item.id} variant="outlined" sx={{ mb: 1.5 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={1.5}
                      >
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Typography variant="subtitle1" fontWeight={700} color={tokens.primary}>
                            งานที่ {idx + 1}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.name}
                          </Typography>
                          <PricingRequestNotesButton
                            pricingRequestId={item.pricingRequestId || item.pr_id}
                            workName={item.name}
                            variant="icon"
                            size="small"
                          />
                        </Box>
                        <Chip label={`${item.quantity} ชิ้น`} size="small" />
                      </Box>

                      <Grid container spacing={1.5}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="แพทเทิร์น"
                            value={item.pattern}
                            onChange={(e) => setItem(item.id, { pattern: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="ประเภทผ้า"
                            value={item.fabricType}
                            onChange={(e) =>
                              setItem(item.id, { fabricType: e.target.value })
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="สี"
                            value={item.color}
                            onChange={(e) => setItem(item.id, { color: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            size="small"
                            label="ขนาด"
                            value={item.size}
                            onChange={(e) => setItem(item.id, { size: e.target.value })}
                          />
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="ราคาต่อหน่วย"
                            type="number"
                            value={item.unitPrice || ''}
                            onChange={(e) =>
                              setItem(item.id, { unitPrice: Number(e.target.value || 0) })
                            }
                          />
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <TextField
                            fullWidth
                            label="จำนวน"
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              setItem(item.id, {
                                quantity: parseInt(e.target.value || 0, 10),
                              })
                            }
                          />
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <Box
                            sx={{
                              p: 1.5,
                              border: `1px dashed ${tokens.border}`,
                              borderRadius: 1.5,
                              textAlign: 'center',
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              ยอดรวม
                            </Typography>
                            <Typography variant="h6" fontWeight={800}>
                              {formatTHB(item.total || 0)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}

                <Divider sx={{ my: 2 }} />

                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color={tokens.primary}
                      gutterBottom
                    >
                      สรุปยอดเงิน
                    </Typography>
                    <Grid container>
                      <Grid item xs={6}>
                        <Typography>ยอดก่อนภาษี</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography textAlign="right" fontWeight={700}>
                          {formatTHB(subtotal)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography>VAT 7%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography textAlign="right" fontWeight={700}>
                          {formatTHB(vat)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle1" fontWeight={800}>
                          ยอดรวมทั้งสิ้น
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={800}
                          textAlign="right"
                        >
                          {formatTHB(total)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            </Section>
          </Grid>

          <Grid item xs={12}>
            <Section>
              <SectionHeader>
                <Avatar
                  sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}
                >
                  <PaymentIcon fontSize="small" />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>
                  เงื่อนไขการชำระเงิน
                </Typography>
              </SectionHeader>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl>
                      <FormLabel>การชำระเงิน</FormLabel>
                      <RadioGroup
                        value={formData.paymentMethod}
                        onChange={(e) => onChangePaymentMethod(e.target.value)}
                      >
                        <FormControlLabel value="cash" control={<Radio />} label="เงินสด" />
                        <FormControlLabel
                          value="credit_30"
                          control={<Radio />}
                          label="เครดิต 30 วัน"
                        />
                        <FormControlLabel
                          value="credit_60"
                          control={<Radio />}
                          label="เครดิต 60 วัน"
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl>
                      <FormLabel>เงินมัดจำ</FormLabel>
                      <RadioGroup
                        value={formData.depositPercentage}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            depositPercentage: e.target.value,
                            customDepositPercentage:
                              e.target.value === 'custom'
                                ? prev.customDepositPercentage
                                : '',
                          }))
                        }
                      >
                        <FormControlLabel value="0" control={<Radio />} label="ไม่มี" />
                        <FormControlLabel value="50" control={<Radio />} label="50%" />
                        <FormControlLabel value="100" control={<Radio />} label="100%" />
                        <FormControlLabel
                          value="custom"
                          control={<Radio />}
                          label={
                            <Box display="flex" alignItems="center" gap={1}>
                              <span>กำหนดเอง</span>
                              <TextField
                                size="small"
                                sx={{ width: 88 }}
                                disabled={formData.depositPercentage !== 'custom'}
                                value={formData.customDepositPercentage}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    customDepositPercentage: e.target.value,
                                  }))
                                }
                                InputProps={{ endAdornment: <span>%</span> }}
                              />
                            </Box>
                          }
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color={tokens.primary}
                          gutterBottom
                        >
                          สรุปการชำระเงิน
                        </Typography>
                        <Grid container>
                          <Grid item xs={6}>
                            <Typography>จำนวนมัดจำ</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography textAlign="right" fontWeight={700}>
                              {formatTHB(depositAmount)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography>ยอดคงเหลือ</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography textAlign="right" fontWeight={700}>
                              {formatTHB(remainingAmount)}
                            </Typography>
                          </Grid>
                          {formData.paymentMethod !== 'cash' && (
                            <>
                              <Grid item xs={6}>
                                <Typography>วันครบกำหนด</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography textAlign="right" fontWeight={700}>
                                  {formatDateTH(formData.dueDate)}
                                </Typography>
                              </Grid>
                            </>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {formData.paymentMethod !== 'cash' && (
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="วันครบกำหนด"
                        value={formData.dueDate}
                        onChange={(d) => setFormData((prev) => ({ ...prev, dueDate: d }))}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="หมายเหตุ"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="เช่น ราคานี้รวมค่าจัดส่งและติดตั้งแล้ว…"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Section>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <SecondaryButton onClick={onBack} startIcon={<ArrowBackIcon />}>
            ยกเลิก
          </SecondaryButton>
          <Box display="flex" gap={1}>
            <SecondaryButton
              startIcon={<VisibilityIcon />}
              onClick={() => setShowPreview(true)}
              disabled={total === 0}
            >
              ดูตัวอย่าง
            </SecondaryButton>
            <SecondaryButton onClick={() => submit('draft')}>บันทึกร่าง</SecondaryButton>
            <PrimaryButton
              onClick={() => submit('review')}
              disabled={isSubmitting || total === 0}
            >
              {isSubmitting ? 'กำลังส่ง…' : 'ส่งตรวจสอบ'}
            </PrimaryButton>
          </Box>
        </Box>

        {total > 0 && (
          <Alert severity="success" sx={{ mt: 2 }}>
            ยอดรวม {formatTHB(total)} • มัดจำ {formatTHB(depositAmount)} • คงเหลือ {formatTHB(remainingAmount)}
          </Alert>
        )}

        <Dialog
          open={showPreview}
          onClose={() => setShowPreview(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle display="flex" alignItems="center" gap={1}>
            <VisibilityIcon /> ตัวอย่างใบเสนอราคา
          </DialogTitle>
          <DialogContent>
            <QuotationPreview
              formData={{
                ...formData,
                subtotal,
                vat,
                total,
                depositAmount,
                remainingAmount,
              }}
              quotationNumber="QT-2025-XXX"
              showActions
            />
          </DialogContent>
          <DialogActions>
            <SecondaryButton
              startIcon={<PrintIcon />}
              onClick={() =>
                document.dispatchEvent(new CustomEvent('quotation-print'))
              }
            >
              พิมพ์
            </SecondaryButton>
            <PrimaryButton onClick={() => setShowPreview(false)}>ปิด</PrimaryButton>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default CreateQuotationForm;
