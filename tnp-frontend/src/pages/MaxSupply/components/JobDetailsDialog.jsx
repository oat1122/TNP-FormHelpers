import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Close,
  Person,
  Event,
  Work,
  Assignment,
  Schedule,
  Edit,
  Delete,
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const JobDetailsDialog = ({ open, onClose, job, onDelete }) => {
  const navigate = useNavigate();
  
  if (!job) return null;

  // Production type colors and icons
  const productionTypeConfig = {
    screen: { color: '#0ea5e9', icon: '📺', label: 'Screen Printing' },
    dtf: { color: '#f59e0b', icon: '📱', label: 'DTF' },
    sublimation: { color: '#8b5cf6', icon: '⚽', label: 'Sublimation' },
    embroidery: { color: '#10b981', icon: '🧵', label: 'Embroidery' },
  };

  const statusConfig = {
    pending: { color: '#f59e0b', label: 'รอดำเนินการ' },
    in_progress: { color: '#3b82f6', label: 'กำลังดำเนินการ' },
    completed: { color: '#10b981', label: 'เสร็จสิ้น' },
    cancelled: { color: '#ef4444', label: 'ยกเลิก' },
  };

  const priorityConfig = {
    low: { color: '#6b7280', label: 'ต่ำ' },
    normal: { color: '#3b82f6', label: 'ปกติ' },
    high: { color: '#f59e0b', label: 'สูง' },
    urgent: { color: '#ef4444', label: 'เร่งด่วน' },
  };

  const typeConfig = productionTypeConfig[job.production_type] || productionTypeConfig.screen;
  const statusInfo = statusConfig[job.status] || statusConfig.pending;
  const priorityInfo = priorityConfig[job.priority] || priorityConfig.normal;

  const duration = job.start_date && job.expected_completion_date 
    ? differenceInDays(new Date(job.expected_completion_date), new Date(job.start_date)) + 1
    : 0;

  const handleEdit = () => {
    navigate(`/max-supply/edit/${job.id}`);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('คุณต้องการลบงานนี้หรือไม่?')) {
      onDelete(job.id);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: `${typeConfig.color}20`,
              color: typeConfig.color,
              width: 48,
              height: 48,
            }}
          >
            <Typography variant="h6">{typeConfig.icon}</Typography>
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {job.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {typeConfig.label}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person fontSize="small" />
                ข้อมูลพื้นฐาน
              </Typography>
              <Box sx={{ pl: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">ลูกค้า:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {job.customer_name || 'ไม่ระบุ'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">จำนวน:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {job.total_quantity} ตัว
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">ประเภทเสื้อ:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {job.shirt_type || 'ไม่ระบุ'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Timeline Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Event fontSize="small" />
                ระยะเวลาการผลิต
              </Typography>
              <Box sx={{ pl: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">วันที่เริ่ม:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {job.start_date ? format(new Date(job.start_date), 'dd MMMM yyyy', { locale: th }) : 'ไม่ระบุ'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">วันที่คาดว่าจะเสร็จ:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {job.expected_completion_date ? format(new Date(job.expected_completion_date), 'dd MMMM yyyy', { locale: th }) : 'ไม่ระบุ'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">ระยะเวลา:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {duration} วัน
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Work Calculations */}
            {job.work_calculations && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Work fontSize="small" />
                  รายละเอียดการผลิต
                </Typography>
                <Box sx={{ pl: 3 }}>
                  {Object.entries(job.work_calculations).map(([type, data]) => (
                    <Box key={type} sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                        {productionTypeConfig[type]?.icon} {productionTypeConfig[type]?.label}
                      </Typography>
                      <Box sx={{ pl: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          จุด: {data.points} | จำนวน: {data.total_quantity} | รวมงาน: {data.total_work}
                        </Typography>
                        {data.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {data.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Grid>

          {/* Status & Priority */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assignment fontSize="small" />
                สถานะ
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Chip
                  label={statusInfo.label}
                  sx={{
                    bgcolor: `${statusInfo.color}20`,
                    color: statusInfo.color,
                    fontWeight: 'medium',
                    alignSelf: 'flex-start',
                  }}
                />
                <Chip
                  label={`ลำดับความสำคัญ: ${priorityInfo.label}`}
                  sx={{
                    bgcolor: `${priorityInfo.color}20`,
                    color: priorityInfo.color,
                    fontWeight: 'medium',
                    alignSelf: 'flex-start',
                  }}
                />
              </Box>
            </Box>

            {/* Sizes */}
            {job.sizes && Object.keys(job.sizes).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ขนาด
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(job.sizes).map(([size, quantity]) => (
                    <Chip
                      key={size}
                      label={`${size}: ${quantity}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>

          {/* Notes */}
          {(job.notes || job.special_instructions) && (
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                หมายเหตุ
              </Typography>
              {job.notes && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>หมายเหตุทั่วไป:</strong> {job.notes}
                </Typography>
              )}
              {job.special_instructions && (
                <Typography variant="body2">
                  <strong>คำแนะนำพิเศษ:</strong> {job.special_instructions}
                </Typography>
              )}
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleEdit}
          variant="contained"
          startIcon={<Edit />}
          sx={{
            bgcolor: typeConfig.color,
            '&:hover': { bgcolor: typeConfig.color, opacity: 0.9 },
          }}
        >
          แก้ไข
        </Button>
        <Button
          onClick={handleDelete}
          variant="outlined"
          startIcon={<Delete />}
          color="error"
        >
          ลบ
        </Button>
        <Button onClick={onClose} variant="outlined">
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobDetailsDialog;
