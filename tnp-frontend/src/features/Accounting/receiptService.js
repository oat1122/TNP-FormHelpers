import axios from '@/api/axios';

// Receipt API Service
// Based on endpoints from README.md

/**
 * Fetch receipts with optional filters
 * @param {Object} params - Query parameters (page, per_page, status, customer_id, etc.)
 * @returns {Promise} API response with receipts list
 */
export const fetchReceipts = (params = {}) => {
  return axios.get('/api/v1/receipts', { params });
};

/**
 * Get specific receipt by ID
 * @param {string} id - Receipt ID
 * @returns {Promise} API response with receipt data
 */
export const getReceipt = (id) => {
  return axios.get(`/api/v1/receipts/${id}`);
};

/**
 * Create new receipt
 * @param {Object} data - Receipt data
 * @returns {Promise} API response with created receipt
 */
export const createReceipt = (data) => {
  return axios.post('/api/v1/receipts', data);
};

/**
 * Create receipt from invoice
 * @param {string} invoiceId - Invoice ID to convert
 * @param {Object} data - Additional receipt data
 * @returns {Promise} API response with created receipt
 */
export const createReceiptFromInvoice = (invoiceId, data = {}) => {
  return axios.post('/api/v1/receipts', {
    ...data,
    invoice_id: invoiceId
  });
};

/**
 * Update existing receipt
 * @param {string} id - Receipt ID
 * @param {Object} data - Updated receipt data
 * @returns {Promise} API response with updated receipt
 */
export const updateReceipt = (id, data) => {
  return axios.put(`/api/v1/receipts/${id}`, data);
};

/**
 * Delete receipt
 * @param {string} id - Receipt ID
 * @returns {Promise} API response
 */
export const deleteReceipt = (id) => {
  return axios.delete(`/api/v1/receipts/${id}`);
};

/**
 * Change receipt status
 * @param {string} id - Receipt ID
 * @param {string} status - New status (draft, pending_review, approved, rejected, completed)
 * @param {string} notes - Optional notes for status change
 * @returns {Promise} API response
 */
export const changeReceiptStatus = (id, status, notes = '') => {
  return axios.patch(`/api/v1/receipts/${id}/status`, { 
    status, 
    notes 
  });
};

/**
 * Download receipt as PDF
 * @param {string} id - Receipt ID
 * @returns {Promise} PDF blob response
 */
export const downloadReceiptPDF = (id) => {
  return axios.get(`/api/v1/receipts/${id}/pdf`, { 
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf'
    }
  });
};

/**
 * Get receipt history/audit trail
 * @param {string} id - Receipt ID
 * @returns {Promise} API response with history data
 */
export const getReceiptHistory = (id) => {
  return axios.get(`/api/v1/receipts/${id}/history`);
};

// Export all functions as default object for easier importing
export default {
  fetchReceipts,
  getReceipt,
  createReceipt,
  createReceiptFromInvoice,
  updateReceipt,
  deleteReceipt,
  changeReceiptStatus,
  downloadReceiptPDF,
  getReceiptHistory
}; 