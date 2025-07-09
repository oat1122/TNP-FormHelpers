import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  LinearProgress,
  Tab,
  Tabs,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  getProductionTypeColor,
  getStatusColor,
  getStatusLabel,
  getProductionTypeIcon,
  getProductionTypeLabel,
  getPriorityLabel,
  getPriorityColor,
  formatDate,
  calculatePercentage
} from '../../utils/maxSupplyUtils';
import { FaTimes, FaEdit, FaCalendarAlt, FaUserAlt, FaTshirt, FaClipboardList } from 'react-icons/fa';

/**
 * Quick view modal for MaxSupply details
 */
const MaxSupplyQuickView = ({ open, onClose, maxSupply }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  
  if (!maxSupply) return null;
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleEdit = () => {
    navigate(`/max-supply/edit/${maxSupply.id}`);
  };
  
  const completionPercentage = calculatePercentage(maxSupply.completed_quantity, maxSupply.total_quantity);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: getProductionTypeColor(maxSupply.production_type, 0.1),
        borderBottom: `4px solid ${getProductionTypeColor(maxSupply.production_type)}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getProductionTypeIcon(maxSupply.production_type, 24)}
          <Typography variant="h6" component="div">
            {maxSupply.code}: {maxSupply.title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} edge="end" size="large">
          <FaTimes />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {/* Basic Info */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FaUserAlt color={theme.palette.text.secondary} />
              <Typography variant="subtitle1" fontWeight="bold">
                ข้อมูลลูกค้า
              </Typography>
            </Box>
            <Typography variant="body1">
              {maxSupply.customer_name}
            </Typography>
            {maxSupply.worksheet && (
              <Typography variant="caption" color="text.secondary">
                จาก Worksheet: {maxSupply.worksheet.code || '-'}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FaCalendarAlt color={theme.palette.text.secondary} />
              <Typography variant="subtitle1" fontWeight="bold">
                กำหนดการ
              </Typography>
            </Box>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  เริ่ม:
                </Typography>
                <Typography variant="body2">
                  {formatDate(maxSupply.start_date)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  คาดว่าจะเสร็จ:
                </Typography>
                <Typography variant="body2">
                  {formatDate(maxSupply.expected_completion_date)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  ครบกำหนด:
                </Typography>
                <Typography variant="body2" fontWeight="bold" color={
                  new Date(maxSupply.due_date) < new Date() && maxSupply.status !== 'completed'
                    ? 'error.main'
                    : 'text.primary'
                }>
                  {formatDate(maxSupply.due_date)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  เสร็จจริง:
                </Typography>
                <Typography variant="body2">
                  {maxSupply.actual_completion_date ? formatDate(maxSupply.actual_completion_date) : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">
              สถานะ:
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={getStatusLabel(maxSupply.status)}
                sx={{
                  bgcolor: getStatusColor(maxSupply.status) + '20',
                  color: getStatusColor(maxSupply.status),
                  fontWeight: 'medium',
                }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">
              ความสำคัญ:
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={getPriorityLabel(maxSupply.priority)}
                sx={{
                  bgcolor: getPriorityColor(maxSupply.priority) + '20',
                  color: getPriorityColor(maxSupply.priority),
                  fontWeight: 'medium',
                }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">
              ประเภทการผลิต:
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                icon={getProductionTypeIcon(maxSupply.production_type)}
                label={getProductionTypeLabel(maxSupply.production_type)}
                sx={{
                  bgcolor: getProductionTypeColor(maxSupply.production_type) + '20',
                  color: getProductionTypeColor(maxSupply.production_type),
                  fontWeight: 'medium',
                }}
              />
            </Box>
          </Grid>
        </Grid>
        
        {/* Tabs for more details */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="max supply details tabs">
              <Tab label="รายละเอียดการผลิต" id="tab-0" />
              <Tab label="ความคืบหน้า" id="tab-1" />
              {maxSupply.notes && <Tab label="หมายเหตุ" id="tab-2" />}
            </Tabs>
          </Box>
          
          {/* Production Details Tab */}
          <div role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0">
            {tabValue === 0 && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <FaTshirt color={theme.palette.text.secondary} />
                      <Typography variant="subtitle1" fontWeight="bold">
                        ข้อมูลเสื้อ
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        ประเภทเสื้อ:
                      </Typography>
                      <Typography variant="body1">
                        {maxSupply.shirt_type === 'polo' && 'เสื้อโปโล'}
                        {maxSupply.shirt_type === 't-shirt' && 'เสื้อยืด'}
                        {maxSupply.shirt_type === 'hoodie' && 'เสื้อฮู้ด'}
                        {maxSupply.shirt_type === 'tank-top' && 'เสื้อกล้าม'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        จำนวนทั้งหมด:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {maxSupply.total_quantity} ตัว
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <FaClipboardList color={theme.palette.text.secondary} />
                      <Typography variant="subtitle1" fontWeight="bold">
                        ขนาด
                      </Typography>
                    </Box>
                    
                    <Box>
                      {maxSupply.sizes ? (
                        <Grid container spacing={1}>
                          {Object.entries(JSON.parse(typeof maxSupply.sizes === 'string' ? maxSupply.sizes : JSON.stringify(maxSupply.sizes))).map(([size, quantity]) => (
                            <Grid item key={size}>
                              <Chip
                                label={`${size}: ${quantity}`}
                                variant="outlined"
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body2">
                          ไม่มีข้อมูลขนาด
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      จุดพิมพ์
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ p: 2, bgcolor: getProductionTypeColor('screen', 0.1), borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            สกรีน
                          </Typography>
                          <Typography variant="h5" fontWeight="bold" color={getProductionTypeColor('screen')}>
                            {maxSupply.screen_points || 0}
                          </Typography>
                          <Typography variant="caption">
                            จุด
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Box sx={{ p: 2, bgcolor: getProductionTypeColor('dtf', 0.1), borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            DTF
                          </Typography>
                          <Typography variant="h5" fontWeight="bold" color={getProductionTypeColor('dtf')}>
                            {maxSupply.dtf_points || 0}
                          </Typography>
                          <Typography variant="caption">
                            จุด
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Box sx={{ p: 2, bgcolor: getProductionTypeColor('sublimation', 0.1), borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            ซับลิเมชั่น
                          </Typography>
                          <Typography variant="h5" fontWeight="bold" color={getProductionTypeColor('sublimation')}>
                            {maxSupply.sublimation_points || 0}
                          </Typography>
                          <Typography variant="caption">
                            จุด
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            )}
          </div>
          
          {/* Progress Tab */}
          <div role="tabpanel" hidden={tabValue !== 1} id="tabpanel-1">
            {tabValue === 1 && (
              <Box sx={{ pt: 2 }}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      ความคืบหน้า
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {completionPercentage}%
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={completionPercentage} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      bgcolor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: completionPercentage < 100 
                          ? theme.palette.primary.main
                          : theme.palette.success.main
                      }
                    }} 
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      ผลิตแล้ว: {maxSupply.completed_quantity} ตัว
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      จาก {maxSupply.total_quantity} ตัว
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Activity logs would go here if available */}
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    ประวัติการทำงาน
                  </Typography>
                  
                  {maxSupply.activities && maxSupply.activities.length > 0 ? (
                    maxSupply.activities.map((activity, index) => (
                      <Box key={index} sx={{ 
                        mb: 1, 
                        p: 1, 
                        borderLeft: `3px solid ${theme.palette.primary.main}`,
                        bgcolor: '#f5f5f5',
                        borderRadius: '0 4px 4px 0'
                      }}>
                        <Typography variant="body2" fontWeight="medium">
                          {activity.action}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            โดย: {activity.user?.name || 'ไม่ระบุ'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.created_at).toLocaleString('th-TH')}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      ไม่มีประวัติการทำงาน
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </div>
          
          {/* Notes Tab */}
          {maxSupply.notes && (
            <div role="tabpanel" hidden={tabValue !== 2} id="tabpanel-2">
              {tabValue === 2 && (
                <Box sx={{ pt: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    หมายเหตุ
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {maxSupply.notes}
                    </Typography>
                  </Box>
                  
                  {maxSupply.special_instructions && (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                        คำแนะนำพิเศษ
                      </Typography>
                      <Box sx={{ p: 2, bgcolor: '#fff4e5', borderRadius: 1, border: '1px dashed #f59e0b' }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {maxSupply.special_instructions}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              )}
            </div>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>ปิด</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleEdit}
          startIcon={<FaEdit />}
        >
          แก้ไข
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaxSupplyQuickView;
