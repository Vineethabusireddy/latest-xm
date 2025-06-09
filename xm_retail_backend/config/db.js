import dotenv from 'dotenv';
// import mongoose from "mongoose";
import { Sequelize } from "sequelize";


dotenv.config()

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  
  process.env.MYSQL_PASSWORD,{
    dialect:"mysql",
    host:process.env.MYSQL_HOST | "localhost",
    logging: false 
  },
);

//Authentication
const connectDB = async ()=>{
  try{
    await sequelize.authenticate();
    console.log("DB connected Successfully");
  }catch(e){
    console.log("Db is not connected ");
  }
};




// const connectDB = async () => {
//   const password= process.env.MONGO_PASSWORD;
//   try {
//     await mongoose.connect(`mongodb+srv://balu:${password}@cluster1.4rk8zhp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`, {});
//     console.log("MongoDB connected successfully.");
//   } catch (error) {
//     console.error("MongoDB connection failed:", error);
//     process.exit(1);
//   }
// };

export { connectDB, sequelize };




