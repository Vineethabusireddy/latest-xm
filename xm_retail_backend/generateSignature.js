// utils/generateSignature.js
import CryptoJS from 'crypto-js';

// Utility to encode URI consistently
const fixedEncodedURIComponent = (str) =>
  encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16));

// Utility to sort query params for consistent signature
const sortQueryParams = (url) => {
  const [baseUrl, queryString] = url.split("?");
  if (!queryString) return fixedEncodedURIComponent(baseUrl);
  const sortedParams = queryString.split('&').sort().join('&');
  return fixedEncodedURIComponent(`${baseUrl}?${sortedParams}`);
};

/**
 * Generate signature for Woohoo API requests.
 * @param {string} url - Full URL including query params
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} clientSecret - Secret key from Woohoo
 * @returns {Object} - Object with signature and ISO timestamp
 */
export const generateWoohooSignature = (url, method, clientSecret) => {
  const requestHttpMethod = method.toUpperCase();
  const dateAtClient = new Date().toISOString();

  const baseArray = [
    requestHttpMethod,
    url.includes("?") ? sortQueryParams(url) : fixedEncodedURIComponent(url),
  ];

  const baseString = baseArray.join("&");
  const signature = CryptoJS.HmacSHA512(baseString, clientSecret).toString();

  return { signature, dateAtClient };
};
