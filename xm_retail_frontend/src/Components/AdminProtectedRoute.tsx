import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const AdminProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initial check
    const token = localStorage.getItem("adminToken");
    setIsAuthenticated(!!token);

    // Storage event listener for cross-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "adminToken") {
        const newToken = e.newValue;
        setIsAuthenticated(!!newToken);
        if (!newToken) {
          navigate("/admin/login", { replace: true });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return null; // Or a loading spinner
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminProtectedRoute;