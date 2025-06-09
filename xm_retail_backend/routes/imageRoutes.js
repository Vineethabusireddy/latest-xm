import { deleteImage, getImages, uploadImage } from "../controllers/imageController.js";

import express from "express";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/upload", upload.single("image"), uploadImage);
router.get("/images", getImages);
router.delete("/delete", deleteImage);

export default router;
