import axios from '../../api/axios';

// Quotation API Service
// Enhanced version with better error handling, caching, and additional features

// Cache for quotation data to improve performance
const quotationCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Enhanced error handler for quotation API calls
 * @param {Error} error - Axios error object
 * @param {string} operation - Operation being performed
 * @returns {Object} Formatted error object
 */
const handleApiError = (error, operation = 'Unknown operation') => {
  const errorInfo = {
    operation,
    timestamp: new Date().toISOString(),
    originalError: error
  };

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    errorInfo.status = status;
    errorInfo.message = data?.message || `HTTP ${status} Error`;
    errorInfo.errors = data?.errors || {};
    
    switch (status) {
      case 400:
        errorInfo.userMessage = 'ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่';
        break;
      case 401:
        errorInfo.userMessage = 'ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่';
        break;
      case 403:
        errorInfo.userMessage = 'ไม่มีสิทธิ์ในการดำเนินการนี้';
        break;
      case 404:
        errorInfo.userMessage = 'ไม่พบข้อมูลที่ร้องขอ';
        break;
      case 422:
        errorInfo.userMessage = 'ข้อมูลไม่ถูกต้องตามเงื่อนไข';
        break;
      case 429:
        errorInfo.userMessage = 'ส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่';
        break;
      case 500:
        errorInfo.userMessage = 'เกิดข้อผิดพลาดในระบบเซิร์ฟเวอร์';
        break;
      default:
        errorInfo.userMessage = `เกิดข้อผิดพลาด (${status})`;
    }
  } else if (error.request) {
    // Network error
    errorInfo.userMessage = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    errorInfo.type = 'network';
  } else {
    // Other error
    errorInfo.userMessage = error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    errorInfo.type = 'unknown';
  }

  console.error(`[QuotationService] ${operation}:`, errorInfo);
  return errorInfo;
};

/**
 * Get cached data if available and not expired
 * @param {string} key - Cache key
 * @returns {Object|null} Cached data or null
 */
const getCachedData = (key) => {
  const cached = quotationCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  quotationCache.delete(key);
  return null;
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 */
const setCachedData = (key, data) => {
  quotationCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Clear cache for specific keys or all
 * @param {string|Array} keys - Keys to clear, or null for all
 */
const clearCache = (keys = null) => {
  if (keys === null) {
    quotationCache.clear();
  } else {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => quotationCache.delete(key));
  }
};

/**
 * Fetch quotations with optional filters and caching
 * @param {Object} params - Query parameters (page, per_page, status, customer_id, etc.)
 * @param {boolean} useCache - Whether to use cached data
 * @returns {Promise} API response with quotations list
 */
export const fetchQuotations = async (params = {}, useCache = true) => {
  try {
    const cacheKey = `quotations_${JSON.stringify(params)}`;
    
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        return { data: cached };
      }
    }

    const response = await axios.get('/quotations', { params });
    
    if (useCache && response.data) {
      setCachedData(cacheKey, response.data);
    }
    
    return response;
  } catch (error) {
    throw handleApiError(error, 'Fetch Quotations');
  }
};

/**
 * Get specific quotation by ID with caching
 * @param {string} id - Quotation ID
 * @param {boolean} useCache - Whether to use cached data
 * @returns {Promise} API response with quotation data
 */
export const getQuotation = async (id, useCache = true) => {
  try {
    const cacheKey = `quotation_${id}`;
    
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        return { data: cached };
      }
    }

    const response = await axios.get(`/quotations/${id}`);
    
    if (useCache && response.data) {
      setCachedData(cacheKey, response.data);
    }
    
    return response;
  } catch (error) {
    throw handleApiError(error, `Get Quotation ${id}`);
  }
};

/**
 * Create new quotation
 * @param {Object} data - Quotation data
 * @returns {Promise} API response with created quotation
 */
export const createQuotation = async (data) => {
  try {
    const response = await axios.post('/quotations', data);
    
    // Clear list cache since we have new data
    clearCache();
    
    return response;
  } catch (error) {
    throw handleApiError(error, 'Create Quotation');
  }
};

/**
 * Update existing quotation
 * @param {string} id - Quotation ID
 * @param {Object} data - Updated quotation data
 * @returns {Promise} API response with updated quotation
 */
export const updateQuotation = async (id, data) => {
  try {
    const response = await axios.put(`/quotations/${id}`, data);
    
    // Clear related cache
    clearCache([`quotation_${id}`, `quotations_*`]);
    
    return response;
  } catch (error) {
    throw handleApiError(error, `Update Quotation ${id}`);
  }
};

