import React from 'react';
import {
  Box, Typography, Card, CardContent, Grid
} from '@mui/material';

export default function TotalsSummary({ subtotal, taxAmount, taxRate, total }) {
  return (
    <Card>
      <CardContent>
        <Grid container spacing={0}>
          <Grid item xs={12} sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between">
              <Typography>รวมเป็นเงิน</Typography>
              <Typography fontWeight="bold">฿{subtotal.toLocaleString()}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between">
              <Typography>ภาษีมูลค่าเพิ่ม {taxRate}%</Typography>
              <Typography>฿{taxAmount.toLocaleString()}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6" fontWeight="bold">รวมทั้งสิ้น</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                ฿{total.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
