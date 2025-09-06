import React, { useState } from 'react';
import { Box, Stack, Chip, Button, Card, Typography, Grid, Divider, Collapse } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import PaletteIcon from '@mui/icons-material/Palette';
import ChecklistIcon from '@mui/icons-material/Checklist';
import PaymentIcon from '@mui/icons-material/Payment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { TNPCard, TNPCardContent, TNPHeading, TNPBodyText, TNPStatusChip, TNPCountChip, TNPDivider } from '../../PricingIntegration/components/styles/StyledComponents';

const typeLabels = {
  full_amount: 'เต็มจำนวน',
  remaining: 'ยอดคงเหลือ (หลังหักมัดจำ)',
  deposit: 'มัดจำ',
  partial: 'เรียกเก็บบางส่วน'
};

const statusColor = {
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

const formatTHB = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(n || 0));
const formatDate = (d) => {
  if (!d) return '-';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('th-TH');
  } catch { return '-'; }
};

// ฟังก์ชันสำหรับการแสดงรายการสินค้า/บริการ (ใช้ข้อมูลจาก invoice_items.item_name)
const formatItemsList = (invoice) => {
  if (!invoice) return null;
  
  // ใช้ข้อมูลจาก invoice.items (ตาราง invoice_items)
  if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
    // ดึงชื่อรายการจาก item_name และจัดกลุ่มเพื่อนับจำนวน
    const itemGroups = new Map();
    
    invoice.items.forEach(item => {
      if (item.item_name && item.item_name.trim() !== '') {
        // ทำความสะอาดชื่อสินค้า - เก็บข้อความในวงเล็บไว้ และ normalize spaces
        let cleanName = item.item_name
          .replace(/\s+/g, ' ') // แปลง multiple spaces เป็น single space
          .trim();
        
        if (cleanName.length > 0) {
          if (itemGroups.has(cleanName)) {
            itemGroups.set(cleanName, itemGroups.get(cleanName) + 1);
          } else {
            itemGroups.set(cleanName, 1);
          }
        }
      }
    });
    
    if (itemGroups.size > 0) {
      const totalItems = invoice.items.length;
      const uniqueItemNames = Array.from(itemGroups.keys());
      const displayCount = Math.min(3, uniqueItemNames.length); // แสดงสูงสุด 3 รายการ
      
      // สร้างข้อความแสดงรายการ
      let itemsText = uniqueItemNames.slice(0, displayCount).map(name => {
        const count = itemGroups.get(name);
        return count > 1 ? `${name} (${count})` : name;
      }).join(', ');
      
      // เพิ่มข้อความ "และอีก X รายการ" ถ้ามีมากกว่า 3 รายการ
      if (uniqueItemNames.length > 3) {
        const remainingCount = uniqueItemNames.length - 3;
        itemsText += `, และอีก ${remainingCount} รายการ`;
      }
      
      return `รายการสินค้า/บริการ (${totalItems} รายการ) ${itemsText}`;
    }
  }
  
  // ถ้าไม่มี items หรือไม่มี item_name ใช้ work_name แทน
  if (invoice.work_name && invoice.work_name.trim() !== '') {
    return `ชื่องาน: ${invoice.work_name}`;
  }
  
  // ถ้าไม่มีข้อมูลใดๆ แต่มี pattern, fabric_type, color
  const workDetails = [];
  if (invoice.pattern && invoice.pattern.trim() !== '') workDetails.push(`แพทเทิร์น: ${invoice.pattern}`);
  if (invoice.fabric_type && invoice.fabric_type.trim() !== '') workDetails.push(`ชนิดผ้า: ${invoice.fabric_type}`);
  if (invoice.color && invoice.color.trim() !== '') workDetails.push(`สี: ${invoice.color}`);
  
  if (workDetails.length > 0) {
    return `รายละเอียดงาน: ${workDetails.join(', ')}`;
  }
  
  // ถ้าไม่มีข้อมูลใดๆ เลย
  return null;
};

