import React from 'react';
import { Box, Stack, Chip, Button, Typography, Collapse, Tooltip, Menu, MenuItem, Checkbox, ListItemText, Divider, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, FormControl, Select, InputLabel } from '@mui/material';
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
import { formatTHB, formatDate, typeLabels, truncateText, formatInvoiceNumber } from './utils/invoiceFormatters';
import { getInvoiceStatus, calculateInvoiceFinancials, formatDepositInfo, getDisplayInvoiceNumber } from './utils/invoiceLogic';

// Hooks
import { useState, useEffect, useCallback } from 'react';

// API
import { useGetCompaniesQuery, useUpdateInvoiceMutation } from '../../../../features/Accounting/accountingApi';

const InvoiceCard = ({ invoice, onView, onDownloadPDF, onPreviewPDF, onApprove, onSubmit, onUpdateCompany }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');

  // Custom Hooks
  const approvalHook = useInvoiceApproval(invoice);
  const evidenceHook = useInvoiceEvidence(invoice);
  const pdfHook = useInvoicePDFDownload(invoice, onDownloadPDF, onPreviewPDF);

  const {
    localStatus,
    depositMode,
    getActiveSideStatus,
    canApproveActiveSide,
    canUserApprove,
    handleApprove,
    handleDepositModeChange
  } = approvalHook;

  // ใช้สถานะของฝั่งที่กำลังดูสำหรับแสดงผล
  const activeSideStatus = getActiveSideStatus();

  // RTK Query hooks (หลังจาก get variables แล้ว)
  const { data: companiesResp, isLoading: loadingCompanies } = useGetCompaniesQuery(undefined, { 
    refetchOnMountOrArgChange: false,
    skip: !canUserApprove || activeSideStatus !== 'draft' 
  });
  const [updateInvoice, { isLoading: updatingCompany }] = useUpdateInvoiceMutation();

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
    handlePreviewClick,
    handleCloseMenu,
    handleConfirmDownload
  } = pdfHook;
  
  // Calculate financial data
  const financials = calculateInvoiceFinancials(invoice);
  const depositInfo = formatDepositInfo(invoice);
  
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

  // Process companies data
  const companies = React.useMemo(() => {
    const list = companiesResp?.data ?? companiesResp ?? [];
    return Array.isArray(list) ? list : [];
  }, [companiesResp]);

  // Handle company change
  const handleCompanyChange = useCallback(async (newCompanyId) => {
    if (!newCompanyId || updatingCompany) return;

    try {
      if (onUpdateCompany) {
        await onUpdateCompany(invoice.id, newCompanyId);
      } else {
        // Use RTK Query mutation as fallback
        await updateInvoice({ id: invoice.id, company_id: newCompanyId }).unwrap();
      }
    } catch (error) {
      console.error('Failed to update company:', error);
    }
  }, [invoice.id, onUpdateCompany, updateInvoice, updatingCompany]);

  // Get current company
  const currentCompany = companies.find(c => c.id === invoice.company_id);

  // Handle PDF Preview - Create blob URL for iframe
  const handlePreviewPDFDialog = async (mode) => {
    try {
      console.log('🔍 PDF Preview clicked:', { invoice: invoice?.id, mode, onPreviewPDF: !!onPreviewPDF });
      
      if (!invoice?.id) {
        console.error('❌ No invoice ID found');
        return;
      }
      
      // Show dialog immediately with loading state
      setPreviewDialogOpen(true);
      setPreviewPdfUrl(''); // Clear previous URL
      
      // Build PDF URL
      const apiConfig = { baseUrl: process.env.NODE_ENV === 'production' ? '/api/v1' : 'http://localhost:8000/api/v1' };
      const url = `${apiConfig.baseUrl}/invoices/${invoice.id}/pdf/preview?mode=${mode || 'before'}`;
      
      // Get auth token
      const authToken = localStorage.getItem("authToken");
      const token = localStorage.getItem("token");
      const finalToken = authToken || token;
      
      if (!finalToken) {
        console.error('❌ No authentication token found');
        return;
      }
      
      console.log('📥 Fetching PDF from:', url);
      
      // Fetch PDF as blob
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${finalToken}`,
          'Accept': 'application/pdf',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Convert to blob and create object URL
      const blob = await response.blob();
      if (blob.type === 'application/pdf') {
        const objectUrl = URL.createObjectURL(blob);
        console.log('✅ PDF loaded successfully, setting URL:', objectUrl);
        setPreviewPdfUrl(objectUrl);
      } else {
        console.error('❌ Unexpected response type for PDF preview:', blob.type);
        throw new Error(`Expected PDF but got ${blob.type}`);
      }
      
    } catch (error) {
      console.error('❌ Error previewing PDF:', error);
      // Close dialog on error
      setPreviewDialogOpen(false);
      setPreviewPdfUrl('');
    }
  };

  const handleClosePreviewDialog = () => {
    // Clean up object URL to prevent memory leaks
    if (previewPdfUrl && previewPdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewPdfUrl);
    }
    setPreviewDialogOpen(false);
    setPreviewPdfUrl('');
  };

  const handleOpenInNewTab = () => {
    if (previewPdfUrl) {
      window.open(previewPdfUrl, '_blank');
    }
  };



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
                {(() => {
                  const displayNumber = getDisplayInvoiceNumber(invoice, depositMode);
                  
                  return displayNumber ? (
                    <TNPCountChip 
                      icon={<DescriptionIcon sx={{ fontSize: '0.9rem' }} aria-hidden="true" />} 
                      label={displayNumber} 
                      size="small"
                      sx={{ fontWeight: 600 }}
                      aria-label={`เลขที่เอกสาร ${displayNumber}`}
                    />
                  ) : null;
                })()}
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

        {/* Company Selector - แสดงเฉพาะก่อนอนุมัติและผู้ใช้มีสิทธิ์ */}
        {activeSideStatus === 'draft' && canUserApprove && invoice.status !== 'approved' && (
          <Box mb={2.5}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              เลือกบริษัทที่ออกเอกสาร
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FormControl size="small" sx={{ minWidth: 200 }} disabled={loadingCompanies || updatingCompany}>
                <InputLabel id={`company-select-label-${invoice.id}`}>บริษัท</InputLabel>
                <Select
                  labelId={`company-select-label-${invoice.id}`}
                  value={companies.find(c => c.id === invoice.company_id) ? invoice.company_id : ''}
                  label="บริษัท"
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  renderValue={(val) => {
                    const found = companies.find(c => c.id === val);
                    return found ? (found.short_code || found.name) : 'ไม่ระบุ';
                  }}
                >
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {c.short_code || c.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.name}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* แสดงบริษัทปัจจุบัน */}
              {currentCompany && (
                <Tooltip title={`บริษัทปัจจุบัน: ${currentCompany.name}`}>
                  <Chip 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    label={currentCompany.short_code || currentCompany.name} 
                  />
                </Tooltip>
              )}
              
              {/* Loading indicator */}
              {(loadingCompanies || updatingCompany) && <CircularProgress size={18} />}
            </Box>
            
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5, display: 'block' }}>
              หมายเหตุ: เลขที่เอกสารจะถูกสร้างหลังจากกดอนุมัติ และสามารถเปลี่ยนบริษัทได้เฉพาะก่อนอนุมัติเท่านั้น
            </Typography>
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
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {canUserApprove() && canApproveActiveSide() && (
            <Button
              size="medium"
              variant="contained"
              color="success"
              onClick={handleApprove}
              sx={{ 
                px: 2, 
                py: 1, 
                fontSize: '0.8rem', 
                fontWeight: 500, 
                borderRadius: 2,
                boxShadow: 'none',
                minHeight: 36,
                '&:hover': {
                  boxShadow: 1
                }
              }}
              aria-label={`อนุมัติใบแจ้งหนี้ฝั่ง ${depositMode === 'before' ? 'มัดจำก่อน' : 'มัดจำหลัง'}`}
            >
              อนุมัติ ({depositMode === 'before' ? 'ก่อน' : 'หลัง'})
            </Button>
          )}
          {/* PDF Actions - Mode-specific */}
          {onPreviewPDF && (
            <Button
              size="medium"
              variant="outlined"
              onClick={() => handlePreviewPDFDialog(depositMode)}
              startIcon={<DescriptionIcon sx={{ fontSize: '1rem' }} aria-hidden="true" />}
              sx={{ 
                px: 2, 
                py: 1, 
                fontSize: '0.8rem', 
                fontWeight: 500, 
                borderRadius: 2,
                minHeight: 36,
                borderColor: 'grey.300',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50'
                }
              }}
              tabIndex={0}
              aria-label={`ดูตัวอย่าง PDF โหมด ${depositMode === 'before' ? 'มัดจำก่อน' : 'มัดจำหลัง'}`}
            >
              ดูตัวอย่าง PDF
            </Button>
          )}
          {onDownloadPDF && (
            <>
              <Button
                size="medium"
                variant="outlined"
                onClick={handleDownloadClick}
                startIcon={<DescriptionIcon sx={{ fontSize: '1rem' }} aria-hidden="true" />}
                sx={{ 
                  px: 2, 
                  py: 1, 
                  fontSize: '0.8rem', 
                  fontWeight: 500, 
                  borderRadius: 2,
                  minHeight: 36,
                  borderColor: 'grey.300',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50'
                  }
                }}
                tabIndex={0}
                aria-label={`ดาวน์โหลดไฟล์ PDF โหมด ${depositMode === 'before' ? 'มัดจำก่อน' : 'มัดจำหลัง'}`}
              >
                ดาวน์โหลด PDF
              </Button>
              <Menu
                anchorEl={downloadAnchorEl}
                open={Boolean(downloadAnchorEl)}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Typography sx={{ px: 2, pt: 1, fontSize: '.8rem', fontWeight: 600 }}>
                  เลือกประเภทหัวกระดาษ ({depositMode === 'before' ? 'มัดจำก่อน' : 'มัดจำหลัง'})
                </Typography>
                <Divider />
                {extendedHeaderOptions.map(opt => (
                  <MenuItem key={opt} dense onClick={() => toggleHeader(opt)}>
                    <Checkbox size="small" checked={selectedHeaders.includes(opt)} />
                    <ListItemText primaryTypographyProps={{ fontSize: '.8rem' }} primary={opt} />
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem disabled={selectedHeaders.length === 0} onClick={() => handleConfirmDownload(depositMode)} sx={{ justifyContent: 'center' }}>
                  <Typography color={selectedHeaders.length ? 'primary.main' : 'text.disabled'} fontSize={'.8rem'} fontWeight={600}>
                    ดาวน์โหลด {selectedHeaders.length > 1 ? '(.zip)' : '(PDF)'}
                  </Typography>
                </MenuItem>
              </Menu>
            </>
          )}
          {onView && (
            <Button 
              size="medium" 
              variant="contained" 
              onClick={onView} 
              color="primary"
              sx={{ 
                px: 2.5,
                py: 1,
                fontSize: '0.85rem',
                fontWeight: 500,
                borderRadius: 2,
                boxShadow: 'none',
                minHeight: 36,
                '&:hover': {
                  boxShadow: 2
                }
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

      {/* PDF Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={handleClosePreviewDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            py: 2
          }}
        >
          ดูตัวอย่าง PDF ใบแจ้งหนี้
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 0,
            height: '80vh'
          }}
        >
          {previewPdfUrl ? (
            <iframe
              title="invoice-pdf"
              src={previewPdfUrl}
              style={{
                width: '100%',
                height: '80vh',
                border: '0px'
              }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '80vh',
                color: 'text.secondary',
                gap: 2
              }}
            >
              <CircularProgress size={40} />
              <Typography>กำลังโหลด PDF...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="MuiDialogActions-root MuiDialogActions-spacing">
          <Button
            className="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium"
            onClick={handleOpenInNewTab}
            disabled={!previewPdfUrl}
          >
            เปิดในแท็บใหม่
          </Button>
          <Button
            className="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium"
            onClick={handleClosePreviewDialog}
          >
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </TNPCard>
  );
};

export default InvoiceCard;
