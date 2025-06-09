import { useMemo } from 'react';

export const useUserPermissions = () => {
  const user = JSON.parse(localStorage.getItem("userData"));
  
  return useMemo(() => ({
    isAdmin: user?.role === 'admin',
    isSale: user?.role === 'sale',
    canManageCustomers: user?.role === 'admin' || user?.role === 'sale',
    canDeleteCustomers: user?.role === 'admin',
    canViewAllCustomers: user?.role === 'admin',
    userId: user?.user_id,
    userRole: user?.role
  }), [user]);
};
