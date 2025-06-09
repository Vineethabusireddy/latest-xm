import axios from 'axios';
import WoohooToken from '../models/WoohooToken.js';
import dotenv from 'dotenv';

dotenv.config();

const WOOHOO_VERIFY_URL = 'https://sandbox.woohoo.in/oauth2/verify';
const WOOHOO_TOKEN_URL = 'https://sandbox.woohoo.in/oauth2/token';

const WOOHOO_CREDENTIALS = {
  clientId: process.env.WOOHOO_CLIENT_ID,
  username: process.env.WOOHOO_USERNAME,
  password: process.env.WOOHOO_PASSWORD,
  clientSecret: process.env.WOOHOO_CLIENT_SECRET
};

export const generateNewToken = async () => {
  try {
    // Log credentials (without sensitive data)
    console.log('Attempting to generate token with credentials:', {
      clientId: WOOHOO_CREDENTIALS.clientId ? 'Set' : 'Not Set',
      username: WOOHOO_CREDENTIALS.username ? 'Set' : 'Not Set',
      password: WOOHOO_CREDENTIALS.password ? 'Set' : 'Not Set',
      clientSecret: WOOHOO_CREDENTIALS.clientSecret ? 'Set' : 'Not Set'
    });

    // Step 1: Get authorization code
    console.log('Step 1: Requesting authorization code...');
    const verifyResponse = await axios.post(WOOHOO_VERIFY_URL, {
      clientId: WOOHOO_CREDENTIALS.clientId,
      username: WOOHOO_CREDENTIALS.username,
      password: WOOHOO_CREDENTIALS.password
    });

    console.log('Verify Response:', verifyResponse.data);

    if (!verifyResponse.data || !verifyResponse.data.authorizationCode) {
      throw new Error('Failed to get authorization code from Woohoo API');
    }

    const authorizationCode = verifyResponse.data.authorizationCode;

    // Step 2: Get access token using authorization code
    console.log('Step 2: Requesting access token...');
    const tokenResponse = await axios.post(WOOHOO_TOKEN_URL, {
      clientId: WOOHOO_CREDENTIALS.clientId,
      clientSecret: WOOHOO_CREDENTIALS.clientSecret,
      authorizationCode: authorizationCode
    });

    console.log('Token Response:', tokenResponse.data);

    if (!tokenResponse.data || !tokenResponse.data.token) {
      throw new Error('Failed to get access token from Woohoo API');
    }

    // Extract token from response
    const accessToken = tokenResponse.data.token;
    const tokenType = 'Bearer'; // Woohoo uses Bearer token type

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Deactivate all existing tokens
    await WoohooToken.update(
      { isActive: false },
      { where: { isActive: true } }
    );

    // Store new token
    const newToken = await WoohooToken.create({
      accessToken,
      refreshToken: null, // Woohoo doesn't provide refresh token
      tokenType,
      expiresAt,
      isActive: true
    });

    return newToken;
  } catch (error) {
    console.error('Error generating new token:', error);
    if (error.response) {
      console.error('Woohoo API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

export const getActiveToken = async () => {
  try {
    // Find active token
    let token = await WoohooToken.findOne({
      where: { isActive: true }
    });

    // If no active token or token is expired, generate new one
    if (!token || new Date(token.expiresAt) <= new Date()) {
      token = await generateNewToken();
    }

    return token;
  } catch (error) {
    console.error('Error getting active token:', error);
    throw error;
  }
};
