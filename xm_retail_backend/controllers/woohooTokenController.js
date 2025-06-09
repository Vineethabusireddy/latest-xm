import { generateNewToken, getActiveToken } from '../services/woohooTokenService.js';
import { startTokenScheduler, stopTokenScheduler } from '../schedulers/tokenScheduler.js';

// Generate a new token manually
export const generateToken = async (req, res) => {
  try {
    // Check if required environment variables are set
    const requiredEnvVars = [
      'WOOHOO_CLIENT_ID',
      'WOOHOO_USERNAME',
      'WOOHOO_PASSWORD',
      'WOOHOO_CLIENT_SECRET'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      return res.status(500).json({
        success: false,
        message: 'Missing required environment variables',
        missingVariables: missingEnvVars
      });
    }

    const token = await generateNewToken();
    res.status(200).json({
      success: true,
      data: {
        accessToken: token.accessToken,
        tokenType: token.tokenType,
        expiresAt: token.expiresAt
      }
    });
  } catch (error) {
    console.error('Error in generateToken controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate token',
      error: error.message,
      details: error.response?.data || 'No additional details available'
    });
  }
};

// Get current active token
export const getToken = async (req, res) => {
  try {
    const token = await getActiveToken();
    res.status(200).json({
      success: true,
      data: {
        accessToken: token.accessToken,
        tokenType: token.tokenType,
        expiresAt: token.expiresAt
      }
    });
  } catch (error) {
    console.error('Error in getToken controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get token',
      error: error.message
    });
  }
};

// Start automatic token generation
export const startAutoTokenGeneration = async (req, res) => {
  try {
    await startTokenScheduler();
    res.status(200).json({
      success: true,
      message: 'Automatic token generation started successfully'
    });
  } catch (error) {
    console.error('Error starting token scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start automatic token generation',
      error: error.message
    });
  }
};

// Stop automatic token generation
export const stopAutoTokenGeneration = async (req, res) => {
  try {
    stopTokenScheduler();
    res.status(200).json({
      success: true,
      message: 'Automatic token generation stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping token scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop automatic token generation',
      error: error.message
    });
  }
}; 