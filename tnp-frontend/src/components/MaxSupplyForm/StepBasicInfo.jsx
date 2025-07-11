import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
  CardMedia,
  CircularProgress,
} from '@mui/material';
import {
  Assignment,
  Person,
  Schedule,
  Image,
  Info,
  Warning,
  Refresh,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const StepBasicInfo = ({ 
  formData, 
  errors, 
  worksheetOptions, 
  worksheetLoading, 
  selectedWorksheet,
  onInputChange, 
  onWorksheetSelect, 
  onRefreshWorksheets,
  priorityLevels 
}) => {
  return (
    <Grid container spacing={3}>
      {/* Worksheet Selection */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
              เลือก Worksheet
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Autocomplete
                value={selectedWorksheet}
                onChange={(event, newValue) => onWorksheetSelect(newValue)}
                options={worksheetOptions}
                getOptionLabel={(option) => option.label || ''}
                loading={worksheetLoading}
                sx={{ flexGrow: 1 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="เลือก Worksheet เพื่อกรอกข้อมูลอัตโนมัติจาก WorkSheet"
                    error={!!errors.worksheet_id}
                    helperText={errors.worksheet_id}
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {worksheetLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  // Debug log to check pattern_sizes structure
                  if (option.pattern_sizes) {
                    console.log(`Dropdown option ${option.label} pattern_sizes:`, option.pattern_sizes);
                  }
                  
                  return (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body1">{option.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.type_shirt ? `ประเภท: ${option.type_shirt}` : 'ไม่ระบุประเภท'} | 
                          {option.total_quantity ? ` ${option.total_quantity} ตัว` : ' จำนวนไม่ระบุ'} | 
                          ผ้า: {option.fabric_name || 'ไม่ระบุ'} ({option.fabric_color || 'ไม่ระบุสี'})
                          {option.due_date && ` | ครบกำหนด: ${dayjs(option.due_date).format('DD/MM/YYYY')}`}
                        </Typography>
                        {option.screen_detail && (
                          <Typography variant="body2" color="primary" sx={{ fontSize: '0.75rem' }}>
                            การพิมพ์: {option.screen_detail}
                          </Typography>
                        )}
                        {/* Display print points information */}
                        {(option.screen_point || option.screen_dft || option.screen_embroider || option.screen_flex) && (
                          <Typography variant="body2" color="secondary" sx={{ fontSize: '0.75rem' }}>
                            จุดพิมพ์: 
                            {option.screen_point && ` Screen(${option.screen_point})`}
                            {option.screen_dft && ` DTF(${option.screen_dft})`}
                            {option.screen_embroider && ` ปัก(${option.screen_embroider})`}
                            {option.screen_flex && ` Flex(${option.screen_flex})`}
                          </Typography>
                        )}
                        {/* Display pattern sizes summary with quantities */}
                        {(option.pattern_sizes || option.total_quantity) && (
                          <Typography variant="body2" color="info.main" sx={{ fontSize: '0.75rem' }}>
                            {option.pattern_sizes ? 'ไซส์: ' : 'จำนวนรวม: '}
                            {(() => {
                              if (!option.pattern_sizes) {
                                return option.total_quantity ? `${option.total_quantity} ตัว` : 'ไม่ระบุ';
                              }
                              
                              let sizeDisplay = '';
                              
                              // Handle array format
                              if (Array.isArray(option.pattern_sizes) && option.pattern_sizes.length > 0) {
                                const sizeWithQuantity = option.pattern_sizes
                                  .map(s => {
                                    const sizeName = (s.size_name || s.size || s.name || '').toString().toUpperCase();
                                    const quantity = s.quantity || 0;
                                    return sizeName && quantity > 0 ? `${sizeName}(${quantity})` : null;
                                  })
                                  .filter(Boolean);
                                
                                if (sizeWithQuantity.length > 0) {
                                  sizeDisplay = sizeWithQuantity.join(', ');
                                } else {
                                  // Fallback: show sizes without quantity if quantities are missing
                                  const sizes = option.pattern_sizes
                                    .map(s => s.size_name || s.size || s.name)
                                    .filter(Boolean)
                                    .map(s => s.toString().toUpperCase());
                                  if (sizes.length > 0) {
                                    sizeDisplay = sizes.join(', ');
                                  }
                                }
                              }
                              
                              // Handle object format with men/women
                              if (typeof option.pattern_sizes === 'object' && !Array.isArray(option.pattern_sizes)) {
                                const genderSizes = [];
                                
                                if (option.pattern_sizes.men && Array.isArray(option.pattern_sizes.men) && option.pattern_sizes.men.length > 0) {
                                  const menSizes = option.pattern_sizes.men
                                    .map(s => {
                                      const sizeName = (s.size_name || s.size || s.name || '').toString().toUpperCase();
                                      const quantity = s.quantity || 0;
                                      return sizeName && quantity > 0 ? `${sizeName}(${quantity})` : null;
                                    })
                                    .filter(Boolean);
                                  
                                  if (menSizes.length > 0) {
                                    genderSizes.push(`ชาย: ${menSizes.join(', ')}`);
                                  } else {
                                    // Fallback: show men sizes without quantity
                                    const menSizesOnly = option.pattern_sizes.men
                                      .map(s => s.size_name || s.size || s.name)
                                      .filter(Boolean)
                                      .map(s => s.toString().toUpperCase());
                                    if (menSizesOnly.length > 0) {
                                      genderSizes.push(`ชาย: ${menSizesOnly.join(', ')}`);
                                    }
                                  }
                                }
                                
                                if (option.pattern_sizes.women && Array.isArray(option.pattern_sizes.women) && option.pattern_sizes.women.length > 0) {
                                  const womenSizes = option.pattern_sizes.women
                                    .map(s => {
                                      const sizeName = (s.size_name || s.size || s.name || '').toString().toUpperCase();
                                      const quantity = s.quantity || 0;
                                      return sizeName && quantity > 0 ? `${sizeName}(${quantity})` : null;
                                    })
                                    .filter(Boolean);
                                  
                                  if (womenSizes.length > 0) {
                                    genderSizes.push(`หญิง: ${womenSizes.join(', ')}`);
                                  } else {
                                    // Fallback: show women sizes without quantity
                                    const womenSizesOnly = option.pattern_sizes.women
                                      .map(s => s.size_name || s.size || s.name)
                                      .filter(Boolean)
                                      .map(s => s.toString().toUpperCase());
                                    if (womenSizesOnly.length > 0) {
                                      genderSizes.push(`หญิง: ${womenSizesOnly.join(', ')}`);
                                    }
                                  }
                                }
                                
                                sizeDisplay = genderSizes.join(' | ');
                              }
                              
                              return sizeDisplay || (option.total_quantity ? `${option.total_quantity} ตัว` : 'ไม่ระบุ');
                            })()}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
                noOptionsText="ไม่พบ Worksheet จาก NewWorksNet"
              />
              <Button 
                variant="outlined" 
                onClick={onRefreshWorksheets} 
                title="โหลดข้อมูล Worksheet จาก NewWorksNet"
                sx={{ height: 56 }}
              >
                <Refresh />
              </Button>
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>1.</strong> คลิกปุ่มรีเฟรช <Refresh fontSize="small" /> เพื่อดึงข้อมูลล่าสุดจากระบบ NewWorkSheet<br/>
                <strong>2.</strong> เลือกรายการที่ต้องการจากรายการ NewWorkSheet ด้านบน<br/>
                <strong>3.</strong> ระบบจะกรอกข้อมูลให้อัตโนมัติตามข้อมูลที่มีใน NewWorkSheet<br/>
                
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Grid>

      {/* Basic Information */}
      <Grid item xs={12}>
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
      </Grid>

      {/* Sample Image */}
      {formData.sample_image && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Image sx={{ mr: 1, verticalAlign: 'middle' }} />
                รูปตัวอย่างเสื้อ
              </Typography>
              <CardMedia
                component="img"
                height="200"
                image={formData.sample_image}
                alt="Sample shirt"
                sx={{ objectFit: 'contain', borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* NewWorksNet Additional Info */}
      {(formData.fabric_info || formData.pattern_info || formData.newworks_code) && (
        <Grid item xs={12}>
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
        </Grid>
      )}

      {/* Dates */}
      <Grid item xs={12}>
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
      </Grid>
    </Grid>
  );
};

export default StepBasicInfo; 