import { generateWoohooSignature } from "../generateSignature.js";
import axios from "axios";
import dotenv from "dotenv";
import { getActiveToken } from '../services/woohooTokenService.js';

dotenv.config();

const woohooProductDetails = (orderId) => `https://sandbox.woohoo.in/rest/v3/orders/${orderId}`;

export const getOrderDetails = async (req, res) => {
  try {
    // Get active token from database
    const token = await getActiveToken();
    if (!token || !token.accessToken) {
      throw new Error('No active token found');
    }

    const { orderid } = req.params;

    if (!orderid) {
      return res.status(400).json({
        success: false,
        error: 'Missing orderId',
        details: 'Order ID is required to fetch the order details'
      });
    }

    const method = 'GET';
    const { signature, dateAtClient } = generateWoohooSignature(
      woohooProductDetails(orderid),
      method,
      process.env.clientSecret
    );

    const response = await axios.get(woohooProductDetails(orderid), {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        signature,
        dateAtClient,
        'Content-Type': 'application/json',
        Accept: '*/*',
      }
    });

    const result = response.data;

    if (!result || Object.keys(result).length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order Not Found",
        details: "No order found with the provided order ID"
      });
    }

    res.status(200).json({
      success: true,
      orderId: result.orderId,
      data: result,
      tokenUsed: {
        tokenType: token.tokenType,
        expiresAt: token.expiresAt
      }
    });

  } catch (error) {
    console.error(`Woohoo API error: ${error.message}`);

    if (error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        error: 'Token Error',
        details: error.message,
        tokenError: true
      });
    }

    if (error.response) {
      // Server responded with a status outside of 2xx
      return res.status(error.response.status).json({
        success: false,
        error: 'Woohoo API Error',
        details: error.response.data || 'An error occurred while communicating with the Woohoo API'
      });
    } else if (error.request) {
      // Request was made but no response received
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        details: 'Failed to connect to the Woohoo API'
      });
    } else {
      // Other unexpected errors
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        details: error.message || 'An unexpected error occurred'
      });
    }
  }
};
