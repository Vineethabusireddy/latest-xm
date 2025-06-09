import cron from 'node-cron';
import { sendDailyNotifications } from '../controllers/notificationController.js';

// Schedule daily notifications to run at 10:41 AM every day
export const startNotificationScheduler = () => {
  cron.schedule('43 10 * * *', async () => {
    console.log('Running daily notification scheduler...');
    try {
      const result = await sendDailyNotifications();
      console.log('Daily notification scheduler result:', result);
    } catch (error) {
      console.error('Error in daily notification scheduler:', error);
    }
  });
  
  console.log('Daily notification scheduler started');
}; 