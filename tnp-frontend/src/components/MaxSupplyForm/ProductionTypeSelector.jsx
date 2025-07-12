import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import {
  Build,
} from '@mui/icons-material';

const ProductionTypeSelector = ({ formData, errors, productionTypes, onInputChange }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
          ประเภทการพิมพ์
        </Typography>
        
        <FormControl fullWidth error={!!errors.production_type}>
          <InputLabel>ประเภทการพิมพ์</InputLabel>
          <Select
            value={formData.production_type}
            onChange={(e) => onInputChange('production_type', e.target.value)}
            label="ประเภทการพิมพ์"
          >
            {productionTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: type.color,
                      borderRadius: '50%',
                      mr: 1,
                    }}
                  />
                  {type.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
          {errors.production_type && (
            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
              {errors.production_type}
            </Typography>
          )}
        </FormControl>
      </CardContent>
    </Card>
  );
};

export default ProductionTypeSelector; 