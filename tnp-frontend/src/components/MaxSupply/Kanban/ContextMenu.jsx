import React from 'react';
import {
  Menu,
  MenuItem,
} from '@mui/material';
import {
  RadioButtonUnchecked,
  Schedule,
  CheckCircle,
  Delete,
} from '@mui/icons-material';

const ContextMenu = ({ 
  anchorEl, 
  open, 
  onClose, 
  job, 
  onStatusChange, 
  onDeleteClick 
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { minWidth: 180 }
      }}
    >
      <MenuItem onClick={() => onStatusChange(job, 'pending')}>
        <RadioButtonUnchecked sx={{ mr: 1 }} fontSize="small" />
        ย้ายไป In Progress
      </MenuItem>
      <MenuItem onClick={() => onStatusChange(job, 'in_progress')}>
        <Schedule sx={{ mr: 1 }} fontSize="small" />
        ย้ายไป In Review
      </MenuItem>
      <MenuItem onClick={() => onStatusChange(job, 'completed')}>
        <CheckCircle sx={{ mr: 1 }} fontSize="small" />
        ย้ายไป Done
      </MenuItem>
      <MenuItem divider />
      <MenuItem onClick={() => onDeleteClick(job)} sx={{ color: 'error.main' }}>
        <Delete sx={{ mr: 1 }} fontSize="small" />
        ลบงาน
      </MenuItem>
    </Menu>
  );
};

export default ContextMenu; 