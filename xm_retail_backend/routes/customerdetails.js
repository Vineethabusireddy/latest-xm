import { getCustomerDetails } from "../controllers/customerController.js";
//import { getOrderDetailsdb } from "../controllers/OrderDetails.js";
import express from "express";

const router = express.Router();

router.get("/", getCustomerDetails); 
//router.get("/orderdetails",getOrderDetailsdb); 


export default router;