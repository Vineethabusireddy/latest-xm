import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const WoohooToken = sequelize.define('WoohooToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: false
  },
 
  tokenType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

export default WoohooToken; 