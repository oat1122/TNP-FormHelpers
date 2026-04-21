import { useMemo } from "react";

export const useCurrentUser = () => {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}") || {};
    } catch {
      return {};
    }
  }, []);
  const isAdmin = String(currentUser?.role).toLowerCase() === "admin";
  return { currentUser, isAdmin };
};
