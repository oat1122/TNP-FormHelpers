import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
  Chip,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Collapse,
} from '@mui/material';
import {
  Category,
  Build,
  Straighten,
  Print,
  Lock,
} from '@mui/icons-material';

const StepProductionInfo = ({ 
  formData, 
  errors, 
  shirtTypes, 
  productionTypes,
  sizeOptions,
  selectedWorksheet,
  onInputChange, 
  onSizeBreakdown,
  onSizeQuantityChange,
  onPrintLocationChange 
}) => {
  // Check if data is auto-filled from worksheet
  const isAutoFilled = Boolean(selectedWorksheet && formData.worksheet_id);
  
  return (
    <Grid container spacing={3}>
      {/* Shirt Type */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
              ประเภทเสื้อ 
            </Typography>
            
            <FormControl fullWidth error={!!errors.shirt_type}>
              <InputLabel>ประเภทเสื้อ</InputLabel>
              <Select
                value={formData.shirt_type}
                onChange={(e) => onInputChange('shirt_type', e.target.value)}
                label="ประเภทเสื้อ"
              >
                {shirtTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.shirt_type && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.shirt_type}
                </Typography>
              )}
            </FormControl>
          </CardContent>
        </Card>
      </Grid>

      {/* Production Type */}
      <Grid item xs={12} md={6}>
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
      </Grid>

      {/* Work Calculation Section */}
      {isAutoFilled && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
                การคำนวณงานแต่ละประเภทการพิมพ์
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>การคำนวณงานจาก WorkSheet:</strong><br/>
                  {(() => {
                    const workCalculations = [];
                    
                    if (formData.print_locations?.screen?.enabled) {
                      const points = formData.print_locations.screen.points;
                      const totalWork = points * formData.total_quantity;
                      workCalculations.push(`Screen Printing ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน Screen Printing มีงาน ${totalWork}`);
                    }
                    
                    if (formData.print_locations?.dtf?.enabled) {
                      const points = formData.print_locations.dtf.points;
                      const totalWork = points * formData.total_quantity;
                      workCalculations.push(`DTF (Direct Film Transfer) ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน DTF มีงาน ${totalWork}`);
                    }
                    
                    if (formData.print_locations?.sublimation?.enabled) {
                      const points = formData.print_locations.sublimation.points;
                      const totalWork = points * formData.total_quantity;
                      workCalculations.push(`Sublimation/Flex ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน Sublimation/Flex มีงาน ${totalWork}`);
                    }
                    
                    if (formData.print_locations?.embroidery?.enabled) {
                      const points = formData.print_locations.embroidery.points;
                      const totalWork = points * formData.total_quantity;
                      workCalculations.push(`Embroidery (ปัก) ${points} จุด เสื้อทั้งหมด ${formData.total_quantity} ตัว (${points}×${formData.total_quantity}=${totalWork}) งาน Embroidery มีงาน ${totalWork}`);
                    }
                    
                    if (workCalculations.length === 0) {
                      return 'ไม่พบข้อมูลการพิมพ์/ปัก';
                    }
                    
                    return workCalculations.map((calc, index) => (
                      <span key={index}>
                        {calc}
                        {index < workCalculations.length - 1 && <br/>}
                      </span>
                    ));
                  })()}
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Size Selection */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Straighten sx={{ mr: 1, verticalAlign: 'middle' }} />
              ขนาดและจำนวน
              {isAutoFilled && (
                <Lock sx={{ ml: 1, verticalAlign: 'middle', color: 'warning.main' }} />
              )}
            </Typography>
            
            {/* Auto-fill warning */}
            {isAutoFilled && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>ข้อมูลนี้ถูกกำหนดจาก NewWorksNet:</strong><br/>
                  
                </Typography>
              </Alert>
            )}
            
            <Autocomplete
              multiple
              value={formData.sizes}
              onChange={(event, newValue) => !isAutoFilled && onSizeBreakdown(newValue)}
              options={sizeOptions}
              disabled={isAutoFilled}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                    onDelete={isAutoFilled ? undefined : getTagProps({ index }).onDelete}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="เลือกไซส์ (Auto Fill จาก NewWorksNet pattern_sizes)"
                  placeholder={isAutoFilled ? "ไซส์ถูกกำหนดจาก NewWorksNet (ไม่สามารถแก้ไขได้)" : "เลือกไซส์ที่ต้องการ"}
                  error={!!errors.sizes}
                  helperText={errors.sizes || (isAutoFilled ? "ไซส์ถูกดึงมาจาก NewWorksNet และไม่สามารถแก้ไขได้" : "ไซส์จะถูกดึงมาจาก pattern_sizes (men/women) ใน NewWorksNet")}
                />
              )}
            />
            
            {/* Show pattern sizes info if available */}
            {formData.size_breakdown.some(item => item.gender) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>ข้อมูลไซส์จาก NewWorksNet pattern_sizes:</strong>
                  <br/>
                  {formData.size_breakdown.filter(item => item.gender === 'men').length > 0 && (
                    <>ชาย: {formData.size_breakdown.filter(item => item.gender === 'men').map(item => `${item.size}(${item.quantity})`).join(', ')}<br/></>
                  )}
                  {formData.size_breakdown.filter(item => item.gender === 'women').length > 0 && (
                    <>หญิง: {formData.size_breakdown.filter(item => item.gender === 'women').map(item => `${item.size}(${item.quantity})`).join(', ')}</>
                  )}
                </Typography>
              </Alert>
            )}
            
            {/* Size Breakdown Table */}
            {formData.size_breakdown.length > 0 && (
              <TableContainer sx={{ mt: 2 }}>
                <Table>
                  <TableBody>
                    {formData.size_breakdown.map((item, index) => (
                      <TableRow key={`${item.size}-${item.gender || 'unisex'}-${index}`}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip 
                              label={item.size} 
                              variant="outlined" 
                              color={item.gender === 'men' ? 'primary' : item.gender === 'women' ? 'secondary' : 'default'}
                              size="small"
                            />
                            {item.gender && (
                              <Typography variant="caption" color="text.secondary">
                                {item.gender === 'men' ? 'ชาย' : item.gender === 'women' ? 'หญิง' : ''}
                              </Typography>
                            )}
                            {item.details?.chest && (
                              <Typography variant="caption" color="text.secondary">
                                (อก: {item.details.chest}")
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => !isAutoFilled && onSizeQuantityChange(index, parseInt(e.target.value) || 0)}
                            inputProps={{ min: 0, readOnly: isAutoFilled }}
                            size="small"
                            sx={{ width: 80 }}
                            disabled={isAutoFilled}
                            
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>รวม</strong></TableCell>
                      <TableCell><strong>{formData.total_quantity} ตัว</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Print Locations */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Print sx={{ mr: 1, verticalAlign: 'middle' }} />
              จุดพิมพ์
            </Typography>
            
            <Grid container spacing={2}>
              {/* Screen Printing */}
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      📺 Screen Printing
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>เปิดใช้งาน</InputLabel>
                      <Select
                        value={formData.print_locations.screen.enabled}
                        onChange={(e) => onPrintLocationChange('screen', 'enabled', e.target.value)}
                        label="เปิดใช้งาน"
                      >
                        <MenuItem value={false}>ไม่ใช้</MenuItem>
                        <MenuItem value={true}>ใช้</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Collapse in={formData.print_locations.screen.enabled}>
                      <TextField
                        label="ตำแหน่งพิมพ์"
                        value={formData.print_locations.screen.position}
                        onChange={(e) => onPrintLocationChange('screen', 'position', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                        placeholder="เช่น หน้า, หลัง, แขน"
                      />
                      <TextField
                        label="จำนวนจุดพิมพ์"
                        type="number"
                        value={formData.print_locations.screen.points}
                        onChange={(e) => onPrintLocationChange('screen', 'points', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                        helperText="จำนวนจุดที่ต้องสกรีน (screen_point)"
                      />
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>

              {/* DTF */}
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      📱 DTF (Direct to Film)
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>เปิดใช้งาน</InputLabel>
                      <Select
                        value={formData.print_locations.dtf.enabled}
                        onChange={(e) => onPrintLocationChange('dtf', 'enabled', e.target.value)}
                        label="เปิดใช้งาน"
                      >
                        <MenuItem value={false}>ไม่ใช้</MenuItem>
                        <MenuItem value={true}>ใช้</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Collapse in={formData.print_locations.dtf.enabled}>
                      <TextField
                        label="ตำแหน่งพิมพ์"
                        value={formData.print_locations.dtf.position}
                        onChange={(e) => onPrintLocationChange('dtf', 'position', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                        placeholder="เช่น หน้า, หลัง, แขน"
                      />
                      <TextField
                        label="จำนวนจุดพิมพ์"
                        type="number"
                        value={formData.print_locations.dtf.points}
                        onChange={(e) => onPrintLocationChange('dtf', 'points', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                        helperText="จำนวนจุดที่ต้อง DTF (screen_dft)"
                      />
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sublimation/Flex */}
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      ⚽ Sublimation/Flex
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>เปิดใช้งาน</InputLabel>
                      <Select
                        value={formData.print_locations.sublimation.enabled}
                        onChange={(e) => onPrintLocationChange('sublimation', 'enabled', e.target.value)}
                        label="เปิดใช้งาน"
                      >
                        <MenuItem value={false}>ไม่ใช้</MenuItem>
                        <MenuItem value={true}>ใช้</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Collapse in={formData.print_locations.sublimation.enabled}>
                      <TextField
                        label="ตำแหน่งพิมพ์"
                        value={formData.print_locations.sublimation.position}
                        onChange={(e) => onPrintLocationChange('sublimation', 'position', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                        placeholder="เช่น หน้า, หลัง, แขน"
                      />
                      <TextField
                        label="จำนวนจุดพิมพ์"
                        type="number"
                        value={formData.print_locations.sublimation.points}
                        onChange={(e) => onPrintLocationChange('sublimation', 'points', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                        helperText="จำนวนจุด Sublimation/Flex (screen_flex)"
                      />
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>

              {/* Embroidery */}
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      🧵 Embroidery (ปัก)
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>เปิดใช้งาน</InputLabel>
                      <Select
                        value={formData.print_locations.embroidery.enabled}
                        onChange={(e) => onPrintLocationChange('embroidery', 'enabled', e.target.value)}
                        label="เปิดใช้งาน"
                      >
                        <MenuItem value={false}>ไม่ใช้</MenuItem>
                        <MenuItem value={true}>ใช้</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Collapse in={formData.print_locations.embroidery.enabled}>
                      <TextField
                        label="ตำแหน่งปัก"
                        value={formData.print_locations.embroidery.position}
                        onChange={(e) => onPrintLocationChange('embroidery', 'position', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                        placeholder="เช่น หน้า, หลัง, แขน"
                      />
                      <TextField
                        label="จำนวนจุดปัก"
                        type="number"
                        value={formData.print_locations.embroidery.points}
                        onChange={(e) => onPrintLocationChange('embroidery', 'points', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                        helperText="จำนวนจุดที่ต้องปัก (screen_embroider)"
                      />
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StepProductionInfo; 