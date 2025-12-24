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

instance.interceptors.request.use(
  (config) => {
    // Try both token keys for backward compatibility (matching apiConfig.js)
    const authToken = localStorage.getItem("authToken");
    const token = localStorage.getItem("token");
    const finalToken = authToken || token;

    if (finalToken) {
      config.headers["Authorization"] = `Bearer ${finalToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
