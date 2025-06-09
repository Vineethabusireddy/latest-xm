import express from 'express';
import { placeOrder } from '../controllers/woohooorder/placeOrder.js';
import { checkOrderStatus } from '../controllers/woohooorder/checkOrderStatus.js';

import { forceUpdateOrder } from '../controllers/woohooorder/forceUpdateOrder.js';
 
import { getUserGiftCards } from '../controllers/getUserGiftCards.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { getOrderDetails } from '../controllers/woohooorder/getOrderDetails.js';

const router = express.Router();

// Route to place Woohoo order
router.post('/place-order', placeOrder);



// Route to get order details by refno
router.get('/details/:refno', getOrderDetails);

// Check order status by refno
router.get('/status/:refno', checkOrderStatus);

// Force update order
router.post('/force-update/:refno', forceUpdateOrder);


router.get('/user-orders', authenticateUser, getUserGiftCards);

export default router;