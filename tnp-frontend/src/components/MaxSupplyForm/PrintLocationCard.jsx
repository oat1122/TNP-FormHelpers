import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Collapse,
} from '@mui/material';
import {
  Print,
} from '@mui/icons-material';

const PrintLocationCard = ({ formData, onPrintLocationChange }) => {
  return (
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
  );
};

export default PrintLocationCard; 