// controllers/customerController.js
import {sequelize} from "../config/db.js"; // Import sequelize

// Fetch customer details
export const getCustomerDetails = async (req, res) => {
  try {
    // Query to fetch all necessary columns, including phone_number, created_at, and updated_at
    const [customers] = await sequelize.query(
      "SELECT id, name, email, phone FROM users"
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: "No customers found" });
    }

    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    console.error("Error fetching customer details:", error.message); // Log the error message
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message, // Include error message for debugging
    });
  }
};
