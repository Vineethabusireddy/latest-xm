import WoohooCategory from '../models/Woohoocategorymodel.js';
// Block 2: Always serve categories from the database
export const getWoohooCategories = async (req, res) => {
    try {
        const categories = await WoohooCategory.findAll();
        // No need to parse images or subcategories, they are already objects
        const parsedCategories = categories.map(cat => ({
            ...cat.toJSON()
        }));
        //console.log('Categories fetched from DB:', parsedCategories.length);
        res.json(parsedCategories);
    } catch (error) {
        console.error('Error fetching categories from database:', error);
        res.status(500).json({
            error: 'Failed to fetch categories from database',
            details: error.message
        });
    }
};