import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  TextField
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as QuotationIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import { customerService, pricingIntegrationService } from '../../../features/Accounting';
import {
  PricingRequestDetailsDialog,
  PricingRequestNotesDialog,
  PricingRequestTable,
  QuotationSummaryCard,
  CustomerInfoCard
} from './components';

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
        <CustomerInfoCard customer={customer} />

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

            <PricingRequestTable
              availableRequests={availableRequests}
              selectedRequests={selectedRequests}
              handleSelectAll={handleSelectAll}
              handleToggleRequest={handleToggleRequest}
              getQuantity={getQuantity}
              getEffectiveUnitPrice={getEffectiveUnitPrice}
              getEffectiveTotalPrice={getEffectiveTotalPrice}
              handleUnitPriceChange={handleUnitPriceChange}
              formatCurrency={formatCurrency}
              handleViewNotes={handleViewNotes}
              handleViewDetails={handleViewDetails}
            />

            {/* Summary */}
            <QuotationSummaryCard
              selectedRequestsCount={selectedRequests.length}
              totalAmount={calculateSelectedTotal()}
              formatCurrency={formatCurrency}
            />

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
    <PricingRequestNotesDialog
      open={notesDialogOpen}
      onClose={() => setNotesDialogOpen(false)}
      selectedRequest={selectedRequestForNotes}
      pricingNotes={pricingNotes}
      getNoteTypeName={getNoteTypeName}
      getNoteTypeColor={getNoteTypeColor}
      formatDateTime={formatDateTime}
    />

    {/* Details Dialog */}
    <PricingRequestDetailsDialog
      open={detailsDialogOpen}
      onClose={() => setDetailsDialogOpen(false)}
      selectedRequest={selectedRequestForDetails}
      formatCurrency={formatCurrency}
      formatDueDate={formatDueDate}
      getQuantity={getQuantity}
      getEffectiveUnitPrice={getEffectiveUnitPrice}
      getEffectiveTotalPrice={getEffectiveTotalPrice}
      pricingNotes={pricingNotes}
      getLatestNote={getLatestNote}
      getNoteTypeName={getNoteTypeName}
      getNoteTypeColor={getNoteTypeColor}
      formatDateTime={formatDateTime}
      onViewNotes={handleViewNotes}
    />
    </>
  );
};

export default QuotationFromPricingDialog;
