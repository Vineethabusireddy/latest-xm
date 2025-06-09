import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

// Define the WoohooCategory model
const WoohooCategory = sequelize.define("WoohooCategory", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    // allowNull: false,
    // autoIncrement: true, // Optional, depending on whether you want auto-increment behavior
  },
  name: {
    type: DataTypes.STRING,
    // allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    // allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    // allowNull: true,
  },
  shortDescription: {
    type: DataTypes.STRING,
    // allowNull: true,
  },
  canonicalUrl: {
    type: DataTypes.STRING,
    // allowNull: true,
  },
  colorCode: {
    type: DataTypes.STRING,
    // allowNull: true,
  },
  bgColorCode: {
    type: DataTypes.STRING,
    // allowNull: true,
  },
  offerDescription: {
    type: DataTypes.TEXT,
    // allowNull: true,
  },
  metaIndex: {
    type: DataTypes.STRING,
    // allowNull: true,
  },
  metaKeyword: {
    type: DataTypes.STRING,
    // allowNull: true,
  },
  pageTitle: {
    type: DataTypes.STRING,
    // allowNull: true,
  },
  metaDescription: {
    type: DataTypes.TEXT,
    // allowNull: true,
  },
  images: {
    type: DataTypes.JSON,
    // allowNull: true,
  },
  subcategoriesCount: {
    type: DataTypes.INTEGER,
    // allowNull: true,
  },
  subcategories: {
    type: DataTypes.JSON,
    // allowNull: true,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

export default WoohooCategory;
