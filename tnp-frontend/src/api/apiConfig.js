import axios from 'axios';

export const apiConfig = {
    baseUrl: import.meta.env.VITE_END_POINT_URL,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");

      // ดึง Token จาก localStorage (หรือ sessionStorage ตามที่คุณบันทึกไว้)
      const token = localStorage.getItem("authToken"); // หรือ sessionStorage.getItem("authToken");

      // ถ้ามี Token ให้นำไปใส่ใน Authorization Header แบบ Bearer Token
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
    credentials: "include",
  };

// Axios instance for Tanstack Query
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_END_POINT_URL,
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("authToken");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
  