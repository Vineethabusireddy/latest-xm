// import mongoose from "mongoose";

// const cardSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   cashback: { type: String, required: true },
//   category: { type: String, required: true },
//   details: { type: String },
//   image: { type: String }, // Store filename
//   amounts: { type: [Number], required: true }, // Array of cashback amounts
//   validityMonths: { type: Number, required: true } // Number of months for validity
// });

// const Card = mongoose.model("Card", cardSchema);
// export default Card;

import { Sequelize,DataTypes  } from "sequelize";
import {sequelize} from "../config/db.js";

const Card = sequelize.define("Cards",{
  id:{
    type:DataTypes.INTEGER,
    autoIncrement:true,
    primaryKey:true,
  },
  name:{
   type:DataTypes.STRING,
   allowNull:true,
  }, 
  image:{
    type:DataTypes.STRING,
    allowNull:true,
  },
  cashback:{
    type:DataTypes.STRING,
    allowNull:true,
  },
  category:{
    type:DataTypes.STRING,
    allowNull:true,
  },
  // details:{
  //   type:DataTypes.TEXT,
  //   allowNull:true,
  // },
 
  amounts:{
    type:DataTypes.JSON,
    allowNull:true,
  },
  validityMonths:{
    type:DataTypes.INTEGER,
    allowNull:false,
  },
});

export default Card;