import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import Nav from "../NavBar/Nav";

interface CartItem {
  sku: string;
  name: string;
  image: string;
  denomination: string;
  currency: { symbol: string };
  quantity: number;
  price: string | number;
}

interface OrderData {
  amount: number;
  cardNumber: string;
  cardPin: string;
  sku: string;
  validity: string;
  issuanceDate: string;
  status: string;
  refno?: string;
  quantity?: number;
  orderIndex?: number;
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderDataList, setOrderDataList] = useState<OrderData[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isNetworkStable, setIsNetworkStable] = useState(true);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const recoveryInProgress = React.useRef(false);
  const modalShown = React.useRef(false);
  const completedOrders = React.useRef(new Set<string>());
  const recoveryTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const networkStabilityTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!storedUser?.email;
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Load completed orders from localStorage on mount
  useEffect(() => {
    const savedCompletedOrders = localStorage.getItem('completedOrders');
    if (savedCompletedOrders) {
      completedOrders.current = new Set(JSON.parse(savedCompletedOrders));
    }
  }, []);

  // Save completed orders to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('completedOrders', JSON.stringify(Array.from(completedOrders.current)));
  }, [completedOrders.current]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsReconnecting(true);
      setIsRestoring(true);
      setShowNetworkModal(true);
      setIsProcessingComplete(false);
      setIsNetworkStable(true);
      
      // Clear any existing recovery timeout
      if (recoveryTimeout.current) {
        clearTimeout(recoveryTimeout.current);
      }

      // Clear any existing network stability timeout
      if (networkStabilityTimeout.current) {
        clearTimeout(networkStabilityTimeout.current);
      }
      
      // Add a small delay before checking pending orders
      recoveryTimeout.current = setTimeout(async () => {
        try {
          // First check if we have any pending orders
          const pendingRefnos = JSON.parse(localStorage.getItem('pendingOrderRefnos') || '[]');
          if (pendingRefnos.length > 0) {
            console.log('Found pending orders during reconnection:', pendingRefnos);
            await recoverOrders(pendingRefnos);
          } else {
            console.log('No pending orders found during reconnection');
            setIsProcessingComplete(true);
            setIsRestoring(false);
            setShowNetworkModal(false);
          }
        } catch (error) {
          console.error('Error during reconnection recovery:', error);
          setIsProcessingComplete(true);
          setIsRestoring(false);
          setShowNetworkModal(false);
        } finally {
          setIsReconnecting(false);
        }
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
      setIsRestoring(false);
      setIsNetworkStable(false);
      setIsProcessingComplete(false);
      setShowNetworkModal(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show network modal if initially offline
    if (!navigator.onLine) {
      setShowNetworkModal(true);
      setIsNetworkStable(false);
      setIsRestoring(false);
      setIsProcessingComplete(false);
    }

    // Check for pending orders when page loads
    const initialCheckTimeout = setTimeout(() => {
      const pendingRefnos = JSON.parse(localStorage.getItem('pendingOrderRefnos') || '[]');
      if (pendingRefnos.length > 0) {
        console.log('Found pending orders on page load:', pendingRefnos);
        recoverOrders(pendingRefnos);
      }
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (recoveryTimeout.current) {
        clearTimeout(recoveryTimeout.current);
      }
      if (networkStabilityTimeout.current) {
        clearTimeout(networkStabilityTimeout.current);
      }
      clearTimeout(initialCheckTimeout);
      recoveryInProgress.current = false;
      modalShown.current = false;
    };
  }, []);

  const recoverOrders = async (refnos: string[]) => {
    if (!refnos.length) return;
    
    try {
      setIsRecovering(true);
      setRecoveryError(null);
      const successfulOrders: OrderData[] = [];
      const failedRefnos: string[] = [];
      let hasNewSuccessfulOrders = false;

      console.log('Starting recovery for orders:', refnos);

      const recoveryPromises = refnos.map(async (refno) => {
        if (completedOrders.current.has(refno)) {
          console.log(`Order ${refno} already completed, skipping...`);
          return null;
        }

        try {
          console.log(`Processing order ${refno}`);
          
          // First try to force update the order
          try {
            const updateResponse = await axios.post(`http://localhost:4000/api/order/force-update/${refno}`);
            console.log(`Force update response for ${refno}:`, updateResponse.data);
            
            // Add a small delay after force update
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (updateError: any) {
            console.error(`Force update failed for ${refno}:`, updateError);
          }

          // Check order status
          const statusResponse = await axios.get(`http://localhost:4000/api/order/status/${refno}`);
          console.log(`Status check response for ${refno}:`, statusResponse.data);

          if (!statusResponse.data.success) {
            throw new Error(statusResponse.data.details || 'Failed to check order status');
          }

          const statusData = statusResponse.data.data;
          console.log(`Order ${refno} status:`, statusData);

          if (statusData.status === 'COMPLETE' || statusData.localStatus === 'completed') {
            // Add a small delay before getting details
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const detailsResponse = await axios.get(`http://localhost:4000/api/order/details/${refno}`);
            console.log(`Details response for ${refno}:`, detailsResponse.data);

            if (!detailsResponse.data.success) {
              throw new Error(detailsResponse.data.details || 'Failed to fetch order details');
            }

            const orderData = detailsResponse.data.data;
            
            const hasCardDetails = orderData.cardNumber && orderData.cardPin;

            if (hasCardDetails) {
              // Mark order as completed and remove from pending orders immediately
              completedOrders.current.add(refno);
              hasNewSuccessfulOrders = true;
              
              // Remove this refno from pending orders in localStorage
              const currentPendingRefnos = JSON.parse(localStorage.getItem('pendingOrderRefnos') || '[]');
              const updatedPendingRefnos = currentPendingRefnos.filter((r: string) => r !== refno);
              localStorage.setItem('pendingOrderRefnos', JSON.stringify(updatedPendingRefnos));

              return {
                amount: orderData.amount,
                cardNumber: orderData.cardNumber,
                cardPin: orderData.cardPin,
                sku: orderData.sku,
                validity: orderData.validity,
                issuanceDate: orderData.issuanceDate,
                status: 'completed',
                refno: refno,
                quantity: orderData.quantity
              };
            } else {
              console.log(`Order ${refno} completed but missing card details:`, {
                hasCardNumber: !!orderData.cardNumber,
                hasCardPin: !!orderData.cardPin
              });
              throw new Error('Missing card details');
            }
          } else if (statusData.status === 'CANCELED') {
            console.log(`Order ${refno} was canceled`);
            throw new Error('Order was canceled');
          } else {
            console.log(`Order ${refno} still pending/processing with status: ${statusData.status}`);
            throw new Error('Order still processing');
          }
        } catch (error: any) {
          console.error(`Failed to recover order ${refno}:`, error);
          return null;
        }
      });

      const results = await Promise.all(recoveryPromises);
      
      results.forEach((result, index) => {
        if (result) {
          successfulOrders.push(result);
        } else {
          failedRefnos.push(refnos[index]);
        }
      });

      // Only update failed refnos if there are any
      if (failedRefnos.length > 0) {
        console.log('Storing failed refnos for retry:', failedRefnos);
        localStorage.setItem('pendingOrderRefnos', JSON.stringify(failedRefnos));
      } else {
        console.log('All orders processed successfully, clearing pending refnos');
        localStorage.removeItem('pendingOrderRefnos');
      }

      // Only update UI and show modal if we have new successful orders
      if (successfulOrders.length > 0 && hasNewSuccessfulOrders) {
        console.log('Adding successful orders to UI:', successfulOrders);
        setOrderDataList(successfulOrders);
        setIsProcessingComplete(true);
        setShowSuccessModal(true);
        modalShown.current = true;
        setShowNetworkModal(false); // Hide network modal only after success modal is shown
      } else {
        console.log('No new successful orders to display');
      }

      setIsRecovering(false);
      setRecoveryError(null);
    } catch (error: any) {
      console.error('Recovery process failed:', error);
      if (error.response) {
        console.error('Error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      setRecoveryError('Failed to recover orders. Please contact support.');
      setIsRecovering(false);
    }
  };

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
      if (emailError.response?.status === 421 && retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return sendEmailConfirmation(orderData, retryCount + 1);
      }
      
      if (retryCount >= 3) {
        console.error("Failed to send confirmation email after retries");
      }
    }
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

  const totalAmount = cart.reduce(
    (acc, item) => acc + Number(item.denomination) * item.quantity,
    0
  );

  const updateQuantity = (sku: string, denomination: string, delta: number) => {
    const updatedCart = cart
      .map((item) => {
        if (item.sku === sku && item.denomination === denomination) {
          const newQty = item.quantity + delta;
          // If newQty < 1, return null to mark for removal
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter((item) => item !== null); // Remove items with quantity < 1

    setCart(updatedCart as CartItem[]);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (sku: string, denomination: string) => {
    const updatedCart = cart.filter(
      (item) => !(item.sku === sku && item.denomination === denomination)
    );
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setIsProcessing(true);

    try {
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        alert("Razorpay SDK failed to load. Please try again.");
        setIsProcessing(false);
        return;
      }

      const orderResponse = await axios.post("http://localhost:4000/api/payment/order", {
        amount: totalAmount,
        currency: "INR",
      });

      const order = orderResponse.data.data;
      if (!order || !order.id) {
        alert("Failed to create Razorpay order. Please try again.");
        setIsProcessing(false);
        return;
      }

      const options = {
        key: "rzp_test_lqwCQUylHVfPtp",
        amount: totalAmount * 100,
        currency: "INR",
        name: "Woohoo Cart Checkout",
        description: `Order for ${cart.length} item(s)`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyResponse = await axios.post("http://localhost:4000/api/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              const pendingRefnos: string[] = [];
              const successfulOrders: OrderData[] = [];
              let hasNetworkError = false;
              let totalOrderIndex = 0;

              // Process each item in cart
              for (const item of cart) {
                console.log(`Processing item ${item.sku} with quantity ${item.quantity}`);
                // Create separate orders for each quantity
                for (let i = 0; i < item.quantity; i++) {
                  try {
                    // Generate a unique reference for each order
                    const uniqueRef = `${response.razorpay_order_id}_${item.sku}_${i}`;
                    
                    // Make separate API call for each quantity
                    const result = await axios.post("http://localhost:4000/api/order/place-order", {
                      sku: item.sku,
                      price: item.denomination,
                      quantity: 1, // Always send 1 as we want separate cards
                      razorpay_order_id: response.razorpay_order_id,
                      email: storedUser.email,
                      phone: storedUser.phone,
                      name: storedUser.name,
                      uniqueRef: uniqueRef,
                      orderIndex: totalOrderIndex // Use totalOrderIndex for global ordering
                    });

                    console.log(`Processing order ${i + 1} of ${item.quantity} for SKU ${item.sku}`);

                    const orderData = result.data?.data;
                    console.log('Received order data:', orderData);

                    if (orderData?.cards && orderData.cards.length > 0) {
                      console.log(`Processing ${orderData.cards.length} cards from response`);
                      // Process each card in the response
                      for (const card of orderData.cards) {
                        try {
                          console.log(`Checking status for card ${card.refno}`);
                          const statusResponse = await axios.get(`http://localhost:4000/api/order/status/${card.refno}`);
                          if (statusResponse.data.success) {
                            const statusData = statusResponse.data.data;
                            console.log(`Status for card ${card.refno}:`, statusData.status);
                            
                            if (statusData.status === 'COMPLETE' || statusData.localStatus === 'completed') {
                              console.log(`Getting details for card ${card.refno}`);
                              const detailsResponse = await axios.get(`http://localhost:4000/api/order/details/${card.refno}`);
                              if (detailsResponse.data.success) {
                                const orderDetails = detailsResponse.data.data;
                                if (orderDetails.cardNumber && orderDetails.cardPin) {
                                  // Create a new order object for each card
                                  const newOrder = {
                                    amount: orderDetails.amount,
                                    cardNumber: orderDetails.cardNumber,
                                    cardPin: orderDetails.cardPin,
                                    sku: orderDetails.sku,
                                    validity: orderDetails.validity,
                                    issuanceDate: orderDetails.issuanceDate,
                                    status: 'completed',
                                    refno: card.refno,
                                    orderIndex: totalOrderIndex,
                                    quantity: 1
                                  };
                                  
                                  console.log(`Adding new card with refno: ${card.refno}`);
                                  successfulOrders.push(newOrder);
                                  completedOrders.current.add(card.refno);
                                  localStorage.setItem('completedOrders', JSON.stringify(Array.from(completedOrders.current)));
                                  totalOrderIndex++; // Increment totalOrderIndex after each successful card
                                }
                              }
                            } else if (statusData.status === 'pending' || statusData.status === 'PENDING') {
                              // Add to pending orders if status is pending
                              if (!completedOrders.current.has(card.refno)) {
                                pendingRefnos.push(card.refno);
                                console.log(`Added pending order refno: ${card.refno}`);
                              }
                            }
                          }
                        } catch (statusError) {
                          console.error('Error checking order status:', statusError);
                          hasNetworkError = true;
                          // Add to pending if network error occurs
                          if (!completedOrders.current.has(card.refno)) {
                            pendingRefnos.push(card.refno);
                          }
                        }
                      }
                    } else {
                      console.log('No cards found in order data');
                      // If no cards in response, add to pending
                      pendingRefnos.push(uniqueRef);
                    }
                  } catch (orderError) {
                    console.error("Order failed for item:", item, orderError);
                    hasNetworkError = true;
                    // Add to pending on error
                    pendingRefnos.push(`${response.razorpay_order_id}_${item.sku}_${i}`);
                  }
                }
              }

              // Sort successful orders by orderIndex
              successfulOrders.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

              // Store pending refnos if there are any
              if (pendingRefnos.length > 0) {
                console.log('Storing pending refnos:', pendingRefnos);
                const existingPendingRefnos = JSON.parse(localStorage.getItem('pendingOrderRefnos') || '[]');
                const updatedPendingRefnos = [...new Set([...existingPendingRefnos, ...pendingRefnos])];
                localStorage.setItem('pendingOrderRefnos', JSON.stringify(updatedPendingRefnos));
              }

              // Always update orderDataList with all successful orders
              if (successfulOrders.length > 0) {
                console.log('Successfully processed orders:', successfulOrders.length);
                setOrderDataList(successfulOrders); // Replace instead of append
                setShowSuccessModal(true);
                modalShown.current = true;
              }

              // Show appropriate notification based on order status
              if (hasNetworkError) {
                setNotificationMessage("Some orders are being processed. You'll receive an email when they're ready.");
              } else if (pendingRefnos.length > 0) {
                setNotificationMessage("Some orders are pending. They will be processed automatically when possible.");
              } else {
                setNotificationMessage("All orders have been processed successfully!");
              }
              setShowNotification(true);
              setTimeout(() => {
                setShowNotification(false);
              }, 5000);

              localStorage.removeItem("cart");
              setCart([]);

              // Send email confirmation for successful orders
              if (successfulOrders.length > 0) {
                try {
                  await axios.post("http://localhost:4000/api/email/send-order-confirmation", {
                    email: storedUser.email,
                    name: storedUser.name,
                    orders: successfulOrders,
                    totalAmount: totalAmount,
                    orderId: response.razorpay_order_id
                  });
                } catch (emailError) {
                  console.error("Failed to send confirmation emails:", emailError);
                }
              }
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            console.error("Error verifying or placing order:", err);
            alert("Something went wrong during order placement. Please contact support.");
          } finally {
            setIsProcessing(false);
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
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed. Please try again.");
      setIsProcessing(false);
    }
  };

  // Reset modal shown flag when modal is closed
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    modalShown.current = false;
  };

  return (
    <>
      <Nav />
      <div className="p-2 sm:p-4 md:p-6 max-w-4xl mx-auto mt-8">
        {/* Notification */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              className="fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50 max-w-md"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{notificationMessage}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Network Status Modal */}
        <AnimatePresence>
          {showNetworkModal && !showSuccessModal && (
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
                  {!isNetworkStable ? (
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
                        {orderDataList.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium text-gray-700">Current Order Status:</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Your orders are saved locally and will be processed when connection is restored.
                            </p>
                          </div>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
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
                  ) : isRestoring ? (
                    <>
                      <motion.div
                        className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
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
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </motion.div>
                      <motion.h3
                        className="text-lg font-semibold text-gray-900 mb-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        Back Online
                      </motion.h3>
                      <motion.div
                        className="text-gray-600 mb-4 space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <p className="text-blue-600 font-medium">Processing Your Orders</p>
                        <motion.div
                          className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <motion.div
                            className="flex items-center justify-between mb-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <p className="text-sm font-medium text-blue-700">Processing Status:</p>
                            <motion.div
                              className="w-4 h-4 bg-blue-500 rounded-full"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.5, 1]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                          </motion.div>
                          <motion.div
                            className="space-y-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                          >
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-blue-600">Connection:</p>
                              <span className="text-sm font-medium text-green-600">Online</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-blue-600">Orders:</p>
                              <span className="text-sm font-medium text-blue-600">
                                {isRecovering ? 'Processing' : 'Syncing'}
                              </span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-1.5">
                              <motion.div
                                className="bg-blue-500 h-1.5 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: isRecovering ? "100%" : "100%" }}
                                transition={{
                                  duration: 2,
                                  ease: "easeInOut",
                                  repeat: isRecovering ? Infinity : 0,
                                  repeatType: "reverse"
                                }}
                              />
                            </div>
                            {isRecovering && (
                              <p className="text-xs text-blue-500 mt-1">
                                Please wait while we process your orders...
                              </p>
                            )}
                          </motion.div>
                        </motion.div>
                        <motion.p
                          className="text-sm text-gray-500 mt-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 }}
                        >
                          Your orders will be processed automatically.
                        </motion.p>
                      </motion.div>
                      <motion.div
                        className="flex justify-center space-x-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </motion.div>
                    </>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-gray-500 text-xs sm:text-sm mb-4">
          <span
            className="text-orange-500 cursor-pointer"
            onClick={() => navigate("/products/121")}
          >
            Products
          </span>{" "}
          / <span className="font-semibold">Cart</span>
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">Your Cart</h1>

        {cart.length === 0 ? (
          <p className="text-center text-gray-600">Your cart is empty.</p>
        ) : (
          <div>
            {/* Desktop/Table View */}
            <div className="hidden sm:block overflow-x-auto rounded">
              <table className="w-full min-w-[600px] mb-6 border border-gray-200 rounded text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left whitespace-nowrap">Product</th>
                    <th className="p-2 text-center whitespace-nowrap">Qty</th>
                    <th className="p-2 text-right whitespace-nowrap">Price</th>
                    <th className="p-2 text-right whitespace-nowrap">Subtotal</th>
                    <th className="p-2 text-center whitespace-nowrap">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={`${item.sku}-${item.denomination}`}>
                      <td className="p-2 flex items-center gap-2 min-w-[140px]">
                        <img src={item.image} alt={item.name} className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded" />
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">
                            Denomination: {item.currency.symbol}
                            {item.denomination}
                          </p>
                        </div>
                      </td>
                      <td className="p-2 text-center min-w-[60px]">
                        <div className="flex justify-center">
                          <div className="inline-flex bg-white shadow-sm border rounded-full overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.sku, item.denomination, -1)}
                              className="px-2 sm:px-3 py-1 bg-gray-100 hover:bg-red-200 transition text-red-600 font-semibold text-base focus:outline-none"
                            >
                              −
                            </button>
                            <span className="px-2 sm:px-3 py-1 text-center font-medium bg-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.sku, item.denomination, 1)}
                              className="px-2 sm:px-3 py-1 bg-gray-100 hover:bg-green-200 transition text-green-600 font-semibold text-base focus:outline-none"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-right min-w-[70px]">
                        {item.currency.symbol}
                        {item.denomination}
                      </td>
                      <td className="p-2 text-right min-w-[80px]">
                        {item.currency.symbol}
                        {Number(item.denomination) * item.quantity}
                      </td>
                      <td className="p-2 text-center min-w-[60px]">
                        <button
                          onClick={() => removeItem(item.sku, item.denomination)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove Item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold border-t border-gray-300">
                    <td colSpan={3} className="p-2 text-right">
                      Total:
                    </td>
                    <td className="p-2 text-right" colSpan={2}>
                      {cart[0]?.currency.symbol}
                      {totalAmount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="sm:hidden flex flex-col gap-4">
              {cart.map((item) => (
                <div key={`${item.sku}-${item.denomination}`} className="bg-white rounded-lg shadow p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded" />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        Denomination: {item.currency.symbol}
                        {item.denomination}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-2">
                    <span>Qty:</span>
                    <div className="inline-flex bg-white shadow-sm border rounded-full overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.sku, item.denomination, -1)}
                        className="px-2 py-1 bg-gray-100 hover:bg-red-200 transition text-red-600 font-semibold text-base focus:outline-none"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 text-center font-medium bg-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.sku, item.denomination, 1)}
                        className="px-2 py-1 bg-gray-100 hover:bg-green-200 transition text-green-600 font-semibold text-base focus:outline-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Price:</span>
                    <span>
                      {item.currency.symbol}
                      {item.denomination}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Subtotal:</span>
                    <span>
                      {item.currency.symbol}
                      {Number(item.denomination) * item.quantity}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => removeItem(item.sku, item.denomination)}
                      className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1"
                      title="Remove Item"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              ))}
              {/* Total for mobile */}
              <div className="bg-gray-100 rounded-lg p-3 text-right font-bold">
                Total: {cart[0]?.currency.symbol}
                {totalAmount}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
           <Link
            to="/products/121"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded shadow-md transition w-full sm:w-auto text-center"
          >
            Continue Shopping
          </Link>
          <button
            onClick={handleCheckout}
            disabled={isProcessing || cart.length === 0}
            className={`${
              isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            } text-white px-4 sm:px-6 py-2 sm:py-3 rounded shadow-md transition w-full sm:w-auto`}
          >
            {isProcessing ? "Processing..." : "Checkout"}
          </button>
          
        </div>

        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl p-3 sm:p-6 max-w-xs sm:max-w-2xl w-full shadow-xl relative overflow-auto max-h-[80vh]"
                initial={{ y: "-100vh", rotate: -5 }}
                animate={{ y: 0, rotate: 0 }}
                exit={{ y: "100vh", rotate: 5 }}
              >
                <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center">🎉 Order Successful!</h2>
                <p className="mb-4 sm:mb-6 text-center text-xs sm:text-base">Thank you for your purchase. Here are your gift card details:</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm mb-4 border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">SKU</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Card No</th>
                        <th className="p-2 text-left">PIN</th>
                        <th className="p-2 text-left">Validity</th>
                        <th className="p-2 text-left">Issued On</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDataList.map((orderData, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{orderData.sku}</td>
                          <td className="p-2">₹{orderData.amount}</td>
                          <td className="p-2">{orderData.cardNumber}</td>
                          <td className="p-2">{orderData.cardPin}</td>
                          <td className="p-2">{orderData.validity}</td>
                          <td className="p-2">{orderData.issuanceDate}</td>
                          <td className="p-2 text-green-600 font-semibold">{orderData.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleCloseModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default CartPage;