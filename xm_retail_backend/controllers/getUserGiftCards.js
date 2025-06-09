// controllers/orderController.js
import WoohooOrder from '../models/cardorders.js';
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.CARD_ENCRYPTION_KEY; // Must be 32 bytes (hex or utf8)
const IV_LENGTH = 16;

function decrypt(text) {
  if (!text || !text.includes(":")) return "";
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = parts.join(":");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export const getUserGiftCards = async (req, res) => {
  const email = req.user?.email;

  if (!email) {
    return res.status(400).json({ message: "User email not found in token" });
  }

  try {
    const orders = await WoohooOrder.findAll({
      where: { recipientEmail: email },
      order: [['issuanceDate', 'DESC']],
    });

    // Decrypt cardNumber before sending to frontend
    const result = orders.map(order => {
      let cardNumber = "";
      let cardPin = "";
      if (order.cardNumber && order.cardNumber.includes(":")) {
        try {
          cardNumber = decrypt(order.cardNumber);
        } catch {
          cardNumber = "";
        }
      }
      if (order.cardPin && order.cardPin.includes(":")) {
        try {
          cardPin = decrypt(order.cardPin);
        } catch {
          cardPin = "";
        }
      }
      return {
        ...order.toJSON(),
        cardNumber,
         cardPin,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching gift cards:", error);
    res.status(500).json({ message: "Failed to fetch gift cards" });
  }
};
