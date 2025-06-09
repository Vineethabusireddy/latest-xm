import { generateNewToken, getActiveToken } from '../services/woohooTokenService.js';
import cron from 'node-cron';

let isSchedulerRunning = false;

export const startTokenScheduler = async () => {
  if (isSchedulerRunning) {
    console.log('Token scheduler is already running');
    return;
  }

  try {
    // Check for existing active token first
    console.log('Checking for existing active token...');
    let token = await getActiveToken();
    
    if (!token) {
      // Generate initial token only if no active token exists
      console.log('No active token found. Generating initial token...');
      token = await generateNewToken();
      console.log('Initial token generated successfully');
    } else {
      console.log('Active token found:', {
        tokenType: token.tokenType,
        expiresAt: token.expiresAt
      });
    }

    // Schedule token generation every 7 days
    cron.schedule('0 0 */7 * *', async () => {
      console.log('Running scheduled token generation...');
      try {
        // Check if current token is expired before generating new one
        const currentToken = await getActiveToken();
        if (!currentToken || new Date(currentToken.expiresAt) <= new Date()) {
          const newToken = await generateNewToken();
          console.log('New token generated successfully:', {
            tokenType: newToken.tokenType,
            expiresAt: newToken.expiresAt
          });
        } else {
          console.log('Current token is still valid, skipping generation');
        }
      } catch (error) {
        console.error('Error in scheduled token generation:', error);
      }
    });

    isSchedulerRunning = true;
    console.log('Token scheduler started successfully');
  } catch (error) {
    console.error('Error starting token scheduler:', error);
    throw error;
  }
};

export const stopTokenScheduler = () => {
  if (!isSchedulerRunning) {
    console.log('Token scheduler is not running');
    return;
  }

  // Stop all cron jobs
  cron.getTasks().forEach(task => task.stop());
  isSchedulerRunning = false;
  console.log('Token scheduler stopped successfully');
}; 