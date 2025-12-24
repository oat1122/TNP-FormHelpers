import { Navigate, Outlet } from "react-router-dom";

import AppHeader from "../../components/Navbar/AppHeader";

export const AuthLayout = () => {
  const login = localStorage.getItem("isLoggedIn");

  // Socket.io notification is handled in AppHeader component
  // to avoid duplicate connections and double toast notifications

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
