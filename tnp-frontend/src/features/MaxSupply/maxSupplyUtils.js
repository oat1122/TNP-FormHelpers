import moment from 'moment';

/**
 * Format date for display
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  return moment(date).format(format);
};

/**
 * Format date for API
 */
export const formatDateForApi = (date) => {
  if (!date) return null;
  return moment(date).format('YYYY-MM-DD');
};

/**
 * Calculate print points based on worksheet data
 */
export const calculatePrintPointsFromWorksheet = (worksheetData) => {
  if (!worksheetData) return 0;
  
  const {
    quantity = 0,
    complexity = 1,
    fabric_type = 'cotton',
    screen_count = 1,
    embroidery_count = 0,
    dft_count = 0,
  } = worksheetData;

  // Base calculation logic (ตามที่ระบุในโครงสร้าง)
  let basePoints = quantity * 0.1; // 10% ของจำนวน
  
  // Complexity multiplier
  const complexityMultiplier = {
    'simple': 1,
    'medium': 1.2,
    'complex': 1.5,
    'very_complex': 2,
  };
  
  basePoints *= complexityMultiplier[complexity] || 1;
  
  // Fabric type adjustment
  const fabricMultiplier = {
    'cotton': 1,
    'polyester': 1.1,
    'blend': 1.05,
    'premium': 1.3,
  };
  
  basePoints *= fabricMultiplier[fabric_type] || 1;
  
  // Additional process points
  basePoints += (screen_count * 0.5);
  basePoints += (embroidery_count * 1.0);
  basePoints += (dft_count * 0.8);
  
  return Math.round(basePoints * 100) / 100; // Round to 2 decimal places
};

/**
 * Generate production code
 */
export const generateProductionCode = () => {
  const today = moment().format('YYYYMMDD');
  const time = moment().format('HHmmss');
  return `MS-${today}-${time}`;
};

/**
 * Validate file for upload
 */
export const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)',
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'ไม่รองรับไฟล์ประเภทนี้',
    };
  }

  return {
    isValid: true,
    error: null,
  };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Status utilities
 */
export const getStatusConfig = (status) => {
  const configs = {
    pending: {
      label: 'รอดำเนินการ',
      color: 'warning',
      bgColor: '#fff3cd',
      textColor: '#856404',
      icon: '⏳',
    },
    in_progress: {
      label: 'กำลังดำเนินการ',
      color: 'info', 
      bgColor: '#cff4fc',
      textColor: '#055160',
      icon: '🔄',
    },
    completed: {
      label: 'เสร็จสิ้น',
      color: 'success',
      bgColor: '#d1edff',
      textColor: '#0a3622',
      icon: '✅',
    },
    cancelled: {
      label: 'ยกเลิก',
      color: 'error',
      bgColor: '#f8d7da',
      textColor: '#721c24',
      icon: '❌',
    },
  };
  
  return configs[status] || configs.pending;
};

/**
 * Priority utilities
 */
export const getPriorityConfig = (priority) => {
  const configs = {
    low: {
      label: 'ต่ำ',
      color: 'success',
      bgColor: '#d1edff',
      textColor: '#0a3622',
      icon: '🟢',
      order: 1,
    },
    medium: {
      label: 'ปานกลาง',
      color: 'warning',
      bgColor: '#fff3cd',
      textColor: '#856404',
      icon: '🟡',
      order: 2,
    },
    high: {
      label: 'สูง',
      color: 'error',
      bgColor: '#ffe6cc',
      textColor: '#cc2900',
      icon: '🟠',
      order: 3,
    },
    urgent: {
      label: 'เร่งด่วน',
      color: 'error',
      bgColor: '#f8d7da',
      textColor: '#721c24',
      icon: '🔴',
      order: 4,
    },
  };
  
  return configs[priority] || configs.medium;
};

/**
 * Calculate duration between dates
 */
export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = moment(startDate);
  const end = moment(endDate);
  
  return end.diff(start, 'days') + 1; // Include both start and end dates
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (startDate, endDate, currentDate = new Date()) => {
  if (!startDate || !endDate) return 0;
  
  const start = moment(startDate);
  const end = moment(endDate);
  const current = moment(currentDate);
  
  if (current.isBefore(start)) return 0;
  if (current.isAfter(end)) return 100;
  
  const totalDays = end.diff(start, 'days');
  const elapsedDays = current.diff(start, 'days');
  
  return Math.round((elapsedDays / totalDays) * 100);
};

/**
 * Transform calendar data for React Big Calendar
 */
export const transformToCalendarEvents = (maxSupplyData) => {
  return maxSupplyData.map(item => ({
    id: item.id,
    title: `${item.production_code} - ${item.customer_name}`,
    start: new Date(item.start_date),
    end: new Date(item.end_date),
    resource: {
      ...item,
      statusConfig: getStatusConfig(item.status),
      priorityConfig: getPriorityConfig(item.priority),
    },
  }));
};

/**
 * Filter and search utilities
 */
export const filterMaxSupplyData = (data, filters) => {
  let filtered = [...data];
  
  // Status filter
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(item => item.status === filters.status);
  }
  
  // Priority filter
  if (filters.priority && filters.priority !== 'all') {
    filtered = filtered.filter(item => item.priority === filters.priority);
  }
  
  // Date range filter
  if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
    const startDate = moment(filters.dateRange.startDate);
    const endDate = moment(filters.dateRange.endDate);
    
    filtered = filtered.filter(item => {
      const itemStart = moment(item.start_date);
      const itemEnd = moment(item.end_date);
      
      return itemStart.isSameOrAfter(startDate) && itemEnd.isSameOrBefore(endDate);
    });
  }
  
  // Search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.production_code.toLowerCase().includes(searchTerm) ||
      item.customer_name.toLowerCase().includes(searchTerm) ||
      item.product_name.toLowerCase().includes(searchTerm) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm))
    );
  }
  
  return filtered;
};

/**
 * Sort utilities
 */
export const sortMaxSupplyData = (data, sortField, sortDirection = 'asc') => {
  const sorted = [...data];
  
  sorted.sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle special cases
    if (sortField === 'priority') {
      aValue = getPriorityConfig(a.priority).order;
      bValue = getPriorityConfig(b.priority).order;
    }
    
    if (moment.isMoment(aValue) || moment(aValue).isValid()) {
      aValue = moment(aValue);
      bValue = moment(bValue);
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
};

/**
 * Export data utilities
 */
export const exportToCSV = (data, filename = 'max-supply-data') => {
  const headers = [
    'รหัสการผลิต',
    'ลูกค้า',
    'สินค้า',
    'จำนวน',
    'จุดพิมพ์',
    'วันที่เริ่ม',
    'วันที่สิ้นสุด',
    'สถานะ',
    'ความสำคัญ',
    'หมายเหตุ',
  ];
  
  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      `"${item.production_code}"`,
      `"${item.customer_name}"`,
      `"${item.product_name}"`,
      item.quantity,
      item.print_points,
      formatDate(item.start_date),
      formatDate(item.end_date),
      `"${getStatusConfig(item.status).label}"`,
      `"${getPriorityConfig(item.priority).label}"`,
      `"${item.notes || ''}"`,
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${moment().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
