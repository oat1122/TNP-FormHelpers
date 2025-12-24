/**
 * Axios Base Query Adapter for RTK Query
 *
 * Uses the existing Axios instance from src/api/axios.js
 * to avoid duplicate configuration and ensure consistency
 */
import axiosInstance from "../../api/axios";

/**
 * Custom baseQuery adapter for RTK Query using Axios
 * Replaces fetchBaseQuery with Axios for better interceptor support
 *
 * Benefits of using shared Axios instance:
 * - Single point for authentication token management
 * - Consistent XSRF/CSRF handling
 * - Unified error handling
 *
 * @param {Object} options - Configuration options
 * @param {string} options.baseUrl - Optional additional base URL prefix
 * @returns {Function} RTK Query compatible baseQuery function
 */
const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: "" }) =>
  async ({ url, method = "GET", data, params, headers }) => {
    try {
      const result = await axiosInstance({
        url: baseUrl + url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      // Format error for RTK Query compatibility
      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data || axiosError.message,
        },
      };
    }
  };

export default axiosBaseQuery;
