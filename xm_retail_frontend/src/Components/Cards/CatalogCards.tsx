import React, { useEffect, useState } from "react";
import axios from "axios";

interface ProductImage {
  mobile?: string;
  base?: string;
}

interface ProductType {
  id?: string | number;
  name?: string;
  sku?: string;
  productType?: string;
  image?: ProductImage;
}

const Product: React.FC = () => {
  const [productList, setProductList] = useState<ProductType[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(10);

  useEffect(() => {
    // Only fetch the products from the database, do not sync catalog here
    axios
      .get("http://localhost:4000/api/woohoo/catalog")
      .then((response) => {
        setProductList(response.data.products);
        setLoading(false);
      })
      .catch((error) => {
        setError("Error fetching products");
        console.error("Error fetching products:", error);
        setLoading(false);
      });
  }, []);

  const handleProductClick = (productSku: string | undefined) => {
    if (!productSku) return;

    axios
      .get(`http://localhost:4000/api/woohoo/catalog/${productSku}`)
      .then((response) => {
        setSelectedProduct(response.data);
      })
      .catch((error) => {
        console.error("Error fetching product details:", error);
        alert("Failed to fetch product details");
      });
  };

  const isSeeMoreVisible = visibleCount < productList.length;

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Available Products</h1>

      {loading && <p className="text-gray-600 text-center">Loading...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Product Grid */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 ${
            selectedProduct ? "md:grid-cols-2" : "md:grid-cols-5"
          }`}
        >
          {productList
            .filter((product) => product && product.name && product.sku)
            .slice(0, visibleCount)
            .map((product) => {
              const imageUrl = product.image || ""; // Extract the URL string

              return (
                <div
                  key={product.id ?? Math.random()}
                  className="bg-white rounded-lg shadow-md p-3 flex flex-col items-center cursor-pointer hover:shadow-lg transition"
                  onClick={() => handleProductClick(product.sku)}
                >
                  <img
                    src={imageUrl}
                    alt={product.name ?? "Product"}
                    className="w-full h-40 object-cover rounded mb-2"
                  />
                  <h2 className="text-sm font-semibold text-center text-gray-800">
                    {product.name ?? "No Name"}
                  </h2>
                  <p className="text-xs text-gray-500">SKU: {product.sku ?? "N/A"}</p>
                  <p className="text-xs text-gray-500">Type: {product.productType ?? "N/A"}</p>
                </div>
              );
            })}
        </div>

        {/* Selected Product Details */}
        {selectedProduct && (
          <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-2 text-center">Product Details</h2>
            <h3 className="text-lg font-semibold text-gray-800 text-center">
              {selectedProduct.name}
            </h3>
            <p className="text-gray-600 text-center">
              <strong>SKU:</strong> {selectedProduct.sku}
            </p>
            <p className="text-gray-600 text-center">
              <strong>Type:</strong> {selectedProduct.productType ?? "N/A"}
            </p>

            {selectedProduct.image && (selectedProduct.image.mobile|| selectedProduct.image.base) && (
              <img
                src={selectedProduct.image.mobile || selectedProduct.image.base}
                alt={selectedProduct.name ?? "Product"}
                className="mt-4 mx-auto rounded"
                style={{ maxWidth: "200px" }}
              />
            )}
          </div>
        )}
      </div>

      {/* See More / See Less Buttons */}
      {productList.length > 10 && (
        <div className="flex justify-center mt-6">
          {isSeeMoreVisible ? (
            <button
              onClick={() => setVisibleCount(productList.length)}
              className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
            >
              See More
            </button>
          ) : (
            <button
              onClick={() => setVisibleCount(10)}
              className="bg-gray-600 text-white px-6 py-2 rounded shadow hover:bg-gray-700 transition"
            >
              See Less
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Product;