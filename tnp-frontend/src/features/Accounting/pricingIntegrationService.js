import axios from '../../api/axios';

// Pricing Integration API Service
// สำหรับ integration ระหว่างระบบ pricing และ accounting

/**
 * ดึงรายการ pricing requests ที่เสร็จแล้วและพร้อมสร้างใบเสนอราคา
 * @param {Object} params - Query parameters (search, customer_id, date_from, date_to, per_page)
 * @returns {Promise} API response with completed pricing requests
 */
export const getCompletedPricingRequests = (params = {}) => {
  return axios.get('/pricing-integration/completed-requests', { params });
};

/**
 * ดึงรายละเอียด pricing request สำหรับสร้างใบเสนอราคา
 * @param {string} id - Pricing request ID
 * @returns {Promise} API response with pricing request details and summary
 */
export const getPricingRequestDetails = (id) => {
  return axios.get(`/pricing-integration/requests/${id}`);
};

/**
 * ดึงสรุปข้อมูล pricing request
 * @param {string} id - Pricing request ID
 * @returns {Promise} API response with pricing request summary
 */
export const getPricingRequestSummary = (id) => {
  return axios.get(`/pricing-integration/requests/${id}/summary`);
};

/**
 * สร้างใบเสนอราคาจาก pricing request
 * @param {Object} data - Quotation data including pricing_request_id
 * @returns {Promise} API response with created quotation
 */
export const createQuotationFromPricing = (data) => {
  return axios.post('/pricing-integration/create-quotation', data);
};

// Export all functions as default object for easier importing
export default {
  getCompletedPricingRequests,
  getPricingRequestDetails,
  getPricingRequestSummary,
  createQuotationFromPricing
}; 