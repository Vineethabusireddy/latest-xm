import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import axios from "axios";

export default function AdminDashboard() {
  const [images, setImages] = useState<(string | null)[]>(Array(9).fill(null));
  const SERVER_URL = import.meta.env.VITE_APP_SERVER_BASE_URL;

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/images`);
      const fetchedImages = response.data.map((img: string) =>
        img ? `${SERVER_URL}${img}` : null
      );
      setImages(Array(9).fill(null).map((_, idx) => fetchedImages[idx] || null));
    } catch (error) {
      console.error("Error fetching images", error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!event.target.files?.length) return;

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post(`${SERVER_URL}/api/upload`, formData);
      const newImageUrl = `${SERVER_URL}${response.data.url}`;
      setImages((prev) => prev.map((img, idx) => (idx === index ? newImageUrl : img)));
    } catch (error) {
      console.error("Error uploading image", error);
    }
  };

  const deleteImage = async (index: number) => {
    const imageUrl = images[index];
    if (!imageUrl) return;

    try {
      await axios.delete(`${SERVER_URL}/api/delete`, {
        data: { url: imageUrl.replace(SERVER_URL, "") },
      });

      setImages((prev) => prev.map((img, idx) => (idx === index ? null : img)));
    } catch (error) {
      console.error("Error deleting image", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Carousel Dashboard</h2>
      <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
        <h3 className="text-base sm:text-lg font-semibold mb-3">Manage Images (Max 9)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative group border border-gray-300 p-1 sm:p-2 rounded-lg">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, index)}
                className="hidden"
                id={`upload-${index}`}
              />
              <label htmlFor={`upload-${index}`} className="cursor-pointer block">
                {img ? (
                  <img
                    src={img}
                    alt={`Image ${index + 1}`}
                    className="w-full h-24 sm:h-32 object-cover rounded-lg group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-24 sm:h-32 bg-gray-300 flex items-center justify-center rounded-lg text-xs sm:text-sm font-semibold">
                    Upload Image {index + 1}
                  </div>
                )}
              </label>
              {img && (
                <button
                  onClick={() => deleteImage(index)}
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-600 text-white p-1 sm:p-2 rounded-full hover:opacity-100 opacity-75 z-20"
                  style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
                >
                  <FaTrash size={14} className="sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
