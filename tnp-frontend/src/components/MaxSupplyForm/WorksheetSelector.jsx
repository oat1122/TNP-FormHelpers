import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Autocomplete,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Assignment,
  Refresh,
} from '@mui/icons-material';
import dayjs from 'dayjs';

const WorksheetSelector = ({ 
  selectedWorksheet,
  worksheetOptions,
  worksheetLoading,
  onWorksheetSelect,
  onRefreshWorksheets,
  errors 
}) => {
  return (
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
              // Debug log to check pattern_sizes structure (temporarily enabled for debugging)
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
  );
};

export default WorksheetSelector; 