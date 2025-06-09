// models/Order.js
import { Sequelize, DataTypes } from 'sequelize';
import {sequelize} from '../config/db.js'; 

const Order = sequelize.define('Order', {
    id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
    },
  order_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount_due: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount_paid: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'created',
  },
  notes: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  offer_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  receipt: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: false, // Disable automatic `createdAt` and `updatedAt` fields
  tableName: 'orders', // Optional: specify a custom table name
});

export default Order;
