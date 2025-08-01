import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Receipt as QuotationIcon,
  Assignment as InvoiceIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentStatusBadge from '../components/DocumentStatusBadge';
import { customerService, pricingIntegrationService } from '../../../features/Accounting';

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [pricingRequests, setPricingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [error, setError] = useState(null);

  // Constants for pricing request status
  const PRICING_STATUS = {
    PRICING_RECEIVED: '20db8be1-092b-11f0-b223-38ca84abdf0a' // ได้ราคาแล้ว
  };

  // Mock data สำหรับลูกค้ารายละเอียด - จะถูกแทนที่ด้วย API ในภายหลัง
  const mockCustomerDetail = {
    id: '1',
    name: 'บริษัท ABC จำกัด',
    type: 'company',
    contact_person: 'คุณสมชาย ใจดี',
    phone: '02-123-4567',
    email: 'contact@abc.co.th',
    address: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน กรุงเทพฯ 10110',
    tax_id: '0123456789012',
    created_date: '2024-01-15',
    quotations: [
      {
        id: 'QT001',
        doc_number: 'QT2025-0001',
        date: '2025-07-30',
        amount: 125000,
        status: 'sent',
        items_count: 3
      },
      {
        id: 'QT002',
        doc_number: 'QT2025-0002',
        date: '2025-07-28',
        amount: 87500,
        status: 'approved',
        items_count: 2
      }
    ],
    invoices: [
      {
        id: 'INV001',
        doc_number: 'INV2025-0001',
        date: '2025-07-25',
        amount: 87500,
        status: 'paid',
        due_date: '2025-08-25'
      }
    ]
  };

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ดึงข้อมูลลูกค้า
      const customerResponse = await customerService.getCustomer(id);
      if (customerResponse.data && customerResponse.data.data) {
        setCustomer(customerResponse.data.data);
      } else {
        // Fallback to mock data if API doesn't exist yet
        setCustomer(mockCustomerDetail);
      }
      
      // ดึงข้อมูล pricing requests สำหรับลูกค้ารายนี้
      await loadPricingRequests();
      
    } catch (err) {
      console.error('Error loading customer data:', err);
      // Fallback to mock data
      setCustomer(mockCustomerDetail);
      setError('ไม่สามารถโหลดข้อมูลลูกค้าได้ กำลังแสดงข้อมูลตัวอย่าง');
    } finally {
      setLoading(false);
    }
  };

  const loadPricingRequests = async () => {
    try {
      // ดึงข้อมูล pricing requests ที่เสร็จแล้วสำหรับลูกค้ารายนี้
      const response = await pricingIntegrationService.getCompletedPricingRequests({
        customer_id: id,
        per_page: 100 // ดึงทั้งหมดสำหรับลูกค้ารายนี้
      });
      
      if (response.data && response.data.data && response.data.data.data) {
        // การกรองตาม pr_created_by และ role จะทำงานใน backend แล้ว
        // ผู้ใช้ปกติจะเห็นเฉพาะรายการที่ตนสร้าง
        // admin จะเห็นทั้งหมด
        setPricingRequests(response.data.data.data);
      }
    } catch (err) {
      console.error('Error loading pricing requests:', err);
      // Mock data สำหรับ pricing requests (สำหรับการทดสอบ)
      setPricingRequests([
        {
          pr_id: 'PR001',
          pr_no: 'P2025-07-0001',
          pr_work_name: 'ชิ้นงานพลาสติก Model A',
          pr_quantity: '1000',
          pr_status_id: PRICING_STATUS.PRICING_RECEIVED,
          latest_price: 125000,
          pr_created_date: '2025-07-28',
          pr_created_by: 'current-user-id', // จะถูกส่งมาจาก backend
          status: 'ได้ราคาแล้ว',
          pricingCustomer: {
            cus_company: 'บริษัท ABC จำกัด'
          }
        }
      ]);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: 'draft',
      sent: 'sent',
      approved: 'approved',
      paid: 'paid',
      overdue: 'overdue',
      cancelled: 'cancelled'
    };
    return <DocumentStatusBadge status={statusMap[status] || 'draft'} />;
  };

  // ฟังก์ชันสำหรับตรวจสอบว่า pricing request มีราคาแล้วหรือไม่
  const isPricingReceived = (pricingRequest) => {
    return pricingRequest.pr_status_id === PRICING_STATUS.PRICING_RECEIVED;
  };

  // ฟังก์ชันสำหรับนับจำนวน pricing requests ที่ได้ราคาแล้ว
  const getPricingReceivedCount = () => {
    return pricingRequests.filter(isPricingReceived).length;
  };

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>กำลังโหลดข้อมูลลูกค้า...</Typography>
        </Box>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">ไม่พบข้อมูลลูกค้า</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/accounting/customers');
          }}
        >
          จัดการลูกค้า
        </Link>
        <Typography color="text.primary">{customer.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/accounting/customers')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 56, height: 56 }}>
          {customer.type === 'company' ? <BusinessIcon /> : <PersonIcon />}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {customer.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {customer.contact_person}
          </Typography>
        </Box>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => navigate(`/accounting/customers/${id}/edit`)}>
            <EditIcon sx={{ mr: 1 }} />
            แก้ไขข้อมูล
          </MenuItem>
          <MenuItem onClick={() => {}}>
            <DeleteIcon sx={{ mr: 1 }} />
            ลบลูกค้า
          </MenuItem>
        </Menu>
      </Box>

      {/* Customer Info Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ข้อมูลติดต่อ
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        โทรศัพท์
                      </Typography>
                      <Typography variant="body1">{customer.phone}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        อีเมล
                      </Typography>
                      <Typography variant="body1">{customer.email}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <LocationIcon sx={{ mr: 2, color: 'text.secondary', mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        ที่อยู่
                      </Typography>
                      <Typography variant="body1">{customer.address}</Typography>
                    </Box>
                  </Box>
                </Grid>
                {customer.tax_id && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        เลขที่ผู้เสียภาษี
                      </Typography>
                      <Typography variant="body1">{customer.tax_id}</Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      วันที่เพิ่มลูกค้า
                    </Typography>
                    <Typography variant="body1">
                      {new Date(customer.created_date).toLocaleDateString('th-TH')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                สถิติการทำธุรกิจ
              </Typography>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h3" color="primary.main">
                  {customer.quotations?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ใบเสนอราคาทั้งหมด
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h3" color="success.main">
                  {customer.invoices?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ใบแจ้งหนี้ทั้งหมด
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="warning.main">
                  {getPricingReceivedCount()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  การขอราคาที่ได้ราคาแล้ว
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions for Pricing Requests */}
      {getPricingReceivedCount() > 0 && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              startIcon={<QuotationIcon />}
              onClick={() => navigate('/accounting/quotations/create', {
                state: {
                  customer: customer,
                  pricingRequests: pricingRequests.filter(isPricingReceived),
                  fromPricingRequest: true
                }
              })}
            >
              สร้างใบเสนอราคา
            </Button>
          }
        >
          ลูกค้ารายนี้มีการขอราคาที่ได้ราคาแล้ว {getPricingReceivedCount()} รายการ คุณสามารถสร้างใบเสนอราคาได้
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
        >
          <Tab label="ใบเสนอราคา" />
          <Tab label="ใบแจ้งหนี้" />
          <Tab label="การขอราคา" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>เลขที่เอกสาร</TableCell>
                <TableCell>วันที่</TableCell>
                <TableCell align="right">จำนวนรายการ</TableCell>
                <TableCell align="right">จำนวนเงิน</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell align="center">การดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customer.quotations?.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell>{quotation.doc_number}</TableCell>
                  <TableCell>{new Date(quotation.date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell align="right">{quotation.items_count}</TableCell>
                  <TableCell align="right">{formatCurrency(quotation.amount)}</TableCell>
                  <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      onClick={() => navigate(`/accounting/quotations/${quotation.id}`)}
                    >
                      ดู
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>เลขที่เอกสาร</TableCell>
                <TableCell>วันที่</TableCell>
                <TableCell>วันครบกำหนด</TableCell>
                <TableCell align="right">จำนวนเงิน</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell align="center">การดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customer.invoices?.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.doc_number}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell>{new Date(invoice.due_date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell align="right">{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
                    >
                      ดู
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedTab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>เลขที่เอกสาร</TableCell>
                <TableCell>สินค้า/บริการ</TableCell>
                <TableCell>จำนวน</TableCell>
                <TableCell align="right">ราคา</TableCell>
                <TableCell>วันที่</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell align="center">การดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pricingRequests.length > 0 ? (
                pricingRequests.map((request) => (
                  <TableRow key={request.pr_id}>
                    <TableCell>{request.pr_no}</TableCell>
                    <TableCell>{request.pr_work_name}</TableCell>
                    <TableCell>{parseInt(request.pr_quantity).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      {request.latest_price ? formatCurrency(request.latest_price) : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(request.pr_created_date).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>
                      <DocumentStatusBadge 
                        status="approved" 
                        customLabel={request.status || 'ได้ราคาแล้ว'} 
                      />
                    </TableCell>
                    <TableCell align="center">
                      {isPricingReceived(request) && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<QuotationIcon />}
                          onClick={() => navigate('/accounting/quotations/create', {
                            state: {
                              customer: customer,
                              pricingRequest: request,
                              fromPricingRequest: true
                            }
                          })}
                        >
                          สร้างใบเสนอราคา
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      ไม่มีข้อมูลการขอราคา
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default CustomerDetailPage;
