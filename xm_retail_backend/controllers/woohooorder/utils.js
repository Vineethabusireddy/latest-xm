import crypto from "crypto";
import WoohooOrder from "../../models/cardorders.js";

const ENCRYPTION_KEY = process.env.CARD_ENCRYPTION_KEY; // Must be 32 bytes (hex or utf8)
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts sensitive data using AES-256-CBC encryption
 * @param {string} text - The text to encrypt
 * @returns {string} - Encrypted text with IV
 */
export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypts encrypted data using AES-256-CBC decryption
 * @param {string} text - The encrypted text to decrypt
 * @returns {string} - Decrypted text
 */
export function decrypt(text) {
  if (!text.includes(":")) return ""; // Not encrypted
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = parts.join(":");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Generates a unique reference number for orders
 * Format: XMR000001-1234567890
 * @returns {Promise<string>} - Generated reference number
 */
export async function generateReferenceNumber() {
  try {
    // Find the last order to get the last reference number
    const lastOrder = await WoohooOrder.findOne({
      order: [['createdAt', 'DESC']],
      attributes: ['refno']
    });

    let nextNumber = 1; // Default starting number

    if (lastOrder && lastOrder.refno) {
      // Extract the number part from the last reference number
      const lastNumber = parseInt(lastOrder.refno.replace('XMR', ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Get current timestamp in milliseconds
    const timestamp = Date.now();
    
    // Format the number with leading zeros and add timestamp
    const refno = `XMR${nextNumber.toString().padStart(6, '0')}-${timestamp}`;

    // Verify the reference number is unique
    const existingOrder = await WoohooOrder.findOne({
      where: { refno }
    });

    if (existingOrder) {
      // If reference number exists, generate a new one with a different timestamp
      return generateReferenceNumber();
    }

    return refno;
  } catch (error) {
    console.error('Error generating reference number:', error);
    // Fallback to timestamp-based reference if there's an error
    return `XMR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
} 