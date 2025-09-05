import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Chip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Section, SectionHeader, SecondaryButton, InfoCard, tokens } from '../../PricingIntegration/components/quotation/styles/quotationTheme';

/**
 * CustomerSection (Shared Component)
 * Display customer information section
 */
const CustomerSection = ({
  customer,
  quotationNumber,
  workName,
  onEditCustomer,
  showEditButton = true,
}) => {
  return (
    <Section>
      <SectionHeader>
        <Avatar sx={{ bgcolor: tokens.primary, color: tokens.white, width: 28, height: 28 }}>
          <AssignmentIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>ข้อมูลลูกค้า</Typography>
          <Typography variant="caption" color="text.secondary">ข้อมูลผู้ติดต่อและบริษัท</Typography>
        </Box>
      </SectionHeader>
      <Box sx={{ p: 2 }}>
        {/* Customer brief card */}
        <InfoCard sx={{ p: 2, mb: 1.5 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {customer?.customer_type === 'individual' ? 'ชื่อผู้ติดต่อ' : 'ชื่อบริษัท'}
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {customer?.customer_type === 'individual'
                  ? `${customer?.cus_firstname || ''} ${customer?.cus_lastname || ''}`.trim() || customer?.cus_name || '-'
                  : (customer?.cus_company || '-')}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {customer?.cus_tel_1 && (
                <Chip 
                  size="small" 
                  variant="outlined" 
                  label={customer.cus_tel_1} 
                  sx={{ borderColor: tokens.primary, color: tokens.primary, fontWeight: 700 }} 
                />
              )}
              {showEditButton && onEditCustomer && (
                <SecondaryButton size="small" startIcon={<EditIcon />} onClick={onEditCustomer}>
                  แก้ไขลูกค้า
                </SecondaryButton>
              )}
            </Box>
          </Box>
          {(customer?.contact_name || customer?.cus_email) && (
            <Grid container spacing={1}>
              {customer?.contact_name && (
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">ผู้ติดต่อ</Typography>
                  <Typography variant="body2">
                    {customer.contact_name} {customer.contact_nickname ? `(${customer.contact_nickname})` : ''}
                  </Typography>
                </Grid>
              )}
              {customer?.cus_email && (
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">อีเมล</Typography>
                  <Typography variant="body2">{customer.cus_email}</Typography>
                </Grid>
              )}
              {customer?.cus_tax_id && (
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">เลขประจำตัวผู้เสียภาษี</Typography>
                  <Typography variant="body2">{customer.cus_tax_id}</Typography>
                </Grid>
              )}
              {customer?.cus_address && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">ที่อยู่</Typography>
                  <Typography variant="body2">{customer.cus_address}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </InfoCard>

        {/* Main work summary */}
        {(workName || quotationNumber) && (
          <InfoCard sx={{ p: 2, mb: 1.5 }}>
            <Grid container spacing={1}>
              {quotationNumber && (
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">เลขที่เอกสาร</Typography>
                  <Typography variant="body2" fontWeight={700}>{quotationNumber}</Typography>
                </Grid>
              )}
              {workName && (
                <Grid item xs={12} md={8}>
                  <Typography variant="caption" color="text.secondary">ใบงานหลัก</Typography>
                  <Typography variant="body1" fontWeight={700}>{workName}</Typography>
                </Grid>
              )}
            </Grid>
          </InfoCard>
        )}
      </Box>
    </Section>
  );
};

export default CustomerSection;
