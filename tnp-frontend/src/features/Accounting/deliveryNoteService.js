import axios from '@/api/axios';

// Delivery Note API Service
// Based on endpoints from README.md

/**
 * Fetch delivery notes with optional filters
 * @param {Object} params - Query parameters (page, per_page, status, customer_id, etc.)
 * @returns {Promise} API response with delivery notes list
 */
export const fetchDeliveryNotes = (params = {}) => {
  return axios.get('/api/v1/delivery-notes', { params });
};

/**
 * Create partial delivery note
 * @param {Object} data - Partial delivery note data
 * @returns {Promise} API response with created delivery note
 */
export const createPartialDeliveryNote = (data) => {
  return axios.post('/api/v1/delivery-notes/partial', data);
};

/**
 * Get pending delivery notes
 * @param {Object} params - Query parameters
 * @returns {Promise} API response with pending delivery notes
 */
export const getPendingDeliveryNotes = (params = {}) => {
  return axios.get('/api/v1/delivery-notes/pending', { params });
};

/**
 * Get customer delivery notes summary
 * @param {string} customerId - Customer ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response with customer delivery summary
 */
export const getCustomerDeliverySummary = (customerId, params = {}) => {
  return axios.get(`/api/v1/delivery-notes/customer/${customerId}/summary`, { params });
};

/**
 * Get specific delivery note by ID
 * @param {string} id - Delivery note ID
 * @returns {Promise} API response with delivery note data
 */
export const getDeliveryNote = (id) => {
  return axios.get(`/api/v1/delivery-notes/${id}`);
};

/**
 * Create new delivery note
 * @param {Object} data - Delivery note data
 * @returns {Promise} API response with created delivery note
 */
export const createDeliveryNote = (data) => {
  return axios.post('/api/v1/delivery-notes', data);
};

/**
 * Create delivery note from receipt
 * @param {string} receiptId - Receipt ID to convert
 * @param {Object} data - Additional delivery note data
 * @returns {Promise} API response with created delivery note
 */
export const createDeliveryNoteFromReceipt = (receiptId, data = {}) => {
  return axios.post('/api/v1/delivery-notes', {
    ...data,
    receipt_id: receiptId
  });
};

/**
 * Update existing delivery note
 * @param {string} id - Delivery note ID
 * @param {Object} data - Updated delivery note data
 * @returns {Promise} API response with updated delivery note
 */
export const updateDeliveryNote = (id, data) => {
  return axios.put(`/api/v1/delivery-notes/${id}`, data);
};

/**
 * Delete delivery note
 * @param {string} id - Delivery note ID
 * @returns {Promise} API response
 */
export const deleteDeliveryNote = (id) => {
  return axios.delete(`/api/v1/delivery-notes/${id}`);
};

/**
 * Change delivery note status
 * @param {string} id - Delivery note ID
 * @param {string} status - New status (draft, pending_review, approved, rejected, completed)
 * @param {string} notes - Optional notes for status change
 * @returns {Promise} API response
 */
export const changeDeliveryNoteStatus = (id, status, notes = '') => {
  return axios.patch(`/api/v1/delivery-notes/${id}/status`, { 
    status, 
    notes 
  });
};

/**
 * Download delivery note as PDF
 * @param {string} id - Delivery note ID
 * @returns {Promise} PDF blob response
 */
export const downloadDeliveryNotePDF = (id) => {
  return axios.get(`/api/v1/delivery-notes/${id}/pdf`, { 
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf'
    }
  });
};

/**
 * Get delivery note history/audit trail
 * @param {string} id - Delivery note ID
 * @returns {Promise} API response with history data
 */
export const getDeliveryNoteHistory = (id) => {
  return axios.get(`/api/v1/delivery-notes/${id}/history`);
};

// Export all functions as default object for easier importing
export default {
  fetchDeliveryNotes,
  createPartialDeliveryNote,
  getPendingDeliveryNotes,
  getCustomerDeliverySummary,
  getDeliveryNote,
  createDeliveryNote,
  createDeliveryNoteFromReceipt,
  updateDeliveryNote,
  deleteDeliveryNote,
  changeDeliveryNoteStatus,
  downloadDeliveryNotePDF,
  getDeliveryNoteHistory
}; 