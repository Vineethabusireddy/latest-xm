import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [user, setUser] = useState({ name: "", email: "", phone: "" });

  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/api/user/profile?email=${storedUser.email}`
        );
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      } catch (error) {
        console.error("Error fetching profile:", error);
        alert("Failed to load profile. Redirecting to login...");
        navigate("/");
      }
    };

    if (storedUser.email) fetchUserProfile();
    else {
      alert("No user data found. Redirecting to login...");
      navigate("/");
    }
  }, [navigate, storedUser.email]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
