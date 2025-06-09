import axios from 'axios';
import { OrderCard } from './types';

/**
 * Forces an update of the order status
 * @param refno - The order reference number
 */
export const forceUpdateOrder = async (refno: string) => {
  try {
    await axios.post(`http://localhost:4000/api/order/force-update/${refno}`);
  } catch (error) {
    // Handle error silently
  }
};

/**
 * Checks the status of an order
 * @param refno - The order reference number
 * @returns Promise with order status data
 */
export const checkOrderStatus = async (refno: string) => {
  const response = await axios.get(`http://localhost:4000/api/order/status/${refno}`);
  if (!response.data.success) {
    throw new Error(response.data.details || 'Failed to check order status');
  }
  return response.data.data;
};

/**
 * Fetches order details
 * @param refno - The order reference number
 * @returns Promise with order details
 */
export const fetchOrderDetails = async (refno: string) => {
  const response = await axios.get(`http://localhost:4000/api/order/details/${refno}`);
  if (!response.data.success) {
    throw new Error(response.data.details || 'Failed to fetch order details');
  }
  return response.data.data;
};

/**
 * Recovers an order and updates its status
 * @param refno - The order reference number
 * @param userData - User data for order recovery
 * @param callbacks - Callback functions for different states
 */
export const recoverOrder = async (
  refno: string,
  userData: { name: string; email: string; phone: string },
  callbacks: {
    onRecovering: () => void;
    onRecovered: (orderData: OrderCard) => void;
    onError: (error: string) => void;
    onCanceled: () => void;
  }
) => {
  try {
    callbacks.onRecovering();

    // First try to force update the order
    await forceUpdateOrder(refno);

    // Check order status
    const statusData = await checkOrderStatus(refno);

    if (statusData.status === 'COMPLETE' || statusData.localStatus === 'completed') {
      // If order is completed, fetch card details
      const orderData = await fetchOrderDetails(refno);
      
      if (orderData.cardNumber && orderData.cardPin) {
        const recoveredOrder: OrderCard = {
          sku: orderData.sku,
          productName: orderData.productName,
          amount: orderData.amount,
          cardNumber: orderData.cardNumber,
          cardPin: orderData.cardPin,
          validity: orderData.validity,
          issuanceDate: orderData.issuanceDate,
          recipientName: orderData.recipientName || userData.name,
          recipientEmail: orderData.recipientEmail || userData.email,
          recipientPhone: orderData.recipientPhone || userData.phone,
          balance: orderData.balance,
          status: 'completed'
        };
        
        callbacks.onRecovered(recoveredOrder);
      } else {
        // If order is complete but no card details, start polling
        startPolling(refno, userData, callbacks);
      }
    } else if (statusData.status === 'CANCELED') {
      callbacks.onCanceled();
    } else {
      // If still pending/processing, start polling
      startPolling(refno, userData, callbacks);
    }
  } catch (error) {
    callbacks.onError('Failed to recover order. Please contact support.');
  }
};

/**
 * Starts polling for order status updates
 * @param refno - The order reference number
 * @param userData - User data for order recovery
 * @param callbacks - Callback functions for different states
 */
export const startPolling = (
  refno: string,
  userData: { name: string; email: string; phone: string },
  callbacks: {
    onRecovering: () => void;
    onRecovered: (orderData: OrderCard) => void;
    onError: (error: string) => void;
    onCanceled: () => void;
  }
) => {
  const pollInterval = setInterval(async () => {
    try {
      const statusData = await checkOrderStatus(refno);

      if (statusData.status === 'COMPLETE' || statusData.localStatus === 'completed') {
        clearInterval(pollInterval);
        
        // Get order details from the status response if available
        if (statusData.cards && statusData.cards.length > 0) {
          const cardData = statusData.cards[0];
          const recoveredOrder: OrderCard = {
            sku: cardData.sku,
            productName: cardData.productName,
            amount: cardData.amount,
            cardNumber: cardData.cardNumber,
            cardPin: cardData.cardPin,
            validity: cardData.validity,
            issuanceDate: cardData.issuanceDate,
            recipientName: userData.name,
            recipientEmail: userData.email,
            recipientPhone: userData.phone,
            balance: cardData.balance,
            status: 'completed'
          };
          
          callbacks.onRecovered(recoveredOrder);
        } else {
          // If no card details in status response, try to get order details
          try {
            const orderData = await fetchOrderDetails(refno);
            if (orderData.cardNumber && orderData.cardPin) {
              const recoveredOrder: OrderCard = {
                sku: orderData.sku,
                productName: orderData.productName,
                amount: orderData.amount,
                cardNumber: orderData.cardNumber,
                cardPin: orderData.cardPin,
                validity: orderData.validity,
                issuanceDate: orderData.issuanceDate,
                recipientName: orderData.recipientName || userData.name,
                recipientEmail: orderData.recipientEmail || userData.email,
                recipientPhone: orderData.recipientPhone || userData.phone,
                balance: orderData.balance,
                status: 'completed'
              };
              
              callbacks.onRecovered(recoveredOrder);
            }
          } catch (detailsError) {
            // Handle error silently
          }
        }
      } else if (statusData.status === 'CANCELED') {
        clearInterval(pollInterval);
        callbacks.onCanceled();
      }
    } catch (error: any) {
      // Don't clear interval on network errors, keep trying
      if (error.response && error.response.status !== 404) {
        clearInterval(pollInterval);
        callbacks.onError('Failed to check order status. Please contact support.');
      }
    }
  }, 5000); // Poll every 5 seconds

  return pollInterval;
}; 