import CatalogProduct from '../models/CatalogModel.js';

// Fetch catalog for frontend from DB
let dbFetchCount = 0;
export const getCatalogFromDB = async (req, res) => {
  dbFetchCount++;
  //console.log(`[DB FETCH ] catalog Called ${dbFetchCount} times`);
  try {
    const products = await CatalogProduct.findAll();
   // console.log(`[DB FETCH] Fetched ${products.length} products from database`);
    // Remove any null/empty products
    const filtered = products.filter(p => p && p.name && p.sku);
    res.json({ products: filtered });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch catalog from DB', details: error.message });
  }
};
