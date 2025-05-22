// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem("token"); 

  if (!isAuthenticated) {
    return <Navigate to="/" />; // Redirect to login if not authenticated
  }

  return children; // Render children if authenticated
};

export default PrivateRoute;

