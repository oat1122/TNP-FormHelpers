/**
 * Utility functions for debugging token issues
 */

// Check and log all available tokens from localStorage
export const debugTokens = () => {
  console.log("---- TOKEN DEBUG INFO ----");

  // Check for the token in standard locations
  const authToken = localStorage.getItem("authToken");
  const token = localStorage.getItem("token");
  const jwtToken = localStorage.getItem("jwtToken");

  console.log("authToken:", authToken);
  console.log("token:", token);
  console.log("jwtToken:", jwtToken);

  // Look for any other key in localStorage that might contain a token
  const allKeys = Object.keys(localStorage);
  console.log("All localStorage keys:", allKeys);

  // Look for keys that might be token related
  const possibleTokenKeys = allKeys.filter(
    (key) =>
      key.toLowerCase().includes("token") ||
      key.toLowerCase().includes("auth") ||
      key.toLowerCase().includes("jwt")
  );

  console.log("Possible token keys found:", possibleTokenKeys);

  // Check for token validity - simplistic check
  if (authToken) {
    console.log("authToken format check:", isTokenFormatValid(authToken));
  }

  if (token) {
    console.log("token format check:", isTokenFormatValid(token));
  }

  console.log("------------------------");
};

// Basic check for token format (JWT format: header.payload.signature)
const isTokenFormatValid = (token) => {
  if (!token) return false;

  // Check if it looks like a JWT token (simplified check)
  if (typeof token === "string" && token.split(".").length === 3) {
    return "Appears to be a valid JWT format";
  }

  // If it's very short, probably not a real token
  if (typeof token === "string" && token.length < 20) {
    return "Token seems too short to be valid";
  }

  return "Unknown token format";
};

/**
 * Debug API request issues
 * @param {string} endpoint - The API endpoint being called
 * @param {Object} options - Additional options to log
 */
export const debugApiRequest = (endpoint, options = {}) => {
  console.log("==== API REQUEST DEBUG INFO ====");
  console.log("Endpoint:", endpoint);

  // Check for the token in standard locations
  const authToken = localStorage.getItem("authToken");
  const token = localStorage.getItem("token");

  console.log("Using authToken:", authToken ? "Yes" : "No");
  console.log("Using token:", token ? "Yes" : "No");

  // Log headers if provided
  if (options.headers) {
    console.log("Request headers:", options.headers);
  }

  // Log configured API base URL
  const apiBaseUrl = import.meta.env.VITE_END_POINT_URL || "/api/v1";
  console.log("API Base URL:", apiBaseUrl);
  console.log("Full request URL:", `${apiBaseUrl}${endpoint}`);

  // Check userData in localStorage
  try {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    console.log("User data in localStorage:", userData);
  } catch (error) {
    console.error("Error parsing userData:", error);
  }

  console.log("==============================");
};

/**
 * Debug API response structure
 * @param {Object} response - The API response to analyze
 * @param {string} source - Source identifier for the log
 */
export const debugApiResponse = (response, source = "Unknown") => {
  console.log(`==== API RESPONSE DEBUG [${source}] ====`);

  // Check if response is defined
  if (!response) {
    console.error("Response is undefined or null");
    console.log("==============================");
    return;
  }

  // Log response type and structure
  console.log("Response type:", typeof response);

  // Analyze basic structure
  if (response.hasOwnProperty("data")) {
    console.log("Contains data property:", typeof response.data);

    if (Array.isArray(response.data)) {
      console.log("Data is an array with length:", response.data.length);
      if (response.data.length > 0) {
        console.log("First item sample:", response.data[0]);
        console.log("Item properties:", Object.keys(response.data[0]));
      }
    } else if (typeof response.data === "object") {
      console.log("Data is an object with keys:", Object.keys(response.data));
    }
  }

  if (response.hasOwnProperty("status")) {
    console.log("Status:", response.status);
  }

  // Check for common expected properties
  const expectedProps = ["data", "status", "message", "pagination"];
  const foundProps = expectedProps.filter((prop) => response.hasOwnProperty(prop));
  console.log("Found expected properties:", foundProps);

  // Check for unexpected properties
  const allProps = Object.keys(response);
  const unexpectedProps = allProps.filter((prop) => !expectedProps.includes(prop));
  if (unexpectedProps.length > 0) {
    console.log("Unexpected properties:", unexpectedProps);
  }

  console.log("==============================");
};

/**
 * Specialized debug function for worksheet API responses
 * @param {Object} response - The worksheet API response to analyze
 */
export const debugWorksheetResponse = (response) => {
  console.log("==== WORKSHEET API DEBUG INFO ====");

  // Check if response is defined
  if (!response) {
    console.error("Response is undefined or null");
    console.log("==============================");
    return;
  }

  // Log response type
  console.log("Response type:", typeof response);

  // Try to determine data structure
  if (Array.isArray(response)) {
    // Direct array
    console.log("Response is a direct array with length:", response.length);
    if (response.length > 0) {
      const firstItem = response[0];
      console.log("First item keys:", Object.keys(firstItem));
      console.log("Has worksheet_id:", !!firstItem.worksheet_id);
      console.log("Has customer_name:", !!firstItem.customer_name);
      console.log("Has status:", !!firstItem.status, firstItem.status);
    }
  } else if (response.data) {
    // Has data property
    if (Array.isArray(response.data)) {
      console.log("Response.data is an array with length:", response.data.length);
      if (response.data.length > 0) {
        const firstItem = response.data[0];
        console.log("First item keys:", Object.keys(firstItem));
        console.log("Has worksheet_id:", !!firstItem.worksheet_id);
        console.log("Has customer_name:", !!firstItem.customer_name);
        console.log("Has status:", !!firstItem.status, firstItem.status);
      }
    } else {
      console.log("Response.data is not an array:", typeof response.data);
      console.log("Response.data keys:", Object.keys(response.data));
    }
  } else {
    // Other format
    console.log("Response keys:", Object.keys(response));
  }

  console.log("==============================");
};
