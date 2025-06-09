import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Subcategory {
  id: number;
  name: string;
  [key: string]: any;
}

interface CategoryType {
  id: number;
  name: string;
  url?: string;
  description?: string | null;
  subcategories?: Subcategory[];
}

const Categorycards: React.FC = () => {
  const [categoryList, setCategoryList] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/woohoo/category")
      .then((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          setCategoryList(data);
        } else if (typeof data === "object" && data !== null) {
          setCategoryList([data]);
        } else {
          setError("Unexpected response format");
        }
        setLoading(false);
      })
      .catch((error) => {
        setError("Failed to load categories");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center text-gray-600">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
        Categories
      </h1>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {categoryList.map((category, idx) => (
          <div
            key={category.id}
            onClick={() => navigate(`/products/${category.id}`)}
            style={{
              userSelect: "none",
              animation: "fadeScaleIn 0.5s",
              animationDelay: `${idx * 0.07}s`,
              animationFillMode: "backwards",
            }}
            className="bg-white rounded-xl shadow hover:shadow-xl transition-all p-3 sm:p-4 flex flex-col justify-between min-h-[170px] cursor-pointer transform hover:-translate-y-1 hover:scale-105 duration-200"
          >
            {/* Animation keyframes */}
            {idx === 0 && (
              <style>
                {`
          @keyframes fadeScaleIn {
            from { opacity: 0; transform: scale(0.96);}
            to { opacity: 1; transform: scale(1);}
          }
        `}
              </style>
            )}
            <div>
              <p className="text-xs sm:text-sm">
                <span className="font-bold">ID:</span> {category.id}
              </p>
              <p className="text-sm sm:text-base">
                <span className="font-bold">Name:</span> {category.name}
              </p>
              <p className="text-xs sm:text-sm">
                <span className="font-bold">URL:</span> {category.url || "N/A"}
              </p>
              <p className="text-xs sm:text-sm">
                <span className="font-bold">Subcategories:</span>{" "}
                {category.subcategories?.length
                  ? category.subcategories.map((sub) => sub.name).join(", ")
                  : "None"}
              </p>
            </div>
            <button
              tabIndex={-1}
              className="mt-3 sm:mt-4 bg-blue-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-blue-700 transition pointer-events-none"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categorycards;
