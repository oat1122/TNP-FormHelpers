import { apiConfig } from "../../../../../../api/apiConfig";

export const getApiBaseUrl = () => apiConfig?.baseUrl || "/api/v1";

export const getAuthToken = () =>
  localStorage.getItem("authToken") || localStorage.getItem("token") || "";
