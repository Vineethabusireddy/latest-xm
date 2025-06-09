import { DataTypes } from 'sequelize';
import {sequelize} from '../config/db.js'; 

const ProductDetails = sequelize.define('ProductDetails', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  sku: DataTypes.STRING,
  name: DataTypes.STRING,
  description: DataTypes.TEXT,
  shortDescription: DataTypes.STRING,
  disableCart: DataTypes.BOOLEAN,
  purchaserLimit: DataTypes.STRING,
  purchaserDescription: DataTypes.STRING,
  offerShortDesc: DataTypes.STRING,
  relatedProductOptions: DataTypes.JSON,
  url: DataTypes.STRING,
  quantity: DataTypes.JSON,
  price: DataTypes.JSON,
  kycEnabled: DataTypes.STRING,
  additionalForm: DataTypes.JSON,
  metaInformation: DataTypes.JSON,
  type: DataTypes.STRING,
  cardBehaviour: DataTypes.STRING,
  schedulingEnabled: DataTypes.BOOLEAN,
  currency: DataTypes.STRING,
  images: DataTypes.JSON,
  tnc: DataTypes.JSON,
  categories: DataTypes.JSON,
  themes: DataTypes.JSON,
  customThemesAvailable: DataTypes.BOOLEAN,
  handlingCharges: DataTypes.JSON,
  reloadCardNumber: DataTypes.BOOLEAN,
  expiry: DataTypes.STRING,
  formatExpiry: DataTypes.STRING,
  couponcodeDesc: DataTypes.STRING,
  discounts: DataTypes.JSON,
  corporateDiscounts: DataTypes.JSON,
  relatedProducts: DataTypes.JSON,
  storeLocatorUrl: DataTypes.STRING,
  brandName: DataTypes.STRING,
  brandCode: DataTypes.STRING,
  etaMessage: DataTypes.STRING,
  createdAtWoohoo: DataTypes.DATE,
  updatedAtWoohoo: DataTypes.DATE,
  cpg: DataTypes.JSON,
  payout: DataTypes.JSON,
  convenience_charges: DataTypes.JSON,
  allowedfulfillments: DataTypes.JSON,
  rewardsDescription: DataTypes.STRING,
  campaigns: DataTypes.JSON,
}, {
  tableName: 'ProductDetails',
  timestamps: true,
});

export default ProductDetails;