/**
 * Delete quotation
 * @param {string} id - Quotation ID
 * @returns {Promise} API response
 */
export const deleteQuotation = async (id) => {
  try {
    const response = await axios.delete(`/quotations/${id}`);
    
    // Clear related cache
    clearCache();
    
    return response;
  } catch (error) {
    throw handleApiError(error, `Delete Quotation ${id}`);
  }
};

/**
 * Change quotation status
 * @param {string} id - Quotation ID
 * @param {string} status - New status (draft, pending_review, approved, rejected, completed)
 * @param {string} notes - Optional notes for status change
 * @returns {Promise} API response
 */
export const changeQuotationStatus = async (id, status, notes = '') => {
  try {
    const response = await axios.patch(`/quotations/${id}/status`, { 
      status, 
      notes 
    });
    
    // Clear related cache
    clearCache([`quotation_${id}`]);
    
    return response;
  } catch (error) {
    throw handleApiError(error, `Change Status for Quotation ${id}`);
  }
};

/**
 * Download quotation as PDF
 * @param {string} id - Quotation ID
 * @returns {Promise} PDF blob response
 */
export const downloadQuotationPDF = async (id) => {
  try {
    const response = await axios.get(`/quotations/${id}/pdf`, { 
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      },
      timeout: 30000 // 30 seconds timeout for PDF generation
    });
    
    return response;
  } catch (error) {
    throw handleApiError(error, `Download PDF for Quotation ${id}`);
  }
};

/**
 * Get quotation history/audit trail
 * @param {string} id - Quotation ID
 * @returns {Promise} API response with history data
 */
export const getQuotationHistory = async (id) => {
  try {
    const response = await axios.get(`/quotations/${id}/history`);
    return response;
  } catch (error) {
    throw handleApiError(error, `Get History for Quotation ${id}`);
  }
};

/**
 * Send quotation via email
 * @param {string} id - Quotation ID
 * @param {Object} emailData - Email configuration
 * @returns {Promise} API response
 */
export const sendQuotationEmail = async (id, emailData) => {
  try {
    const response = await axios.post(`/quotations/${id}/email`, emailData);
    return response;
  } catch (error) {
    throw handleApiError(error, `Send Email for Quotation ${id}`);
  }
};

/**
 * Duplicate quotation
 * @param {string} id - Quotation ID to duplicate
 * @param {Object} overrides - Data to override in the duplicated quotation
 * @returns {Promise} API response with new quotation
 */
export const duplicateQuotation = async (id, overrides = {}) => {
  try {
    const response = await axios.post(`/quotations/${id}/duplicate`, overrides);
    
    // Clear list cache since we have new data
    clearCache();
    
    return response;
  } catch (error) {
    throw handleApiError(error, `Duplicate Quotation ${id}`);
  }
};

/**
 * Convert quotation to invoice
 * @param {string} id - Quotation ID
 * @param {Object} invoiceData - Additional invoice data
 * @returns {Promise} API response with new invoice
 */
export const convertToInvoice = async (id, invoiceData = {}) => {
  try {
    const response = await axios.post(`/quotations/${id}/convert-to-invoice`, invoiceData);
    
    // Clear related cache
    clearCache([`quotation_${id}`]);
    
    return response;
  } catch (error) {
    throw handleApiError(error, `Convert Quotation ${id} to Invoice`);
  }
};

/**
 * Get quotation statistics/summary
 * @param {Object} filters - Date range and other filters
 * @returns {Promise} API response with statistics
 */
export const getQuotationStats = async (filters = {}) => {
  try {
    const response = await axios.get('/quotations/stats', { params: filters });
    return response;
  } catch (error) {
    throw handleApiError(error, 'Get Quotation Statistics');
  }
};

/**
 * Validate quotation data before saving
 * @param {Object} data - Quotation data to validate
 * @returns {Promise} API response with validation results
 */
export const validateQuotationData = async (data) => {
  try {
    const response = await axios.post('/quotations/validate', data);
    return response;
  } catch (error) {
    throw handleApiError(error, 'Validate Quotation Data');
  }
};

// Export all functions as default object for easier importing
export default {
  fetchQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  changeQuotationStatus,
  downloadQuotationPDF,
  getQuotationHistory,
  sendQuotationEmail,
  duplicateQuotation,
  convertToInvoice,
  getQuotationStats,
  validateQuotationData,
  clearCache,
  handleApiError
}; 