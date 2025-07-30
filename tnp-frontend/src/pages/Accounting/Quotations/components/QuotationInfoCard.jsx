import React from 'react';
import {
  Card, CardContent, Typography, Grid
} from '@mui/material';

export default function QuotationInfoCard({ pricingDetails, customer }) {
  if (!pricingDetails && !customer) {
    return null;
  }

  return (
    <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          สรุปข้อมูล
        </Typography>
        <Grid container spacing={2}>
          {pricingDetails && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">จากการขอราคา:</Typography>
              <Typography variant="body2">
                {pricingDetails.pr_no} - {pricingDetails.pr_work_name}
              </Typography>
            </Grid>
          )}
          {customer && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">ลูกค้า:</Typography>
              <Typography variant="body2">
                {customer.company_name || customer.name}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}
