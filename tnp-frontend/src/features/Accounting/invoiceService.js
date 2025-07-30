import axios from '@/api/axios';

// Invoice API Service
// Based on endpoints from README.md

/**
 * Fetch invoices with optional filters
 * @param {Object} params - Query parameters (page, per_page, status, customer_id, overdue, etc.)
 * @returns {Promise} API response with invoices list
 */
export const fetchInvoices = (params = {}) => {
  return axios.get('/invoices', { params });
};

/**
 * Get overdue invoices
 * @param {Object} params - Query parameters
 * @returns {Promise} API response with overdue invoices
 */
export const getOverdueInvoices = (params = {}) => {
  return axios.get('/invoices/overdue', { params });
};

/**
 * Get specific invoice by ID
 * @param {string} id - Invoice ID
 * @returns {Promise} API response with invoice data
 */
export const getInvoice = (id) => {
  return axios.get(`/invoices/${id}`);
};

/**
 * Create new invoice
 * @param {Object} data - Invoice data
 * @returns {Promise} API response with created invoice
 */
export const createInvoice = (data) => {
  return axios.post('/invoices', data);
};

/**
 * Create invoice from quotation
 * @param {string} quotationId - Quotation ID to convert
 * @param {Object} data - Additional invoice data
 * @returns {Promise} API response with created invoice
 */
export const createInvoiceFromQuotation = (quotationId, data = {}) => {
  return axios.post('/invoices', {
    ...data,
    quotation_id: quotationId
  });
};

/**
 * Update existing invoice
 * @param {string} id - Invoice ID
 * @param {Object} data - Updated invoice data
 * @returns {Promise} API response with updated invoice
 */
export const updateInvoice = (id, data) => {
  return axios.put(`/invoices/${id}`, data);
};

/**
 * Delete invoice
 * @param {string} id - Invoice ID
 * @returns {Promise} API response
 */
export const deleteInvoice = (id) => {
  return axios.delete(`/invoices/${id}`);
};

/**
 * Change invoice status
 * @param {string} id - Invoice ID
 * @param {string} status - New status (draft, pending_review, approved, rejected, completed)
 * @param {string} notes - Optional notes for status change
 * @returns {Promise} API response
 */
export const changeInvoiceStatus = (id, status, notes = '') => {
  return axios.patch(`/invoices/${id}/status`, { 
    status, 
    notes 
  });
};

/**
 * Record payment for invoice
 * @param {string} id - Invoice ID
 * @param {Object} paymentData - Payment information
 * @returns {Promise} API response
 */
export const recordPayment = (id, paymentData) => {
  return axios.post(`/invoices/${id}/payment`, paymentData);
};

/**
 * Download invoice as PDF
 * @param {string} id - Invoice ID
 * @returns {Promise} PDF blob response
 */
export const downloadInvoicePDF = (id) => {
  return axios.get(`/invoices/${id}/pdf`, { 
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf'
    }
  });
};

/**
 * Get invoice history/audit trail
 * @param {string} id - Invoice ID
 * @returns {Promise} API response with history data
 */
export const getInvoiceHistory = (id) => {
  return axios.get(`/invoices/${id}/history`);
};

// Export all functions as default object for easier importing
export default {
  fetchInvoices,
  getOverdueInvoices,
  getInvoice,
  createInvoice,
  createInvoiceFromQuotation,
  updateInvoice,
  deleteInvoice,
  changeInvoiceStatus,
  recordPayment,
  downloadInvoicePDF,
  getInvoiceHistory
}; 