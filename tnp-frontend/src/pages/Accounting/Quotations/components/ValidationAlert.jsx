import React from 'react';
import {
  Alert, AlertTitle, Typography, Card, CardContent, Stack
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon, Warning as WarningIcon
} from '@mui/icons-material';

export default function ValidationAlert({ isValid, errors, validationErrors }) {
  // If no items, don't show validation
  if (!errors && validationErrors.length === 0) {
    return null;
  }

  // Show validation errors if any
  if (validationErrors.length > 0) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>ข้อผิดพลาดในการกรอกข้อมูล</AlertTitle>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          {validationErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </Alert>
    );
  }

  // Show form validation status
  if (!isValid) {
    return (
      <Card sx={{ mt: 2, bgcolor: 'warning.light' }}>
        <CardContent>
          <Typography variant="h6" color="warning.dark" gutterBottom>
            <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            ตรวจสอบข้อมูลก่อนดำเนินการต่อ
          </Typography>
          <Stack spacing={1}>
            {Object.keys(errors).map(field => (
              errors[field] && (
                <Typography key={field} variant="body2" color="text.secondary">
                  • {errors[field]?.message}
                </Typography>
              )
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Success validation
  return (
    <Card sx={{ mt: 2, bgcolor: 'success.light' }}>
      <CardContent>
        <Typography variant="h6" color="success.dark">
          <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          ข้อมูลครบถ้วน พร้อมดำเนินการต่อ
        </Typography>
      </CardContent>
    </Card>
  );
}
