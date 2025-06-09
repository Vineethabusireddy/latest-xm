// controllers/woohooController.js
import axios from "axios";
import ProductList from "../models/ProductListModel.js";

export const getWoohooCategoryProducts = async (req, res) => {
  const { categoryId } = req.params;
  try {
    // Fetch products from ProductList table by categoryId
    const products = await ProductList.findAll({ where: { categoryId } });
    console.log(`Data fetched from DB for categoryId ${categoryId}:`, products.length, "products");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products", details: error.message });
  }
};
