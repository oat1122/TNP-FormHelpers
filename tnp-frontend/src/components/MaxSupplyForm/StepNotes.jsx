import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
} from '@mui/material';
import {
  Note,
  CheckCircle,
} from '@mui/icons-material';

const StepNotes = ({ formData, errors, onInputChange }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Note sx={{ mr: 1, verticalAlign: 'middle' }} />
              หมายเหตุและข้อมูลเพิ่มเติม
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="หมายเหตุทั่วไป"
                  value={formData.notes}
                  onChange={(e) => onInputChange('notes', e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="หมายเหตุเพิ่มเติม..."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="คำแนะนำพิเศษ"
                  value={formData.special_instructions}
                  onChange={(e) => onInputChange('special_instructions', e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="คำแนะนำพิเศษสำหรับการผลิต..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Summary */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
              สรุปข้อมูล
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2"><strong>ชื่องาน:</strong> {formData.title}</Typography>
                <Typography variant="body2"><strong>ลูกค้า:</strong> {formData.customer_name}</Typography>
                <Typography variant="body2"><strong>ประเภทเสื้อ:</strong> {formData.shirt_type}</Typography>
                <Typography variant="body2"><strong>จำนวนรวม:</strong> {formData.total_quantity} ตัว</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2"><strong>วันที่เริ่ม:</strong> {formData.start_date?.format('DD/MM/YYYY')}</Typography>
                <Typography variant="body2"><strong>วันที่คาดว่าจะเสร็จ:</strong> {formData.expected_completion_date?.format('DD/MM/YYYY')}</Typography>
                <Typography variant="body2"><strong>วันที่ครบกำหนด:</strong> {formData.due_date?.format('DD/MM/YYYY')}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StepNotes; 