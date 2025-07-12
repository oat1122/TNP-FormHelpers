import { format, isValid, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

// Format date string to Thai format
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: th }) : '-';
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

// Format date string to short format
export const formatShortDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(date) ? format(date, 'dd/MM', { locale: th }) : '-';
  } catch (error) {
    console.error('Error formatting short date:', error);
    return '-';
  }
};

// Format date string to full Thai format
export const formatFullDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(date) ? format(date, 'dd MMMM yyyy', { locale: th }) : '-';
  } catch (error) {
    console.error('Error formatting full date:', error);
    return '-';
  }
};

// Format date string to datetime format
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm', { locale: th }) : '-';
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
};

// Format date string to time only
export const formatTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(date) ? format(date, 'HH:mm', { locale: th }) : '-';
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
};

// Get relative time description
export const getRelativeTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return '-';
    
    const now = new Date();
    const diffInDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'วันนี้';
    if (diffInDays === 1) return 'พรุ่งนี้';
    if (diffInDays === -1) return 'เมื่อวาน';
    if (diffInDays > 0) return `อีก ${diffInDays} วัน`;
    return `${Math.abs(diffInDays)} วันที่แล้ว`;
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '-';
  }
}; 