// ฟังก์ชันสำหรับการแสดงมัดจำ
const formatDepositInfo = (invoice) => {
  if (!invoice) return null;
  
  const { deposit_percentage, deposit_amount, deposit_mode, total_amount } = invoice;
  
  if (deposit_mode === 'percentage' && deposit_percentage && deposit_percentage > 0) {
    const calculatedAmount = (total_amount * deposit_percentage) / 100;
    return `${deposit_percentage}% (${formatTHB(calculatedAmount)})`;
  } else if (deposit_mode === 'amount' && deposit_amount && deposit_amount > 0) {
    return formatTHB(deposit_amount);
  }
  
  return null;
};

const InvoiceCard = ({ invoice, onView, onDownloadPDF }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const amountText = formatTHB(invoice?.final_total_amount || invoice?.total_amount);
  const subtotalText = formatTHB(invoice?.subtotal);
  const taxText = formatTHB(invoice?.vat_amount || invoice?.tax_amount);
  const paidAmount = formatTHB(invoice?.paid_amount || 0);
  const remainingAmount = formatTHB((invoice?.final_total_amount || invoice?.total_amount || 0) - (invoice?.paid_amount || 0));
  const depositInfo = formatDepositInfo(invoice);
  const itemsListText = formatItemsList(invoice);

  const companyName = invoice?.customer_company || invoice?.customer?.cus_company || '-';
  const quotationNumber = invoice?.quotation_number || invoice?.quotation?.number || null;
  const contactName = [invoice?.customer_firstname, invoice?.customer_lastname]
    .filter(Boolean).join(' ') || '-';

  // ข้อมูลผู้ขาย/ผู้ดูแล
  const managerUsername = invoice?.manager?.username || 'ไม่ระบุ';
  const managerFullName = [invoice?.manager?.user_firstname, invoice?.manager?.user_lastname]
    .filter(Boolean).join(' ') || null;
  const managerDisplay = managerFullName 
    ? `${managerUsername} (${managerFullName})`
    : managerUsername;

  // ใช้ข้อมูลจาก customer_snapshot หากมี - ตรวจสอบประเภทข้อมูลก่อน
  let customerSnapshot = null;
  if (invoice?.customer_snapshot) {
    try {
      if (typeof invoice.customer_snapshot === 'string') {
        customerSnapshot = JSON.parse(invoice.customer_snapshot);
      } else if (typeof invoice.customer_snapshot === 'object') {
        customerSnapshot = invoice.customer_snapshot;
      }
    } catch (error) {
      
      customerSnapshot = null;
    }
  }
  
  // Priority: invoice overrides -> master customer relation -> snapshot (fallback only)
  const displayCompanyName = invoice?.customer_company || invoice?.customer?.cus_company || customerSnapshot?.customer_company || companyName;
  const displayAddress = invoice?.customer_address || invoice?.customer?.cus_address || customerSnapshot?.customer_address || invoice?.customer_address;
  const displayTaxId = invoice?.customer_tax_id || invoice?.customer?.cus_tax_id || customerSnapshot?.customer_tax_id || invoice?.customer_tax_id;
  const displayEmail = invoice?.customer_email || invoice?.customer?.cus_email || customerSnapshot?.customer_email || invoice?.customer_email;
  const displayPhone = invoice?.customer_tel_1 || invoice?.customer?.cus_tel_1 || customerSnapshot?.customer_tel_1 || invoice?.customer_tel_1;
  const displayFirstName = invoice?.customer_firstname || invoice?.customer?.cus_firstname || customerSnapshot?.customer_firstname || invoice?.customer_firstname;
  const displayLastName = invoice?.customer_lastname || invoice?.customer?.cus_lastname || customerSnapshot?.customer_lastname || invoice?.customer_lastname;
  const displayContactName = [displayFirstName, displayLastName].filter(Boolean).join(' ') || '-';

  // คำนวณยอดเงินสำหรับรายละเอียด
  const baseAmount = invoice?.subtotal || 0;
  const specialDiscountAmount = invoice?.special_discount_amount || 0;
  const baseAfterDiscount = baseAmount - specialDiscountAmount;
  const vatAmount = invoice?.vat_amount || invoice?.tax_amount || 0;
  const withholdingTaxAmount = invoice?.withholding_tax_amount || 0;
  const totalAfterVat = baseAfterDiscount + vatAmount;
  const finalTotal = invoice?.final_total_amount || (totalAfterVat - withholdingTaxAmount);

  return (
    <TNPCard>
      <TNPCardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box flex={1}>
            <TNPHeading variant="h6">{displayCompanyName || displayAddress || 'บริษัท/ลูกค้า'}</TNPHeading>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.5} flexWrap="wrap">
              {invoice?.number && (
                <TNPCountChip 
                  icon={<DescriptionIcon sx={{ fontSize: '1rem' }} />} 
                  label={invoice.number} 
                  size="small" 
                />
              )}
              <Chip 
                size="small" 
                color="primary" 
                variant="outlined"
                label={typeLabels[invoice?.type] || invoice?.type || '-'} 
              />
            </Stack>
          </Box>
          <TNPStatusChip 
            label={invoice?.status || 'draft'} 
            size="small" 
            statuscolor={statusColor[invoice?.status] || 'default'} 
          />
        </Box>

        <Box mb={2}>
          <Stack spacing={1}>
            {!!displayContactName && displayContactName !== '-' && (
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action" />
                <TNPBodyText>{displayContactName}</TNPBodyText>
              </Stack>
            )}
            {managerDisplay && managerDisplay !== 'ไม่ระบุ' && (
              <Stack direction="row" spacing={1} alignItems="center">
                <AccountBoxIcon fontSize="small" color="primary" />
                <TNPBodyText><strong>ผู้ขาย:</strong> {managerDisplay}</TNPBodyText>
              </Stack>
            )}
            {displayTaxId && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <BusinessIcon fontSize="small" color="action" />
                <TNPBodyText variant="caption" color="text.secondary">
                  เลขประจำตัวผู้เสียภาษี: {displayTaxId}
                </TNPBodyText>
              </Stack>
            )}
            {displayEmail && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText variant="caption" color="text.secondary">
                  Email: {displayEmail}
                </TNPBodyText>
              </Stack>
            )}
            {displayPhone && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText variant="caption" color="text.secondary">
                  โทร: {displayPhone}
                </TNPBodyText>
              </Stack>
            )}
            {displayAddress && !displayCompanyName && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText variant="caption" color="text.secondary">
                  ที่อยู่: {displayAddress}{invoice?.customer_zip_code ? ` ${invoice.customer_zip_code}` : ''}
                </TNPBodyText>
              </Stack>
            )}
          </Stack>
        </Box>

        <Box mb={2}>
          <Stack spacing={1}>
            {/* แสดงรายการสินค้า/บริการจาก invoice_items */}
            {itemsListText && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <WorkIcon fontSize="small" color="primary" sx={{ mt: 0.2, flexShrink: 0 }} />
                  <Box flex={1}>
                    <TNPBodyText sx={{ fontWeight: 600, color: 'primary.main', lineHeight: 1.4 }}>
                      {itemsListText}
                    </TNPBodyText>
                  </Box>
                </Stack>
              </Box>
            )}
            
            {/* Fallback: แสดงชื่องานถ้าไม่มี items */}
            {!itemsListText && invoice?.work_name && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <WorkIcon fontSize="small" color="action" sx={{ mt: 0.2, flexShrink: 0 }} />
                  <Box flex={1}>
                    <TNPBodyText sx={{ lineHeight: 1.4 }}>
                      <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>ชื่องาน:</Box>{' '}
                      <Box component="span" sx={{ color: 'text.secondary' }}>{invoice.work_name}</Box>
                    </TNPBodyText>
                  </Box>
                </Stack>
              </Box>
            )}
            
            {/* รายละเอียดเพิ่มเติม */}
            {(invoice?.fabric_type || invoice?.pattern || invoice?.color || invoice?.sizes || invoice?.quantity) && (
              <Box sx={{ ml: 4 }}>
                <Stack spacing={0.5}>
                  {/* บรรทัดแรก: ชนิดผ้า, แพทเทิร์น, สี */}
                  {(invoice?.fabric_type || invoice?.pattern || invoice?.color) && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} flexWrap="wrap">
                      {invoice?.fabric_type && (
                        <TNPBodyText variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                          <Box component="span" sx={{ fontWeight: 500, mr: 0.5 }}>ชนิดผ้า:</Box>
                          {invoice.fabric_type}
                        </TNPBodyText>
                      )}
                      {invoice?.pattern && (
                        <TNPBodyText variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                          <Box component="span" sx={{ fontWeight: 500, mr: 0.5 }}>แพทเทิร์น:</Box>
                          {invoice.pattern}
                        </TNPBodyText>
                      )}
                      {invoice?.color && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <PaletteIcon sx={{ fontSize: '0.75rem', color: 'text.disabled' }} />
                          <TNPBodyText variant="caption" sx={{ color: 'text.secondary' }}>
                            {invoice.color}
                          </TNPBodyText>
                        </Stack>
                      )}
                    </Stack>
                  )}
                  
                  {/* บรรทัดสอง: ไซซ์, จำนวน */}
                  {(invoice?.sizes || invoice?.quantity) && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <ChecklistIcon sx={{ fontSize: '0.75rem', color: 'text.disabled' }} />
                      <TNPBodyText variant="caption" sx={{ color: 'text.secondary' }}>
                        {invoice?.sizes && (
                          <>
                            <Box component="span" sx={{ fontWeight: 500 }}>ไซซ์:</Box> {invoice.sizes}
                          </>
                        )}
                        {invoice?.sizes && invoice?.quantity && ' • '}
                        {invoice?.quantity && (
                          <>
                            <Box component="span" sx={{ fontWeight: 500 }}>จำนวน:</Box> {invoice.quantity}
                          </>
                        )}
                      </TNPBodyText>
                    </Stack>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>

        <Box mb={2}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <RequestQuoteIcon fontSize="small" color="primary" />
              <TNPBodyText><strong>ยอดรวม:</strong> {amountText}</TNPBodyText>
            </Stack>
            {depositInfo && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText color="info.main"><strong>มัดจำ:</strong> {depositInfo}</TNPBodyText>
              </Stack>
            )}
            {invoice?.paid_amount > 0 && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText color="success.main"><strong>ชำระแล้ว:</strong> {paidAmount}</TNPBodyText>
              </Stack>
            )}
            {(invoice?.total_amount - (invoice?.paid_amount || 0)) > 0 && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 3 }}>
                <TNPBodyText color="warning.main"><strong>ยอดคงเหลือ:</strong> {remainingAmount}</TNPBodyText>
              </Stack>
            )}
            
            {/* ปุ่มแสดงเพิ่มเติม */}
            <Button 
              size="small" 
              variant="text" 
              onClick={() => setShowDetails(!showDetails)}
              startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ alignSelf: 'flex-start', ml: 3, mt: 1 }}
            >
              {showDetails ? 'ซ่อนรายละเอียด' : 'แสดงเพิ่มเติม'}
            </Button>

            {/* รายละเอียดการคำนวณ */}
            <Collapse in={showDetails}>
              <Card sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main' }}>
                  สรุปยอดเงิน
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  {baseAmount > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2">ยอดก่อนภาษี (ก่อนส่วนลด)</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ textAlign: 'right' }}>
                          {formatTHB(baseAmount)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {(invoice?.special_discount_percentage > 0 || invoice?.special_discount_amount > 0) && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="error.main">
                          ส่วนลดพิเศษ
                          {invoice?.special_discount_percentage > 0 && ` (${invoice.special_discount_percentage}%)`}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ textAlign: 'right', color: 'error.main' }}>
                          - {formatTHB(specialDiscountAmount)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {baseAfterDiscount > 0 && specialDiscountAmount > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2">ฐานภาษีหลังส่วนลด</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ textAlign: 'right' }}>
                          {formatTHB(baseAfterDiscount)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {invoice?.has_vat && vatAmount > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2">VAT {invoice?.vat_percentage || 7}%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ textAlign: 'right' }}>
                          {formatTHB(vatAmount)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {invoice?.has_vat && vatAmount > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2">ยอดหลัง VAT</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ textAlign: 'right' }}>
                          {formatTHB(totalAfterVat)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {invoice?.has_withholding_tax && withholdingTaxAmount > 0 && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="warning.main">
                          ภาษีหัก ณ ที่จ่าย ({invoice?.withholding_tax_percentage || 0}%)
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ textAlign: 'right', color: 'warning.main' }}>
                          - {formatTHB(withholdingTaxAmount)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      ยอดรวมทั้งสิ้น
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" sx={{ textAlign: 'right', fontWeight: 'bold', color: 'primary.main' }}>
                      {formatTHB(finalTotal)}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Collapse>
          </Stack>
        </Box>

        {(invoice?.payment_method || invoice?.payment_terms) && (
          <Box mb={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PaymentIcon fontSize="small" color="action" />
              <Stack spacing={0.5}>
                {invoice?.payment_method && (
                  <TNPBodyText variant="caption" color="text.secondary">วิธีชำระเงิน: {invoice.payment_method}</TNPBodyText>
                )}
                {invoice?.payment_terms && (
                  <TNPBodyText variant="caption" color="text.secondary">เงื่อนไขการชำระ: {invoice.payment_terms}</TNPBodyText>
                )}
              </Stack>
            </Stack>
          </Box>
        )}

        <Box mb={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <EventIcon fontSize="small" color="action" />
              <TNPBodyText>สร้างเมื่อ: {formatDate(invoice?.created_at)}</TNPBodyText>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <EventIcon fontSize="small" color="error" />
              <TNPBodyText>วันครบกำหนด: {formatDate(invoice?.due_date)}</TNPBodyText>
            </Stack>
          </Stack>
        </Box>

        {(quotationNumber || invoice?.customer_address || invoice?.notes || (invoice?.document_header_type && invoice.document_header_type !== 'ต้นฉบับ')) && (
          <Box mb={2}>
            <Stack spacing={0.5}>
              {quotationNumber && (
                <TNPBodyText variant="caption" color="text.secondary">อ้างอิงใบเสนอราคา: {quotationNumber}</TNPBodyText>
              )}
              {invoice?.customer_address && (
                <TNPBodyText variant="caption" color="text.secondary">
                  ที่อยู่ใบกำกับ: {invoice.customer_address}{invoice?.customer_zip_code ? ` ${invoice.customer_zip_code}` : ''}
                </TNPBodyText>
              )}
              {invoice?.notes && (
                <TNPBodyText variant="caption" color="text.secondary">หมายเหตุ: {invoice.notes}</TNPBodyText>
              )}
              {invoice?.document_header_type && invoice.document_header_type !== 'ต้นฉบับ' && (
                <TNPBodyText variant="caption" color="primary.main">ประเภทหัวกระดาษ: {invoice.document_header_type}</TNPBodyText>
              )}
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onDownloadPDF && (
            <Button size="small" variant="outlined" onClick={onDownloadPDF} startIcon={<DescriptionIcon />}>
              ดาวน์โหลด PDF
            </Button>
          )}
          {onView && (
            <Button size="small" variant="contained" onClick={onView} color="primary">
              ดูรายละเอียด
            </Button>
          )}
        </Stack>
      </TNPCardContent>
      <TNPDivider />
    </TNPCard>
  );
};

export default InvoiceCard;

