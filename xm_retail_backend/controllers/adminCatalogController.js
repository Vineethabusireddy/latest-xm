import axios from 'axios';
import { generateWoohooSignature } from '../generateSignature.js';
import CatalogProduct from '../models/CatalogModel.js';
import { Op } from "sequelize";
import { getActiveToken } from '../services/woohooTokenService.js';

const woohoocatalog = 'https://sandbox.woohoo.in/rest/v3/catalog/products';

// Add these counters at the top of your file (outside the functions)
let apiSyncCount = 0;

// Sync catalog from Woohoo API, but only update DB if new/changed
export const syncWoohooCatalog = async (req, res) => {
  apiSyncCount++;
  console.log(`[Woohoo API SYNC] Called ${apiSyncCount} times`);
  try {
    // Get active token from database
    const token = await getActiveToken();
    if (!token || !token.accessToken) {
      throw new Error('No active token found');
    }

    const method = 'GET';
    const { signature, dateAtClient } = generateWoohooSignature(
      woohoocatalog,
      method,
      process.env.clientSecret
    );

    const response = await axios.get(woohoocatalog, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        signature,
        dateAtClient,
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
    });

    const products = response.data.products;
    console.log(`[Woohoo catalog API SYNC] Fetched ${products.length} products from Woohoo API`);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    let updatedCount = 0;
    for (const product of products) {
      if (!product.name || !product.sku) {
        //console.log("Skipping product (missing name or sku):", product.name, product.sku);
        continue;
      } // skip invalid products

      // Find existing product by SKU
      const existing = await CatalogProduct.findOne({ where: { sku: product.sku } });

      // Prepare product data
      const productData = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        productType: product.productType || null,
        image:
          product.image && (
            product.image.mobile ||
            product.image.base ||
            product.image.url ||
            null
          ),
        stores: product.stores || null,
        websites: product.websites || null,
        // Add other fields as needed
      };

      // If not exist, create. If exist and changed, update.
      if (!existing) {
        try {
          await CatalogProduct.create(productData);
          updatedCount++;
        } catch (err) {
          console.error("Error creating product:", err, productData);
        }
      } else {
        // Compare fields (simple JSON stringify for demo, use deep compare for production)
        const isChanged = JSON.stringify(existing.toJSON()) !== JSON.stringify({ ...existing.toJSON(), ...productData });
        if (isChanged) {
          await existing.update(productData);
          updatedCount++;
        }
      }
    }

    // Delete products with NULL name or SKU
    await CatalogProduct.destroy({
      where: {
        [Op.or]: [
          { name: null },
          { sku: null }
        ]
      }
    });

    res.json({ 
      success: true,
      message: `Catalog sync complete. ${updatedCount} products added/updated.`,
      tokenUsed: {
        tokenType: token.tokenType,
        expiresAt: token.expiresAt
      }
    });
  } catch (error) {
    console.error("Woohoo API error:", error.response ? error.response.data : error.message);
    res.status(500).json({ 
      success: false,
      error: 'Catalog sync failed', 
      details: error.message,
      tokenError: error.message.includes('token') ? 'Token related error' : null
    });
  }
};



