import { Navigate, Outlet } from "react-router-dom";

import AppHeader from "../../components/Navbar/AppHeader";
import { useSocketNotification } from "../../hooks/useSocketNotification";

export const AuthLayout = () => {
  const login = localStorage.getItem("isLoggedIn");

  // เชื่อมต่อ Socket.io เมื่อ user login
  useSocketNotification();

  return !login ? (
    <Navigate to="/login" />
  ) : (
    <>
      <AppHeader />
      <Outlet />
    </>
  );
};

export const GuestLayout = () => {
  const login = localStorage.getItem("isLoggedIn");

  return !login ? <Outlet /> : <Navigate to="/" />;
};
