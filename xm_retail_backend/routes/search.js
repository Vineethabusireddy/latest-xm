import express from "express";
import { Op } from "sequelize";
import Card from "../models/Card.js";
import Product from "../models/CatalogModel.js";
import WoohooCategory from "../models/Woohoocategorymodel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const query = req.query.query?.trim();

  if (!query) {
    return res.json([]);
  }

  try {
    // Search in Card model
    const cardResults = await Card.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      attributes: ["id", "name", "image", "cashback"],
    });

    // Search in Product model
    const productResults = await Product.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      attributes: ["id", "name", "image", "sku"],
    });

    // Search in WoohooCategory model
    const categoryResults = await WoohooCategory.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        },
      },
      attributes: ["id", "name"],
    });

    // Construct the response
    const results = [
      ...cardResults.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        cashback: item.cashback,
        type: "cards",
      })),
      ...productResults.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        sku: item.sku,
        type: "product",
      })),
      ...categoryResults.map((item) => ({
        id: item.id,
        name: item.name,
        type: "category",
      })),
    ];

    res.json(results);
  } catch (err) {
    console.error("Error in search route:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;