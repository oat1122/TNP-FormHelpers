import { Navigate, Outlet } from "react-router-dom";

import AppHeader from "../../components/Navbar/AppHeader";

export const AuthLayout = () => {
  const login = localStorage.getItem("isLoggedIn");

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
