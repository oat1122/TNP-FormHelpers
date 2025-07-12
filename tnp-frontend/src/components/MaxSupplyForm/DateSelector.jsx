import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import {
  Schedule,
  Warning,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const DateSelector = ({ formData, errors, onInputChange }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
          กำหนดเวลา
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <DatePicker
              label="วันที่เริ่มต้น (วันที่ปัจจุบัน)"
              value={formData.start_date}
              onChange={(date) => onInputChange('start_date', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.start_date,
                  helperText: errors.start_date || "วันที่เริ่มต้นงาน (ตั้งเป็นวันที่ปัจจุบัน)",
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <DatePicker
              label="วันที่คาดว่าจะเสร็จ"
              value={formData.expected_completion_date}
              onChange={(date) => onInputChange('expected_completion_date', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.expected_completion_date,
                  helperText: errors.expected_completion_date,
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <DatePicker
              label="วันที่ครบกำหนด"
              value={formData.due_date}
              onChange={(date) => onInputChange('due_date', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.due_date,
                  helperText: errors.due_date || "วันที่ครบกำหนดจาก NewWorksNet",
                },
              }}
            />
          </Grid>
        </Grid>
        
        {formData.expected_completion_date && formData.due_date && 
         formData.expected_completion_date.isAfter(formData.due_date) && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Warning sx={{ mr: 1 }} />
            วันที่คาดว่าจะเสร็จเกินกำหนดส่งมอบจาก NewWorksNet กรุณาตรวจสอบอีกครั้ง
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DateSelector; 