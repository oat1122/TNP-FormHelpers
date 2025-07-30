import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Stack,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { customerService } from '../../../../features/Accounting';

const CustomerStep = ({ data, onChange, loading }) => {
  const [customer, setCustomer] = useState(data.customer || {});
  const [customerOverrides, setCustomerOverrides] = useState(data.customerOverrides || {});
  const [enableOverrides, setEnableOverrides] = useState(false);
  const [searchDialog, setSearchDialog] = useState(false);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  useEffect(() => {
    setCustomer(data.customer || {});
    setCustomerOverrides(data.customerOverrides || {});
    
    // Check if there are any overrides to enable the toggle
    if (data.customerOverrides && Object.keys(data.customerOverrides).length > 0) {
      setEnableOverrides(true);
    }
  }, [data]);

  useEffect(() => {
    // Notify parent component when data changes
    onChange({
      customer: customer,
      customerOverrides: enableOverrides ? customerOverrides : {}
    });
  }, [customer, customerOverrides, enableOverrides]);

  const handleOverrideChange = (field, value) => {
    setCustomerOverrides(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearchCustomers = async (searchTerm) => {
    try {
      setSearchLoading(true);
      const response = await customerService.searchCustomers(searchTerm, 20);
      
      if (response.data && response.data.data) {
        setCustomerOptions(response.data.data);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectCustomer = (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setSearchDialog(false);
    
    // Clear overrides when changing customer
    setCustomerOverrides({});
    setEnableOverrides(false);
  };

  const getDisplayValue = (field) => {
    if (enableOverrides && customerOverrides[field] !== undefined) {
      return customerOverrides[field];
    }
    return customer[field] || '';
  };

  const CustomerInfoCard = ({ title, icon, children }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        ตรวจสอบข้อมูลลูกค้า
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        ตรวจสอบข้อมูลลูกค้าจากระบบ Pricing หากต้องการแก้ไขสามารถเปิดใช้งาน "แก้ไขข้อมูลสำหรับใบเสนอราคานี้"
      </Typography>

      {/* Customer Source Info */}
      {data.pricingDetails && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            ข้อมูลลูกค้าจากการขอราคา: {data.pricingDetails.pr_no}
          </Typography>
          <Typography variant="body2">
            ข้อมูลนี้จะถูกใช้สร้างใบเสนอราคา คุณสามารถแก้ไขได้หากจำเป็น
          </Typography>
        </Alert>
      )}

      {/* Override Toggle */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={enableOverrides}
                    onChange={(e) => {
                      setEnableOverrides(e.target.checked);
                      if (!e.target.checked) {
                        setCustomerOverrides({});
                      }
                    }}
                  />
                }
                label="แก้ไขข้อมูลสำหรับใบเสนอราคานี้"
              />
              <Typography variant="body2" color="text.secondary">
                เปิดใช้งานเพื่อแก้ไขข้อมูลลูกค้าชั่วคราวสำหรับใบเสนอราคานี้เท่านั้น
              </Typography>
            </Box>
            <Button
              startIcon={<SearchIcon />}
              onClick={() => setSearchDialog(true)}
              variant="outlined"
            >
              เปลี่ยนลูกค้า
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {!customer || Object.keys(customer).length === 0 ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            ไม่พบข้อมูลลูกค้า
          </Typography>
          <Typography variant="body2">
            กรุณาเลือกลูกค้าจากระบบ หรือกลับไปเลือกข้อมูลจากระบบ Pricing ใหม่
          </Typography>
        </Alert>
      ) : (
        <>
          {/* Basic Information */}
          <CustomerInfoCard
            title="ข้อมูลพื้นฐาน"
            icon={<PersonIcon color="primary" />}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ชื่อผู้ติดต่อ"
                  value={getDisplayValue('name')}
                  onChange={(e) => enableOverrides && handleOverrideChange('name', e.target.value)}
                  disabled={!enableOverrides}
                  variant={enableOverrides ? "outlined" : "filled"}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ชื่อบริษัท"
                  value={getDisplayValue('company_name')}
                  onChange={(e) => enableOverrides && handleOverrideChange('company_name', e.target.value)}
                  disabled={!enableOverrides}
                  variant={enableOverrides ? "outlined" : "filled"}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="เลขประจำตัวผู้เสียภาษี"
                  value={getDisplayValue('tax_id')}
                  onChange={(e) => enableOverrides && handleOverrideChange('tax_id', e.target.value)}
                  disabled={!enableOverrides}
                  variant={enableOverrides ? "outlined" : "filled"}
                />
              </Grid>
            </Grid>
          </CustomerInfoCard>

          {/* Contact Information */}
          <CustomerInfoCard
            title="ข้อมูลติดต่อ"
            icon={<EmailIcon color="primary" />}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="อีเมล"
                  type="email"
                  value={getDisplayValue('email')}
                  onChange={(e) => enableOverrides && handleOverrideChange('email', e.target.value)}
                  disabled={!enableOverrides}
                  variant={enableOverrides ? "outlined" : "filled"}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="เบอร์โทรศัพท์"
                  value={getDisplayValue('phone')}
                  onChange={(e) => enableOverrides && handleOverrideChange('phone', e.target.value)}
                  disabled={!enableOverrides}
                  variant={enableOverrides ? "outlined" : "filled"}
                />
              </Grid>
            </Grid>
          </CustomerInfoCard>

          {/* Address Information */}
          <CustomerInfoCard
            title="ที่อยู่"
            icon={<LocationIcon color="primary" />}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ที่อยู่"
                  multiline
                  rows={3}
                  value={getDisplayValue('address')}
                  onChange={(e) => enableOverrides && handleOverrideChange('address', e.target.value)}
                  disabled={!enableOverrides}
                  variant={enableOverrides ? "outlined" : "filled"}
                />
              </Grid>
            </Grid>
          </CustomerInfoCard>

          {/* Override Summary */}
          {enableOverrides && Object.keys(customerOverrides).length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                การแก้ไขข้อมูล
              </Typography>
              <Typography variant="body2">
                ข้อมูลที่แก้ไขจะใช้เฉพาะในใบเสนอราคานี้เท่านั้น และจะไม่มีผลต่อข้อมูลลูกค้าในระบบ
              </Typography>
              <Box mt={1}>
                {Object.entries(customerOverrides).map(([field, value]) => (
                  <Chip
                    key={field}
                    label={`${field}: ${value}`}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                    onDelete={() => {
                      const newOverrides = { ...customerOverrides };
                      delete newOverrides[field];
                      setCustomerOverrides(newOverrides);
                    }}
                  />
                ))}
              </Box>
            </Alert>
          )}
        </>
      )}

      {/* Customer Search Dialog */}
      <Dialog 
        open={searchDialog} 
        onClose={() => setSearchDialog(false)}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          เลือกลูกค้า
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            options={customerOptions}
            getOptionLabel={(option) => `${option.company_name || option.name} (${option.customer_code || option.id})`}
            loading={searchLoading}
            onInputChange={(event, newInputValue) => {
              if (newInputValue.length >= 2) {
                handleSearchCustomers(newInputValue);
              }
            }}
            onChange={(event, newValue) => {
              if (newValue) {
                handleSelectCustomer(newValue);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ค้นหาลูกค้า (พิมพ์อย่างน้อย 2 ตัวอักษร)"
                fullWidth
                margin="dense"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="subtitle1">
                    {option.company_name || option.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    รหัส: {option.customer_code || option.id} | อีเมล: {option.email || 'ไม่ระบุ'}
                  </Typography>
                </Box>
              </Box>
            )}
            noOptionsText="ไม่พบลูกค้า กรุณาลองคำค้นหาอื่น"
            loadingText="กำลังค้นหา..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialog(false)}>
            ยกเลิก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerStep; 