import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js'; 

const WoohooOrder = sequelize.define("WoohooOrder", {
  orderId: {
    type: DataTypes.STRING,
  },
  refno: {
    type: DataTypes.STRING,
    unique: true,
  },
  sku: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  productName: DataTypes.STRING,
  amount: DataTypes.DECIMAL(10, 2),
  cardNumber: DataTypes.STRING,
  cardPin: DataTypes.STRING,

  // ✅ Uncomment these
  validity: DataTypes.DATE,
  issuanceDate: DataTypes.DATE,

  recipientName: DataTypes.STRING,
  recipientEmail: DataTypes.STRING,
  recipientPhone: DataTypes.STRING,
  balance: DataTypes.DECIMAL(10, 2),
  
  // New fields for order tracking
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  
  // Payment details
  razorpayOrderId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  razorpayPaymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  razorpaySignature: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  paymentCurrency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Error handling
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastRetryAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  woohooResponse: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

export default WoohooOrder;