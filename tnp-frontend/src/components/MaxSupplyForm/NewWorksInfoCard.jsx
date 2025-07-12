import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';
import {
  Info,
} from '@mui/icons-material';

const NewWorksInfoCard = ({ formData }) => {
  // Only show if there's NewWorks data
  if (!formData.fabric_info && !formData.pattern_info && !formData.newworks_code) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
          ข้อมูลเพิ่มเติมจาก NewWorksNet
        </Typography>
        
        <Grid container spacing={2}>
          {formData.newworks_code && (
            <Grid item xs={12} md={4}>
              <Typography variant="body2">
                <strong>รหัสงาน:</strong> {formData.newworks_code}
              </Typography>
            </Grid>
          )}
          
          {formData.fabric_info?.fabric_name && (
            <Grid item xs={12} md={4}>
              <Typography variant="body2">
                <strong>ผ้า:</strong> {formData.fabric_info.fabric_name}
                {formData.fabric_info.fabric_color && ` (${formData.fabric_info.fabric_color})`}
                {formData.fabric_info.fabric_factory && ` - โรงงาน: ${formData.fabric_info.fabric_factory}`}
              </Typography>
            </Grid>
          )}
          
          {formData.pattern_info?.pattern_name && (
            <Grid item xs={12} md={4}>
              <Typography variant="body2">
                <strong>แพทเทิร์น:</strong> {formData.pattern_info.pattern_name}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default NewWorksInfoCard; 