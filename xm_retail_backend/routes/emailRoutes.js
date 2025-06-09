import express from 'express';
import { sendOrderConfirmation } from '../controllers/emailOrderConfirmController.js';

const router = express.Router();

router.post('/send-order-confirmation', sendOrderConfirmation);

export default router;
