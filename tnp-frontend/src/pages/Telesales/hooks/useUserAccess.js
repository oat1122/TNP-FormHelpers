import { useMemo } from "react";

/**
 * Custom hook for role-based access control
 * Determines user permissions and view type for the dashboard
 *
 * @returns {Object} Access control properties
 * @returns {boolean} hasAccess - Whether user can access the dashboard
 * @returns {string|null} userRole - User's role (admin, manager, telesale, sale)
 * @returns {string|null} userName - User's display name
 * @returns {number|null} userId - User's ID
 * @returns {boolean} isTeamView - Whether to show team view (admin/manager) or personal view
 */
export const useUserAccess = () => {
  return useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("userData") || "{}");
      const allowedRoles = ["admin", "manager", "telesale", "sale"];
      const isAdmin = ["admin", "manager"].includes(user?.role);

      return {
        hasAccess: allowedRoles.includes(user?.role),
        userRole: user?.role,
        userName: user?.username || user?.user_firstname,
        userId: user?.user_id,
        isTeamView: isAdmin,
      };
    } catch {
      return {
        hasAccess: false,
        userRole: null,
        userName: null,
        userId: null,
        isTeamView: false,
      };
    }
  }, []);
};
