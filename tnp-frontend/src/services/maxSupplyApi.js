import axios from "axios";
import { debugApiRequest } from "../utils/tokenDebug";

const API_BASE_URL = import.meta.env.VITE_END_POINT_URL || "/api/v1";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for slower networks and complex queries
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json", // Explicitly request JSON responses
  },
  // Make sure query params are properly serialized
  paramsSerializer: (params) => {
    const searchParams = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key]);
      }
    }
    return searchParams.toString();
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Try to get token from multiple possible storage keys for backward compatibility
    const authToken = localStorage.getItem("authToken");
    const token = localStorage.getItem("token");

    // Use whichever token is available
    const finalToken = authToken || token;

    // Debug: Log only in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("MaxSupply API: Token check -", finalToken ? "Found" : "Not found");
    }

    // If we have a token, add it to the Authorization header
    if (finalToken) {
      config.headers.Authorization = `Bearer ${finalToken}`;
    } else {
      console.warn("MaxSupply API: No authentication token found");
      console.warn("Available localStorage keys:", Object.keys(localStorage));
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - disabled to prevent infinite refresh loops
      console.warn("Received 401 Unauthorized, but auto-redirect disabled");
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// MaxSupply API endpoints
export const maxSupplyApi = {
  // Get all max supplies with filters
  getAll: async (params = {}) => {
    const response = await api.get("/max-supplies", { params });
    return response.data;
  },

  // Get single max supply by ID
  getById: async (id) => {
    const response = await api.get(`/max-supplies/${id}`);
    return response.data;
  },

  // Create new max supply
  create: async (data) => {
    const response = await api.post("/max-supplies", data);
    return response.data;
  },

  // Update max supply
  update: async (id, data) => {
    const response = await api.put(`/max-supplies/${id}`, data);
    return response.data;
  },

  // Delete max supply
  delete: async (id) => {
    const response = await api.delete(`/max-supplies/${id}`);
    return response.data;
  },

  // Update status
  updateStatus: async (id, status, completedQuantity = null) => {
    const response = await api.patch(`/max-supplies/${id}/status`, {
      status,
      completed_quantity: completedQuantity,
    });
    return response.data;
  },

  // Get statistics
  getStatistics: async (params = {}) => {
    const response = await api.get("/max-supplies/statistics", { params });
    return response.data;
  },
};

// Calendar API endpoints
export const calendarApi = {
  // Get calendar data
  getCalendarData: async (params = {}) => {
    try {
      // Build URL manually to avoid any parameter serialization issues
      let url = "/calendar";
      const queryParams = new URLSearchParams();

      // Add parameters to query string
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
          queryParams.append(key, params[key]);
        }
      });

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      // Debug: Log only in development mode
      if (process.env.NODE_ENV === "development") {
        console.log("Calendar API request to:", url);
      }

      const response = await api.get(url);

      // Debug: Log response only in development mode
      if (process.env.NODE_ENV === "development") {
        console.log("Calendar API response received");
      }

      // Check for HTML response which would indicate an error
      if (typeof response.data === "string" && response.data.trim().startsWith("<!DOCTYPE")) {
        throw new Error(
          "Server returned HTML instead of JSON. This typically indicates a server error or authentication issue."
        );
      }

      return response.data;
    } catch (error) {
      console.error("Calendar API error:", error.message);

      // Enhanced error logging for debugging
      if (process.env.NODE_ENV === "development") {
        console.error("Full Calendar API error details:", {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          url: url,
          config: error.config,
        });
      }

      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      }
      throw error;
    }
  },

  // Get monthly data
  getMonthlyData: async (year, month) => {
    const response = await api.get(`/calendar/${year}/${month}`);
    return response.data;
  },

  // Get weekly data
  getWeeklyData: async (date) => {
    const response = await api.get(`/calendar/week/${date}`);
    return response.data;
  },

  // Get daily data
  getDailyData: async (date) => {
    const response = await api.get(`/calendar/day/${date}`);
    return response.data;
  },
};

// Worksheet API endpoints
export const worksheetApi = {
  // Get all worksheets
  getAll: async (params = {}) => {
    const response = await api.get("/worksheets", { params });
    return response.data;
  },

  // Get single worksheet by ID
  getById: async (id) => {
    const response = await api.get(`/worksheets/${id}`);
    return response.data;
  },

  // Get worksheets for MaxSupply creation
  getForMaxSupply: async () => {
    try {
      const response = await api.get("/worksheets-newworksnet");
      if (response.data && response.data.status === "success") {
        return { status: "success", data: response.data.data };
      }
      return { status: "error", message: "Invalid response", data: [] };
    } catch (error) {
      console.error("Error fetching worksheets for MaxSupply:", error);
      if (error.response) {
        return {
          status: "error",
          message: error.response.data?.message || "Request failed",
          data: [],
        };
      }
      return { status: "error", message: error.message, data: [] };
    }
  },
  // Fetch worksheets directly from the NewWorksNet system
  getFromNewWorksNet: async () => {
    try {
      const response = await api.get("/worksheets-newworksnet");
      return response.data;
    } catch (error) {
      console.error("Error fetching worksheets from NewWorksNet:", error);
      if (error.response) {
        return { status: "error", message: error.response.data?.message || "Request failed" };
      }
      return { status: "error", message: error.message };
    }
  },
};

// Customer API endpoints
export const customerApi = {
  // Get all customers
  getAll: async (params = {}) => {
    const response = await api.get("/customers", { params });
    return response.data;
  },

  // Get customer by ID
  getById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
};

// General API endpoints
export const generalApi = {
  // Get business types
  getBusinessTypes: async () => {
    const response = await api.get("/get-all-business-types");
    return response.data;
  },

  // Get product categories
  getProductCategories: async () => {
    const response = await api.get("/get-all-product-categories");
    return response.data;
  },

  // Get status by type
  getStatusByType: async (type) => {
    const response = await api.get(`/get-status-by-type/${type}`);
    return response.data;
  },
};

// Export default API instance
export default api;
