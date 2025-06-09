import { signature } from "../../Woohooservice/signature.js";
import axios from "axios";
import WoohooOrder from "../../models/cardorders.js";
import { getActiveToken } from '../../services/woohooTokenService.js';
import { encrypt } from './utils.js';

const woohooOrderUrl = `https://sandbox.woohoo.in/rest/v3/orders`;

/**
 * Force updates an order with Woohoo API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const forceUpdateOrder = async (req, res) => {
  try {
    const { refno } = req.params;
    
    // Get active token
    const token = await getActiveToken();
    if (!token || !token.accessToken) {
      return res.status(401).json({
        success: false,
        error: "Authentication Error",
        details: "Failed to get valid Woohoo API token"
      });
    }

    // Find order in database
    const order = await WoohooOrder.findOne({ where: { refno } });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order Not Found",
        details: "Order not found in our system"
      });
    }

    // Update retry count and timestamp
    await order.update({
      retryCount: order.retryCount + 1,
      lastRetryAt: new Date(),
      status: 'processing'
    });

    // Prepare payload for Woohoo API
    const payload = {
      address: {
        salutation: "Mr.",
        firstname: order.recipientName,
        lastname: "jackson",
        email: order.recipientEmail,
        telephone: `+91${order.recipientPhone}`,
        line1: "123 Main Street",
        city: "Bangalore",
        region: "Karnataka",
        country: "IN",
        postcode: "560001",
        billToThis: true,
      },
      payments: [
        {
          code: "svc",
          amount: order.amount,
          poNumber: order.refno,
        },
      ],
      products: [
        {
          sku: order.sku,
          price: order.amount,
          qty: 1,
          currency: 356,
          giftMessage: "Enjoy your gift!",
        },
      ],
      refno: order.refno,
      remarks: "Force update of pending order",
      deliveryMode: "API",
      syncOnly: true,
    };

    const method = "POST";
    const { signature: generatedSignature, dateAtClient } = signature(
      method,
      woohooOrderUrl,
      payload
    );

    try {
      const response = await axios.post(woohooOrderUrl, payload, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Signature: generatedSignature,
          DateAtClient: dateAtClient,
          'Content-Type': 'application/json',
          Accept: '*/*'
        },
        timeout: 30000 // 30 second timeout
      });

      const placed = response.data;
      const cardList = placed.cards || [];

      // Update order with Woohoo response and card details
      await order.update({
        orderId: placed.orderId,
        cardNumber: cardList[0]?.cardNumber ? encrypt(cardList[0].cardNumber) : "",
        cardPin: cardList[0]?.cardPin ? encrypt(cardList[0].cardPin) : "",
        validity: cardList[0]?.validity,
        issuanceDate: cardList[0]?.issuanceDate ? new Date(cardList[0].issuanceDate) : null,
        balance: placed.payments?.[0]?.balance || null,
        status: 'completed',
        woohooResponse: placed,
        errorMessage: null
      });

      // Return success with card details
      return res.status(200).json({
        success: true,
        data: {
          status: 'completed',
          message: 'Order successfully updated',
          cards: [{
            sku: order.sku,
            productName: order.productName,
            amount: order.amount,
            cardNumber: cardList[0]?.cardNumber || "",
            cardPin: cardList[0]?.cardPin || "",
            validity: cardList[0]?.validity,
            issuanceDate: cardList[0]?.issuanceDate,
            recipientName: order.recipientName,
            recipientEmail: order.recipientEmail,
            recipientPhone: order.recipientPhone,
            balance: order.balance,
            status: 'completed'
          }]
        }
      });

    } catch (woohooError) {
      // If Woohoo API is unreachable, keep order as pending
      if (woohooError.code === 'ENOTFOUND' || woohooError.code === 'ECONNREFUSED' || woohooError.code === 'ETIMEDOUT') {
        await order.update({
          status: 'pending',
          errorMessage: 'Woohoo API temporarily unavailable. Will retry automatically.',
          retryCount: order.retryCount + 1
        });

        return res.status(200).json({
          success: true,
          data: {
            status: 'pending',
            message: 'Order is pending. Will be processed when Woohoo API is available.',
            retryCount: order.retryCount
          }
        });
      }

      // For other errors, mark as failed
      await order.update({
        status: 'failed',
        errorMessage: woohooError.message,
        retryCount: order.retryCount + 1
      });

      return res.status(500).json({
        success: false,
        error: "Woohoo API Error",
        details: woohooError.message || "Failed to update order with Woohoo"
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message || "An unexpected error occurred while updating order"
    });
  }
}; 