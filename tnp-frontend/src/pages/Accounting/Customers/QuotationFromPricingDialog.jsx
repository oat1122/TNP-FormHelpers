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
  TextField
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as QuotationIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  Person as PersonIcon
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

      // Convert pricing requests to quotation items
      const quotationItems = selectedPricingRequests.map((request, index) => ({
        id: `item_${index + 1}`,
        item_name: request.product_name || request.pr_work_name,
        item_description: request.description || '',
        quantity: request.quantity || 1,
        unit: 'ชิ้น',
        unit_price: request.price || request.latest_price || 0,
        total_price: (request.quantity || 1) * (request.price || request.latest_price || 0),
        pricing_request_id: request.id || request.pr_id
      }));
      
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

  const calculateSelectedTotal = () => {
    const selectedPricingRequests = pricingRequests.filter(request => 
      selectedRequests.includes(request.id || request.pr_id)
    );
    return selectedPricingRequests.reduce((sum, request) => {
      const price = request.price || request.latest_price || 0;
      const quantity = request.quantity || 1;
      return sum + (price * quantity);
    }, 0);
  };

  const availableRequests = pricingRequests.filter(request => 
    request.status === PRICING_REQUEST_STATUS.PRICING_RECEIVED ||
    request.pr_status_id === PRICING_REQUEST_STATUS.PRICING_RECEIVED
  );

  return (
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

            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRequests.length === availableRequests.length && availableRequests.length > 0}
                        indeterminate={selectedRequests.length > 0 && selectedRequests.length < availableRequests.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>รหัส</TableCell>
                    <TableCell>สินค้า/บริการ</TableCell>
                    <TableCell>รายละเอียด</TableCell>
                    <TableCell>Notes (Sales/Price)</TableCell>
                    <TableCell align="right">จำนวน</TableCell>
                    <TableCell align="right">ราคา</TableCell>
                    <TableCell>วันที่</TableCell>
                    <TableCell>สถานะ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableRequests.map((request) => (
                    <TableRow 
                      key={request.id || request.pr_id}
                      selected={selectedRequests.includes(request.id || request.pr_id)}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleToggleRequest(request.id || request.pr_id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedRequests.includes(request.id || request.pr_id)}
                          onChange={() => handleToggleRequest(request.id || request.pr_id)}
                        />
                      </TableCell>
                      <TableCell>{request.id || request.pr_id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {request.product_name || request.pr_work_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {request.description || request.pr_pattern || request.pr_fabric_type || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ maxWidth: 300 }}>
                          {pricingNotes[request.id || request.pr_id] && pricingNotes[request.id || request.pr_id].length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {pricingNotes[request.id || request.pr_id].slice(0, 2).map((note, index) => (
                                <Box key={note.id} sx={{ mb: 0.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Chip 
                                      label={getNoteTypeName(note.type)}
                                      size="small"
                                      color={getNoteTypeColor(note.type)}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      {formatDateTime(note.created_date)}
                                    </Typography>
                                  </Box>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    {note.text}
                                  </Typography>
                                </Box>
                              ))}
                              {pricingNotes[request.id || request.pr_id].length > 2 && (
                                <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic' }}>
                                  และอีก {pricingNotes[request.id || request.pr_id].length - 2} รายการ...
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              ไม่มี notes
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {parseInt(request.quantity || request.pr_quantity || 1).toLocaleString()} ชิ้น
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(request.price || request.latest_price || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(request.created_date).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        <DocumentStatusBadge 
                          status="approved" 
                          customLabel="ได้ราคาแล้ว"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary */}
            {selectedRequests.length > 0 && (
              <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    สรุปรายการที่เลือก
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        จำนวนรายการ
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {selectedRequests.length} รายการ
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        ยอดรวม (ยังไม่รวม VAT)
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(calculateSelectedTotal())}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        ยอดรวมทั้งสิ้น (รวม VAT 7%)
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(calculateSelectedTotal() * 1.07)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Selected Items Notes Summary */}
                  {selectedRequests.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Notes สำหรับรายการที่เลือก
                      </Typography>
                      {selectedRequests.map(requestId => {
                        const request = pricingRequests.find(r => (r.id || r.pr_id) === requestId);
                        const notes = pricingNotes[requestId] || [];
                        
                        if (notes.length === 0) return null;
                        
                        return (
                          <Card key={requestId} variant="outlined" sx={{ mb: 2 }}>
                            <CardContent sx={{ py: 2 }}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                {request?.product_name || request?.pr_work_name} ({request?.id || request?.pr_id})
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {notes.map(note => (
                                  <Box key={note.id} sx={{ 
                                    p: 1, 
                                    bgcolor: note.type === 1 ? 'primary.50' : 'success.50',
                                    borderRadius: 1,
                                    border: `1px solid ${note.type === 1 ? 'primary.200' : 'success.200'}`
                                  }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                      <Chip 
                                        label={getNoteTypeName(note.type)}
                                        size="small"
                                        color={getNoteTypeColor(note.type)}
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        {formatDateTime(note.created_date)} • {note.created_by}
                                      </Typography>
                                    </Box>
                                    <Typography variant="body2">
                                      {note.text}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Note */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="หมายเหตุเพิ่มเติม (ถ้ามี)"
              value={quotationNote}
              onChange={(e) => setQuotationNote(e.target.value)}
              placeholder="ระบุเงื่อนไขพิเศษ หรือหมายเหตุเพิ่มเติมสำหรับใบเสนอราคา"
              sx={{ mb: 2 }}
            />

            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="body2">
                <strong>หมายเหตุ:</strong> เมื่อสร้างใบเสนอราคาแล้ว รายการขอราคาที่เลือกจะถูกอัพเดทสถานะเป็น "แปลงเป็นใบเสนอราคาแล้ว"
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          startIcon={<QuotationIcon />}
          onClick={handleCreateQuotation}
          disabled={selectedRequests.length === 0 || loading}
          sx={{ minWidth: 180 }}
        >
          {loading ? 'กำลังสร้าง...' : `สร้างใบเสนอราคา (${selectedRequests.length} รายการ)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuotationFromPricingDialog;
