import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const auth = localStorage.getItem("authToken") || localStorage.getItem("token");
  return auth ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
