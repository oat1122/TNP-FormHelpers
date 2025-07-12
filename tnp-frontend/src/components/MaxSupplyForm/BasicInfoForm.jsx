import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import {
  Person,
} from '@mui/icons-material';

const BasicInfoForm = ({ 
  formData, 
  errors, 
  priorityLevels, 
  onInputChange 
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
          ข้อมูลพื้นฐาน
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="ชื่องาน"
              value={formData.title}
              onChange={(e) => onInputChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="ชื่อลูกค้า"
              value={formData.customer_name}
              onChange={(e) => onInputChange('customer_name', e.target.value)}
              error={!!errors.customer_name}
              helperText={errors.customer_name}
              fullWidth
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>ระดับความสำคัญ</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => onInputChange('priority', e.target.value)}
                label="ระดับความสำคัญ"
              >
                {priorityLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: level.color,
                          borderRadius: '50%',
                          mr: 1,
                        }}
                      />
                      {level.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm; 