import React from 'react';
import { Product } from './types';

// Props interface for ProductInfo component
interface ProductInfoProps {
  product: Product;
  selectedDenomination: string;
  onDenominationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isPaymentProcessing: boolean;
}

/**
 * ProductInfo Component
 * Displays product information and purchase options
 * @param product - The product data
 * @param selectedDenomination - Currently selected denomination
 * @param onDenominationChange - Handler for denomination selection change
 * @param onAddToCart - Handler for adding to cart
 * @param onBuyNow - Handler for buy now action
 * @param isPaymentProcessing - Whether payment is being processed
 */
const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  selectedDenomination,
  onDenominationChange,
  onAddToCart,
  onBuyNow,
  isPaymentProcessing
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-10">
      {/* Product Image */}
      <div className="md:w-1/3">
        <img
          src={product.images.base}
          alt={product.name}
          className="w-full h-auto object-contain rounded-xl shadow-md"
        />
      </div>

      {/* Product Details */}
      <div className="md:w-2/3 space-y-6">
        {/* Product Description */}
        <p className="text-gray-700 text-base leading-relaxed">
          {product.description}
        </p>

        {/* Denomination Selection */}
        {product.price.denominations && product.price.denominations.length > 0 && (
          <div>
            <label
              htmlFor="denomination"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Denomination:
            </label>
            <select
              id="denomination"
              value={selectedDenomination}
              onChange={onDenominationChange}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {product.price.denominations.map((denom) => (
                <option key={denom} value={denom}>
                  ₹{denom}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={onAddToCart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
          >
            Add to Cart
          </button>

          <button
            onClick={onBuyNow}
            disabled={isPaymentProcessing}
            className={`px-6 py-3 rounded-lg font-semibold transition duration-200 text-white ${
              isPaymentProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isPaymentProcessing ? "Processing..." : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo; 