import RelatedProduct from "../models/RelatedProductsModel.js";

export const getRelatedProductsFromDB = async (req, res) => {
  try {
    const { productSku } = req.params;
    const relatedProducts = await RelatedProduct.findAll({ where: { productSku } });
    res.json(relatedProducts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch related products", details: error.message });
  }
};