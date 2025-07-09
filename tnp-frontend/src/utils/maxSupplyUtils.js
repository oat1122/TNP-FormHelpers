import { FaTshirt, FaCircle } from 'react-icons/fa';
import { MdScreenShare } from 'react-icons/md';
import { IoShirtSharp } from 'react-icons/io5';

// Utility functions for MaxSupply components

/**
 * Get color based on production type
 * @param {string} type - Production type: 'screen', 'dtf', 'sublimation'
 * @param {number} opacity - Optional opacity value (0-1)
 * @returns {string} - Color hex code
 */
export const getProductionTypeColor = (type, opacity = 1) => {
  const colors = {
    screen: '#7c3aed', // Violet-600
    dtf: '#0891b2', // Cyan-600
    sublimation: '#16a34a', // Green-600
    default: '#6b7280' // Gray-500
  };
  
  const color = colors[type] || colors.default;
  
  if (opacity === 1) {
    return color;
  }
  
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Get color based on status
 * @param {string} status - Status: 'pending', 'in_progress', 'completed', 'cancelled'
 * @returns {string} - Color hex code
 */
export const getStatusColor = (status) => {
  const colors = {
    pending: '#d97706', // Amber-600
    in_progress: '#2563eb', // Blue-600
    completed: '#059669', // Emerald-600
    cancelled: '#dc2626', // Red-600
    default: '#6b7280' // Gray-500
  };
  
  return colors[status] || colors.default;
};

/**
 * Get icon component based on production type
 * @param {string} type - Production type: 'screen', 'dtf', 'sublimation'
 * @param {number} size - Icon size
 * @returns {JSX.Element} - React Icon component
 */
export const getProductionTypeIcon = (type, size = 14) => {
  switch (type) {
    case 'screen':
      return <MdScreenShare size={size} color={getProductionTypeColor('screen')} />;
    case 'dtf':
      return <FaTshirt size={size} color={getProductionTypeColor('dtf')} />;
    case 'sublimation':
      return <IoShirtSharp size={size} color={getProductionTypeColor('sublimation')} />;
    default:
      return <FaCircle size={size} color="#6b7280" />;
  }
};

/**
 * Get human-readable label for production type
 * @param {string} type - Production type: 'screen', 'dtf', 'sublimation'
 * @returns {string} - Thai label
 */
export const getProductionTypeLabel = (type) => {
  const labels = {
    screen: 'สกรีน',
    dtf: 'DTF',
    sublimation: 'ซับลิเมชั่น',
    default: 'ไม่ระบุ'
  };
  
  return labels[type] || labels.default;
};

/**
 * Get human-readable label for status
 * @param {string} status - Status: 'pending', 'in_progress', 'completed', 'cancelled'
 * @returns {string} - Thai label
 */
export const getStatusLabel = (status) => {
  const labels = {
    pending: 'รอเริ่ม',
    in_progress: 'กำลังผลิต',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
    default: 'ไม่ระบุ'
  };
  
  return labels[status] || labels.default;
};

/**
 * Get human-readable label for priority
 * @param {string} priority - Priority: 'low', 'normal', 'high', 'urgent'
 * @returns {string} - Thai label
 */
export const getPriorityLabel = (priority) => {
  const labels = {
    low: 'ต่ำ',
    normal: 'ปกติ',
    high: 'สูง',
    urgent: 'เร่งด่วน',
    default: 'ไม่ระบุ'
  };
  
  return labels[priority] || labels.default;
};

/**
 * Get color based on priority
 * @param {string} priority - Priority: 'low', 'normal', 'high', 'urgent'
 * @returns {string} - Color hex code
 */
export const getPriorityColor = (priority) => {
  const colors = {
    low: '#6b7280', // Gray-500
    normal: '#2563eb', // Blue-600
    high: '#f59e0b', // Amber-500
    urgent: '#dc2626', // Red-600
    default: '#6b7280' // Gray-500
  };
  
  return colors[priority] || colors.default;
};

/**
 * Get human-readable label for shirt type
 * @param {string} type - Shirt type: 'polo', 't-shirt', 'hoodie', 'tank-top'
 * @returns {string} - Thai label
 */
export const getShirtTypeLabel = (type) => {
  const labels = {
    polo: 'เสื้อโปโล',
    't-shirt': 'เสื้อยืด',
    hoodie: 'ฮูดดี้',
    'tank-top': 'เสื้อกล้าม',
    default: 'ไม่ระบุ'
  };
  
  return labels[type] || labels.default;
};

/**
 * Format a date for display
 * @param {string} dateString - ISO date string
 * @param {string} format - 'short' or 'full'
 * @returns {string} - Formatted date
 */
export const formatDate = (dateString, format = 'short') => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  if (format === 'short') {
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Calculate days remaining
 * @param {string} dateString - ISO date string
 * @returns {number} - Days remaining (negative if overdue)
 */
export const getDaysRemaining = (dateString) => {
  if (!dateString) return 0;
  
  const date = new Date(dateString);
  const today = new Date();
  
  // Reset time part for accurate day calculation
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // Calculate the difference in milliseconds
  const diffMs = date - today;
  
  // Convert to days
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Get date status (overdue, due today, upcoming)
 * @param {string} dateString - ISO date string
 * @returns {string} - 'overdue', 'today', or 'upcoming'
 */
export const getDateStatus = (dateString) => {
  const daysRemaining = getDaysRemaining(dateString);
  
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining === 0) return 'today';
  return 'upcoming';
};

/**
 * Calculate completion percentage
 * @param {number} completed - Completed quantity
 * @param {number} total - Total quantity
 * @returns {number} - Percentage (0-100)
 */
export const calculatePercentage = (completed, total) => {
  if (!completed || !total || total === 0) return 0;
  return Math.round((completed / total) * 100);
};
