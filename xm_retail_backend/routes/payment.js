import express from 'express';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { stat } from 'fs';
import Order from '../models/orderModel.js'; // Adjust the import path as needed

dotenv.config();

const router = express.Router();

// Initialize Razorpay
// RAZORPAY_KEY_ID=rzp_test_lqwCQUylHVfPtp
// RAZORPAY_SECRET=LvbYL24lSMcmYdsFnGRf9xIz
const razorpayInstance = new Razorpay({
  key_id: "rzp_test_lqwCQUylHVfPtp",
  key_secret: "LvbYL24lSMcmYdsFnGRf9xIz",
});

// Create Order Endpoint
router.post('/order', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!razorpayInstance) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay instance not initialized',
      });
    }
    // Validate input
    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Amount and currency are required',
      });
    }

    // Convert amount to paise and validate
    const amountInPaise = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least 1 INR (100 paise)',
      });
    }
    if (amountInPaise > 100000000) {
      return res.status(400).json({
        success: false,
        message: 'Amount exceeds the maximum limit of 1 crore INR',
      });
    }
    


    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: currency || 'INR',
      payment_capture: 1, 
      notes: {
        userId: "user_123",
        cartId: "cart_456"
      }
    };
    console.log('Razorpay order options:', options);

    // Uncomment the following line to create an order in Razorpay

    const order = await razorpayInstance.orders.create(options);


    // Check if order creation was successful
    if (!order || !order.id) {
      return es.status(500).json({
        success: false,
        message: 'Failed to create order in Razorpay',
      });
    }
    // Save order in database
    await Order.create({
      order_id: order.id,
      amount: order.amount,
      amount_due: order.amount_due,
      amount_paid: order.amount_paid,
      attempts: order.attempts,
      created_at: order.created_at,
      currency: order.currency,
      entity: order.entity,
      status: order.status,
      notes: order.notes,
      offer_id: order.offer_id,
      receipt: order.receipt,
    });

    return res.json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    
    if (error.error && error.error.description) {
      return res.status(400).json({
        success: false,
        message: error.error.description,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create order. Please try again.',
    });
  }
});

// Verify Payment Endpoint
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields',
      });
    }

    console.log('Payment verification request:', req.body);
    console.log('Razorpay Order ID:', razorpay_order_id); 

    // Generate expected signature
    const generatedSignature = crypto
      .createHmac('sha256', "LvbYL24lSMcmYdsFnGRf9xIz")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
      console.log('Generated Signature:', generatedSignature);
      console.log('Received Signature:', razorpay_signature);

    // Verify signature
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature',
      });
    }
   console.log('Signature verified successfully');
   console.log('Razorpay Order ID:', razorpay_order_id);
    const order  = await Order.findOne({ where: { order_id: razorpay_order_id } });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // console.log('Order found:', order);
    order.status = 'paid'; // Update order status to 'paid'
    order.amount_paid = order.amount; // Update amount paid to total amount
    order.amount_due = 0; // Set amount due to 0
    order.attempts += 1; // Increment attempts
    await order.save(); // Save the updated order
    // console.log('Order updated successfully:', order);

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      status: 'success',
      data: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
    });
    console.log('Payment verification successful:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      status:"error",
      error: error.message, 
      data: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
      
    });
  }
});

export default router;
