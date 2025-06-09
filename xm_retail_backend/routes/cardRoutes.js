// import { addNewCard, fetchCardById, removeCard } from "../controllers/cardController.js";

import { createCard, deleteCard, getCards, getCardsByCategory, updateCard } from "../controllers/cardController.js";

import express from "express";
import upload from "../middleware/Cardupload.js"; // Middleware for file upload

const router = express.Router();

router.get("/", getCards);
router.post("/", upload.single("image"), createCard);
router.put("/:id", upload.single("image"), updateCard); 
router.delete("/:id", deleteCard);
router.get("/category/:category", getCardsByCategory);



// router.get("/cards/:cardId", fetchCardById); // Get a single card
// router.post("/cards/add", addNewCard); // Create a new card
// router.delete("/cards/remove/:cardId", removeCard); // Delete a card

export default router;



