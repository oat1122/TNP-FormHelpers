import axios from '@/api/axios';

// Product API Service for Accounting
// Based on endpoints from README.md and DATABASE_SCHEMA_ALIGNMENT.md

/**
 * Fetch products with optional filters
 * @param {Object} params - Query parameters (page, per_page, search, category, is_active, etc.)
 * @returns {Promise} API response with products list
 */
export const fetchProducts = (params = {}) => {
  return axios.get('/accounting/products', { params });
};

/**
 * Get product categories
 * @param {Object} params - Query parameters
 * @returns {Promise} API response with product categories
 */
export const fetchProductCategories = (params = {}) => {
  return axios.get('/accounting/products/categories', { params });
};

// Alias for backward compatibility
export const getProductCategories = fetchProductCategories;

/**
 * Get low stock products
 * @param {Object} params - Query parameters
 * @returns {Promise} API response with low stock products
 */
export const getLowStockProducts = (params = {}) => {
  return axios.get('/accounting/products/low-stock', { params });
};

/**
 * Get specific product by ID
 * @param {string} id - Product ID (mpc_id)
 * @returns {Promise} API response with product data
 */
export const getProduct = (id) => {
  return axios.get(`/accounting/products/${id}`);
};

/**
 * Create new product
 * @param {Object} data - Product data (following master_product_categories schema)
 * @returns {Promise} API response with created product
 */
export const createProduct = (data) => {
  return axios.post('/accounting/products', data);
};

/**
 * Update existing product
 * @param {string} id - Product ID
 * @param {Object} data - Updated product data
 * @returns {Promise} API response with updated product
 */
export const updateProduct = (id, data) => {
  return axios.put(`/accounting/products/${id}`, data);
};

/**
 * Delete product (soft delete)
 * @param {string} id - Product ID
 * @returns {Promise} API response
 */
export const deleteProduct = (id) => {
  return axios.delete(`/accounting/products/${id}`);
};

/**
 * Update product stock
 * @param {string} id - Product ID
 * @param {Object} stockData - Stock update data
 * @returns {Promise} API response
 */
export const updateProductStock = (id, stockData) => {
  return axios.patch(`/accounting/products/${id}/stock`, stockData);
};

/**
 * Search products for autocomplete
 * @param {string} query - Search query
 * @param {number} limit - Maximum results
 * @returns {Promise} API response with matching products
 */
export const searchProducts = (query, limit = 10) => {
  return axios.get('/accounting/products', {
    params: {
      search: query,
      per_page: limit,
      autocomplete: true
    }
  });
};

// Export all functions as default object for easier importing
export default {
  fetchProducts,
  fetchProductCategories,
  getProductCategories,
  getLowStockProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  searchProducts
}; 