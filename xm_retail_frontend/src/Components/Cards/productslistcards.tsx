import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Nav from "../NavBar/Nav";
import { FiHome } from "react-icons/fi"; // Add this import at the top

interface Product {
  sku: string;
  name: string;
  currency: {
    code: string;
    symbol: string;
  };
  url: string;
  minPrice: string;
  maxPrice: string;
  offer: string; // New field for offer
  images: {
    mobile: string;
    base: string;
    small: string;
  };
}

const ProductList: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (categoryId) {
      axios
        .get(`http://localhost:4000/api/woohoo/category/products/${categoryId}`)
        .then((response) => {
          const data = response.data;
          let products: Product[] = [];
          if (Array.isArray(data)) {
            products = data;
          } else if (data.products && Array.isArray(data.products)) {
            products = data.products;
          }
          // Map image field to images.mobile for compatibility
          const mappedProducts = products.map((product) => ({
            ...product,
            images: {
              mobile: product.image || "",
              base: "",
              small: "",
              ...(product.images || {}),
            },
          }));
          setProductList(mappedProducts);
          setError("");
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching products:", error);
          setError("Failed to load products");
          setLoading(false);
        });
    }
  }, [categoryId]);

  if (loading) return <p className="text-center text-gray-600">Loading products...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <>
      <Nav/> 
      <div className="p-6 max-w-7xl mx-auto">
          
                    <div
            className="text-gray-500 text-sm mb-4 flex items-center animate-breadcrumb"
            style={{
              animation: "slideInFade 0.8s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <style>
              {`
                @keyframes slideInFade {
                  from { opacity: 0; transform: translateX(-30px);}
                  to { opacity: 1; transform: translateX(0);}
                }
                .animate-breadcrumb span {
                  transition: color 0.3s, text-shadow 0.3s;
                }
                .animate-breadcrumb span.text-orange-500:hover {
                  color: #ea580c;
                  text-shadow: 0 2px 8px #ffedd5;
                }
                .animate-breadcrumb .breadcrumb-sep {
                  animation: bounceSep 1s infinite alternate;
                  display: inline-block;
                }
                @keyframes bounceSep {
                  from { transform: translateY(0);}
                  to { transform: translateY(-3px);}
                }
              `}
            </style>
            <span
              className="text-orange-500 cursor-pointer flex items-center"
              onClick={() => navigate("/home")}
            >
              <FiHome className="mr-1" />
              Home
            </span>
            <span className="mx-2 breadcrumb-sep">{'>'}</span>
            <span className="font-semibold hover:text-blue-700 transition-colors duration-300">Products</span>
          </div>
          
        <h1 className="text-2xl font-bold mb-6 text-center">Products for Category {categoryId}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {/* Animation keyframes in a style tag */}
          <style>
            {`
              @keyframes cardFadeIn {
                from { opacity: 0; transform: scale(0.96);}
                to { opacity: 1; transform: scale(1);}
              }
            `}
          </style>
          {productList.length > 0 ? (
            productList.map((product, idx) => {
              const mappedProduct = {
                ...product,
                images: product.images || { mobile: "", base: "", small: "" },
                currency: product.currency || { code: "INR", symbol: "₹" },
                minPrice: product.minPrice?.toString() ?? "",
                maxPrice: product.maxPrice?.toString() ?? "",
                offer: product.offer || "",
              };
              return (
                <div
                  key={mappedProduct.sku}
                  onClick={() => window.location.href = `/product/${mappedProduct.sku}`}
                  style={{
                    animation: "cardFadeIn 0.5s",
                    animationDelay: `${idx * 0.07}s`,
                    animationFillMode: "backwards",
                  }}
                  className="relative bg-white rounded-2xl shadow hover:shadow-lg transition-all p-4 flex flex-col justify-between transform hover:-translate-y-2 hover:scale-105 duration-200 cursor-pointer"
                >
                  <img
                    src={product.images?.mobile || product.image || "/placeholder-image.jpg"}
                    alt={product.name}
                    className="w-full h-36 object-cover rounded-xl border-2 border-gray-100 mb-3 mt-2 shadow-sm"
                  />
                  <p className="font-bold text-lg text-gray-800 mb-1 text-center">{mappedProduct.name}</p>
                  <div className="text-sm text-gray-600 text-center mb-2">
                    <p>
                      <strong>Price: </strong>
                      {mappedProduct.currency.symbol}
                      {mappedProduct.minPrice} - {mappedProduct.currency.symbol}
                      {mappedProduct.maxPrice}
                    </p>
                    {mappedProduct.offer && (
                      <p className="text-blue-700 font-semibold">
                        <strong>Offer:</strong> {mappedProduct.offer}
                      </p>
                    )}
                  </div>
                  <button
                    tabIndex={-1}
                    className="mt-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow transition pointer-events-none"
                  >
                    View Details
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500">No products available for this category.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductList;
