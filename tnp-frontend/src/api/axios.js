import axios from "axios";

import { apiConfig } from "./apiConfig";

const instance = axios.create({
  baseURL: apiConfig.baseUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  withXSRFToken: true,
});

const clearAuthStorage = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  localStorage.removeItem("isLoggedIn");
};

// Helper to parse JWT (since we might not have jwt-decode)
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};

instance.interceptors.request.use(
  (config) => {
    // Try both token keys for backward compatibility
    const authToken = localStorage.getItem("authToken");
    const token = localStorage.getItem("token");
    let finalToken = authToken || token;

    if (finalToken) {
      // Check if token is expired
      const decoded = parseJwt(finalToken);
      if (decoded && decoded.exp) {
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          console.warn("Token expired, removing from storage");
          clearAuthStorage();
          finalToken = null;
          // Optionally redirect to login or let the 401 logic handle the rest,
          // but clearing it prevents sending an invalid header.
        }
      }
    }

    if (finalToken) {
      config.headers["Authorization"] = `Bearer ${finalToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Global Axios: Received 401 Unauthorized, redirecting...");
      clearAuthStorage();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
