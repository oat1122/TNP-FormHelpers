// Resolve the auth token from the standard localStorage keys.
// Returns "" when no token is present so callers can skip the Authorization header.
export function getAuthToken() {
  return localStorage.getItem("authToken") || localStorage.getItem("token") || "";
}
