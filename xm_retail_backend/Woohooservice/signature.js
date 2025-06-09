import axios from 'axios';
import cryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();
// clientSecret = f33c680c790601ed61e0c7f9e29a7318
// bearerToken =eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjb25zdW1lcklkIjo4NTQsImV4cCI6MTc0NjU4OTA5MiwidG9rZW4iOiIyMmNlODJjMDU2MjEyNmYyMzJlN2VjYmE4MjYxYWEwOSJ9.QZKOmDMyCnlKrYK6bH3yHzUoh8KiA9YgYKdAqNmAlLs


const clientSecret = "f33c680c790601ed61e0c7f9e29a7318";
const bearerToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjb25zdW1lcklkIjo4NTQsImV4cCI6MTc0NjU4OTA5MiwidG9rZW4iOiIyMmNlODJjMDU2MjEyNmYyMzJlN2VjYmE4MjYxYWEwOSJ9.QZKOmDMyCnlKrYK6bH3yHzUoh8KiA9YgYKdAqNmAlLs";
if (!clientSecret) {
  throw new Error('Environment variable CLIENT_SECRET is not defined.');
}

if (!bearerToken) {
  throw new Error('Environment variable BEARER_TOKEN is not defined.');
}

export function signature(method, url, body) {
  const dateAtClient = new Date().toISOString();
  const baseArray = [];

  baseArray.push(method.toUpperCase());
  baseArray.push(url.includes('?') ? sortQueryParams(url) : fixedEncodeURIComponent(url));

  if (method !== 'GET' && method !== 'DELETE') {
    const sortedBody = sortObject(body);
    const encodedBody = fixedEncodeURIComponent(JSON.stringify(sortedBody));
    baseArray.push(encodedBody);
  }

  const baseString = baseArray.join('&');
  const signature = cryptoJS.HmacSHA512(baseString, clientSecret).toString();

  return { signature, dateAtClient };
}

function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c =>
    '%' + c.charCodeAt(0).toString(16)
  );
}

function sortObject(obj) {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((sorted, key) => {
      sorted[key] = sortObject(obj[key]);
      return sorted;
    }, {});
  }
  return obj;
}

function sortQueryParams(url) {
  const [baseUrl, queryString] = url.split('?');
  if (!queryString) return fixedEncodeURIComponent(baseUrl);
  const sortedParams = queryString.split('&').sort().join('&');
  return fixedEncodeURIComponent(baseUrl + '?' + sortedParams);
}

export async function fetchData(url, method, body = {}) {
  const { signature, dateAtClient } = generateSignature(method, url, body);

  const headers = {
    'Authorization': `Bearer ${bearerToken}`,
    'signature': signature,
    'dateAtClient': dateAtClient,
    'Content-Type': 'application/json'
  };

  try {
    const config = {
      method,
      url,
      headers,
      ...(method !== 'GET' && method !== 'DELETE' ? { data: body } : {})
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching data:', error.response?.data || error.message);
    throw error;
  }
}
