import React from 'react';
import { Chip, Tooltip, useTheme, keyframes } from '@mui/material';
import {
  Edit as DraftIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  CheckCircleOutline as CompletedIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// Animation keyframes for different status types
const pulseAnimation = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
`;

// Enhanced status configuration using theme colors and animations
const getStatusConfig = (theme) => ({
  // Common statuses
  draft: {
    label: 'ร่าง',
    color: 'primary',
    bgColor: theme.palette.status?.draft || '#2196f3',
    textColor: 'white',
    icon: <DraftIcon sx={{ fontSize: 16 }} />,
    description: 'เอกสารยังอยู่ในขั้นตอนการแก้ไข',
    animation: null
  },
  pending_review: {
    label: 'รอตรวจ',
    color: 'warning',
    bgColor: theme.palette.status?.pending || '#ff9800',
    textColor: 'white',
    icon: <PendingIcon sx={{ fontSize: 16 }} />,
    description: 'รอการตรวจสอบและอนุมัติ',
    animation: pulseAnimation
  },
  approved: {
    label: 'อนุมัติแล้ว',
    color: 'success',
    bgColor: theme.palette.status?.approved || '#4caf50',
    textColor: 'white',
    icon: <ApprovedIcon sx={{ fontSize: 16 }} />,
    description: 'เอกสารได้รับการอนุมัติแล้ว',
    animation: null
  },
  rejected: {
    label: 'ปฏิเสธ',
    color: 'error',
    bgColor: theme.palette.status?.rejected || '#f44336',
    textColor: 'white',
    icon: <RejectedIcon sx={{ fontSize: 16 }} />,
    description: 'เอกสารถูกปฏิเสธ',
    animation: shakeAnimation
  },
  completed: {
    label: 'เสร็จสิ้น',
    color: 'success',
    bgColor: theme.palette.status?.completed || '#4caf50',
    textColor: 'white',
    icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    description: 'เอกสารดำเนินการเสร็จสิ้นแล้ว',
    animation: null
  },
  
  // Quotation specific statuses
  expired: {
    label: 'หมดอายุ',
    color: 'error',
    bgColor: theme.palette.error.dark,
    textColor: 'white',
    icon: <ScheduleIcon sx={{ fontSize: 16 }} />,
    description: 'ใบเสนอราคาหมดอายุแล้ว',
    animation: shakeAnimation
  },
  converted: {
    label: 'แปลงแล้ว',
    color: 'success',
    bgColor: theme.palette.success.main,
    textColor: 'white',
    icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    description: 'ได้แปลงเป็นใบแจ้งหนี้แล้ว',
    animation: null
  },
  
  // Invoice specific statuses
  sent: {
    label: 'ส่งแล้ว',
    color: 'info',
    bgColor: theme.palette.info.main,
    textColor: 'white',
    icon: <ShippingIcon sx={{ fontSize: 16 }} />,
    description: 'ส่งใบแจ้งหนี้ให้ลูกค้าแล้ว',
    animation: null
  },
  paid: {
    label: 'ชำระแล้ว',
    color: 'success',
    bgColor: theme.palette.success.main,
    textColor: 'white',
    icon: <PaymentIcon sx={{ fontSize: 16 }} />,
    description: 'ลูกค้าชำระเงินแล้ว',
    animation: null
  },
  partial_paid: {
    label: 'ชำระบางส่วน',
    color: 'warning',
    bgColor: theme.palette.warning.main,
    textColor: 'white',
    icon: <PaymentIcon sx={{ fontSize: 16 }} />,
    description: 'ลูกค้าชำระเงินบางส่วน',
    animation: pulseAnimation
  },
  overdue: {
    label: 'เกินกำหนด',
    color: 'error',
    bgColor: theme.palette.status?.overdue || '#d32f2f',
    textColor: 'white',
    icon: <WarningIcon sx={{ fontSize: 16 }} />,
    description: 'เกินกำหนดชำระเงิน',
    animation: shakeAnimation
  },
  
  // Receipt specific statuses
  received: {
    label: 'รับแล้ว',
    color: 'success',
    bgColor: theme.palette.success.main,
    textColor: 'white',
    icon: <PaymentIcon sx={{ fontSize: 16 }} />,
    description: 'รับเงินแล้ว',
    animation: null
  },
  
  // Delivery note specific statuses
  preparing: {
    label: 'กำลังเตรียม',
    color: 'info',
    bgColor: theme.palette.info.light,
    textColor: 'white',
    icon: <ScheduleIcon sx={{ fontSize: 16 }} />,
    description: 'กำลังเตรียมสินค้า',
    animation: pulseAnimation
  },
  ready: {
    label: 'พร้อมส่ง',
    color: 'success',
    bgColor: theme.palette.success.light,
    textColor: 'white',
    icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    description: 'สินค้าพร้อมจัดส่ง',
    animation: null
  },
  shipped: {
    label: 'จัดส่งแล้ว',
    color: 'info',
    bgColor: theme.palette.info.main,
    textColor: 'white',
    icon: <ShippingIcon sx={{ fontSize: 16 }} />,
    description: 'จัดส่งสินค้าแล้ว',
    animation: null
  },
  delivered: {
    label: 'ส่งมอบแล้ว',
    color: 'success',
    bgColor: theme.palette.success.main,
    textColor: 'white',
    icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    description: 'ส่งมอบสินค้าเรียบร้อยแล้ว',
    animation: null
  },
  cancelled: {
    label: 'ยกเลิก',
    color: 'default',
    bgColor: theme.palette.status?.cancelled || '#9e9e9e',
    textColor: 'white',
    icon: <RejectedIcon sx={{ fontSize: 16 }} />,
    description: 'เอกสารถูกยกเลิก',
    animation: null
  }
});

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
  animated = false,
  sx = {},
  onClick,
  customLabel,
  customConfig,
  ...chipProps
}) => {
  const theme = useTheme();
  
  // Use custom config or theme-based config
  const STATUS_CONFIG = getStatusConfig(theme);
  const statusConfig = customConfig || STATUS_CONFIG[status];
  
  if (!statusConfig) {
    console.warn(`Unknown status: ${status}`);
    return (
      <Chip
        label={customLabel || status || 'Unknown'}
        color="default"
        size={size}
        variant={variant}
        sx={{ 
          fontFamily: 'Kanit',
          fontWeight: 500,
          ...sx 
        }}
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
        fontFamily: 'Kanit',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        height: size === 'small' ? 24 : 32,
        borderRadius: 16,
        transition: 'all 0.2s ease-in-out',
        cursor: onClick ? 'pointer' : 'default',
        ...(variant === 'filled' && {
          backgroundColor: statusConfig.bgColor,
          color: statusConfig.textColor,
          border: 'none',
          '& .MuiChip-icon': {
            color: statusConfig.textColor
          }
        }),
        ...(animated && statusConfig.animation && {
          animation: `${statusConfig.animation} 2s infinite`
        }),
        '&:hover': {
          ...(onClick && {
            transform: 'scale(1.05)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          })
        },
        '& .MuiChip-label': {
          padding: size === 'small' ? '0 8px' : '0 12px'
        },
        ...sx
      }}
      {...chipProps}
    />
  );

  // Wrap with tooltip if enabled
  if (showTooltip && statusConfig.description) {
    return (
      <Tooltip 
        title={statusConfig.description} 
        arrow 
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              fontFamily: 'Kanit',
              fontSize: '0.875rem',
              backgroundColor: 'grey.800',
              '& .MuiTooltip-arrow': {
                color: 'grey.800'
              }
            }
          }
        }}
      >
        <span>{chipComponent}</span>
      </Tooltip>
    );
  }

  return chipComponent;
};

// Export status configuration for use in other components
export { getStatusConfig };

export default DocumentStatusBadge;