import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from './types';

// Props interface for RelatedProducts component
interface RelatedProductsProps {
  products: Product[];
}

/**
 * RelatedProducts Component
 * Displays a grid of related products
 * @param products - Array of related products to display
 */
const RelatedProducts: React.FC<RelatedProductsProps> = ({ products }) => {
  const navigate = useNavigate();

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold mb-4">Related Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product.sku}
            className="border rounded p-2 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => navigate(`/product/${product.sku}`)}
          >
            {/* Product Image */}
            <img
              src={
                product.images?.thumbnail ||
                product.images?.base ||
                "/placeholder-image.jpg"
              }
              alt={product.name}
              className="w-full h-32 object-contain mb-2"
            />
            {/* Product Name */}
            <p className="font-semibold text-center text-gray-800">
              {product.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts; 