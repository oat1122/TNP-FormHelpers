import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { FaExclamationTriangle, FaClock, FaCheckCircle } from 'react-icons/fa';
import { differenceInDays } from 'date-fns';

const DeadlineIndicator = ({ dueDate, priority = 'normal', size = 'small' }) => {
  if (!dueDate) return null;

  const daysUntilDeadline = differenceInDays(new Date(dueDate), new Date());
  
  const getDeadlineStatus = () => {
    if (daysUntilDeadline < 0) return 'overdue';
    if (daysUntilDeadline <= 2) return 'urgent';
    if (daysUntilDeadline <= 7) return 'warning';
    return 'normal';
  };

  const status = getDeadlineStatus();
  
  const getStatusConfig = () => {
    switch (status) {
      case 'overdue':
        return {
          color: 'error',
          icon: <FaExclamationTriangle />,
          label: `เลย ${Math.abs(daysUntilDeadline)} วัน`,
          bgColor: '#fef2f2',
          textColor: '#dc2626'
        };
      case 'urgent':
        return {
          color: 'warning',
          icon: <FaClock />,
          label: `เหลือ ${daysUntilDeadline} วัน`,
          bgColor: '#fffbeb',
          textColor: '#f59e0b'
        };
      case 'warning':
        return {
          color: 'info',
          icon: <FaClock />,
          label: `เหลือ ${daysUntilDeadline} วัน`,
          bgColor: '#f0f9ff',
          textColor: '#0ea5e9'
        };
      default:
        return {
          color: 'success',
          icon: <FaCheckCircle />,
          label: 'ปกติ',
          bgColor: '#f0fdf4',
          textColor: '#059669'
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'normal') return null;

  return (
    <Tooltip title={`ครบกำหนด: ${new Date(dueDate).toLocaleDateString('th-TH')}`}>
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size={size}
        sx={{
          fontWeight: 'bold',
          fontSize: size === 'small' ? '0.7rem' : '0.8rem',
          '& .MuiChip-icon': {
            fontSize: size === 'small' ? '0.8rem' : '1rem'
          }
        }}
      />
    </Tooltip>
  );
};

export default DeadlineIndicator;
