import { signature } from "../../Woohooservice/signature.js";
import axios from "axios";
import WoohooOrder from "../../models/cardorders.js";
import { getActiveToken } from '../../services/woohooTokenService.js';
import { encrypt } from './utils.js';

/**
 * Checks the status of an order with Woohoo API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkOrderStatus = async (req, res) => {
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

    // First check if order exists in our database
    const order = await WoohooOrder.findOne({ where: { refno } });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order Not Found",
        details: "Order not found in our system"
      });
    }

    // Check order status with Woohoo API
    const method = "GET";
    const statusUrl = `https://sandbox.woohoo.in/rest/v3/order/${refno}/status`;
    const { signature: generatedSignature, dateAtClient } = signature(
      method,
      statusUrl,
      {}
    );

    try {
      const response = await axios.get(statusUrl, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Signature: generatedSignature,
          DateAtClient: dateAtClient,
          'Content-Type': 'application/json',
          Accept: '*/*'
        },
        timeout: 10000 // 10 second timeout
      });

      const statusData = response.data;
      
      // Map Woohoo status to our system status
      let mappedStatus = 'pending';
      switch(statusData.status) {
        case 'COMPLETE':
          mappedStatus = 'completed';
          // If order is completed, try to fetch card details
          if (order.status !== 'completed') {
            try {
              const cardDetailsUrl = `https://sandbox.woohoo.in/rest/v3/order/${refno}/cards`;
              const { signature: cardSignature, dateAtClient: cardDate } = signature(
                "GET",
                cardDetailsUrl,
                {}
              );

              const cardResponse = await axios.get(cardDetailsUrl, {
                headers: {
                  Authorization: `Bearer ${token.accessToken}`,
                  Signature: cardSignature,
                  DateAtClient: cardDate,
                  'Content-Type': 'application/json',
                  Accept: '*/*'
                },
                timeout: 10000
              });

              const cardList = cardResponse.data.cards || [];
              if (cardList.length > 0) {
                await order.update({
                  cardNumber: cardList[0].cardNumber ? encrypt(cardList[0].cardNumber) : "",
                  cardPin: cardList[0].cardPin ? encrypt(cardList[0].cardPin) : "",
                  validity: cardList[0].validity,
                  issuanceDate: cardList[0].issuanceDate ? new Date(cardList[0].issuanceDate) : null,
                  balance: cardList[0].balance || null
                });
              }
            } catch (cardError) {
              // Continue with status update even if card details fetch fails
            }
          }
          break;
        case 'PROCESSING':
          mappedStatus = 'processing';
          break;
        case 'CANCELED':
          mappedStatus = 'failed';
          break;
        case 'PENDING':
          mappedStatus = 'pending';
          break;
      }

      // Update local order status
      await order.update({
        status: mappedStatus,
        woohooResponse: statusData
      });

      return res.status(200).json({
        success: true,
        data: {
          status: statusData.status,
          statusLabel: statusData.statusLabel,
          orderId: statusData.orderId,
          refno: statusData.refno,
          cancel: statusData.cancel,
          localStatus: mappedStatus
        }
      });

    } catch (woohooError) {
      // Handle specific Woohoo API errors
      if (woohooError.response) {
        switch (woohooError.response.status) {
          case 400:
            return res.status(400).json({
              success: false,
              error: "Invalid Request",
              details: woohooError.response.data?.message || "Order not available in Woohoo system"
            });
          case 401:
            return res.status(401).json({
              success: false,
              error: "Authentication Error",
              details: "Invalid or expired Woohoo API token"
            });
          case 403:
            return res.status(403).json({
              success: false,
              error: "Access Forbidden",
              details: "API access is revoked or insufficient permissions"
            });
          case 500:
            // If Woohoo server is down, return our local status
            return res.status(200).json({
              success: true,
              data: {
                status: order.status.toUpperCase(),
                statusLabel: "Local Status",
                orderId: order.orderId,
                refno: order.refno,
                localStatus: order.status
              }
            });
        }
      }

      // For network errors or other issues
      return res.status(200).json({
        success: true,
        data: {
          status: order.status.toUpperCase(),
          statusLabel: "Local Status",
          orderId: order.orderId,
          refno: order.refno,
          localStatus: order.status
        }
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message || "An unexpected error occurred while checking order status"
    });
  }
}; 