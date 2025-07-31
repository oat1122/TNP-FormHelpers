import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import {
  Edit as DraftIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  CheckCircleOutline as CompletedIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Status configuration for all document types
const STATUS_CONFIG = {
  // Common statuses
  draft: {
    label: 'ร่าง',
    color: 'default',
    bgColor: '#f5f5f5',
    textColor: '#666',
    icon: <DraftIcon sx={{ fontSize: 16 }} />,
    description: 'เอกสารยังอยู่ในขั้นตอนการแก้ไข'
  },
  pending_review: {
    label: 'รอตรวจ',
    color: 'warning',
    bgColor: '#fff3e0',
    textColor: '#e65100',
    icon: <PendingIcon sx={{ fontSize: 16 }} />,
    description: 'รอการตรวจสอบและอนุมัติ'
  },
  approved: {
    label: 'อนุมัติแล้ว',
    color: 'success',
    bgColor: '#e8f5e8',
    textColor: '#2e7d32',
    icon: <ApprovedIcon sx={{ fontSize: 16 }} />,
    description: 'เอกสารได้รับการอนุมัติแล้ว'
  },
  rejected: {
    label: 'ปฏิเสธ',
    color: 'error',
    bgColor: '#ffebee',
    textColor: '#c62828',
    icon: <RejectedIcon sx={{ fontSize: 16 }} />,
    description: 'เอกสารถูกปฏิเสธ'
  },
  completed: {
    label: 'เสร็จสิ้น',
    color: 'info',
    bgColor: '#e3f2fd',
    textColor: '#1565c0',
    icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    description: 'เอกสารดำเนินการเสร็จสิ้นแล้ว'
  },
  
  // Quotation specific statuses
  expired: {
    label: 'หมดอายุ',
    color: 'error',
    bgColor: '#ffebee',
    textColor: '#c62828',
    icon: <InfoIcon sx={{ fontSize: 16 }} />,
    description: 'ใบเสนอราคาหมดอายุแล้ว'
  },
  converted: {
    label: 'แปลงเป็นใบแจ้งหนี้',
    color: 'success',
    bgColor: '#e8f5e8',
    textColor: '#2e7d32',
    icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    description: 'ได้แปลงเป็นใบแจ้งหนี้แล้ว'
  },
  
  // Invoice specific statuses
  sent: {
    label: 'ส่งแล้ว',
    color: 'info',
    bgColor: '#e3f2fd',
    textColor: '#1565c0',
    icon: <InfoIcon sx={{ fontSize: 16 }} />,
    description: 'ส่งใบแจ้งหนี้ให้ลูกค้าแล้ว'
  },
  paid: {
    label: 'ชำระแล้ว',
    color: 'success',
    bgColor: '#e8f5e8',
    textColor: '#2e7d32',
    icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    description: 'ลูกค้าชำระเงินแล้ว'
  },
  partial_paid: {
    label: 'ชำระบางส่วน',
    color: 'warning',
    bgColor: '#fff3e0',
    textColor: '#e65100',
    icon: <InfoIcon sx={{ fontSize: 16 }} />,
    description: 'ลูกค้าชำระเงินบางส่วน'
  },
  overdue: {
    label: 'เกินกำหนด',
    color: 'error',
    bgColor: '#ffebee',
    textColor: '#c62828',
    icon: <InfoIcon sx={{ fontSize: 16 }} />,
    description: 'เกินกำหนดชำระเงิน'
  },
  
  // Receipt specific statuses
  received: {
    label: 'รับแล้ว',
    color: 'success',
    bgColor: '#e8f5e8',
    textColor: '#2e7d32',
    icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    description: 'รับเงินแล้ว'
  },
  
  // Delivery note specific statuses
  preparing: {
    label: 'กำลังเตรียม',
    color: 'info',
    bgColor: '#e3f2fd',
    textColor: '#1565c0',
    icon: <InfoIcon sx={{ fontSize: 16 }} />,
    description: 'กำลังเตรียมสินค้า'
  },
  ready: {
    label: 'พร้อมส่ง',
    color: 'success',
    bgColor: '#e8f5e8',
    textColor: '#2e7d32',
    icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    description: 'สินค้าพร้อมจัดส่ง'
  },
  shipped: {
    label: 'จัดส่งแล้ว',
    color: 'info',
    bgColor: '#e3f2fd',
    textColor: '#1565c0',
    icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    description: 'จัดส่งสินค้าแล้ว'
  },
  delivered: {
    label: 'ส่งมอบแล้ว',
    color: 'success',
    bgColor: '#e8f5e8',
    textColor: '#2e7d32',
    icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    description: 'ส่งมอบสินค้าเรียบร้อยแล้ว'
  }
};

/**
 * DocumentStatusBadge component
 * แสดง status badge สำหรับเอกสารต่างๆ ในระบบบัญชี
 * 
 * @param {Object} props
 * @param {string} props.status - Status key (draft, pending_review, approved, etc.)
 * @param {string} props.variant - Badge variant ('filled', 'outlined', 'text')
 * @param {string} props.size - Badge size ('small', 'medium')
 * @param {boolean} props.showIcon - Whether to show status icon
 * @param {boolean} props.showTooltip - Whether to show tooltip with description
 * @param {Object} props.sx - Additional styles
 * @param {function} props.onClick - Click handler
 * @param {string} props.customLabel - Custom label to override default
 * @param {Object} props.customConfig - Custom status configuration
 */
const DocumentStatusBadge = ({
  status,
  variant = 'filled',
  size = 'small',
  showIcon = true,
  showTooltip = true,
  sx = {},
  onClick,
  customLabel,
  customConfig,
  ...chipProps
}) => {
  // Use custom config or default config
  const statusConfig = customConfig || STATUS_CONFIG[status];
  
  if (!statusConfig) {
    console.warn(`Unknown status: ${status}`);
    return (
      <Chip
        label={customLabel || status || 'Unknown'}
        color="default"
        size={size}
        variant={variant}
        sx={{ ...sx }}
        {...chipProps}
      />
    );
  }

  const chipComponent = (
    <Chip
      label={customLabel || statusConfig.label}
      color={statusConfig.color}
      size={size}
      variant={variant}
      icon={showIcon ? statusConfig.icon : undefined}
      onClick={onClick}
      clickable={!!onClick}
      sx={{
        fontWeight: 'medium',
        ...(variant === 'filled' && {
          backgroundColor: statusConfig.bgColor,
          color: statusConfig.textColor,
          '& .MuiChip-icon': {
            color: statusConfig.textColor
          }
        }),
        ...sx
      }}
      {...chipProps}
    />
  );

  // Wrap with tooltip if enabled
  if (showTooltip && statusConfig.description) {
    return (
      <Tooltip title={statusConfig.description} arrow placement="top">
        <span>{chipComponent}</span>
      </Tooltip>
    );
  }

  return chipComponent;
};

// Export status configuration for use in other components
export { STATUS_CONFIG };

export default DocumentStatusBadge;