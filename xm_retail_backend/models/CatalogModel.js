import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const CatalogProduct = sequelize.define("CatalogProduct", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  sku: DataTypes.STRING,
  productType: DataTypes.STRING,
  image: DataTypes.STRING, // Store only the image URL as a string
  stores: DataTypes.JSON,
  websites: DataTypes.JSON,
}, {
  tableName: "CatalogProducts", // Make sure this matches your actual table name!
  timestamps: true,
});

export default CatalogProduct;
