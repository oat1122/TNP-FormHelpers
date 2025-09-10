import React, { useState } from 'react';
import { Box, Stack, Chip, Button, Card, Typography, Grid, Divider, Collapse, Tooltip, Menu, MenuItem, Checkbox, ListItemText } from '@mui/material';
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
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  sent: 'info',
  partial_paid: 'warning',
  fully_paid: 'success',
  overdue: 'error',
};

// ปรับปรุงการจัดรูปแบบเงินให้คงเส้นคงวา ฿129,028.50
const formatTHB = (n) => {
  const num = Number(n || 0);
  return new Intl.NumberFormat('th-TH', { 
    style: 'currency', 
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// ปรับปรุงการจัดรูปแบบวันที่เป็น พ.ศ. DD/MM/YYYY
const formatDate = (d) => {
  if (!d) return '-';
  try {
    const date = new Date(d);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
    return `${day}/${month}/${year}`;
  } catch { return '-'; }
};

// ฟังก์ชันสำหรับตัดข้อความที่ยาวเกินไป
const truncateText = (text, maxLength = 35) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// ฟังก์ชันตรวจสอบสถานะตามวันครบกำหนด (เพิ่ม mapping ภาษาไทยให้ครบ และรองรับสถานะจำลอง)
const getInvoiceStatus = (invoice) => {
  if (!invoice) return { status: 'draft', color: 'default' };

  const today = new Date();
  const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
  const finalTotal = invoice?.final_total_amount || invoice?.total_amount || 0;
  const paidAmount = invoice?.paid_amount || 0;
  const depositAmount = invoice?.deposit_amount || 0;
  const remaining = Math.max(finalTotal - paidAmount - depositAmount, 0);

  // ถ้าชำระครบแล้ว
  if (remaining <= 0) {
    return { status: 'ชำระแล้ว', color: 'success' };
  }

  // ถ้าเกินกำหนด
  if (dueDate && dueDate < today && remaining > 0) {
    return { status: 'เกินกำหนด', color: 'error' };
  }

  const originalStatus = invoice.status || 'draft';
  const statusMap = {
    draft: 'แบบร่าง',
    pending: 'รอดำเนินการ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ถูกปฏิเสธ',
    sent: 'ส่งแล้ว',
    partial_paid: 'ชำระบางส่วน',
    fully_paid: 'ชำระแล้ว',
    overdue: 'เกินกำหนด'
  };

  return {
    status: statusMap[originalStatus] || originalStatus,
    color: statusColor[originalStatus] || 'default'
  };
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

const InvoiceCard = ({ invoice, onView, onDownloadPDF, onApprove, onSubmit }) => {
  const [showDetails, setShowDetails] = useState(false);
  // เก็บสถานะภายในเพื่อ "จำลอง" การอนุมัติ โดยไม่กระทบข้อมูลจริงจาก backend
  const [localStatus, setLocalStatus] = useState(invoice?.status);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [selectedHeaders, setSelectedHeaders] = useState(() => {
    // default select current header type if not ต้นฉบับ
    const base = ['ต้นฉบับ'];
    if (invoice?.document_header_type && !base.includes(invoice.document_header_type)) {
      base.push(invoice.document_header_type);
    }
    return base;
  });

  const headerOptions = [
    'ต้นฉบับ',
    'สำเนา',
    'สำเนา-ลูกค้า',
    ...(invoice?.document_header_type && !['ต้นฉบับ','สำเนา','สำเนา-ลูกค้า'].includes(invoice.document_header_type)
      ? [invoice.document_header_type] : [])
  ];

  const toggleHeader = (h) => {
    setSelectedHeaders(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  };

  const handleDownloadClick = (e) => {
    if (!onDownloadPDF) return;
    setDownloadAnchorEl(e.currentTarget);
  };

  const handleCloseMenu = () => setDownloadAnchorEl(null);

  const handleConfirmDownload = () => {
    handleCloseMenu();
    if (onDownloadPDF) {
      onDownloadPDF({ invoiceId: invoice?.id, headerTypes: selectedHeaders });
    }
  };
  
  // คำนวณยอดเงินอย่างถูกต้อง - แก้ไข logic การคำนวณ
  const subtotal = Number(invoice?.subtotal || 0);
  const specialDiscountAmount = Number(invoice?.special_discount_amount || 0);
  const discounted = Math.max(subtotal - specialDiscountAmount, 0); // ป้องกันติดลบ
  const vatRate = (invoice?.vat_percentage || 7) / 100;
  const vat = invoice?.has_vat ? discounted * vatRate : 0;
  const afterVat = discounted + vat;
  const withholdingTaxRate = (invoice?.withholding_tax_percentage || 0) / 100;
  const withholding = invoice?.has_withholding_tax ? discounted * withholdingTaxRate : 0;
  const total = afterVat - withholding;
  
  // คำนวณยอดคงเหลือที่ถูกต้อง
  const paidAmount = Number(invoice?.paid_amount || 0);
  const depositAmount = Number(invoice?.deposit_amount || 0);
  const remaining = Math.max(total - paidAmount - depositAmount, 0);
  
  const depositInfo = formatDepositInfo(invoice);
  const itemsListText = formatItemsList(invoice);
  // ใช้สถานะจำลอง (ถ้ามี) เพื่อให้ UI อัปเดตได้ทันที
  const invoiceStatus = getInvoiceStatus({ ...invoice, status: localStatus });

  // Handler สำหรับปุ่มอนุมัติ (จำลอง)
  const handleApprove = async () => {
    if (onApprove) {
      try {
        // ถ้ายังเป็น draft และมี onSubmit ให้ส่งก่อน
        if (invoice?.status === 'draft' && typeof onSubmit === 'function') {
          await onSubmit();
        }
        await onApprove();
        setLocalStatus('approved');
      } catch (e) {
        console.error('Approve action error', e);
      }
    } else {
      // Fallback: simulation only
      setLocalStatus('approved');
    }
  };

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

  // ชื่อบริษัทแบบตัดข้อความ - แก้ไขที่อยู่ซ้ำ
  const rawCompanyName = displayCompanyName || displayAddress || 'บริษัท/ลูกค้า';
  const cleanCompanyName = rawCompanyName.replace(/(\d+)\s+\1/g, '$1'); // แก้ "10240 10240" เป็น "10240"
  const truncatedCompanyName = truncateText(cleanCompanyName, 35);

  // Component สำหรับแถวในตารางสรุปยอดเงิน
  const FinancialRow = ({ label, value, emphasis = false, negative = false, color = null }) => (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
        {label}
      </Typography>
      <Typography
        variant={emphasis ? "subtitle2" : "body2"}
        align="right"
        sx={{ 
          fontWeight: emphasis ? 700 : 400,
          color: color || (negative ? 'error.main' : emphasis ? 'primary.main' : 'text.primary'),
          fontSize: emphasis ? '1rem' : '0.9rem'
        }}
      >
        {negative ? `- ${formatTHB(value)}` : formatTHB(value)}
      </Typography>
    </Stack>
  );

  return (
    <TNPCard>
      <TNPCardContent sx={{ p: 2.5 }}>
        {/* Header Section - ปรับปรุง layout และ visual hierarchy */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Tooltip title={cleanCompanyName} placement="top-start">
              <Typography 
                variant="h6" 
                noWrap 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1.25, 
                  lineHeight: 1.45,
                  fontSize: '1.1rem'
                }}
              >
                {truncatedCompanyName}
              </Typography>
            </Tooltip>
            
            {/* จัดกลุ่ม Chips ใหม่ - แยกเป็น 2 กลุ่ม */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.25}>
              {/* กลุ่มซ้าย: เลขที่เอกสาร + สถานะ */}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {invoice?.number && (
                  <TNPCountChip 
                    icon={<DescriptionIcon sx={{ fontSize: '0.9rem' }} aria-hidden="true" />} 
                    label={invoice.number} 
                    size="small"
                    sx={{ fontWeight: 600 }}
                    aria-label={`เลขที่เอกสาร ${invoice.number}`}
                  />
                )}
                <TNPStatusChip 
                  label={invoiceStatus.status} 
                  size="small" 
                  statuscolor={invoiceStatus.color}
                  sx={{ fontWeight: 500 }}
                  aria-label={`สถานะ ${invoiceStatus.status}`}
                />
                <Chip 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  label={typeLabels[invoice?.type] || invoice?.type || '-'} 
                  sx={{ fontSize: '0.75rem' }}
                />
              </Stack>
              
              {/* กลุ่มขวา: เงื่อนไขพิเศษ */}
              {depositInfo && (
                <Chip 
                  size="small" 
                  color="warning" 
                  variant="outlined"
                  label={`มัดจำ: ${depositInfo}`}
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Stack>
          </Box>
        </Box>

        {/* Customer & Manager Info - ลดไอคอนที่ซ้ำความหมาย */}
        <Box mb={2.5}>
          <Stack spacing={1.25}>
            {!!displayContactName && displayContactName !== '-' && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <PersonIcon fontSize="small" color="primary" aria-hidden="true" />
                <Typography sx={{ 
                  fontWeight: 500, 
                  fontSize: '0.95rem',
                  lineHeight: 1.45
                }}>
                  {displayContactName}
                </Typography>
              </Stack>
            )}
            
            {managerDisplay && managerDisplay !== 'ไม่ระบุ' && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <AccountBoxIcon fontSize="small" color="action" aria-hidden="true" />
                <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.45 }}>
                  <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>ผู้ขาย:</Box>{' '}
                  <Box component="span" sx={{ color: 'text.secondary' }}>{managerDisplay}</Box>
                </Typography>
              </Stack>
            )}
            
            {/* ข้อมูลเพิ่มเติม - ลดไอคอน ใช้ตัวหนังสือเป็นหลัก */}
            {(displayTaxId || displayEmail || displayPhone) && (
              <Box sx={{ ml: 4, mt: 1 }}>
                <Stack spacing={0.5}>
                  {displayTaxId && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                      เลขประจำตัวผู้เสียภาษี: {displayTaxId}
                    </Typography>
                  )}
                  {displayEmail && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                      Email: {displayEmail}
                    </Typography>
                  )}
                  {displayPhone && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                      โทร: {displayPhone}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Work Details - ลดไอคอนและปรับปรุงการแสดงผล */}
        {(itemsListText || invoice?.work_name) && (
          <Box mb={2.5}>
            <Stack spacing={1.25}>
              {itemsListText && (
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <WorkIcon fontSize="small" color="primary" sx={{ mt: 0.2, flexShrink: 0 }} aria-hidden="true" />
                    <Box flex={1}>
                      <Typography sx={{ 
                        fontWeight: 600, 
                        color: 'primary.main', 
                        lineHeight: 1.45, 
                        fontSize: '0.95rem' 
                      }}>
                        {itemsListText}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
              
              {!itemsListText && invoice?.work_name && (
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <WorkIcon fontSize="small" color="action" sx={{ mt: 0.2, flexShrink: 0 }} aria-hidden="true" />
                    <Box flex={1}>
                      <Typography sx={{ lineHeight: 1.45, fontSize: '0.9rem' }}>
                        <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>ชื่องาน:</Box>{' '}
                        <Box component="span" sx={{ color: 'text.secondary' }}>{invoice.work_name}</Box>
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
              
              {/* รายละเอียดเพิ่มเติม - ลดไอคอน */}
              {(invoice?.fabric_type || invoice?.pattern || invoice?.color || invoice?.sizes || invoice?.quantity) && (
                <Box sx={{ ml: 4.5 }}>
                  <Stack spacing={0.5}>
                    {(invoice?.fabric_type || invoice?.pattern || invoice?.color) && (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} flexWrap="wrap">
                        {invoice?.fabric_type && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.45 }}>
                            <Box component="span" sx={{ fontWeight: 500, mr: 0.5 }}>ชนิดผ้า:</Box>
                            {invoice.fabric_type}
                          </Typography>
                        )}
                        {invoice?.pattern && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.45 }}>
                            <Box component="span" sx={{ fontWeight: 500, mr: 0.5 }}>แพทเทิร์น:</Box>
                            {invoice.pattern}
                          </Typography>
                        )}
                        {invoice?.color && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.45 }}>
                            <Box component="span" sx={{ fontWeight: 500, mr: 0.5 }}>สี:</Box>
                            {invoice.color}
                          </Typography>
                        )}
                      </Stack>
                    )}
                    
                    {(invoice?.sizes || invoice?.quantity) && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.45 }}>
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
                      </Typography>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {/* Financial Summary - ปรับปรุงการแสดงผลให้ชัดเจน */}
        <Box mb={2.5}>
          <Stack spacing={1.25}>
            {/* ยอดรวมหลัก - เน้นให้เด่น */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <RequestQuoteIcon fontSize="medium" color="primary" aria-hidden="true" />
              <Typography sx={{ 
                fontWeight: 700, 
                fontSize: '1.1rem',
                color: 'primary.main',
                lineHeight: 1.45
              }}>
                ยอดรวม: {formatTHB(total)}
              </Typography>
            </Stack>
            
            {/* ข้อมูลการชำระเงิน */}
            <Box sx={{ ml: 4.5 }}>
              <Stack spacing={1}>
                {paidAmount > 0 && (
                  <Typography sx={{ 
                    color: 'success.main', 
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    lineHeight: 1.45
                  }}>
                    ✓ ชำระแล้ว: {formatTHB(paidAmount)}
                  </Typography>
                )}
                
                {depositAmount > 0 && (
                  <Typography sx={{ 
                    color: 'warning.main', 
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    lineHeight: 1.45
                  }}>
                    💰 มัดจำ: {formatTHB(depositAmount)}
                  </Typography>
                )}
                
                {remaining > 0 && (
                  <Typography sx={{ 
                    color: 'error.main', 
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    lineHeight: 1.45
                  }}>
                    ⚠ ยอดคงเหลือ: {formatTHB(remaining)}
                  </Typography>
                )}
              </Stack>
            </Box>
            
            {/* ปุ่มแสดงเพิ่มเติม */}
            <Button 
              size="small" 
              variant="text" 
              onClick={() => setShowDetails(!showDetails)}
              startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ 
                alignSelf: 'flex-start', 
                ml: 4.5, 
                mt: 0.5,
                fontSize: '0.85rem',
                fontWeight: 500
              }}
              tabIndex={0}
              aria-label={showDetails ? 'ซ่อนรายละเอียดการคำนวณ' : 'แสดงรายละเอียดการคำนวณ'}
            >
              {showDetails ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียดการคำนวณ'}
            </Button>

            {/* รายละเอียดการคำนวณ - แก้ไข layout เป็นตาราง 2 คอลัมน์ */}
            <Collapse in={showDetails}>
              <Card variant="outlined" sx={{ 
                mt: 2, 
                p: 2.5, 
                bgcolor: 'grey.50', 
                borderRadius: 2,
                borderColor: 'primary.100'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  color: 'text.secondary',
                  fontWeight: 600,
                  mb: 1.25
                }}>
                  สรุปยอดเงิน
                </Typography>
                <Divider sx={{ my: 1 }} />
                
                <Stack spacing={1}>
                  {subtotal > 0 && (
                    <FinancialRow label="ยอดก่อนภาษี (ก่อนส่วนลด)" value={subtotal} />
                  )}
                  
                  {specialDiscountAmount > 0 && (
                    <FinancialRow 
                      label={`ส่วนลดพิเศษ${invoice?.special_discount_percentage ? ` (${invoice.special_discount_percentage}%)` : ''}`}
                      value={specialDiscountAmount} 
                      negative={true}
                    />
                  )}
                  
                  {specialDiscountAmount > 0 && (
                    <FinancialRow label="ฐานภาษีหลังส่วนลด" value={discounted} />
                  )}
                  
                  {invoice?.has_vat && vat > 0 && (
                    <FinancialRow label={`VAT ${invoice?.vat_percentage || 7}%`} value={vat} />
                  )}
                  
                  {invoice?.has_vat && vat > 0 && (
                    <FinancialRow label="ยอดหลัง VAT" value={afterVat} />
                  )}
                  
                  {invoice?.has_withholding_tax && withholding > 0 && (
                    <FinancialRow 
                      label={`ภาษีหัก ณ ที่จ่าย (${invoice?.withholding_tax_percentage || 0}%)`}
                      value={withholding} 
                      negative={true}
                      color="warning.main"
                    />
                  )}
                  
                  <Divider sx={{ my: 1.5 }} />
                  <FinancialRow label="ยอดรวมทั้งสิ้น" value={total} emphasis={true} />
                </Stack>
              </Card>
            </Collapse>
          </Stack>
        </Box>

        {/* Payment Info - ย่อให้เล็กลง */}
        {(invoice?.payment_method || invoice?.payment_terms) && (
          <Box mb={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PaymentIcon fontSize="small" color="action" aria-hidden="true" />
              <Stack spacing={0.5}>
                {invoice?.payment_method && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                    วิธีชำระเงิน: {invoice.payment_method}
                  </Typography>
                )}
                {invoice?.payment_terms && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                    เงื่อนไขการชำระ: {invoice.payment_terms}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Box>
        )}

        {/* Dates - ปรับปรุงการแสดงผล */}
        <Box mb={2}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 0.5, sm: 3 }}
            sx={{ fontSize: '0.85rem' }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <EventIcon fontSize="small" color="action" aria-hidden="true" />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                สร้างเมื่อ: {formatDate(invoice?.created_at)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <EventIcon fontSize="small" color="warning" aria-hidden="true" />
              <Typography variant="caption" sx={{ 
                color: invoiceStatus.status === 'เกินกำหนด' ? 'error.main' : 'warning.main',
                fontWeight: 500,
                fontSize: '0.8rem',
                lineHeight: 1.45
              }}>
                วันครบกำหนด: {formatDate(invoice?.due_date)}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Additional Info - ย่อให้เล็กลง */}
        {(quotationNumber || invoice?.customer_address || invoice?.notes || (invoice?.document_header_type && invoice.document_header_type !== 'ต้นฉบับ')) && (
          <Box mb={2.5}>
            <Stack spacing={0.5}>
              {quotationNumber && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                  อ้างอิงใบเสนอราคา: {quotationNumber}
                </Typography>
              )}
              {invoice?.customer_address && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                  ที่อยู่ใบกำกับ: {invoice.customer_address}{invoice?.customer_zip_code ? ` ${invoice.customer_zip_code}` : ''}
                </Typography>
              )}
              {invoice?.notes && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                  หมายเหตุ: {invoice.notes}
                </Typography>
              )}
              {invoice?.document_header_type && invoice.document_header_type !== 'ต้นฉบับ' && (
                <Typography variant="caption" color="primary.main" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                  ประเภทหัวกระดาษ: {invoice.document_header_type}
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* Action Buttons - ปรับปรุง hierarchy และ spacing */}
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          {/* ปุ่มอนุมัติ (จำลอง) แสดงเมื่อยังไม่ได้อนุมัติ */}
          {localStatus !== 'approved' && (
            <Button
              size="small"
              variant="outlined"
              color="success"
        onClick={handleApprove}
              sx={{ px: 2, py: 1, fontSize: '0.8rem', fontWeight: 600, borderStyle: 'dashed' }}
              aria-label="จำลองการอนุมัติใบแจ้งหนี้"
            >
        {onApprove ? 'อนุมัติ' : 'อนุมัติ (จำลอง)'}
            </Button>
          )}
          {onDownloadPDF && (
            <>
              <Button
                size="small"
                variant="outlined"
                onClick={handleDownloadClick}
                startIcon={<DescriptionIcon sx={{ fontSize: '1rem' }} aria-hidden="true" />}
                sx={{ px: 2, py: 1, fontSize: '0.85rem', fontWeight: 500 }}
                tabIndex={0}
                aria-label="ดาวน์โหลดไฟล์ PDF หลายประเภทหัวกระดาษ"
              >
                ดาวน์โหลด PDF
              </Button>
              <Menu
                anchorEl={downloadAnchorEl}
                open={Boolean(downloadAnchorEl)}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Typography sx={{ px: 2, pt: 1, fontSize: '.8rem', fontWeight: 600 }}>เลือกประเภทหัวกระดาษ</Typography>
                {headerOptions.map(opt => (
                  <MenuItem key={opt} dense onClick={() => toggleHeader(opt)}>
                    <Checkbox size="small" checked={selectedHeaders.includes(opt)} />
                    <ListItemText primaryTypographyProps={{ fontSize: '.8rem' }} primary={opt} />
                  </MenuItem>
                ))}
                <Divider sx={{ my: .5 }} />
                <MenuItem disabled={selectedHeaders.length === 0} onClick={handleConfirmDownload} sx={{ justifyContent: 'center' }}>
                  <Typography color={selectedHeaders.length ? 'primary.main' : 'text.disabled'} fontSize={'.8rem'} fontWeight={600}>
                    ดาวน์โหลด {selectedHeaders.length > 1 ? '(.zip)' : '(PDF)'}
                  </Typography>
                </MenuItem>
              </Menu>
            </>
          )}
          {onView && (
            <Button 
              size="small" 
              variant="contained" 
              onClick={onView} 
              color="primary"
              sx={{ 
                px: 2.5,
                py: 1,
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: 2
              }}
              tabIndex={0}
              aria-label="ดูรายละเอียดใบแจ้งหนี้"
            >
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
