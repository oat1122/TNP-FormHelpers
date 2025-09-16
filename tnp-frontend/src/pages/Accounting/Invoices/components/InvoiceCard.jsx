import React, { useState } from 'react';
import { Box, Stack, Chip, Button, Typography, Collapse, Tooltip, Menu, MenuItem, Checkbox, ListItemText, Divider } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import PaymentIcon from '@mui/icons-material/Payment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Styled Components
import { TNPCard, TNPCardContent, TNPStatusChip, TNPCountChip, TNPDivider } from '../../PricingIntegration/components/styles/StyledComponents';

// Custom Components
import ImageUploadGrid from '../../shared/components/ImageUploadGrid';
import { CustomerInfoSection } from './subcomponents/CustomerInfoSection';
import WorkDetailsSection from './subcomponents/WorkDetailsSection';
import DepositCard from './subcomponents/DepositCard';
import FinancialSummaryCard from './subcomponents/FinancialSummaryCard';

// Custom Hooks
import { useInvoiceEvidence } from './hooks/useInvoiceEvidence';
import { useInvoiceApproval } from './hooks/useInvoiceApproval';
import { useInvoicePDFDownload } from './hooks/useInvoicePDFDownload';

// Utilities
import { formatTHB, formatDate, typeLabels, truncateText } from './utils/invoiceFormatters';
import { getInvoiceStatus, calculateInvoiceFinancials, formatDepositInfo } from './utils/invoiceLogic';



const InvoiceCard = ({ invoice, onView, onDownloadPDF, onApprove, onSubmit }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Custom Hooks
  const approvalHook = useInvoiceApproval(invoice);
  const evidenceHook = useInvoiceEvidence(invoice);
  const pdfHook = useInvoicePDFDownload(invoice, onDownloadPDF);

  const {
    localStatus,
    depositMode,
    getActiveSideStatus,
    canApproveActiveSide,
    canUserApprove,
    handleApprove,
    handleDepositModeChange
  } = approvalHook;

  const {
    getEvidenceForMode,
    hasEvidence,
    handleUploadEvidence,
    uploadingEvidence
  } = evidenceHook;

  const {
    downloadAnchorEl,
    selectedHeaders,
    extendedHeaderOptions,
    toggleHeader,
    handleDownloadClick,
    handleCloseMenu,
    handleConfirmDownload
  } = pdfHook;
  
  // Calculate financial data
  const financials = calculateInvoiceFinancials(invoice);
  const depositInfo = formatDepositInfo(invoice);
  
  // ใช้สถานะของฝั่งที่กำลังดูสำหรับแสดงผล
  const activeSideStatus = getActiveSideStatus();
  const invoiceStatus = getInvoiceStatus({ ...invoice, status: activeSideStatus });

  // Company name processing
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
  
  const displayCompanyName = invoice?.customer_company || invoice?.customer?.cus_company || customerSnapshot?.customer_company || 'บริษัท/ลูกค้า';
  const displayAddress = invoice?.customer_address || invoice?.customer?.cus_address || customerSnapshot?.customer_address;
  const rawCompanyName = displayCompanyName || displayAddress || 'บริษัท/ลูกค้า';
  const cleanCompanyName = rawCompanyName.replace(/(\d+)\s+\1/g, '$1');
  const truncatedCompanyName = truncateText(cleanCompanyName, 35);

  const quotationNumber = invoice?.quotation_number || invoice?.quotation?.number || null;





  return (
    <TNPCard sx={{ position: 'relative' }}>
      {(localStatus === 'approved' || hasEvidence) && (
        <Tooltip title={hasEvidence ? 'มีหลักฐานการชำระเงินแล้ว' : 'อนุมัติแล้ว'} placement="left">
          <Box
            aria-label={hasEvidence ? 'มีหลักฐานการชำระเงินแล้ว' : 'ใบแจ้งหนี้อนุมัติแล้ว'}
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: hasEvidence ? 'success.main' : 'warning.main',
              border: '2px solid #fff',
              boxShadow: 1
            }}
          />
        </Tooltip>
      )}
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
              <Stack direction="row" spacing={1} alignItems="center">
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
            </Stack>
          </Box>
        </Box>

        {/* Customer & Manager Info */}
        <CustomerInfoSection invoice={invoice} />

        {/* Work Details */}
        <WorkDetailsSection invoice={invoice} />

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
                ยอดรวม: {formatTHB(financials?.total || 0)}
              </Typography>
            </Stack>
            
            {/* Deposit Cards - Conditional Rendering Based on Mode */}
            <DepositCard 
              mode={depositMode}
              depositAmount={financials?.depositAmount || 0}
              paidAmount={financials?.paidAmount || 0}
              remaining={financials?.remaining || 0}
              activeSideStatus={activeSideStatus}
              hasEvidence={hasEvidence}
              onModeChange={(val) => handleDepositModeChange(val, hasEvidence)}
            />
            
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

            {/* รายละเอียดการคำนวณ */}
            <Collapse in={showDetails}>
              <FinancialSummaryCard 
                financials={financials} 
                invoice={invoice}
                showDetails={showDetails}
              />
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

        {/* Evidence Upload Section - Mode-Specific */}
        { activeSideStatus === 'approved' && (
          <Box mb={2.5}>
            <ImageUploadGrid
              images={getEvidenceForMode(depositMode)}
              onUpload={(files) => handleUploadEvidence(files, depositMode)}
              title={`หลักฐานการชำระเงิน (${depositMode === 'before' ? 'มัดจำก่อน' : 'มัดจำหลัง'})`}
              helperText={
                uploadingEvidence ? 'กำลังอัปโหลด...' : 
                'อัปโหลดสลิปหรือหลักฐาน (รองรับหลายไฟล์)'
              }
              disabled={uploadingEvidence}
              previewMode="dialog"
              showFilename={false}
            />
          </Box>
        )}

        {/* Action Buttons - Side-specific Approve (admin/account only) */}
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          {canUserApprove() && canApproveActiveSide() && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={handleApprove}
              sx={{ 
                px: 2, 
                py: 1, 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                borderStyle: 'dashed'
              }}
              aria-label={`อนุมัติใบแจ้งหนี้ฝั่ง ${depositMode === 'before' ? 'มัดจำก่อน' : 'มัดจำหลัง'}`}
            >
              อนุมัติ ({depositMode === 'before' ? 'ก่อน' : 'หลัง'})
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
                {extendedHeaderOptions.map(opt => (
                  <MenuItem key={opt} dense onClick={() => toggleHeader(opt)}>
                    <Checkbox size="small" checked={selectedHeaders.includes(opt)} />
                    <ListItemText primaryTypographyProps={{ fontSize: '.8rem' }} primary={opt} />
                  </MenuItem>
                ))}
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
