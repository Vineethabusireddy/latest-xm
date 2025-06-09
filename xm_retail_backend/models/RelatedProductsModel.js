import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import ProductList from "./ProductListModel.js";

const RelatedProduct = sequelize.define("RelatedProduct", {
  sku: { // Related product's SKU as PRIMARY KEY
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  description: DataTypes.TEXT,
  price: DataTypes.FLOAT,
  image: DataTypes.STRING,
  // The SKU of the main product this is related to
  productSku: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null if there is no related data
    references: {
      model: ProductList,
      key: "sku",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  // Add other related product fields as needed
}, {
  timestamps: true,
});

// Associations
ProductList.hasMany(RelatedProduct, { foreignKey: "productSku", sourceKey: "sku" });
RelatedProduct.belongsTo(ProductList, { foreignKey: "productSku", targetKey: "sku" });

export default RelatedProduct;