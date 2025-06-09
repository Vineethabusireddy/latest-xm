import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSearch, FaLocationArrow, FaMapMarkerAlt, FaChevronRight } from 'react-icons/fa';
import { useLocationPermission } from './useLocationPermission';
import { useNavigate } from 'react-router-dom';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: { 
    name: string; 
    city?: string | null; 
    postcode?: string | null; 
    latitude?: number | null; 
    longitude?: number | null; 
  }) => void;
}

// Define a type for search results based on Nominatim API response (simplified)
interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  // Add other relevant fields if needed
}

// Define a type for search results for our component
interface SearchResult {
  name: string;
  city?: string | null;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onSelectLocation }) => {
  const { locationState, requestLocation } = useLocationPermission();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; city?: string | null; postcode?: string | null; latitude?: number | null; longitude?: number | null } | null>(null);

  // Add this useEffect to update the modal's selected location when locationState changes (e.g., after permission granted)
  useEffect(() => {
    if (locationState.permission === 'granted' && locationState.latitude && locationState.longitude) {
        const location = {
          name: locationState.locationName || 'Current Location',
          city: locationState.city,
          postcode: locationState.postcode,
          latitude: locationState.latitude,
          longitude: locationState.longitude
        };
        setSelectedLocation(location);
    }
  }, [locationState]); // Dependency on locationState

  const handleNavigateToSearch = () => {
    onClose(); // Close the modal before navigating
    navigate('/location-select');
  };

  const modalVariants = {
    hidden: { opacity: 0, y: '100%' },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm m-0 sm:m-4 border border-gray-100 dark:border-gray-700"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Choose Location</h2>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <FaTimes className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Use Current Location Button */}
              <button
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                onClick={() => {
                  if (!navigator.geolocation) {
                    return;
                  }

                  if (locationState.permission === 'granted' && locationState.latitude && locationState.longitude) {
                    const location = {
                      name: locationState.locationName || 'Current Location',
                      city: locationState.city,
                      postcode: locationState.postcode,
                      latitude: locationState.latitude,
                      longitude: locationState.longitude
                    };
                    onSelectLocation(location);
                    onClose();
                  } else {
                    requestLocation();
                  }
                }}
              >
                <div className="flex items-center">
                  <FaLocationArrow size={20} className="mr-3" />
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-sm sm:text-base">Use current location</span>
                    {(locationState.city || locationState.postcode) && (
                      <span className="text-xs opacity-90">
                        {`${locationState.city || ''}${locationState.city && locationState.postcode ? ', ' : ''}${locationState.postcode || ''}`}
                      </span>
                    )}
                  </div>
                </div>
                <FaChevronRight size={16} />
              </button>

              {/* Search Option Button */}
              <button
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                onClick={handleNavigateToSearch}
              >
                <div className="flex items-center">
                  <FaSearch size={20} className="mr-3" />
                  <span className="font-medium text-sm sm:text-base">Search for a location</span>
                </div>
                <FaChevronRight size={16} />
              </button>

              {/* Saved Addresses Section */}
              <div className="flex items-start p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl mt-6 border border-blue-100 dark:border-blue-800">
                <FaMapMarkerAlt size={20} className="text-blue-600 dark:text-blue-400 mr-3 mt-1" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Sign in to see your saved addresses or add a new address
                  </p>
                  <button 
                    onClick={() => {
                      onClose(); // Close the modal first
                      navigate('/login'); // Navigate to login page
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-blue-600 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Login / Sign up
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Safe Area for Mobile */}
            <div className="h-4 sm:hidden" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationModal; 