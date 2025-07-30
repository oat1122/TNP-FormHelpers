import axios from '@/api/axios';

// Customer API Service for Accounting
// Based on endpoints from README.md and DATABASE_SCHEMA_ALIGNMENT.md

/**
 * Fetch customers with optional filters
 * @param {Object} params - Query parameters (page, per_page, search, is_active, etc.)
 * @returns {Promise} API response with customers list
 */
export const fetchCustomers = (params = {}) => {
  return axios.get('/accounting/customers', { params });
};

/**
 * Get specific customer by ID
 * @param {string} id - Customer ID (cus_id)
 * @returns {Promise} API response with customer data
 */
export const getCustomer = (id) => {
  return axios.get(`/accounting/customers/${id}`);
};

/**
 * Get customer summary (for dashboard/overview)
 * @param {string} id - Customer ID
 * @returns {Promise} API response with customer summary
 */
export const getCustomerSummary = (id) => {
  return axios.get(`/accounting/customers/${id}/summary`);
};

/**
 * Create new customer
 * @param {Object} data - Customer data (following master_customers schema)
 * @returns {Promise} API response with created customer
 */
export const createCustomer = (data) => {
  return axios.post('/accounting/customers', data);
};

/**
 * Update existing customer
 * @param {string} id - Customer ID
 * @param {Object} data - Updated customer data
 * @returns {Promise} API response with updated customer
 */
export const updateCustomer = (id, data) => {
  return axios.put(`/accounting/customers/${id}`, data);
};

/**
 * Delete customer (soft delete)
 * @param {string} id - Customer ID
 * @returns {Promise} API response
 */
export const deleteCustomer = (id) => {
  return axios.delete(`/accounting/customers/${id}`);
};

/**
 * Search customers for autocomplete
 * @param {string} query - Search query
 * @param {number} limit - Maximum results
 * @returns {Promise} API response with matching customers
 */
export const searchCustomers = (query, limit = 10) => {
  return axios.get('/accounting/customers', {
    params: {
      search: query,
      per_page: limit,
      autocomplete: true
    }
  });
};

// Export all functions as default object for easier importing
export default {
  fetchCustomers,
  getCustomer,
  getCustomerSummary,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
}; 