import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaMapMarkerAlt, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import Nav from '../NavBar/Nav';

interface SearchResult {
  name: string;
  city?: string | null;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    county?: string;
    district?: string;
    [key: string]: any;
  };
}

const LocationSelectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(null);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (search: string) => {
    const updatedSearches = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const handleSearch = async (query: string) => {
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NominatimSearchResult[] = await response.json();

      const results: SearchResult[] = data.map(item => {
        let city = null;

        // Prioritize district from address object first
        if (item.address?.district) {
            city = item.address.district;
        } else {
            // If district is not available, use city, town, or village
            city = item.address?.city || item.address?.town || item.address?.village || null;

            // Fallback: if the extracted city is null or seems like a smaller locality
            // and a district or city wasn't explicitly found in the address object,
            // try to extract a more suitable administrative area from the display_name
            if ((!city || city === item.address?.village || city === item.address?.town) && 
                (!item.address?.district && !item.address?.city)) {
                const parts = item.display_name.split(', ').reverse();

                // Look for a part that is not a number, and doesn't seem like a street, road, or small place type
                const potentialCityPart = parts.find(part => {
                    const lowerPart = part.toLowerCase();
                    return part.length > 1 && 
                           !/\d/.test(part) && 
                           !lowerPart.includes('street') &&
                           !lowerPart.includes('road') &&
                           !lowerPart.includes('lane') &&
                           !lowerPart.includes('andhra pradesh') &&
                           !lowerPart.includes('telangana') &&
                           !lowerPart.includes('mandal') &&
                           !lowerPart.includes('village') &&
                           !lowerPart.includes('india');
                });

                if (potentialCityPart) {
                    city = potentialCityPart.trim();
                }
            }
        }

        const postcode = item.address?.postcode || null;
        const locationData = {
            name: item.display_name,
            city: city,
            postcode: postcode,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
        };
        return locationData;
      });

      setSearchResults(results);
      saveRecentSearch(query);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location: SearchResult) => {
    const locationData = {
      name: location.name,
      // Use the city already extracted from search results.
      city: location.city || null,
      postcode: location.postcode || null,
      latitude: location.latitude,
      longitude: location.longitude
    };
    localStorage.setItem('selectedLocation', JSON.stringify(locationData));
    navigate(-1);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav/>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <FaArrowLeft className="text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Select Location</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search for your area, street, building..."
            className="w-full p-3 pl-10 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <FaSearch size={18} />
          </div>
        </div>

        {/* Loading State */}
        {isSearching && (
          <div className="flex justify-center items-center py-6">
            <FaSpinner className="animate-spin text-purple-500 text-xl" />
          </div>
        )}

        {/* Search Results */}
        {!isSearching && searchResults.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white px-1">Search Results</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
              {searchResults.map((result, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => handleLocationSelect(result)}
                >
                  <div className="flex items-start space-x-3">
                    <FaMapMarkerAlt className="text-purple-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{result.name}</p>
                      {result.city && result.city !== result.name && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{result.city}</p>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {!isSearching && searchResults.length === 0 && recentSearches.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white px-1">Recent Searches</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => {
                    setSearchTerm(search);
                    handleSearch(search);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <FaSearch className="text-gray-400" size={16} />
                    <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{search}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Results State */}
        {!isSearching && searchResults.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <FaMapMarkerAlt className="mx-auto text-gray-400 text-3xl sm:text-4xl mb-2" />
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No locations found</p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSelectPage; 