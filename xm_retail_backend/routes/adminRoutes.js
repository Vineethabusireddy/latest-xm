import { adminLogin } from "../controllers/adminController.js";
import express from "express";
import { syncWoohooCatalog } from "../controllers/adminCatalogController.js";
import { syncProductDetails, syncProductsForAllCategories, syncWoohooCategories,getAllProductSkus, syncAllRelatedProducts } from "../controllers/SyncController.js";
import { getWoohooCategoryProducts } from "../controllers/WoohooProductListController.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get('/sync-catalog', syncWoohooCatalog);
router.get('/sync-categories', syncWoohooCategories);
router.get('/sync-productlist', syncProductsForAllCategories);
router.get('/products/:categoryId', getWoohooCategoryProducts);
router.post('/sync-productdetails', syncProductDetails);
router.get('/product-skus', getAllProductSkus);
router.post('/sync-all-related-products', syncAllRelatedProducts);


export default router;
