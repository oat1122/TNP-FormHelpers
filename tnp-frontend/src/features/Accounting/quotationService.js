import axios from '@/api/axios';

// Quotation API Service
// Based on endpoints from README.md

/**
 * Fetch quotations with optional filters
 * @param {Object} params - Query parameters (page, per_page, status, customer_id, etc.)
 * @returns {Promise} API response with quotations list
 */
export const fetchQuotations = (params = {}) => {
  return axios.get('/quotations', { params });
};

/**
 * Get specific quotation by ID
 * @param {string} id - Quotation ID
 * @returns {Promise} API response with quotation data
 */
export const getQuotation = (id) => {
  return axios.get(`/quotations/${id}`);
};

/**
 * Create new quotation
 * @param {Object} data - Quotation data
 * @returns {Promise} API response with created quotation
 */
export const createQuotation = (data) => {
  return axios.post('/quotations', data);
};

/**
 * Update existing quotation
 * @param {string} id - Quotation ID
 * @param {Object} data - Updated quotation data
 * @returns {Promise} API response with updated quotation
 */
export const updateQuotation = (id, data) => {
  return axios.put(`/quotations/${id}`, data);
};

/**
 * Delete quotation
 * @param {string} id - Quotation ID
 * @returns {Promise} API response
 */
export const deleteQuotation = (id) => {
  return axios.delete(`/quotations/${id}`);
};

/**
 * Change quotation status
 * @param {string} id - Quotation ID
 * @param {string} status - New status (draft, pending_review, approved, rejected, completed)
 * @param {string} notes - Optional notes for status change
 * @returns {Promise} API response
 */
export const changeQuotationStatus = (id, status, notes = '') => {
  return axios.patch(`/quotations/${id}/status`, { 
    status, 
    notes 
  });
};

/**
 * Download quotation as PDF
 * @param {string} id - Quotation ID
 * @returns {Promise} PDF blob response
 */
export const downloadQuotationPDF = (id) => {
  return axios.get(`/quotations/${id}/pdf`, { 
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf'
    }
  });
};

/**
 * Get quotation history/audit trail
 * @param {string} id - Quotation ID
 * @returns {Promise} API response with history data
 */
export const getQuotationHistory = (id) => {
  return axios.get(`/quotations/${id}/history`);
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
  getQuotationHistory
}; 