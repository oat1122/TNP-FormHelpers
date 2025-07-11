import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  AvatarGroup,
  Chip,
  IconButton,
  Button,
  Grid,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Delete,
  Edit,
  Person,
  AccessTime,
  Flag,
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  Assignment,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const KanbanBoard = ({ 
  maxSupplies = [], 
  onStatusChange, 
  onDeleteJob, 
  loading = false 
}) => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, job: null });
  const [menuAnchor, setMenuAnchor] = useState({ element: null, job: null });
  const [draggedJob, setDraggedJob] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Define columns matching the image
  const columns = [
    {
      id: 'pending',
      title: 'In Progress',
      color: '#FEF3C7', // Yellow background
      icon: <RadioButtonUnchecked />,
      count: maxSupplies.filter(job => job.status === 'pending').length
    },
    {
      id: 'in_progress', 
      title: 'In Review',
      color: '#E0E7FF', // Purple background
      icon: <Schedule />,
      count: maxSupplies.filter(job => job.status === 'in_progress').length
    },
    {
      id: 'completed',
      title: 'Done',
      color: '#D1FAE5', // Green background
      icon: <CheckCircle />,
      count: maxSupplies.filter(job => job.status === 'completed').length
    },
  ];

  // Production type colors and icons
  const productionTypes = {
    screen: { color: '#7c3aed', icon: '📺', label: 'Screen' },
    dtf: { color: '#0891b2', icon: '📱', label: 'DTF' },
    sublimation: { color: '#16a34a', icon: '⚽', label: 'Sublimation' },
    embroidery: { color: '#dc2626', icon: '🧵', label: 'Embroidery' },
  };

  // Priority colors
  const priorityColors = {
    low: '#10b981',
    normal: '#6b7280', 
    high: '#f59e0b',
    urgent: '#ef4444',
  };

  const handleMenuClick = (event, job) => {
    setMenuAnchor({ element: event.currentTarget, job });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ element: null, job: null });
  };

  const handleStatusChange = (job, newStatus) => {
    if (onStatusChange) {
      onStatusChange(job.id, newStatus);
    }
    handleMenuClose();
  };

  const handleDeleteClick = (job) => {
    setDeleteDialog({ open: true, job });
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.job && onDeleteJob) {
      onDeleteJob(deleteDialog.job.id);
    }
    setDeleteDialog({ open: false, job: null });
  };

  // Drag and Drop handlers
  const handleDragStart = (e, job) => {
    setDraggedJob(job);
    e.dataTransfer.setData('text/plain', job.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add ghost image effect
    const dragImage = e.target.cloneNode(true);
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = (e) => {
    setDraggedJob(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the column container, not child elements
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedJob && draggedJob.status !== newStatus) {
      if (onStatusChange) {
        onStatusChange(draggedJob.id, newStatus);
      }
    }
    setDraggedJob(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    try {
      return format(new Date(dateString), 'dd MMM', { locale: th });
    } catch {
      return 'ไม่ระบุ';
    }
  };

  const JobCard = ({ job }) => {
    const productionType = productionTypes[job.production_type] || productionTypes.screen;
    const isDragging = draggedJob?.id === job.id;
    
    return (
      <Card 
        draggable="true"
        onDragStart={(e) => handleDragStart(e, job)}
        onDragEnd={handleDragEnd}
        sx={{ 
          mb: 2, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease-in-out',
          cursor: 'grab',
          opacity: isDragging ? 0.5 : 1,
          transform: isDragging ? 'rotate(5deg)' : 'none',
          '&:hover': {
            transform: isDragging ? 'rotate(5deg)' : 'translateY(-2px)',
            boxShadow: 3,
          },
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Tooltip title="ลากเพื่อเปลี่ยนสถานะ" placement="top">
              <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                fontSize: '0.875rem',
                lineHeight: 1.3,
                flex: 1,
                mr: 1
              }}>
                {job.title || 'งานไม่ระบุชื่อ'}
              </Typography>
            </Tooltip>
            <IconButton 
              size="small" 
              onClick={(e) => handleMenuClick(e, job)}
              sx={{ p: 0.5 }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>

          {/* Customer */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.75rem' }}>
            <Person sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
            {job.customer_name || 'ไม่ระบุลูกค้า'}
          </Typography>

          {/* Tags */}
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 1.5 }}>
            {/* Production Type */}
            <Chip
              size="small"
              label={`${productionType.icon} ${productionType.label}`}
              sx={{
                bgcolor: productionType.color + '20',
                color: productionType.color,
                fontSize: '0.65rem',
                height: 20,
                '& .MuiChip-label': { px: 0.5 }
              }}
            />
            
            {/* Priority */}
            <Chip
              size="small"
              label={job.priority || 'normal'}
              sx={{
                bgcolor: priorityColors[job.priority] + '20',
                color: priorityColors[job.priority],
                fontSize: '0.65rem',
                height: 20,
                '& .MuiChip-label': { px: 0.5 }
              }}
            />

            {/* Quantity */}
            {job.total_quantity && (
              <Chip
                size="small"
                label={`${job.total_quantity} ตัว`}
                variant="outlined"
                sx={{
                  fontSize: '0.65rem',
                  height: 20,
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
          </Stack>

          {/* Footer */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {/* Due Date */}
            <Box display="flex" alignItems="center">
              <AccessTime sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                {formatDate(job.due_date)}
              </Typography>
            </Box>

            {/* Avatar Group (mock data for now) */}
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 20, height: 20, fontSize: '0.7rem' } }}>
              <Avatar sx={{ bgcolor: productionType.color }}>
                {(job.customer_name || 'U').charAt(0).toUpperCase()}
              </Avatar>
              {job.total_quantity > 100 && (
                <Avatar sx={{ bgcolor: '#f59e0b' }}>
                  {Math.floor(job.total_quantity / 100)}
                </Avatar>
              )}
            </AvatarGroup>
          </Box>

          {/* Progress indicator */}
          {job.status === 'in_progress' && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                กำลังดำเนินการ...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const ColumnHeader = ({ column }) => (
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="space-between" 
      mb={2}
      p={1.5}
      sx={{
        bgcolor: column.color,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box display="flex" alignItems="center">
        {column.icon}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ ml: 1 }}>
          {column.title}
        </Typography>
        <Badge 
          badgeContent={column.count} 
          color="primary" 
          sx={{ ml: 1 }}
        />
      </Box>
      <Button size="small" startIcon={<Add />} variant="text">
        <Add fontSize="small" />
      </Button>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading jobs...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Job Manager
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ลากและวางการ์ดงานเพื่อเปลี่ยนสถานะ หรือคลิกปุ่ม ⋮ เพื่อจัดการ
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>
          เพิ่มงานใหม่
        </Button>
      </Box>

      {/* Kanban Board */}
      <Grid container spacing={3}>
        {columns.map((column) => {
          const isDropTarget = dragOverColumn === column.id;
          const canDrop = draggedJob && draggedJob.status !== column.id;
          
          return (
            <Grid item xs={12} md={4} key={column.id}>
              <Paper 
                elevation={isDropTarget ? 4 : 1} 
                sx={{ 
                  p: 2, 
                  bgcolor: isDropTarget && canDrop ? column.color : 'grey.50', 
                  minHeight: '70vh',
                  transition: 'all 0.3s ease-in-out',
                  border: isDropTarget && canDrop ? '2px solid' : '1px solid transparent',
                  borderColor: isDropTarget && canDrop ? 'primary.main' : 'transparent',
                }}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <ColumnHeader column={column} />
                
                <Box
                  sx={{
                    minHeight: '60vh',
                    position: 'relative',
                  }}
                >
                  {maxSupplies
                    .filter(job => job.status === column.id)
                    .map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  
                  {maxSupplies.filter(job => job.status === column.id).length === 0 && (
                    <Box 
                      textAlign="center" 
                      py={4}
                      sx={{ 
                        border: '2px dashed',
                        borderColor: isDropTarget && canDrop ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        transition: 'all 0.3s ease-in-out',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {isDropTarget && canDrop 
                          ? `วางงานที่นี่เพื่อเปลี่ยนเป็น ${column.title}` 
                          : 'ไม่มีงานในสถานะนี้'
                        }
                      </Typography>
                    </Box>
                  )}

                  {/* Drop zone indicator */}
                  {isDropTarget && canDrop && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        border: '3px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        opacity: 0.1,
                        pointerEvents: 'none',
                        zIndex: 1000,
                      }}
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 180 }
        }}
      >
        <MenuItem onClick={() => handleStatusChange(menuAnchor.job, 'pending')}>
          <RadioButtonUnchecked sx={{ mr: 1 }} fontSize="small" />
          ย้ายไป In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(menuAnchor.job, 'in_progress')}>
          <Schedule sx={{ mr: 1 }} fontSize="small" />
          ย้ายไป In Review
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(menuAnchor.job, 'completed')}>
          <CheckCircle sx={{ mr: 1 }} fontSize="small" />
          ย้ายไป Done
        </MenuItem>
        <MenuItem divider />
        <MenuItem onClick={() => handleDeleteClick(menuAnchor.job)} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          ลบงาน
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, job: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          ยืนยันการลบงาน
        </DialogTitle>
        <DialogContent>
          <Typography>
            คุณแน่ใจหรือไม่ที่จะลบงาน "{deleteDialog.job?.title}" ของลูกค้า "{deleteDialog.job?.customer_name}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, job: null })}>
            ยกเลิก
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            ลบงาน
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KanbanBoard; 