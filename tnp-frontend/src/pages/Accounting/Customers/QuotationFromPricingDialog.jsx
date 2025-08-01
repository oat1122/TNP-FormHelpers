import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Chip,
  Divider,
  Alert,
  IconButton,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as QuotationIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import { customerService, pricingIntegrationService } from '../../../features/Accounting';

// Constants for pricing request status
const PRICING_REQUEST_STATUS = {
  PRICING_RECEIVED: '20db8be1-092b-11f0-b223-38ca84abdf0a' // ได้ราคาแล้ว
};

const QuotationFromPricingDialog = ({ 
  open, 
  onClose, 
  customer, 
  pricingRequests = [],
  onQuotationCreated 
}) => {
  const navigate = useNavigate();
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [quotationNote, setQuotationNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [pricingNotes, setPricingNotes] = useState({});
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedRequestForNotes, setSelectedRequestForNotes] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState(null);
  const [manualPrices, setManualPrices] = useState({}); // Store manual unit prices

  useEffect(() => {
    if (open && pricingRequests.length > 0) {
      // Auto-select all pricing requests that have received pricing
      const autoSelected = pricingRequests
        .filter(request => 
          request.status === PRICING_REQUEST_STATUS.PRICING_RECEIVED || 
          request.pr_status_id === PRICING_REQUEST_STATUS.PRICING_RECEIVED
        )
        .map(request => request.id || request.pr_id);
      setSelectedRequests(autoSelected);
      
      // Load notes for all pricing requests
      loadPricingNotes();
    }
  }, [open, pricingRequests]);

  const loadPricingNotes = async () => {
    try {
      const notesData = {};
      
      // Load notes for each pricing request using the dedicated notes endpoint
      for (const request of pricingRequests) {
        try {
          const requestId = request.id || request.pr_id;
          const response = await pricingIntegrationService.getPricingRequestNotes(requestId);
          
          if (response.data && response.data.status === 'success') {
            notesData[requestId] = response.data.data;
          } else {
            notesData[requestId] = [];
          }
        } catch (err) {
          console.error(`Error loading notes for request ${request.id || request.pr_id}:`, err);
          notesData[request.id || request.pr_id] = [];
        }
      }
      
      setPricingNotes(notesData);
    } catch (error) {
      console.error('Error loading pricing notes:', error);
    }
  };

  const handleToggleRequest = (requestId) => {
    setSelectedRequests(prev => 
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    const availableRequests = pricingRequests
      .filter(request => 
        request.status === PRICING_REQUEST_STATUS.PRICING_RECEIVED ||
        request.pr_status_id === PRICING_REQUEST_STATUS.PRICING_RECEIVED
      )
      .map(request => request.id || request.pr_id);
    
    if (selectedRequests.length === availableRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(availableRequests);
    }
  };

  const handleCreateQuotation = async () => {
    if (selectedRequests.length === 0) {
      alert('กรุณาเลือกรายการขอราคาอย่างน้อย 1 รายการ');
      return;
    }

    setLoading(true);
    try {
      const selectedPricingRequests = pricingRequests.filter(request => 
        selectedRequests.includes(request.id || request.pr_id)
      );

      // Convert pricing requests to quotation items using effective prices
      const quotationItems = selectedPricingRequests.map((request, index) => {
        const quantity = getQuantity(request);
        const unitPrice = getEffectiveUnitPrice(request);
        const totalPrice = getEffectiveTotalPrice(request);
        
        return {
          id: `item_${index + 1}`,
          item_name: request.product_name || request.pr_work_name,
          item_description: request.description || '',
          quantity: quantity,
          unit: 'ชิ้น',
          unit_price: unitPrice,
          total_price: totalPrice,
          pricing_request_id: request.id || request.pr_id
        };
      });
      
      // Calculate totals
      const subtotal = quotationItems.reduce((sum, item) => sum + item.total_price, 0);
      const vatAmount = subtotal * 0.07;
      const totalAmount = subtotal + vatAmount;

      // Prepare quotation data
      const quotationData = {
        customer: customer,
        items: quotationItems,
        subtotal: subtotal,
        vat_percent: 7,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        note: quotationNote,
        pricing_request_ids: selectedRequests,
        created_from: 'pricing_request',
        valid_days: 30, // Default validity period
        payment_terms: 'Net 30 days'
      };

      // Navigate to quotation create page with pre-filled data
      navigate('/accounting/quotations/create', {
        state: {
          quotationData: quotationData,
          fromPricingRequest: true,
          customer: customer,
          pricingRequests: selectedPricingRequests
        }
      });

      if (onQuotationCreated) {
        onQuotationCreated(quotationData);
      }

      onClose();
    } catch (error) {
      console.error('Error creating quotation:', error);
      alert('เกิดข้อผิดพลาดในการสร้างใบเสนอราคา');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNoteTypeColor = (type) => {
    switch (type) {
      case 1: return 'primary'; // Sales
      case 2: return 'success'; // Price
      default: return 'default';
    }
  };

  const getNoteTypeName = (type) => {
    switch (type) {
      case 1: return 'Sales';
      case 2: return 'Price';
      default: return 'Other';
    }
  };

  // Helper function to get latest note for display in table
  const getLatestNote = (requestId) => {
    const notes = pricingNotes[requestId] || [];
    if (notes.length === 0) return null;
    
    // Sort by created_date descending and return the latest
    const sortedNotes = [...notes].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return sortedNotes[0];
  };

  // Helper function to calculate unit price from total price
  const calculateUnitPrice = (request) => {
    const quantity = parseInt(request.quantity || request.pr_quantity || 1);
    const totalPrice = request.price || request.latest_price || 0;
    
    // Debug logging
    console.log('calculateUnitPrice:', {
      request_id: request.id || request.pr_id,
      quantity,
      totalPrice,
      unitPrice: quantity > 0 ? (totalPrice / quantity) : 0
    });
    
    return quantity > 0 ? (totalPrice / quantity) : 0;
  };

  // Helper function to get total price with more fallback options
  const getTotalPrice = (request) => {
    // Try multiple fields for price data
    const priceFields = [
      request.price,
      request.latest_price,
      request.pr_price,
      request.total_price,
      request.pr_total_price
    ];
    
    for (const price of priceFields) {
      if (price && !isNaN(price) && price > 0) {
        return parseFloat(price);
      }
    }
    
    return 0;
  };

  // Helper function to get quantity with more fallback options
  const getQuantity = (request) => {
    // Try multiple fields for quantity data
    const quantityFields = [
      request.quantity,
      request.pr_quantity,
      request.qty,
      request.pr_qty
    ];
    
    for (const qty of quantityFields) {
      if (qty && !isNaN(qty) && qty > 0) {
        return parseInt(qty);
      }
    }
    
    return 1; // Default to 1 if no valid quantity found
  };

  // Helper function to format fabric, color, and size information
  const formatFabricInfo = (request) => {
    const parts = [];
    if (request.pr_fabric_type) parts.push(`ผ้า: ${request.pr_fabric_type}`);
    if (request.pr_color) parts.push(`สี: ${request.pr_color}`);
    if (request.pr_sizes) parts.push(`ไซส์: ${request.pr_sizes}`);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  // Helper function to format special work information
  const formatSpecialWork = (request) => {
    const works = [];
    if (request.pr_silk) works.push(`สกรีน: ${request.pr_silk}`);
    if (request.pr_dft) works.push(`DTF: ${request.pr_dft}`);
    if (request.pr_embroider) works.push(`ปัก: ${request.pr_embroider}`);
    if (request.pr_sub) works.push(`ซับ: ${request.pr_sub}`);
    if (request.pr_other_screen) works.push(`อื่นๆ: ${request.pr_other_screen}`);
    return works.length > 0 ? works.join(', ') : '-';
  };

  // Helper function to format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleViewNotes = (request) => {
    setSelectedRequestForNotes(request);
    setNotesDialogOpen(true);
  };

  const handleViewDetails = (request) => {
    setSelectedRequestForDetails(request);
    setDetailsDialogOpen(true);
  };

  // Handle manual unit price change
  const handleUnitPriceChange = (requestId, newPrice) => {
    const price = parseFloat(newPrice) || 0;
    setManualPrices(prev => ({
      ...prev,
      [requestId]: price
    }));
  };

  // Get effective unit price (manual or calculated)
  const getEffectiveUnitPrice = (request) => {
    const requestId = request.id || request.pr_id;
    
    // If manual price is set, use it
    if (manualPrices[requestId] !== undefined) {
      return manualPrices[requestId];
    }
    
    // Otherwise calculate from existing data
    return calculateUnitPrice(request);
  };

  // Get effective total price (manual unit price * quantity or original total)
  const getEffectiveTotalPrice = (request) => {
    const requestId = request.id || request.pr_id;
    const quantity = getQuantity(request);
    
    // If manual unit price is set, calculate total from it
    if (manualPrices[requestId] !== undefined) {
      return manualPrices[requestId] * quantity;
    }
    
    // Otherwise use original total price
    return getTotalPrice(request);
  };

  const calculateSelectedTotal = () => {
    const selectedPricingRequests = pricingRequests.filter(request => 
      selectedRequests.includes(request.id || request.pr_id)
    );
    return selectedPricingRequests.reduce((sum, request) => {
      return sum + getEffectiveTotalPrice(request);
    }, 0);
  };

  const availableRequests = pricingRequests.filter(request => 
    request.status === PRICING_REQUEST_STATUS.PRICING_RECEIVED ||
    request.pr_status_id === PRICING_REQUEST_STATUS.PRICING_RECEIVED
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuotationIcon />
            สร้างใบเสนอราคาจากการขอราคา
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {customer?.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Customer Info Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {customer?.type === 'company' ? <BusinessIcon /> : <PersonIcon />}
              ข้อมูลลูกค้า
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">ชื่อลูกค้า</Typography>
                <Typography variant="body1">{customer?.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">ผู้ติดต่อ</Typography>
                <Typography variant="body1">{customer?.contact_person}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">โทรศัพท์</Typography>
                <Typography variant="body1">{customer?.phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">อีเมล</Typography>
                <Typography variant="body1">{customer?.email}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Pricing Requests Selection */}
        {availableRequests.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body1">
              ไม่มีการขอราคาที่ได้ราคาแล้วสำหรับลูกค้ารายนี้
            </Typography>
          </Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                รายการขอราคาที่ได้ราคาแล้ว ({availableRequests.length} รายการ)
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleSelectAll}
              >
                {selectedRequests.length === availableRequests.length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ mb: 3, maxHeight: '60vh', overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ minWidth: 50 }}>
                      <Checkbox
                        checked={selectedRequests.length === availableRequests.length && availableRequests.length > 0}
                        indeterminate={selectedRequests.length > 0 && selectedRequests.length < availableRequests.length}
                        onChange={handleSelectAll}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 120, fontWeight: 600 }}>เลขที่</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 600 }}>ชื่องาน</TableCell>
                    <TableCell align="right" sx={{ minWidth: 100, fontWeight: 600 }}>จำนวน</TableCell>
                    <TableCell align="right" sx={{ minWidth: 140, fontWeight: 600 }}>ราคา/ชิ้น</TableCell>
                    <TableCell align="right" sx={{ minWidth: 120, fontWeight: 600 }}>ราคารวม</TableCell>
                    <TableCell align="center" sx={{ minWidth: 120, fontWeight: 600 }}>การดำเนินการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableRequests.map((request) => {
                    const requestId = request.id || request.pr_id;
                    const quantity = getQuantity(request);
                    const totalPrice = getTotalPrice(request);
                    const unitPrice = calculateUnitPrice(request);
                    
                    return (
                      <TableRow 
                        key={requestId}
                        selected={selectedRequests.includes(requestId)}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleToggleRequest(requestId)}
                      >
                        {/* Checkbox */}
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedRequests.includes(requestId)}
                            onChange={() => handleToggleRequest(requestId)}
                            size="small"
                          />
                        </TableCell>
                        
                        {/* เลขที่ */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {request.pr_no || request.id || request.pr_id}
                          </Typography>
                        </TableCell>
                        
                        {/* ชื่องาน */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {request.pr_work_name || request.product_name}
                          </Typography>
                          {request.pr_pattern && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {request.pr_pattern}
                            </Typography>
                          )}
                        </TableCell>
                        
                        {/* จำนวน */}
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {quantity.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            ชิ้น
                          </Typography>
                        </TableCell>
                        
                        {/* ราคาต่อชิ้น */}
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={getEffectiveUnitPrice(request)}
                            onChange={(e) => handleUnitPriceChange(requestId, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            InputProps={{
                              startAdornment: <span style={{ marginRight: 4, fontSize: '0.75rem' }}>฿</span>,
                              inputProps: { 
                                min: 0, 
                                step: 0.01,
                                style: { 
                                  textAlign: 'right',
                                  fontWeight: 600,
                                  color: '#1976d2',
                                  fontSize: '0.8rem'
                                }
                              }
                            }}
                            sx={{ 
                              width: 120,
                              '& .MuiOutlinedInput-root': {
                                height: 32,
                                '&:hover fieldset': {
                                  borderColor: 'primary.main',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: 'primary.main',
                                }
                              }
                            }}
                            placeholder="กรอกราคา"
                          />
                        </TableCell>
                        
                        {/* ราคารวม */}
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {formatCurrency(getEffectiveTotalPrice(request))}
                          </Typography>
                        </TableCell>
                        
                        {/* การดำเนินการ */}
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="ดู Notes และประวัติ" arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewNotes(request);
                                }}
                                sx={{ 
                                  color: 'primary.main',
                                  '&:hover': { bgcolor: 'primary.50' }
                                }}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="ดูรายละเอียดเพิ่มเติม" arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(request);
                                }}
                                sx={{ 
                                  color: 'info.main',
                                  '&:hover': { bgcolor: 'info.50' }
                                }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary */}
            {selectedRequests.length > 0 && (
              <Card sx={{ mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">จำนวนรายการ</Typography>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                          {selectedRequests.length}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">ยอดรวม (ไม่รวม VAT)</Typography>
                        <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculateSelectedTotal())}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">ยอดรวมทั้งสิ้น (+VAT 7%)</Typography>
                        <Typography variant="h6" color="error.main" sx={{ fontWeight: 600 }}>
                          {formatCurrency(calculateSelectedTotal() * 1.07)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Additional Note */}
            <TextField
              fullWidth
              multiline
              rows={2}
              label="หมายเหตุเพิ่มเติม"
              value={quotationNote}
              onChange={(e) => setQuotationNote(e.target.value)}
              placeholder="ระบุเงื่อนไขพิเศษ หรือหมายเหตุเพิ่มเติมสำหรับใบเสนอราคา"
              sx={{ mb: 2 }}
              size="small"
            />

            <Alert severity="info" icon={<InfoIcon />} sx={{ fontSize: '0.875rem' }}>
              <Typography variant="body2">
                เมื่อสร้างใบเสนอราคาแล้ว รายการขอราคาที่เลือกจะถูกอัพเดทสถานะเป็น "แปลงเป็นใบเสนอราคาแล้ว"
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          เลือกแล้ว: {selectedRequests.length} รายการ
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} variant="outlined">
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            startIcon={<QuotationIcon />}
            onClick={handleCreateQuotation}
            disabled={selectedRequests.length === 0 || loading}
            sx={{ minWidth: 160 }}
          >
            {loading ? 'กำลังสร้าง...' : `สร้างใบเสนอราคา`}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>

    {/* Notes History Dialog */}
    <Dialog
      open={notesDialogOpen}
      onClose={() => setNotesDialogOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            ประวัติ Notes
          </Typography>
          {selectedRequestForNotes && (
            <Typography variant="body2" color="text.secondary">
              {selectedRequestForNotes.product_name || selectedRequestForNotes.pr_work_name} 
              ({selectedRequestForNotes.pr_no || selectedRequestForNotes.id || selectedRequestForNotes.pr_id})
            </Typography>
          )}
        </Box>
        <IconButton onClick={() => setNotesDialogOpen(false)}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {selectedRequestForNotes && (
          <Box>
            {(() => {
              const notes = pricingNotes[selectedRequestForNotes.id || selectedRequestForNotes.pr_id] || [];
              const sortedNotes = [...notes].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
              
              if (sortedNotes.length === 0) {
                return (
                  <Alert severity="info">
                    <Typography>ไม่มี notes สำหรับรายการนี้</Typography>
                  </Alert>
                );
              }
              
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    จำนวน Notes ทั้งหมด: {sortedNotes.length} รายการ
                  </Typography>
                  
                  {sortedNotes.map((note, index) => (
                    <Card 
                      key={note.id} 
                      variant="outlined" 
                      sx={{ 
                        bgcolor: index === 0 ? 'action.hover' : 'background.paper',
                        border: index === 0 ? '2px solid' : '1px solid',
                        borderColor: index === 0 ? 'primary.main' : 'divider'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip 
                              label={getNoteTypeName(note.type)}
                              color={getNoteTypeColor(note.type)}
                              size="small"
                            />
                            {index === 0 && (
                              <Chip 
                                label="ล่าสุด"
                                color="primary"
                                variant="outlined"
                                size="small"
                              />
                            )}
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.primary">
                              {formatDateTime(note.created_date)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              โดย: {note.created_by || 'ไม่ระบุ'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="body1" sx={{ 
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {note.text}
                        </Typography>
                        
                        {note.updated_date && note.updated_date !== note.created_date && (
                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary">
                              แก้ไขล่าสุด: {formatDateTime(note.updated_date)} 
                              {note.updated_by && ` โดย ${note.updated_by}`}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              );
            })()}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setNotesDialogOpen(false)}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>

    {/* Details Dialog */}
    <Dialog
      open={detailsDialogOpen}
      onClose={() => setDetailsDialogOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewIcon />
            รายละเอียดการขอราคา
          </Typography>
          {selectedRequestForDetails && (
            <Typography variant="body2" color="text.secondary">
              {selectedRequestForDetails.pr_work_name || selectedRequestForDetails.product_name} 
              ({selectedRequestForDetails.pr_no || selectedRequestForDetails.id || selectedRequestForDetails.pr_id})
            </Typography>
          )}
        </Box>
        <IconButton onClick={() => setDetailsDialogOpen(false)}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {selectedRequestForDetails && (
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                ข้อมูลทั่วไป
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">เลขที่ใบขอราคา</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedRequestForDetails.pr_no || selectedRequestForDetails.id || selectedRequestForDetails.pr_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">ชื่องาน</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedRequestForDetails.pr_work_name || selectedRequestForDetails.product_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">รูปแบบงาน</Typography>
                  <Typography variant="body1">
                    {selectedRequestForDetails.pr_pattern || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">จำนวน</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {getQuantity(selectedRequestForDetails).toLocaleString()} ชิ้น
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">กำหนดส่ง</Typography>
                  <Typography variant="body1" color={
                    selectedRequestForDetails.pr_due_date && new Date(selectedRequestForDetails.pr_due_date) < new Date() 
                      ? 'error.main' 
                      : 'text.primary'
                  }>
                    {formatDueDate(selectedRequestForDetails.pr_due_date)}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Fabric Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                ข้อมูลผ้าและสี
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">ชนิดผ้า</Typography>
                  <Typography variant="body1">
                    {selectedRequestForDetails.pr_fabric_type || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">สี</Typography>
                  <Typography variant="body1">
                    {selectedRequestForDetails.pr_color || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">ไซส์</Typography>
                  <Typography variant="body1">
                    {selectedRequestForDetails.pr_sizes || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Special Work */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                งานพิเศษ
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">งานสกรีน</Typography>
                  <Typography variant="body1">
                    {selectedRequestForDetails.pr_silk || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">งาน DTF</Typography>
                  <Typography variant="body1">
                    {selectedRequestForDetails.pr_dft || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">งานปัก</Typography>
                  <Typography variant="body1">
                    {selectedRequestForDetails.pr_embroider || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">งานซับ</Typography>
                  <Typography variant="body1">
                    {selectedRequestForDetails.pr_sub || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">งานอื่นๆ</Typography>
                  <Typography variant="body1">
                    {selectedRequestForDetails.pr_other_screen || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Pricing Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                ข้อมูลราคา
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">ราคาต่อชิ้น</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(getEffectiveUnitPrice(selectedRequestForDetails))}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">ราคารวม</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatCurrency(getEffectiveTotalPrice(selectedRequestForDetails))}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">สถานะ</Typography>
                  <DocumentStatusBadge 
                    status="approved" 
                    customLabel="ได้ราคาแล้ว"
                    size="small"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Notes Summary */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Notes ล่าสุด
              </Typography>
              {(() => {
                const requestId = selectedRequestForDetails.id || selectedRequestForDetails.pr_id;
                const notes = pricingNotes[requestId] || [];
                const latestNote = getLatestNote(requestId);
                
                if (!latestNote) {
                  return (
                    <Alert severity="info">
                      <Typography>ไม่มี notes สำหรับรายการนี้</Typography>
                    </Alert>
                  );
                }
                
                return (
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Chip 
                          label={getNoteTypeName(latestNote.type)}
                          color={getNoteTypeColor(latestNote.type)}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {formatDateTime(latestNote.created_date)}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {latestNote.text}
                      </Typography>
                      {notes.length > 1 && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<HistoryIcon />}
                            onClick={() => {
                              setDetailsDialogOpen(false);
                              setTimeout(() => handleViewNotes(selectedRequestForDetails), 100);
                            }}
                          >
                            ดูประวัติ Notes ทั้งหมด ({notes.length} รายการ)
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setDetailsDialogOpen(false)}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default QuotationFromPricingDialog;
