import ProductDetails from "../models/WoohooproductDetailsModel.js";




// 2. GET PRODUCT DETAILS (ALWAYS FRESH)
export const getProductDetails = async (req, res) => {
  const { productSku } = req.params;
  try {
    const dbProduct = await ProductDetails.findOne({ where: { sku: productSku } });
    if (!dbProduct) {
      return res.status(404).json({ error: "Product not found in database" });
    }
    res.json(dbProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product details', details: error.message });
  }
};
