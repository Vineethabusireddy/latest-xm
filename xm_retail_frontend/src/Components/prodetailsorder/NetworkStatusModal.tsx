import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Props interface for NetworkStatusModal component
interface NetworkStatusModalProps {
  isReconnecting: boolean;
  onReconnectComplete?: () => void;
}

/**
 * NetworkStatusModal Component
 * Displays network connection status with animations
 * @param isReconnecting - Boolean indicating if network is reconnecting
 * @param onReconnectComplete - Callback when reconnection is complete
 */
const NetworkStatusModal: React.FC<NetworkStatusModalProps> = ({ 
  isReconnecting,
  onReconnectComplete 
}) => {
  // Auto-hide modal after successful reconnection
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isReconnecting) {
      // Check if we have a stable connection
      const checkConnection = async () => {
        try {
          // Try to make a quick request to check connection
          await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
          // If successful, hide the modal quickly
          if (onReconnectComplete) {
            onReconnectComplete();
          }
        } catch (error) {
          // If connection check fails, try again after a short delay
          timeout = setTimeout(checkConnection, 500);
        }
      };

      // Start checking connection immediately
      checkConnection();
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isReconnecting, onReconnectComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }} // Faster transition
      >
        <motion.div
          className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }} // Faster transition
        >
          <div className="text-center">
            {!isReconnecting ? (
              // Offline state display
              <>
                <motion.div
                  className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </motion.div>
                <motion.h3
                  className="text-lg font-semibold text-gray-900 mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }} // Faster animation
                >
                  Network Connection Lost
                </motion.h3>
                <motion.div
                  className="text-gray-600 mb-4 space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }} // Faster animation
                >
                  <p>Your internet connection has been interrupted.</p>
                  <p className="text-sm text-gray-500">
                    Don't worry, we'll automatically sync your data when you're back online.
                  </p>
                </motion.div>
                {/* Pulsing dots animation */}
                <motion.div
                  className="flex justify-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }} // Faster animation
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </motion.div>
              </>
            ) : (
              // Reconnecting state display
              <>
                <motion.div
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 1, // Faster animation
                    ease: "easeInOut",
                    times: [0, 0.5, 1]
                  }}
                >
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <motion.h3
                  className="text-lg font-semibold text-gray-900 mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }} // Faster animation
                >
                  Connection Restored
                </motion.h3>
                <motion.p
                  className="text-gray-600 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }} // Faster animation
                >
                  Resuming your payment process
                </motion.p>
                {/* Bouncing dots animation */}
                <motion.div
                  className="flex justify-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }} // Faster animation
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NetworkStatusModal; 