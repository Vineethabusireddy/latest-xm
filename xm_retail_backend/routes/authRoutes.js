import { sendOtp, verifyOtp ,saveRegistration} from "../controllers/authController.js";
// import { saveRegistrationDetails } from "../controllers/userController.js";

import { Router } from "express";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/save-registration", saveRegistration); 

export default router;
