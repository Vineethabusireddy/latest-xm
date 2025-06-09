import nodemailer from 'nodemailer';
import { User } from '../models/User.js';
import { Op } from 'sequelize';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendDailyNotifications = async () => {
  try {
    // Get all users with email addresses
    const users = await User.findAll({
      where: {
        email: {
          [Op.ne]: null
        }
      }
    });

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    for (const user of users) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Daily Reminder - Visit  Xm Retail',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F37254;">Hello ${user.name}!</h2>
            <p>We hope you're having a great ${today.toLocaleDateString('en-US', { weekday: 'long' })}!</p>
            
            <p>Don't forget to check out our latest gift cards and offers on Xm Retail:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #F37254; margin-top: 0;">Why Visit Today?</h3>
              <ul style="list-style-type: none; padding: 0;">
                <li style="margin: 10px 0;">✨ New gift cards added daily</li>
                <li style="margin: 10px 0;">🎁 Special offers and discounts</li>
                <li style="margin: 10px 0;">💝 Perfect for last-minute gifts</li>
                <li style="margin: 10px 0;">🚀 Instant delivery options</li>
              </ul>
            </div>
            
            <p>Visit us now and discover amazing gift cards for your loved ones!</p>
            
            <a href="${process.env.FRONTEND_URL}" 
               style="display: inline-block; background-color: #F37254; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Visit Xm Retail
            </a>
            
            <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
              You're receiving this email because you're a registered user of Woohoo Cart. 
              To unsubscribe from these notifications, please update your preferences in your account settings.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Daily notification sent to ${user.email}`);
    }

    return { success: true, message: 'Daily notifications sent successfully' };
  } catch (error) {
    console.error('Error sending daily notifications:', error);
    return { success: false, message: 'Failed to send daily notifications', error: error.message };
  }
};

// Function to manually trigger daily notifications (for testing)
export const triggerDailyNotifications = async (req, res) => {
  try {
    const result = await sendDailyNotifications();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error triggering daily notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger daily notifications',
      error: error.message
    });
  }
};
