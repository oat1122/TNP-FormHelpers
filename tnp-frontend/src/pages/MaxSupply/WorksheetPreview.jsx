import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import { 
  FaFileAlt, 
  FaUserAlt, 
  FaCalendarAlt, 
  FaTag,
  FaBox
} from 'react-icons/fa';
import dayjs from 'dayjs';
import { getProductionTypeLabel } from '../../utils/maxSupplyUtils';

const WorksheetPreview = ({ worksheet, loading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!worksheet && !loading) {
    return null;
  }
  
  return (
    <Paper sx={{ p: 2, mt: 2 }} elevation={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FaFileAlt style={{ marginRight: theme.spacing(1) }} />
        <Typography variant="h6">
          {loading ? (
            <Skeleton width={200} />
          ) : (
            `Worksheet Preview: ${worksheet?.code || ''}`
          )}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FaTag size={14} style={{ marginRight: theme.spacing(1) }} />
            <Typography variant="subtitle2" component="span">
              ชื่องาน:
            </Typography>
          </Box>
          {loading ? (
            <Skeleton width="100%" />
          ) : (
            <Typography variant="body2" sx={{ pl: 3 }}>
              {worksheet?.name || '-'}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FaUserAlt size={14} style={{ marginRight: theme.spacing(1) }} />
            <Typography variant="subtitle2" component="span">
              ลูกค้า:
            </Typography>
          </Box>
          {loading ? (
            <Skeleton width="100%" />
          ) : (
            <Typography variant="body2" sx={{ pl: 3 }}>
              {worksheet?.customer?.name || '-'}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FaCalendarAlt size={14} style={{ marginRight: theme.spacing(1) }} />
            <Typography variant="subtitle2" component="span">
              วันที่สร้าง:
            </Typography>
          </Box>
          {loading ? (
            <Skeleton width="100%" />
          ) : (
            <Typography variant="body2" sx={{ pl: 3 }}>
              {worksheet?.created_at ? dayjs(worksheet.created_at).format('DD/MM/YYYY') : '-'}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FaCalendarAlt size={14} style={{ marginRight: theme.spacing(1) }} />
            <Typography variant="subtitle2" component="span">
              กำหนดส่ง:
            </Typography>
          </Box>
          {loading ? (
            <Skeleton width="100%" />
          ) : (
            <Typography variant="body2" sx={{ pl: 3 }}>
              {worksheet?.due_date ? dayjs(worksheet.due_date).format('DD/MM/YYYY') : '-'}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FaBox size={14} style={{ marginRight: theme.spacing(1) }} />
            <Typography variant="subtitle2" component="span">
              จำนวนรวม:
            </Typography>
          </Box>
          {loading ? (
            <Skeleton width={100} />
          ) : (
            <Typography variant="body2" sx={{ pl: 3 }}>
              {worksheet?.total_quantity || 0} ชิ้น
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FaTag size={14} style={{ marginRight: theme.spacing(1) }} />
            <Typography variant="subtitle2" component="span">
              สถานะ:
            </Typography>
          </Box>
          {loading ? (
            <Skeleton width={100} />
          ) : (
            <Box sx={{ pl: 3 }}>
              {getStatusChip(worksheet?.status || 'draft')}
            </Box>
          )}
        </Grid>
      </Grid>
      
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
        รายการสินค้า
      </Typography>
      
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={150} />
      ) : worksheet?.items && worksheet.items.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>รายการ</TableCell>
                <TableCell>ประเภท</TableCell>
                <TableCell align="center">จำนวน</TableCell>
                <TableCell>สีเสื้อ</TableCell>
                <TableCell>สี/วิธีการพิมพ์</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {worksheet.items.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>{item.name || '-'}</TableCell>
                  <TableCell>{getProductionTypeLabel(item.type)}</TableCell>
                  <TableCell align="center">{item.quantity || 0}</TableCell>
                  <TableCell>{item.shirt_color || '-'}</TableCell>
                  <TableCell>{item.print_detail || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">ไม่พบรายการสินค้าใน Worksheet นี้</Alert>
      )}
      
      {worksheet?.sizes && Object.keys(worksheet.sizes).length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            ข้อมูลไซส์
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(worksheet.sizes).map(([size, quantity], index) => (
              <Grid item xs={4} sm={3} md={2} key={index}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="subtitle2">{size}</Typography>
                  <Typography variant="h6">{quantity}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {worksheet?.notes && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            หมายเหตุ
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2">
              {worksheet.notes}
            </Typography>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

// Helper functions
const getStatusChip = (status) => {
  let color = 'default';
  let label = 'Unknown';
  
  switch (status) {
    case 'draft':
      color = 'default';
      label = 'แบบร่าง';
      break;
    case 'pending':
      color = 'warning';
      label = 'รอดำเนินการ';
      break;
    case 'in_progress':
      color = 'info';
      label = 'กำลังดำเนินการ';
      break;
    case 'completed':
      color = 'success';
      label = 'เสร็จสิ้น';
      break;
    case 'cancelled':
      color = 'error';
      label = 'ยกเลิก';
      break;
    default:
      break;
  }
  
  return <Chip size="small" color={color} label={label} />;
};

// Using imported getProductionTypeLabel function instead

export default WorksheetPreview;
