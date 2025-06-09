import { Router } from 'express';
import { triggerDailyNotifications } from '../controllers/notificationController.js';

const router = Router();

// Route to manually trigger daily notifications (for testing)
router.post('/trigger-daily', triggerDailyNotifications);

export default router; 