import { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaMapMarkerAlt } from "react-icons/fa";
import { ShoppingCart } from "lucide-react";
import axios from "axios";
import Logo from "./assets/Group_1.png";
import { useLocationPermission } from "../LocationPermission/useLocationPermission";
import LocationModal from "../LocationPermission/LocationModal";

interface SearchResult {
  id: number;
  name: string;
  type: "card" | "product" | "category";
  image?: string;
  cashback?: string;
  sku?: string;
}

const Nav: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("user"));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const { locationState, requestLocation } = useLocationPermission();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ 
    name: string; 
    city?: string | null; 
    postcode?: string | null; 
    latitude?: number | null; 
    longitude?: number | null; 
  } | null>(locationState.locationName ? { 
    name: locationState.locationName, 
    city: locationState.city, 
    postcode: locationState.postcode, 
    latitude: locationState.latitude, 
    longitude: locationState.longitude 
  } : null);

  const location = useLocation();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("user"));
  }, [location]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setShowDropdown(false);
      setActiveIndex(null);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/search`, {
          params: { query: searchTerm },
        });
        setSearchResults(response.data);
        setShowDropdown(true);
        setActiveIndex(null);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    const debounceTimer = setTimeout(fetchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, apiUrl]);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(cart.length);
      } catch {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);
    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  useEffect(() => {
    if (locationState.permission === 'granted' && locationState.locationName) {
       const name = locationState.locationName || '';
       const newSelectedLocation = {
           name: name,
           city: locationState.city,
           postcode: locationState.postcode,
           latitude: locationState.latitude,
           longitude: locationState.longitude,
       };
       setSelectedLocation(newSelectedLocation);
    } else if (locationState.permission === 'denied' && (locationState.city || locationState.postcode || locationState.locationName)) {
           const newSelectedLocation = {
               name: locationState.locationName || "Mumbai",
               city: locationState.city,
               postcode: locationState.postcode,
               latitude: locationState.latitude,
               longitude: locationState.longitude,
           };
           setSelectedLocation(newSelectedLocation);
    }
  }, [locationState.permission, locationState.locationName, locationState.city, locationState.postcode, locationState.latitude, locationState.longitude]);

  useEffect(() => {
    const savedLocation = localStorage.getItem('selectedLocation');
    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation);
        setSelectedLocation(locationData);
      } catch (error) {
        console.error('Error parsing saved location:', error);
      }
    }
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setSearchTerm(result.name);
    setShowDropdown(false);
    setActiveIndex(null);

    let path =`/${result.type}/${result.id}`;

    if (result.type === "product" && result.sku) {
      path = `/product/${result.sku}`;
    }

    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prevIndex) => {
        const newIndex = prevIndex === null ? 0 : prevIndex + 1;
        return newIndex >= searchResults.length ? 0 : newIndex;
      });
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prevIndex) => {
        const newIndex = prevIndex === null ? searchResults.length - 1 : prevIndex - 1;
        return newIndex < 0 ? searchResults.length - 1 : newIndex;
      });
    }

    if (e.key === "Enter" && activeIndex !== null) {
      e.preventDefault();
      handleResultClick(searchResults[activeIndex]);
    }
  };

  const handleLocationSelect = useCallback((location: { 
    name: string; 
    city?: string | null; 
    postcode?: string | null; 
    latitude?: number | null; 
    longitude?: number | null; 
  }) => {
    const locationData = {
      name: location.name,
      city: location.city,
      postcode: location.postcode,
      latitude: location.latitude,
      longitude: location.longitude
    };
    setSelectedLocation(locationData);
    localStorage.setItem('selectedLocation', JSON.stringify(locationData));
  }, [setSelectedLocation]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-[#F8F9FA] border-b border-[#E0E0E0] dark:bg-[#1A202C] w-full z-20 shadow-md">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3">
          
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 min-w-[80px] sm:min-w-[100px]">
            <img
              src={Logo}
              className="h-6 w-16 sm:h-8 sm:w-20 md:h-10 md:w-24 transition-all duration-300"
              alt="XM RETAIL"
            />
            <span className="text-base sm:text-lg md:text-xl font-semibold dark:text-white hidden sm:block">
              XM RETAIL
            </span>
          </Link>

          {/* Search Bar */}
          <div className="relative flex-1 mx-1 sm:mx-4 md:mx-6 lg:mx-8 min-w-[120px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onKeyDown={handleKeyDown}
              className="block w-full p-2 sm:p-2.5 pl-8 sm:pl-10 text-sm sm:text-base text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
              placeholder="Search..."
            />
            <div className="absolute inset-y-0 left-2 sm:left-2.5 flex items-center text-gray-500">
              🔍
            </div>

            {/* Search Results Dropdown */}
            {showDropdown && (
              <div className="absolute top-11 sm:top-12 left-0 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <div
                      key={result.id}
                      className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer ${
                        activeIndex === index ? "bg-orange-100" : ""
                      }`}
                      onMouseDown={() => handleResultClick(result)}
                    >
                      <div className="flex items-center gap-2">
                        {result.image && result.image !== "" && (
                          <img
                            src={`${apiUrl}/uploads/${result.image}`}
                            alt={result.name}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="font-medium text-sm sm:text-base">
                          {result.name}
                        </span>
                      </div>
                      {result.cashback && (
                        <span className="text-xs sm:text-sm font-semibold text-gray-600">
                          {result.cashback}%
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-2 text-sm">
                    No results found
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Location Display */}
          <div
            className="flex flex-col items-end mx-2 sm:mx-4 cursor-pointer min-w-[60px] sm:min-w-[80px]"
            onClick={() => setIsLocationModalOpen(true)}
          >
            <div className="flex items-center text-[#ff6726]">
              {/* Location Icon */}
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#ff6726] bg-opacity-10 mr-2">
                <FaMapMarkerAlt className="text-[#ff6726] text-base" />
              </span>
              {/* City and Pincode stacked */}
              <div className="flex flex-col items-start">
                <span className="font-semibold text-xs sm:text-sm mb-0.5">
                  {selectedLocation?.city || locationState.city || "Set City"}
                </span>
                <span className="text-xs sm:text-sm">
                  {selectedLocation?.postcode || locationState.postcode || "Set Pincode"}
                </span>
              </div>
            </div>
          </div>

          {/* Login/Signup Button */}
          {!isLoggedIn &&location.pathname==="/home" &&(
            <div className="flex items-center gap-2">
              <Link to="/login" className="min-w-[80px] sm:min-w-[100px]">
                <button className="text-white bg-[#ff6726] hover:bg-[#FFB74D] rounded-md text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 font-semibold w-full">
                  Login/Sign up
                </button>
              </Link>
            </div>
          )}
          {isLoggedIn && (
            <div className="flex items-center gap-2 sm:gap-4 min-w-[80px] sm:min-w-[100px] justify-end">
              <Link to="/cart" className="relative">
                <ShoppingCart size={22} className="sm:w-6 sm:h-6" color="#ff6726" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-[#ff6726] text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center border border-[#ff6726] shadow">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="ml-1 sm:ml-2">
                <FaUserCircle className="text-xl sm:text-2xl text-[#ff6726] cursor-pointer" />
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className="main-content" style={{ paddingTop: "60px" }}>
        {/* Other content */}
      </div>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={handleLocationSelect}
      />
    </>
  );
}

export default Nav;