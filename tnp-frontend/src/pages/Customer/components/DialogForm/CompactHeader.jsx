import React from 'react';
import { Box, Grid, TextField, Select, InputLabel } from '@mui/material';

function CompactHeader() {
  return (
    <Box sx={{
      mb: 2,
      p: 2,
      bgcolor: 'grey.50',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <Grid container spacing={1.5} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField size="small" label="ชื่อบริษัท" fullWidth required variant="outlined" />
        </Grid>
        <Grid item xs={6} md={3}>
          <Select size="small" label="ประเภทธุรกิจ" fullWidth required />
        </Grid>
        <Grid item xs={6} md={3}>
          <Select size="small" label="ช่องทางติดต่อ" fullWidth required />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField size="small" label="วันที่สร้าง" disabled fullWidth />
        </Grid>
      </Grid>
    </Box>
  );
}

export default CompactHeader;
