import Card from "../models/Card.js";
import fs from "fs";
import path from "path";

// @desc Get all cards
export const getCards = async (req, res) => {
  try {
    const cards = await Card.findAll();
    res.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
};

// @desc Create a new card
export const createCard = async (req, res) => {
  try {
    const { name, cashback, category, details, validityMonths, amounts } = req.body;

    if (!validityMonths) {
      return res.status(400).json({ message: "Validity (months) is required." });
    }

    const newCard = await Card.create({
      name,
      cashback,
      category,
      details,
      validityMonths,
      amounts: amounts.split(",").map((a) => a.trim()),
      image: req.file ? req.file.filename : null,
    });

    res.status(201).json(newCard);
  } catch (error) {
    console.error("Error creating card:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Update a card
export const updateCard = async (req, res) => {
  try {
    const { name, cashback, category, details, validityMonths, amounts } = req.body;
    const cardId = req.params.id;

    const existingCard = await Card.findByPk(cardId);
    if (!existingCard) {
      return res.status(404).json({ error: "Card not found" });
    }

    let updatedImage = existingCard.image;

    if (req.file) {
      if (existingCard.image) {
        const oldImagePath = path.join("uploads", existingCard.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updatedImage = req.file.filename;
    }

    await existingCard.update({
      name,
      cashback,
      category,
      details,
      validityMonths,
      amounts: amounts.split(",").map((a) => a.trim()),
      image: updatedImage,
    });

    res.json({ message: "Card updated successfully", card: existingCard });
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({ error: "Failed to update card" });
  }
};

// @desc Delete a card
export const deleteCard = async (req, res) => {
  try {
    const card = await Card.findByPk(req.params.id);
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (card.image) {
      const imagePath = path.join("uploads", card.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await card.destroy(); // ✅ FIXED
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ error: "Failed to delete card" });
  }
};

// @desc Get cards by category
export const getCardsByCategory = async (req, res) => {
  const { category } = req.params;

  if (!category) {
    return res.status(400).json({ message: "Category parameter is required" });
  }

  try {
    const cards = await Card.findAll({
      where: { category }
    });
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch cards by category",
      error: error.message,
      stack: error.stack
    });
  }
};
