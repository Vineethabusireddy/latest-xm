import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

// Props interface for ToastNotification component
interface ToastNotificationProps {
  message: string;
  onClose: () => void;
}

/**
 * ToastNotification Component
 * Displays a temporary notification message with animation
 * @param message - The message to display
 * @param onClose - Function to call when the toast should close
 */
const ToastNotification: React.FC<ToastNotificationProps> = ({ message, onClose }) => {
  // Set up auto-close timer when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    // Clean up timer when component unmounts
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="fixed top-4 right-4 z-50"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
    >
      <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
        {/* Success checkmark icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        {/* Toast message */}
        <span>{message}</span>
      </div>
    </motion.div>
  );
};

export default ToastNotification; 