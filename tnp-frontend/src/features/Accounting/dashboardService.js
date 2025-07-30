import axios from '@/api/axios';

// Dashboard API Service for Accounting
// Based on endpoints from README.md

/**
 * Get dashboard summary statistics
 * @param {Object} params - Query parameters (date_from, date_to, etc.)
 * @returns {Promise} API response with summary data
 */
export const getDashboardSummary = (params = {}) => {
  return axios.get('/accounting/dashboard/summary', { params });
};

/**
 * Get revenue chart data
 * @param {Object} params - Query parameters (period, date_from, date_to, etc.)
 * @returns {Promise} API response with revenue chart data
 */
export const getRevenueChart = (params = {}) => {
  return axios.get('/accounting/dashboard/revenue-chart', { params });
};

/**
 * Get document statistics by type
 * @param {string} documentType - Type of document (quotation, invoice, receipt, delivery-note)
 * @param {Object} params - Query parameters
 * @returns {Promise} API response with document statistics
 */
export const getDocumentStats = (documentType, params = {}) => {
  return axios.get(`/accounting/dashboard/${documentType}/stats`, { params });
};

/**
 * Get pending approvals count
 * @param {Object} params - Query parameters
 * @returns {Promise} API response with pending approvals data
 */
export const getPendingApprovals = (params = {}) => {
  return axios.get('/accounting/dashboard/pending-approvals', { params });
};

/**
 * Get overdue invoices summary
 * @param {Object} params - Query parameters
 * @returns {Promise} API response with overdue invoices summary
 */
export const getOverdueSummary = (params = {}) => {
  return axios.get('/accounting/dashboard/overdue-summary', { params });
};

// Export all functions as default object for easier importing
export default {
  getDashboardSummary,
  getRevenueChart,
  getDocumentStats,
  getPendingApprovals,
  getOverdueSummary
}; 