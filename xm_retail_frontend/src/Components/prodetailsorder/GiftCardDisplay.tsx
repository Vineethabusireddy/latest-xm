import React from 'react';
import { motion } from 'framer-motion';
import { OrderCard, Product } from './types';

// Props interface for GiftCardDisplay component
interface GiftCardDisplayProps {
  orderData: OrderCard | null;
  product: Product | null;
  onClose: () => void;
}

/**
 * GiftCardDisplay Component
 * Displays the gift card details in an animated card format
 * @param orderData - The order data containing gift card details
 * @param product - The product information
 * @param onClose - Function to close the display
 */
const GiftCardDisplay: React.FC<GiftCardDisplayProps> = ({ orderData, product, onClose }) => {
  return (
    <motion.div
      className="bg-white rounded-xl p-4 w-full max-w-xs shadow-xl relative"
      initial={{ y: "-100vh", rotate: -5 }}
      animate={{
        y: 0,
        rotate: 0,
        transition: {
          type: "spring",
          stiffness: 120,
          damping: 14
        }
      }}
      exit={{ y: "100vh", rotate: 5 }}
    >
      {/* Gift Card Container */}
      <motion.div
        className="border-2 border-dashed border-yellow-400 rounded-lg p-3 relative bg-gradient-to-br from-yellow-50 to-amber-50 overflow-hidden"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {/* Animated Confetti Background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-400 text-sm"
              initial={{
                y: -10,
                x: Math.random() * 80 - 40,
                opacity: 0,
                rotate: Math.random() * 360
              }}
              animate={{
                y: Math.random() * 60 + 30,
                opacity: [0, 1, 0],
                rotate: Math.random() * 360 + 180
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                left: `${Math.random() * 100}%`,
              }}
            >
              {['★', '✿', '✧'][Math.floor(Math.random() * 3)]}
            </motion.div>
          ))}
        </div>

        {/* Card Header */}
        <motion.div
          className="text-center mb-1"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.h2
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-red-500"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            🎟 GIFT CARD
          </motion.h2>
          <p className="text-[0.65rem] text-amber-700">Payment Successful!</p>
        </motion.div>

        {/* Card Content */}
        <div className="space-y-1">
          {/* Date and Time Section */}
          <motion.div
            className="border-b border-amber-200 pb-1"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="font-semibold text-xs text-amber-800 tracking-wider">ADMIT ONE</p>
            <div className="flex justify-between text-[0.65rem] text-amber-700">
              <p>{new Date().toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <p>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </motion.div>

          {/* Amount Display */}
          <motion.div
            className="text-center py-1"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.4 }}
          >
            <p className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
              ₹{orderData?.amount || '0'}
            </p>
          </motion.div>

          {/* Card Details Table */}
          <motion.div
            className="text-xs border border-amber-200 rounded p-1"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="font-semibold text-amber-700 py-0.5 pr-2">Card No:</td>
                  <td className="text-gray-800">{orderData?.cardNumber || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-amber-700 py-0.5 pr-2">PIN:</td>
                  <td className="text-gray-800">{orderData?.cardPin || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-amber-700 py-0.5 pr-2">Product:</td>
                  <td className="text-gray-800">{product?.name || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-amber-700 py-0.5 pr-2">SKU:</td>
                  <td className="text-gray-800">{orderData?.sku || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-amber-700 py-0.5 pr-2">Valid Until:</td>
                  <td className="text-gray-800">{orderData?.validity || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-amber-700 py-0.5 pr-2">Issued On:</td>
                  <td className="text-gray-800">{orderData?.issuanceDate || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-amber-700 py-0.5 pr-2">Status:</td>
                  <td className="text-green-600 font-semibold">{orderData?.status || 'Confirmed'}</td>
                </tr>
              </tbody>
            </table>
          </motion.div>

          {/* Limited Offer Badge */}
          <motion.p
            className="text-center text-[0.65rem] mt-1 font-bold text-white bg-amber-500 py-0.5 px-2 rounded-full inline-block"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 1 }}
          >
            LIMITED OFFER ✨
          </motion.p>
        </div>

        {/* Decorative Elements */}
        <motion.div
          className="absolute -left-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-dashed border-amber-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-dashed border-amber-400"
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Close Button */}
      <motion.div
        className="mt-3 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <button
          onClick={onClose}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-1.5 rounded-full shadow text-xs font-medium transition-all"
        >
          Got It!
        </button>
      </motion.div>
    </motion.div>
  );
};

export default GiftCardDisplay; 