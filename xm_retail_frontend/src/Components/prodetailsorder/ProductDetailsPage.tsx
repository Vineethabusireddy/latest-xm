import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';
import Nav from '../NavBar/Nav';
import { Product, OrderCard } from './types';
import ProductInfo from './ProductInfo';
import RelatedProducts from './RelatedProducts';
import ToastNotification from './ToastNotification';
import NetworkStatusModal from './NetworkStatusModal';
import GiftCardDisplay from './GiftCardDisplay';
import { handleBuyNow } from './PaymentHandler';
import { recoverOrder } from './OrderRecovery';

/**
 * ProductDetailsPage Component
 * Main component for displaying product details and handling purchases
 */
const ProductDetailsPage: React.FC = () => {
  // URL parameters and navigation
  const { productSku } = useParams<{ productSku: string }>();
  const navigate = useNavigate();

  // State management
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
  // State to manage network modal visibility and content
  const [networkModalState, setNetworkModalState] = useState<'hidden' | 'offline' | 'reconnecting'>('hidden');

  // Function to check for stable network connection
  const checkStableConnection = useCallback(async () => {
    try {
      // Attempt to fetch a small, cache-busting resource with a timeout
      const response = await Promise.race([
        fetch(`https://www.google.com/favicon.ico?_=${Date.now()}`, { mode: 'no-cors' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection check timed out')), 3000))
      ]);
      // If we get here and the promise didn't reject, the network is likely stable
      console.log('Stable connection detected.');
      return true;
    } catch (error) {
      // Connection check failed or timed out
      console.error('Connection check failed:', error);
      return false;
    }
  }, []);

  // Get user data from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!localStorage.getItem("user");

  // Fetch product details
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

  // Fetch related products
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

  // Network status monitoring
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Online event detected.');
      setIsOnline(true);
      setIsReconnecting(true);
      setNetworkModalState('reconnecting');

      // Start checking for stable connection
      let checkInterval: NodeJS.Timeout;
      const attemptRecoveryOrHideModal = async () => {
        const isStable = await checkStableConnection();
        if (isStable) {
          console.log('Connection is stable, clearing interval and hiding modal.');
          clearInterval(checkInterval);
          setIsReconnecting(false);
          setNetworkModalState('hidden');

          // Try to recover any pending orders after stable connection is confirmed
          const pendingOrderRefno = localStorage.getItem('pendingOrderRefno');
          if (pendingOrderRefno) {
            console.log('Attempting to recover pending order:', pendingOrderRefno);
            recoverOrder(
              pendingOrderRefno,
              {
                name: storedUser.name,
                email: storedUser.email,
                phone: storedUser.phone
              },
              {
                onRecovering: () => {
                  setIsRecovering(true);
                  console.log('Order recovery started.');
                },
                onRecovered: (data) => {
                  setOrderData(data);
                  setShowSuccessModal(true);
                  localStorage.removeItem('pendingOrderRefno');
                  setIsRecovering(false);
                  setRecoveryError(null);
                  console.log('Order recovered successfully.');
                },
                onError: (error) => {
                  setRecoveryError(error);
                  setIsRecovering(false);
                  console.error('Order recovery failed:', error);
                },
                onCanceled: () => {
                  setRecoveryError('Order was canceled. Please try again.');
                  localStorage.removeItem('pendingOrderRefno');
                  setIsRecovering(false);
                  console.log('Order recovery canceled.');
                }
              }
            );
          } else {
            console.log('No pending order to recover.');
          }
        }
      };

      // Check connection every 500ms until stable
      checkInterval = setInterval(attemptRecoveryOrHideModal, 500);

      return () => {
        console.log('Cleaning up connection check interval.');
        clearInterval(checkInterval);
      };
    };

    const handleOffline = () => {
      console.log('Offline event detected.');
      setIsOnline(false);
      setIsReconnecting(false);
      setNetworkModalState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setNetworkModalState('offline');
    }

    return () => {
      console.log('Removing network status listeners.');
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [storedUser, checkStableConnection]);

  // Handle network modal visibility based on state
  useEffect(() => {
    console.log('networkModalState changed:', networkModalState);
    if (networkModalState !== 'hidden') {
      setShowNetworkModal(true);
    } else {
      setShowNetworkModal(false);
    }
  }, [networkModalState]);

  // Handle denomination change
  const handleDenominationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDenomination(e.target.value);
  };

  // Handle add to cart
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

  // Handle buy now click
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

    if (!product) return;

    await handleBuyNow(
      product,
      selectedDenomination,
      {
        email: storedUser.email,
        phone: storedUser.phone,
        name: storedUser.name
      },
      {
        onProcessingStart: () => setIsPaymentProcessing(true),
        onProcessingEnd: () => setIsPaymentProcessing(false),
        onSuccess: async (refno) => {
          setToastMessage("Payment successful! Processing your order...");
          setShowToast(true);
          
          // Fetch order details and show success modal
          try {
            const response = await axios.get(`http://localhost:4000/api/order/details/${refno}`);
            if (response.data.success && response.data.data) {
              const orderDetails = response.data.data;
              
              // Only store in localStorage if order is pending or there's a network issue
              if (orderDetails.status === 'pending' || !navigator.onLine) {
                localStorage.setItem('pendingOrderRefno', refno);
              }
              
              setOrderData({
                sku: orderDetails.sku,
                productName: orderDetails.productName,
                amount: orderDetails.amount,
                cardNumber: orderDetails.cardNumber,
                cardPin: orderDetails.cardPin,
                validity: orderDetails.validity,
                issuanceDate: orderDetails.issuanceDate,
                recipientName: storedUser.name,
                recipientEmail: storedUser.email,
                recipientPhone: storedUser.phone,
                balance: orderDetails.balance,
              });
              setShowSuccessModal(true);
            }
          } catch (error) {
            // If there's an error fetching order details, store refno for recovery
            localStorage.setItem('pendingOrderRefno', refno);
            setToastMessage("Order placed but details couldn't be fetched. Will be processed automatically.");
            setShowToast(true);
          }
        },
        onError: (message) => {
          setToastMessage(message);
          setShowToast(true);
        }
      }
    );
  };

  return (
    <>
      <Nav />
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <ToastNotification
            message={toastMessage}
            onClose={() => setShowToast(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Breadcrumb Navigation */}
        <div className="text-gray-500 text-sm mb-4">
          <span
            className="text-orange-500 cursor-pointer"
            onClick={() => navigate("/products/121")}
          >
            Products
          </span>{" "}
          / <span className="font-semibold">ProductDetails</span>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <p className="text-center text-gray-500 text-lg">Loading product details...</p>
        )}
        {error && <p className="text-center text-red-500 text-lg">{error}</p>}

        {/* Product Information */}
        {!loading && !error && product && (
          <>
            <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
              {product.name}
            </h1>
            
            <ProductInfo
              product={product}
              selectedDenomination={selectedDenomination}
              onDenominationChange={handleDenominationChange}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNowClick}
              isPaymentProcessing={isPaymentProcessing}
            />

            {/* Related Products */}
            <RelatedProducts products={relatedProducts} />
          </>
        )}
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <GiftCardDisplay
              orderData={orderData}
              product={product}
              onClose={() => setShowSuccessModal(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Network Status Modal */}
      <AnimatePresence>
        {showNetworkModal && (
          <NetworkStatusModal 
            isReconnecting={isReconnecting} 
            onReconnectComplete={() => { 
              console.log('NetworkStatusModal onReconnectComplete triggered.');
              // Optional: add fallback logic here if needed, 
              // but parent useEffect should handle main dismissal
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductDetailsPage; 