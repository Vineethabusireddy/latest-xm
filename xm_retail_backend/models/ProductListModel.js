import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import WoohooCategory from "./Woohoocategorymodel.js";

const ProductList = sequelize.define("ProductList", {
  sku: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  currencyCode: DataTypes.STRING,
  currencySymbol: DataTypes.STRING,
  url: DataTypes.STRING,
  minPrice: DataTypes.STRING,
  maxPrice: DataTypes.STRING,
  offer: DataTypes.STRING,
  image: DataTypes.STRING, // store mobile image only
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: WoohooCategory,
      key: "id",
    },
    onDelete: "CASCADE",
  },
}, {
  timestamps: true,
  tableName: "ProductList",
});

WoohooCategory.hasMany(ProductList, { foreignKey: "categoryId" });
ProductList.belongsTo(WoohooCategory, { foreignKey: "categoryId" });

export default ProductList;