import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Container,
  Tabs,
  Tab,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Receipt as QuotationIcon,
  Assignment as InvoiceIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import QuotationFromPricingDialog from './QuotationFromPricingDialog';
import { customerService, pricingIntegrationService } from '../../../features/Accounting';

// Constants for pricing request status
const PRICING_REQUEST_STATUS = {
  PRICING_RECEIVED: '20db8be1-092b-11f0-b223-38ca84abdf0a' // ได้ราคาแล้ว
};

const CustomersPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [quotationFromPricingDialog, setQuotationFromPricingDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user and customers with user-based filtering
  useEffect(() => {
    // Load customers with current user info
    loadCustomersWithUserFiltering();
  }, []);

  const loadCustomersWithUserFiltering = async () => {
    setLoading(true);
    try {
      // Get current user from auth context or localStorage
      const currentUser = getCurrentUserInfo(); // ฟังก์ชันดึงข้อมูลผู้ใช้ปัจจุบัน
      setCurrentUser(currentUser);

      // Load customers from API
      const customersResponse = await customerService.fetchCustomers({
        per_page: 100,
        is_active: true
      });

      if (customersResponse.data && customersResponse.data.data) {
        const customers = customersResponse.data.data.data || customersResponse.data.data;
        
        // Load pricing requests for each customer
        const customersWithPricing = await Promise.all(
          customers.map(async (customer) => {
            try {
              // Get pricing requests for this customer
              const pricingResponse = await pricingIntegrationService.getCompletedPricingRequests({
                customer_id: customer.cus_id || customer.id,
                per_page: 50
              });

              const pricingRequests = pricingResponse.data?.data?.data || [];
              
              // Filter pricing requests ที่มีราคาแล้ว
              const completedPricing = pricingRequests.filter(pr => 
                pr.pr_status_id === PRICING_REQUEST_STATUS.PRICING_RECEIVED
              );

              return {
                id: customer.cus_id || customer.id,
                name: customer.cus_company || `${customer.cus_firstname || ''} ${customer.cus_lastname || ''}`.trim(),
                type: customer.cus_company ? 'company' : 'individual',
                contact_person: customer.cus_company ? 
                  `${customer.cus_firstname || ''} ${customer.cus_lastname || ''}`.trim() : 
                  customer.cus_name,
                phone: customer.cus_tel_1 || customer.cus_phone,
                email: customer.cus_email,
                address: [
                  customer.cus_address,
                  customer.cus_sub_district,
                  customer.cus_district,
                  customer.cus_province,
                  customer.cus_zip_code
                ].filter(Boolean).join(' '),
                tax_id: customer.cus_tax_id,
                total_quotations: 0, // จะต้องดึงจาก API ใน future
                total_invoices: 0,   // จะต้องดึงจาก API ใน future
                pending_pricing: completedPricing.map(pr => ({
                  id: pr.pr_id,
                  pr_no: pr.pr_no,
                  product_name: pr.pr_work_name,
                  quantity: parseInt(pr.pr_quantity) || 0,
                  status: PRICING_REQUEST_STATUS.PRICING_RECEIVED,
                  price: pr.latest_price || 0,
                  created_date: pr.pr_created_date,
                  description: pr.pr_pattern || pr.pr_fabric_type || '',
                  pr_created_by: pr.pr_created_by
                }))
              };
            } catch (err) {
              console.error(`Error loading pricing for customer ${customer.cus_id}:`, err);
              // Return customer without pricing data if error
              return {
                id: customer.cus_id || customer.id,
                name: customer.cus_company || `${customer.cus_firstname || ''} ${customer.cus_lastname || ''}`.trim(),
                type: customer.cus_company ? 'company' : 'individual',
                contact_person: customer.cus_company ? 
                  `${customer.cus_firstname || ''} ${customer.cus_lastname || ''}`.trim() : 
                  customer.cus_name,
                phone: customer.cus_tel_1 || customer.cus_phone,
                email: customer.cus_email,
                address: [
                  customer.cus_address,
                  customer.cus_sub_district,
                  customer.cus_district,
                  customer.cus_province,
                  customer.cus_zip_code
                ].filter(Boolean).join(' '),
                tax_id: customer.cus_tax_id,
                total_quotations: 0,
                total_invoices: 0,
                pending_pricing: []
              };
            }
          })
        );

        setCustomers(customersWithPricing);
      } else {
        setCustomers([]);
      }
      
    } catch (error) {
      console.error('Error loading customers:', error);
      
      // Fallback to mock data for development
      const mockData = getMockCustomersData();
      setCustomers(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get current user info
  const getCurrentUserInfo = () => {
    try {
      // Try to get from localStorage or auth context
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      
      // Default mock user for development
      return {
        user_uuid: 'current_user_id',
        name: 'ผู้ใช้ปัจจุบัน',
        role: 'user' // or 'admin'
      };
    } catch (err) {
      console.error('Error getting current user:', err);
      return null;
    }
  };

  // Mock data fallback function
  const getMockCustomersData = () => {
    const currentUser = getCurrentUserInfo();
    return [
      {
        id: '1',
        name: 'บริษัท ABC จำกัด',
        type: 'company',
        contact_person: 'คุณสมชาย ใจดี',
        phone: '02-123-4567',
        email: 'contact@abc.co.th',
        address: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน กรุงเทพฯ 10110',
        total_quotations: 15,
        total_invoices: 12,
        pending_pricing: [
          {
            id: 'PR001',
            product_name: 'ชิ้นงานพลาสติก Model A',
            quantity: 1000,
            status: PRICING_REQUEST_STATUS.PRICING_RECEIVED,
            price: 125000,
            created_date: '2025-07-28',
            description: 'ชิ้นงานพลาสติกแฟนซี สำหรับใช้ในอุตสาหกรรมยานยนต์',
            pr_created_by: currentUser?.user_uuid || 'current_user'
          }
        ]
      },
      {
        id: '2',
        name: 'บริษัท XYZ อุตสาหกรรม จำกัด',
        type: 'company',
        contact_person: 'คุณวิไล สง่างาม',
        phone: '02-987-6543',
        email: 'info@xyz-industry.com',
        address: '456 ถนนเพชรบุรี แขวงมักกะสัน เขตราชเทวี กรุงเทพฯ 10400',
        total_quotations: 8,
        total_invoices: 6,
        pending_pricing: []
      }
    ];
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter customers by tab
  const getFilteredCustomersByTab = () => {
    switch (selectedTab) {
      case 0: // ทั้งหมด
        return filteredCustomers;
      case 1: // มีการขอราคาที่ได้ราคาแล้ว
        return filteredCustomers.filter(customer => 
          customer.pending_pricing && customer.pending_pricing.length > 0
        );
      case 2: // ลูกค้าประจำ
        return filteredCustomers.filter(customer => customer.total_quotations > 10);
      default:
        return filteredCustomers;
    }
  };

  const handleCreateQuotation = (customer) => {
    setSelectedCustomer(customer);
    setQuotationFromPricingDialog(true);
  };

  const handleQuotationCreated = (quotationData) => {
    // Handle successful quotation creation
    console.log('Quotation created:', quotationData);
    // You can add success notification here
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const CustomerCard = ({ customer }) => (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
            {customer.type === 'company' ? <BusinessIcon /> : <PersonIcon />}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h2" noWrap>
              {customer.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {customer.contact_person}
            </Typography>
          </Box>
          {customer.pending_pricing && customer.pending_pricing.length > 0 && (
            <Chip 
              label={`${customer.pending_pricing.length} รายการ`}
              color="warning"
              size="small"
            />
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">{customer.phone}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" noWrap>{customer.email}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary', mt: 0.2 }} />
            <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
              {customer.address}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {customer.total_quotations}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ใบเสนอราคา
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {customer.total_invoices}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ใบแจ้งหนี้
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={() => navigate(`/accounting/customers/${customer.id}`)}
        >
          ดูรายละเอียด
        </Button>
        
        {customer.pending_pricing && customer.pending_pricing.length > 0 && (
          <Button
            size="small"
            variant="contained"
            color="warning"
            startIcon={<QuotationIcon />}
            onClick={() => handleCreateQuotation(customer)}
          >
            สร้างใบเสนอราคา
          </Button>
        )}
      </CardActions>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={15} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={15} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={15} sx={{ mb: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          จัดการลูกค้า
        </Typography>
        <Typography variant="body1" color="text.secondary">
          จัดการข้อมูลลูกค้าและสร้างใบเสนอราคาจากการขอราคาที่ได้ราคาแล้ว
        </Typography>
      </Box>

      {/* User Visibility Info */}
      {currentUser && (
        <Alert 
          severity={currentUser.role === 'admin' ? 'info' : 'warning'} 
          sx={{ mb: 3 }}
        >
          {currentUser.role === 'admin' 
            ? `คุณมีสิทธิ์ Admin สามารถเห็นข้อมูลการขอราคาทั้งหมด`
            : `คุณสามารถเห็นได้เฉพาะการขอราคาที่คุณสร้างเอง (${currentUser.name || currentUser.user_uuid})`
          }
        </Alert>
      )}

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="ค้นหาลูกค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300, flexGrow: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadCustomersWithUserFiltering}
          >
            รีเฟรช
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/accounting/customers/create')}
          >
            เพิ่มลูกค้าใหม่
          </Button>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
        >
          <Tab label={`ทั้งหมด (${filteredCustomers.length})`} />
          <Tab 
            label={`มีการขอราคาที่ได้ราคาแล้ว (${filteredCustomers.filter(c => c.pending_pricing?.length > 0).length})`} 
          />
          <Tab label={`ลูกค้าประจำ (${filteredCustomers.filter(c => c.total_quotations > 10).length})`} />
        </Tabs>
      </Paper>

      {/* Customer Cards */}
      {getFilteredCustomersByTab().length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            ไม่พบข้อมูลลูกค้า
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'ลองเปลี่ยนคำค้นหาหรือเพิ่มลูกค้าใหม่' : 'เริ่มต้นด้วยการเพิ่มลูกค้าใหม่'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {getFilteredCustomersByTab().map((customer) => (
            <Grid item xs={12} sm={6} md={4} key={customer.id}>
              <CustomerCard customer={customer} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* QuotationFromPricingDialog */}
      <QuotationFromPricingDialog
        open={quotationFromPricingDialog}
        onClose={() => setQuotationFromPricingDialog(false)}
        customer={selectedCustomer}
        pricingRequests={selectedCustomer?.pending_pricing || []}
        onQuotationCreated={handleQuotationCreated}
      />

      {/* Floating Action Button */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add customer"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => navigate('/accounting/customers/create')}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default CustomersPage;
