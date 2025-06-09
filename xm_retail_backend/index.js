import Card from "./models/Card.js";
import adminRoute from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import cust from "./routes/customerdetails.js"
import { connectDB, sequelize } from "./config/db.js";
import cors from "cors";
import dotenv from 'dotenv';
import errorHandler from "./middleware/errorMiddleware.js";
import express from "express";
import imageRoutes from "./routes/imageRoutes.js";
import path from "path";
import userRoutes from "./routes/userRoutes.js";
import payment from "./routes/payment.js"
import woohooRoutes from "./routes/woohooRoutes.js";
import woohooTokenRoutes from "./routes/woohooTokenRoutes.js";
import orderRoutes from "./routes/orderroutes.js"; // Ensure the file extension is included
import Order from "./models/orderModel.js";
//import OrderdetailsRoutes from "./routes/OrderdetailsRoutes.js"; // Ensure the file extension is included
import searchRoutes from "./routes/search.js"; // Ensure the file extension is included
import ProductList from "./models/ProductListModel.js"; // Import ProductList model
import emailRoutes from "./routes/emailRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { startNotificationScheduler } from "./schedulers/notificationScheduler.js";
import { startTokenScheduler } from "./schedulers/tokenScheduler.js";

const app = express();
const PORT = 4000;
dotenv.config();
// Connect to MongoDB
connectDB();
//this will sync db and create tables
await sequelize.sync();

// Sync ProductList model (temporarily, for development only)
// ProductList.sync({ alter: true }); // or { force: true } to drop and recreate

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static images
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// Routes
app.use("/api/admin", adminRoute);
app.use("/api", imageRoutes);
app.use("/uploads", express.static("uploads"));

// API Routes
app.use("/api/cards", cardRoutes);
app.use('/api/payment', payment);
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).send("Internal Server Error!");
});

//order routes
app.use("/api/order",orderRoutes);

//for nginx
app.use('/admin/dashboard', (req, res) => {
  res.status(403).json({ message: 'Access Forbidden' });
});

//for card

app.get("/api/cards/:id", async (req, res) => {
  try {
    console.log(`API hit for card ID: ${req.params.id}`); // Debugging
    const card = await Card.findByPk(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//app.use("/api/cards", cardRoutes);

// Error Middleware
app.use(errorHandler);


//Woohoo fetching
app.use("/api/woohoo", woohooRoutes);
app.use("/api/woohoo/token", woohooTokenRoutes);

 

//login
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/cust/data",cust);

//customer Order details
//app.use("/api/order",OrderdetailsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/email", emailRoutes);

//notification routes
app.use("/api/notifications", notificationRoutes);

// Start the schedulers
startNotificationScheduler();
startTokenScheduler().catch(error => {
  console.error('Failed to start token scheduler:', error);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
