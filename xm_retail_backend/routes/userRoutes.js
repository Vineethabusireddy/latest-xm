import { getProfile, getUserProfile, updateProfile,saveRegistrationDetails } from "../controllers/userController.js";

import { Router } from "express";

const router = Router();

router.put("/update-profile", updateProfile);
router.get("/profile",  getProfile);
router.get("/:userId", getUserProfile);
router.put("/save-registration", saveRegistrationDetails);

export default router;
