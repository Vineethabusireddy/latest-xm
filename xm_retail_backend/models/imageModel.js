import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Image = sequelize.define("Images", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});