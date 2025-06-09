import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "../NavBar/Nav";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Product {
  sku: string;
  name: string;
  description: string;
  shortDescription: string;
  price: {
    price: string;
    value?: number;
    type: string;
    min: string;
    max: string;
    denominations?: string[];
    currency: {
      code: string;
      symbol: string;
      numericCode: string;
    } | string;
  };
  images: {
    thumbnail: string;
    mobile: string;
    base: string;
    small: string;
  };
  currency: string;
  url: string;
}

interface OrderCard {
  sku: string;
  productName: string;
  amount: number;
  cardNumber: string;
  cardPin: string;
  validity: string;
  issuanceDate: string | null;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  balance: number | null;
  status?: string;
}

const ProductDetails: React.FC = () => {
  const { productSku } = useParams<{ productSku: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDenomination, setSelectedDenomination] = useState<string>("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [orderData, setOrderData] = useState<OrderCard | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("user");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (productSku) {
          const response = await axios.get(
            `http://localhost:4000/api/woohoo/product/details/${productSku}`
          );
          const data = response.data;
          if (data) {
            setProduct(data);
            if (data.price?.denominations?.length) {
              setSelectedDenomination(data.price.denominations[0]);
            }
          } else {
            setError("Product not found");
          }
        }
      } catch (err) {
        setError("Failed to load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productSku]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        if (productSku) {
          const response = await axios.get(
            `http://localhost:4000/api/woohoo/related-products/${productSku}`
          );
          setRelatedProducts(response.data || []);
        }
      } catch (error) {
        setRelatedProducts([]);
      }
    };

    fetchRelatedProducts();
  }, [productSku]);

  // Update the useEffect for network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(true);
      
      // Don't hide network modal immediately, let it show the reconnection state
      // It will be hidden when success modal appears
      
      // Try to recover any pending orders
      const pendingOrderRefno = localStorage.getItem('pendingOrderRefno');
      if (pendingOrderRefno) {
        recoverOrder(pendingOrderRefno);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
      setShowNetworkModal(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show network modal if initially offline
    if (!navigator.onLine) {
      setShowNetworkModal(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update the recoverOrder function to handle the modal transition
  const recoverOrder = async (refno: string) => {
    try {
      setIsRecovering(true);
      setRecoveryError(null);

      // First try to force update the order
      try {
        await axios.post(`http://localhost:4000/api/order/force-update/${refno}`);
      } catch (updateError) {
        // Handle error silently
      }

      // Then check order status
      const statusResponse = await axios.get(`http://localhost:4000/api/order/status/${refno}`);
      if (!statusResponse.data.success) {
        throw new Error(statusResponse.data.details || 'Failed to check order status');
      }

      const statusData = statusResponse.data.data;

      // If order is completed, fetch card details
      if (statusData.status === 'COMPLETE' || statusData.localStatus === 'completed') {
      const detailsResponse = await axios.get(`http://localhost:4000/api/order/details/${refno}`);
        if (!detailsResponse.data.success) {
          throw new Error(detailsResponse.data.details || 'Failed to fetch order details');
        }

        const orderData = detailsResponse.data.data;
        
        // Only show card details if they exist
        if (orderData.cardNumber && orderData.cardPin) {
          setOrderData({
            sku: orderData.sku,
            productName: orderData.productName,
            amount: orderData.amount,
            cardNumber: orderData.cardNumber,
            cardPin: orderData.cardPin,
            validity: orderData.validity,
            issuanceDate: orderData.issuanceDate,
            recipientName: orderData.recipientName || storedUser.name,
            recipientEmail: orderData.recipientEmail || storedUser.email,
            recipientPhone: orderData.recipientPhone || storedUser.phone,
            balance: orderData.balance,
            status: 'completed'
          });
          // Hide network modal and show success modal
          setShowNetworkModal(false);
          setShowSuccessModal(true);
          localStorage.removeItem('pendingOrderRefno');
          setIsRecovering(false);
          setRecoveryError(null);

          await sendEmailConfirmation(orderData);
        } else {
          // If order is complete but no card details, start polling
          startPolling(refno);
        }
      } else if (statusData.status === 'CANCELED') {
        setRecoveryError('Order was canceled. Please try again.');
        localStorage.removeItem('pendingOrderRefno');
        setIsRecovering(false);
        setShowNetworkModal(false);
      } else {
        // If still pending/processing, start polling
        startPolling(refno);
      }
    } catch (error) {
      setRecoveryError('Failed to recover order. Please contact support.');
      setIsRecovering(false);
      setShowNetworkModal(false);
    }
  };

  // Function to start polling for order status
  const startPolling = (refno: string) => {
    const pollInterval = setInterval(async () => {
      try {
      const statusResponse = await axios.get(`http://localhost:4000/api/order/status/${refno}`);
        if (!statusResponse.data.success) {
          throw new Error(statusResponse.data.details || 'Failed to check order status');
        }

        const statusData = statusResponse.data.data;

        if (statusData.status === 'COMPLETE' || statusData.localStatus === 'completed') {
          clearInterval(pollInterval);
          
          // Get order details from the status response if available
          if (statusData.cards && statusData.cards.length > 0) {
            const cardData = statusData.cards[0];
            setOrderData({
              sku: cardData.sku,
              productName: cardData.productName,
              amount: cardData.amount,
              cardNumber: cardData.cardNumber,
              cardPin: cardData.cardPin,
              validity: cardData.validity,
              issuanceDate: cardData.issuanceDate,
              recipientName: storedUser.name,
              recipientEmail: storedUser.email,
              recipientPhone: storedUser.phone,
              balance: cardData.balance,
              status: 'completed'
            });
            setShowSuccessModal(true);
          localStorage.removeItem('pendingOrderRefno');
            setIsRecovering(false);
            setRecoveryError(null);

            await sendEmailConfirmation(cardData);
          } else {
            // If no card details in status response, try to get order details
            try {
              const detailsResponse = await axios.get(`http://localhost:4000/api/order/details/${refno}`);
              if (detailsResponse.data.success && detailsResponse.data.data) {
                const orderData = detailsResponse.data.data;
                if (orderData.cardNumber && orderData.cardPin) {
                  setOrderData({
                    sku: orderData.sku,
                    productName: orderData.productName,
                    amount: orderData.amount,
                    cardNumber: orderData.cardNumber,
                    cardPin: orderData.cardPin,
                    validity: orderData.validity,
                    issuanceDate: orderData.issuanceDate,
                    recipientName: orderData.recipientName || storedUser.name,
                    recipientEmail: orderData.recipientEmail || storedUser.email,
                    recipientPhone: orderData.recipientPhone || storedUser.phone,
                    balance: orderData.balance,
                    status: 'completed'
                  });
                  setShowSuccessModal(true);
          localStorage.removeItem('pendingOrderRefno');
                  setIsRecovering(false);
                  setRecoveryError(null);

                  await sendEmailConfirmation(orderData);
                }
              }
            } catch (detailsError) {
              // Handle error silently
            }
          }
        } else if (statusData.status === 'CANCELED') {
          clearInterval(pollInterval);
          setRecoveryError('Order was canceled. Please try again.');
          localStorage.removeItem('pendingOrderRefno');
          setIsRecovering(false);
        } else {
          // Show processing status
          setOrderData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              status: statusData.status.toLowerCase()
            };
          });
        }
      } catch (error: any) {
        // Don't clear interval on network errors, keep trying
        if (error.response && error.response.status !== 404) {
          clearInterval(pollInterval);
          setRecoveryError('Failed to check order status. Please contact support.');
          setIsRecovering(false);
        }
      }
    }, 5000); // Poll every 5 seconds

    
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDenominationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDenomination(e.target.value);
  };

  const handleAddToCart = () => {
    if (!product || !selectedDenomination) return;

    let cart: any[] = [];

    try {
      const storedCart = localStorage.getItem("cart");
      cart = storedCart ? JSON.parse(storedCart) : [];
    } catch (err) {
      console.error("Invalid cart JSON in localStorage. Resetting cart.", err);
      cart = [];
    }

    const existingItemIndex = cart.findIndex(
      (item) =>
        item.sku === product.sku && item.denomination === selectedDenomination
    );

    let priceValue = product.price.value ?? parseFloat(selectedDenomination);
    if (isNaN(priceValue)) {
      priceValue = parseFloat(selectedDenomination);
    }

    const currencySymbol =
      typeof product.price.currency === "object"
        ? product.price.currency.symbol
        : product.price.currency || "₹";

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({
        sku: product.sku,
        name: product.name,
        image: product.images.thumbnail || product.images.base,
        denomination: selectedDenomination,
        currency: currencySymbol,
        quantity: 1,
        price: priceValue,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    navigate("/cart");
  };

  const handleBuyNowClick = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (!selectedDenomination) {
      setToastMessage("Please select a denomination");
      setShowToast(true);
      return;
    }

    setIsPaymentProcessing(true);

    try {
      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded) {
        setToastMessage("Razorpay SDK failed to load. Please check your internet connection.");
        setShowToast(true);
        setIsPaymentProcessing(false);
        return;
      }

      const orderResponse = await axios.post("http://localhost:4000/api/payment/order", {
        amount: selectedDenomination,
        currency: "INR",
      });

      const orderData = orderResponse.data.data;

      if (!orderData || !orderData.id) {
        setToastMessage("Failed to create order. Please try again.");
        setShowToast(true);
        setIsPaymentProcessing(false);
        return;
      }

      const options = {
        key: "rzp_test_lqwCQUylHVfPtp",
        amount: parseInt(selectedDenomination, 10) * 100,
        currency: "INR",
        name: product?.name || "Product",
        description: product?.shortDescription || "Purchase",
        image: product?.images?.base || "/placeholder-image.jpg",
        order_id: orderData.id,
        handler: async (response: any) => {
          setIsPaymentProcessing(false);
          try {
            const verifyResponse = await axios.post("http://localhost:4000/api/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              const orderApiResponse = await axios.post("http://localhost:4000/api/order/place-order", {
                sku: product?.sku,
                price: selectedDenomination,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email: storedUser.email,
                phone: storedUser.phone,
                name: storedUser.name,
                quantity: 1,
              });

              if (!orderApiResponse.data.success) {
                throw new Error(orderApiResponse.data.details || "Failed to place order");
              }

              const orderData = orderApiResponse.data.data;
              const refno = orderData.refno;
              
              localStorage.setItem('pendingOrderRefno', refno);
              startPolling(refno);
              setToastMessage("Payment successful! Processing your order...");
              setShowToast(true);

            } else {
              setToastMessage("Payment verification failed.");
              setShowToast(true);
            }
          } catch (err) {
            setToastMessage("Verification failed. Please try again.");
            setShowToast(true);
          }
        },
        prefill: {
          name: storedUser.name,
          email: storedUser.email,
          contact: `+91${storedUser.phone}`,
        },
        theme: {
          color: "#F37254",
        },
        modal: {
          ondismiss: () => {
            setIsPaymentProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setToastMessage("Payment failed. Please try again.");
      setShowToast(true);
      setIsPaymentProcessing(false);
    }
  };

  // Update the sendEmailConfirmation function
  const sendEmailConfirmation = async (orderData: any, retryCount = 0) => {
    try {
      await axios.post("http://localhost:4000/api/email/send-order-confirmation", {
        email: storedUser.email,
        name: storedUser.name,
        orders: [{
          sku: orderData.sku,
          amount: orderData.amount,
          cardNumber: orderData.cardNumber,
          cardPin: orderData.cardPin,
          validity: orderData.validity,
          issuanceDate: orderData.issuanceDate,
          status: "Success"
        }],
        totalAmount: orderData.amount,
        orderId: orderData.razorpayOrderId || orderData.orderId
      });
    } catch (emailError: any) {
      // Check if it's a temporary error and we haven't exceeded retry attempts
      if (emailError.response?.status === 421 && retryCount < 3) {
        // Wait for 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
        return sendEmailConfirmation(orderData, retryCount + 1);
      }
      
      // If we've exhausted retries or it's a different error, show a message to the user
      if (retryCount >= 3) {
        alert("We couldn't send the confirmation email. Please check your email settings or contact support.");
      }
    }
  };

  // Add Toast Notification Component
  const ToastNotification = ({ message, onClose }: { message: string; onClose: () => void }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{message}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <Nav />
      {/* Add Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <ToastNotification
            message={toastMessage}
            onClose={() => setShowToast(false)}
          />
        )}
      </AnimatePresence>
     <div className="max-w-7xl mx-auto px-4 py-10">
        
        <div className="text-gray-500 text-sm mb-4">
        <span
          className="text-orange-500 cursor-pointer"
          onClick={() => navigate("/products/121")}
        >
          Products
        </span>{" "}
        / <span className="font-semibold">ProductDetails</span>
      </div>


  {loading && (
    <p className="text-center text-gray-500 text-lg">Loading product details...</p>
  )}
  {error && <p className="text-center text-red-500 text-lg">{error}</p>}
  {!loading && !error && product && (
    <>
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
        {product.name}
      </h1>
      <div className="flex flex-col md:flex-row gap-10">
        <div className="md:w-1/3">
          <img
            src={product.images.base}
            alt={product.name}
            className="w-full h-auto object-contain rounded-xl shadow-md"
          />
        </div>
        <div className="md:w-2/3 space-y-6">
          <p className="text-gray-700 text-base leading-relaxed">
            {product.description}
          </p>

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
                onChange={handleDenominationChange}
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

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleAddToCart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
            >
              Add to Cart
            </button>

            <button
              onClick={handleBuyNowClick}
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
    


            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-semibold mb-4">Related Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedProducts.map((rp) => (
                    <div
                      key={rp.sku}
                      className="border rounded p-2 cursor-pointer hover:shadow-lg"
                      onClick={() => navigate(`/product/${rp.sku}`)}
                    >
                      <img
                        src={
                          rp.images?.thumbnail ||
                          rp.images?.base ||
                          "/placeholder-image.jpg"
                        }
                        alt={rp.name}
                        className="w-full h-32 object-contain mb-2"
                      />
                      <p className="font-semibold text-center">{rp.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

     {/* Success Modal */}
<AnimatePresence>
  {showSuccessModal && (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
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
        {/* Compact Coupon Card */}
        <motion.div
          className="border-2 border-dashed border-yellow-400 rounded-lg p-3 relative bg-gradient-to-br from-yellow-50 to-amber-50 overflow-hidden"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {/* Floating confetti */}
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

          {/* Coupon header */}
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

          {/* Main coupon content */}
          <div className="space-y-1">
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

            {/* Full Details Section (No Scrollbar) */}
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

            <motion.p
              className="text-center text-[0.65rem] mt-1 font-bold text-white bg-amber-500 py-0.5 px-2 rounded-full inline-block"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 1 }}
            >
              LIMITED OFFER ✨
            </motion.p>
          </div>

          {/* Perforation marks */}
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
            onClick={() => setShowSuccessModal(false)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-1.5 rounded-full shadow text-xs font-medium transition-all"
          >
            Got It!
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* Network Status Modal */}
      <AnimatePresence>
        {showNetworkModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="text-center">
                {!isReconnecting ? (
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
                      transition={{ delay: 0.2 }}
                    >
                      Network Connection Lost
                    </motion.h3>
                    <motion.div
                      className="text-gray-600 mb-4 space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p>Your internet connection has been interrupted.</p>
                      <p className="text-sm text-gray-500">
                        Don't worry, we'll automatically sync your data when you're back online.
                      </p>
                    </motion.div>
                    <motion.div
                      className="flex justify-center space-x-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360]
                      }}
                      transition={{
                        duration: 2,
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
                      transition={{ delay: 0.2 }}
                    >
                      Reconnecting
                    </motion.h3>
                    <motion.p
                      className="text-gray-600 mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Restoring your connection
                    </motion.p>
                    <motion.div
                      className="flex justify-center space-x-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
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
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductDetails;
	