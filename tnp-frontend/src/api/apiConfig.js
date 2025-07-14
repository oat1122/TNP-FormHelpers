export const apiConfig = {
    baseUrl: import.meta.env.VITE_END_POINT_URL,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");

      // Try to get token from multiple possible storage keys for backward compatibility
      const authToken = localStorage.getItem("authToken");
      const token = localStorage.getItem("token");
      
      // Use whichever token is available
      const finalToken = authToken || token;

      // If we have a token, add it to the Authorization header
      if (finalToken) {
        headers.set("Authorization", `Bearer ${finalToken}`);
        if (process.env.NODE_ENV === 'development') {
          console.log("API Config: Added token to request headers");
        }
      } else {
        console.warn("API Config: No authentication token found");
      }

      return headers;
    },
    credentials: "include",
  };
  