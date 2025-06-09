import { signature } from "../../Woohooservice/signature.js";
import axios from "axios";
import WoohooOrder from "../../models/cardorders.js";
import { getActiveToken } from '../../services/woohooTokenService.js';
import { encrypt, decrypt } from './utils.js';

/**
 * Retrieves detailed information about an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getOrderDetails = async (req, res) => {
  try {
    const { refno } = req.params;

    if (!refno) {
      return res.status(400).json({
        success: false,
        error: "Missing Parameters",
        details: "Reference number is required"
      });
    }

    const order = await WoohooOrder.findOne({
      where: { refno }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order Not Found",
        details: "No order found with the provided reference number"
      });
    }

    // Decrypt card details
    let cardNumber = "";
    let cardPin = "";
    
    if (order.cardNumber && order.cardNumber.includes(":")) {
      try {
        cardNumber = decrypt(order.cardNumber);
      } catch (error) {
        console.error("Error decrypting card number:", error);
      }
    }
    
    if (order.cardPin && order.cardPin.includes(":")) {
      try {
        cardPin = decrypt(order.cardPin);
      } catch (error) {
        console.error("Error decrypting card PIN:", error);
      }
    }

    // Get active token
    const token = await getActiveToken();
    if (!token || !token.accessToken) {
      return res.status(401).json({
        success: false,
        error: "Authentication Error",
        details: "Failed to get valid Woohoo API token"
      });
    }

    // Try to get latest card details from Woohoo if order is completed
    if (order.status === 'completed') {
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
          // Update order with latest card details
          await order.update({
            cardNumber: cardList[0].cardNumber ? encrypt(cardList[0].cardNumber) : order.cardNumber,
            cardPin: cardList[0].cardPin ? encrypt(cardList[0].cardPin) : order.cardPin,
            validity: cardList[0].validity || order.validity,
            issuanceDate: cardList[0].issuanceDate ? new Date(cardList[0].issuanceDate) : order.issuanceDate,
            balance: cardList[0].balance || order.balance
          });

          // Update decrypted values
          if (cardList[0].cardNumber) cardNumber = cardList[0].cardNumber;
          if (cardList[0].cardPin) cardPin = cardList[0].cardPin;
        }
      } catch (cardError) {
        // Continue with existing card details if fetch fails
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...order.toJSON(),
        cardNumber,
        cardPin
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message || "Failed to fetch order details"
    });
  }
}; 