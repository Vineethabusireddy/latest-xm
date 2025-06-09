import { useNavigate } from "react-router-dom";
import { useState } from "react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${apiUrl}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // Store token instead of just a flag
      localStorage.setItem("adminToken", data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-2">
      <div className="w-full max-w-xs sm:max-w-md p-4 sm:p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-700 mb-4 sm:mb-6">Admin Login</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 text-sm sm:text-base">Email</label>
            <input
              type="text"
              className="w-full px-3 py-2 sm:px-4 sm:py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 text-sm sm:text-base">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 sm:px-4 sm:py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm sm:text-base"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;