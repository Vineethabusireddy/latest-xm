import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendOrderConfirmation = async (req, res) => {
  try {
    const { email, name, orders, totalAmount, orderId, phone } = req.body;

    // Create order details text
    const orderDetails = orders.map(order => `
      Product SKU: ${order.sku}
      Amount: ₹${order.amount}
      Card Number: ${order.cardNumber}
      PIN: ${order.cardPin}
      Validity: ${order.validity}
      Issued On: ${order.issuanceDate}
      Status: ${order.status}
      ----------------------------------------
    `).join('\n');

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Order Confirmation - Xm Retail',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F37254;">Order Confirmation</h2>
          <p>Dear ${name},</p>
          <p>Thank you for your purchase! Your order has been successfully placed.</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
          
          <h3 style="color: #F37254;">Order Details:</h3>
          <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
${orderDetails}
          </pre>
          
          <p>Please keep this email for your records. The gift cards can be used as per their validity period.</p>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>Xm Retail Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // Send WhatsApp message if phone number is provided
    if (phone) {
      const formattedPhone = phone.replace(/\D/g, '').startsWith('+') 
        ? phone.replace(/\D/g, '') 
        : `+91${phone.replace(/\D/g, '')}`;

      const whatsappMessage = `*Order Confirmation - Woohoo Cart*\n\nDear ${name},\n\nThank you for your purchase! Your order has been successfully placed.\n\n*Order ID:* ${orderId}\n*Total Amount:* ₹${totalAmount}\n\n*Order Details:*\n${orderDetails}\n\nPlease keep this message for your records. The gift cards can be used as per their validity period.\n\nIf you have any questions, please don't hesitate to contact our support team.\n\nBest regards,\nXm Retail Team`;

      await twilioClient.messages.create({
        body: whatsappMessage,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${formattedPhone}`
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Order confirmation notifications sent successfully' 
    });
  } catch (error) {
    console.error('Error sending order confirmation notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send order confirmation notifications',
      error: error.message 
    });
  }
};

