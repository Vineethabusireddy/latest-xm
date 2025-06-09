import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import axios from "axios";

function Carousels() {
  const [index, setIndex] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(3); // Default for Desktop
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;

  // Fetch images from the API
  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/api/images`);
        console.log("API Response:", response.data); // Debugging

        // Ensure response.data is an array
        if (Array.isArray(response.data)) {
          setImages(response.data);
        } else if (response.data && Array.isArray(response.data.images)) {
          setImages(response.data.images);
        } else {
          console.error("Unexpected response format:", response.data);
          setImages([]); // Fallback to an empty array
        }
      } catch (error) {
        console.error("Error fetching images:", error);
        setImages([]); // Ensure `images` is always an array
      } finally {
        setIsLoading(false);
        setFadeIn(true);
      }
    };

    fetchImages();
  }, [apiUrl]);

  // Update items per slide based on screen size
  useEffect(() => {
    const updateItemsPerSlide = () => {
      if (window.innerWidth < 640) {
        setItemsPerSlide(1); // Mobile
      } else if (window.innerWidth < 1024) {
        setItemsPerSlide(2); // Tablet
      } else {
        setItemsPerSlide(3); // Desktop
      }
    };

    updateItemsPerSlide();
    window.addEventListener("resize", updateItemsPerSlide);
    return () => window.removeEventListener("resize", updateItemsPerSlide);
  }, []);

  // Navigate to the next slide
  const nextSlide = () => {
    setSlideDirection('right');
    if (index < images.length - itemsPerSlide) {
      setIndex(index + 1);
    } else {
      setIndex(0); // Loop back to the first slide
    }
  };

  // Navigate to the previous slide
  const prevSlide = () => {
    setSlideDirection('left');
    if (index > 0) {
      setIndex(index - 1);
    } else {
      setIndex(images.length - itemsPerSlide); // Loop to the last visible set
    }
  };

  // Auto-slide effect
  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 2000); // 2 seconds
    return () => clearInterval(interval);
  }, [images, index, itemsPerSlide]); // dependencies

  return (
    <div className="relative overflow-hidden mt-4 rounded-lg p-2 sm:p-4 mx-2 sm:mx-4 lg:mx-6 animate-fadeIn">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
        </div>
      )}

      {/* Previous Button */}
      <div className="absolute top-1/2 left-1 transform -translate-y-1/2 z-10 animate-slideInLeft">
        <button
          onClick={prevSlide}
          className="p-1 sm:p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-[-5deg] hover:shadow-xl"
        >
          <FaChevronLeft size={16} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Carousel Container */}
      <div
        className={`flex transition-all duration-700 ease-in-out ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        } ${slideDirection === 'right' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}
        style={{ transform: `translateX(-${(index / itemsPerSlide) * 100}%)` }}
      >
        {images.length > 0 ? (
          images.map((img, idx) => (
            <div
              key={idx}
              className={`flex-shrink-0 w-full ${
                itemsPerSlide === 1 ? "sm:w-full" : itemsPerSlide === 2 ? "sm:w-1/2" : "sm:w-1/3"
              } p-1 transition-all duration-500 ease-in-out hover:scale-[1.02] group animate-fadeInUp`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="relative overflow-hidden rounded-lg transform transition-transform duration-500 hover:rotate-1">
                <img
                  src={`${apiUrl}${img}`}
                  alt={`Slide ${idx + 1}`}
                  className="w-full h-42 sm:h-56 md:h-48 lg:h-56 object-cover rounded-lg shadow-md transition-all duration-500 ease-in-out hover:shadow-xl group-hover:brightness-110 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full text-center py-8 animate-pulse">
            <p className="text-gray-500">No images available</p>
          </div>
        )}
      </div>

      {/* Next Button */}
      <div className="absolute top-1/2 right-1 transform -translate-y-1/2 z-10 animate-slideInRight">
        <button
          onClick={nextSlide}
          className="p-1 sm:p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-[5deg] hover:shadow-xl"
        >
          <FaChevronRight size={16} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 animate-fadeInUp" style={{ animationDelay: '500ms' }}>
        {Array.from({ length: Math.ceil(images.length / itemsPerSlide) }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setSlideDirection(i > Math.floor(index / itemsPerSlide) ? 'right' : 'left');
              setIndex(i * itemsPerSlide);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === Math.floor(index / itemsPerSlide)
                ? 'bg-gray-800 scale-125'
                : 'bg-gray-400 hover:bg-gray-600'
            } hover:scale-110`}
          />
        ))}
      </div>
    </div>
  );
}

export default Carousels;

// Add these styles to your global CSS file or create a new CSS module
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeInUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}

.animate-slideInLeft {
  animation: slideInLeft 0.5s ease-out;
}

.animate-slideInRight {
  animation: slideInRight 0.5s ease-out;
}

.animate-fadeInUp {
  animation: fadeInUp 0.5s ease-out;
}
`;

