import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  // Check for user instead of token since that's what Login sets
  const isAuthenticated = localStorage.getItem("user");
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;