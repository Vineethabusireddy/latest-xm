// routes/woohooRoutes.js
import express from 'express';
import { getProductDetails } from '../controllers/WoohooproductdetailsController.js';
import { getCatalogFromDB } from '../controllers/WoohoocatalogController.js';
import { getWoohooCategories } from '../controllers/WoohoocategoryController.js';
import { getWoohooCategoryProducts } from '../controllers/WoohooProductListController.js';
import { getRelatedProductsFromDB } from '../controllers/RelatedProductsController.js';

const router = express.Router();

//router.get('/sync-catalog', syncWoohooCatalog); // Call this to sync with Woohoo API
router.get('/catalog', getCatalogFromDB);       // Frontend should call this to get products

router.get('/category', getWoohooCategories);
router.get('/category/products/:categoryId', getWoohooCategoryProducts);
router.get('/product/details/:productSku', getProductDetails);
router.get('/related-products/:productSku', getRelatedProductsFromDB);

export default router;