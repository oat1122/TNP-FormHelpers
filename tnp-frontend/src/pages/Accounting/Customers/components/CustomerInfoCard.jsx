import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const CustomerInfoCard = ({ customer }) => {
  if (!customer) return null;

  return (
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
  );
};

export default CustomerInfoCard;
