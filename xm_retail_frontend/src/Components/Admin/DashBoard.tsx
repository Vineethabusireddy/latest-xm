// src/components/DashBoard.tsx
import { FiHome, FiLogOut, FiMenu, FiTag, FiX ,FiUser ,FiFileText} from "react-icons/fi";
import { JSX, useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Admin from "./Admin";
import CardAdmin from "./CardAdmin";
import CustomerDetails from "./CustomerDetails"; 
import {CustomerOrders} from "./CustomerOrders"; 
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
    
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

const buttonVariants = {
  hover: { 
    scale: 1.05,
    transition: { 
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: { 
    scale: 0.95,
    transition: { 
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

const pageTransition = {
  initial: { 
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  animate: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.3
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.2
    }
  }
};

const sidebarVariants = {
  hidden: { 
    x: -300,
    opacity: 0
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20
    }
  },
  exit: {
    x: -300,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

// Replace the sync button variants with a simpler version
const syncButtonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
};

const syncIconVariants = {
  initial: { rotate: 0 },
  loading: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Memoized section components
const MemoizedAdmin = React.memo(Admin);
const MemoizedCardAdmin = React.memo(CardAdmin);
const MemoizedCustomerDetails = React.memo(CustomerDetails);
const MemoizedCustomerOrders = React.memo(CustomerOrders);

// Memoized Sidebar Content Component
const SidebarContent = React.memo(({ 
  activeSection, 
  setActiveSection, 
  setIsSidebarOpen, 
  handleLogout 
}: { 
  activeSection: string;
  setActiveSection: (section: any) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  handleLogout: () => void;
}) => {
  const menuItems = [
    { icon: <FiHome />, label: "Carousel", section: "home" },
    { icon: <FiTag />, label: "Cards", section: "coupons" },
    { icon: <FiFileText />, label: "OrderDetails", section: "orders" },
    { icon: <FiUser />, label: "Customer Details", section: "customerDetails" },
    { icon: <FiTag />, label: "Catalog Data", section: "catalog" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="h-full"
    >
      <motion.h2 
        variants={itemVariants}
        className="text-2xl font-bold mb-8"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        Admin Dashboard
      </motion.h2>
      <motion.ul 
        variants={containerVariants}
        className="space-y-2"
      >
        {menuItems.map((item) => (
          <motion.li
            key={item.section}
            variants={itemVariants}
            whileHover={{ 
              x: 5,
              transition: { type: "spring", stiffness: 400 }
            }}
          >
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => {
                setActiveSection(item.section);
                setIsSidebarOpen(false);
              }}
              className={`flex items-center space-x-3 w-full text-left p-3 rounded-lg transition-all duration-200 ${
                activeSection === item.section
                  ? "bg-gray-700 text-white shadow-md"
                  : "text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              <motion.span 
                className="text-xl"
                whileHover={{ 
                  rotate: 5,
                  scale: 1.1,
                  transition: { type: "spring", stiffness: 400 }
                }}
              >
                {item.icon}
              </motion.span>
              <span className="font-medium">{item.label}</span>
            </motion.button>
          </motion.li>
        ))}
        <motion.li
          variants={itemVariants}
          whileHover={{ 
            x: 5,
            transition: { type: "spring", stiffness: 400 }
          }}
        >
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full text-left p-3 rounded-lg text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200"
          >
            <motion.span 
              className="text-xl"
              whileHover={{ 
                rotate: 5,
                scale: 1.1,
                transition: { type: "spring", stiffness: 400 }
              }}
            >
              <FiLogOut />
            </motion.span>
            <span className="font-medium">Logout</span>
          </motion.button>
        </motion.li>
      </motion.ul>
    </motion.div>
  );
});

// Memoized Sidebar Component
const MemoizedSidebar = React.memo(({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  activeSection, 
  setActiveSection, 
  handleLogout 
}: { 
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeSection: string;
  setActiveSection: (section: any) => void;
  handleLogout: () => void;
}) => (
  <>
    {/* Desktop Sidebar */}
    <motion.div 
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="hidden md:flex flex-col bg-gray-800 text-white w-64 p-5 space-y-4 h-screen fixed top-0 left-0 z-30"
    >
      <SidebarContent 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        setIsSidebarOpen={setIsSidebarOpen}
        handleLogout={handleLogout}
      />
    </motion.div>

    {/* Mobile Sidebar Overlay */}
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 flex md:hidden"
        >
          <motion.div 
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col bg-gray-800 text-white w-64 p-5 space-y-4 h-full z-50"
          >
            <motion.button
              whileHover={{ 
                rotate: 90,
                scale: 1.1,
                transition: { type: "spring", stiffness: 400 }
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarOpen(false)}
              className="text-2xl self-end mb-4 text-gray-400 hover:text-white transition-colors"
            >
              <FiX />
            </motion.button>
            <SidebarContent 
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              setIsSidebarOpen={setIsSidebarOpen}
              handleLogout={handleLogout}
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-black/50 w-full"
            onClick={() => setIsSidebarOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  </>
));

export default function DashBoard(): JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<"home" | "coupons" | "customerDetails"| "orders" | "catalog">("home");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "adminToken" && !e.newValue) {
        navigate("/admin/login");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [navigate]);

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/categories");
      setCategories(res.data);
    } catch (err) {
      setCategories([]);
    }
  };

  // Fetch products for a specific category
  const fetchProducts = async (categoryId: number) => {
    try {
      const res = await axios.get(`http://localhost:4000/api/admin/products/${categoryId}`);
      setProducts(res.data);
    } catch (err) {
      setProducts([]);
    }
  };

  // Sync categories handler
  const handleSyncCategories = async () => {
    setSyncLoading(true);
    setSyncMessage("");
    try {
      await axios.get("http://localhost:4000/api/admin/sync-categories");
      setSyncMessage("Categories sync complete!");
      fetchCategories(); // Refresh categories after sync
    } catch (err) {
      setSyncMessage("Categories sync failed!");
    }
    setSyncLoading(false);
  };

  // Memoize handleLogout
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;
      await fetch(`${apiUrl}/api/admin/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
          "Content-Type": "application/json",
        },
      });

      localStorage.removeItem("adminToken");
      window.dispatchEvent(new Event("storage"));
      navigate("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err);
      localStorage.removeItem("adminToken");
      window.dispatchEvent(new Event("storage"));
      navigate("/admin/login");
    }
  }, [navigate]);

  // Add this function for syncing catalog
  const handleSyncCatalog = async () => {
    setSyncLoading(true);
    setSyncMessage("");
    try {
      await axios.get("http://localhost:4000/api/admin/sync-catalog");
      setSyncMessage("Catalog sync complete!");
    } catch (err) {
      setSyncMessage("Catalog sync failed!");
    }
    setSyncLoading(false);
  };

  // Sync product list handler
  const handleSyncProductList = async () => {
    setSyncLoading(true);
    setSyncMessage("");
    try {
      await axios.get("http://localhost:4000/api/admin/sync-productlist");
      setSyncMessage("Product list sync complete!");
      // Optionally, fetch categories or products again here
    } catch (err) {
      setSyncMessage("Product list sync failed!");
    }
    setSyncLoading(false);
  };

  // Fetch all SKUs from all categories
  const fetchAllSkus = async () => {
    let allSkus: string[] = [];
    for (const cat of categories) {
      try {
        const res = await axios.get(`http://localhost:4000/api/admin/products/${cat.id}`);
        const skus = res.data.map((p: any) => p.sku);
        allSkus = allSkus.concat(skus);
      } catch (err) {
        // handle error if needed
      }
    }
    return allSkus;
  };

  useEffect(() => {
    fetchCategories();
  }, [navigate]);

  // Memoize the active section content
  const activeContent = useMemo(() => {
    switch (activeSection) {
      case "home":
        return <MemoizedAdmin />;
      case "coupons":
        return <MemoizedCardAdmin />;
      case "customerDetails":
        return <MemoizedCustomerDetails />;
      case "orders":
        return <MemoizedCustomerOrders />;
      case "catalog":
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 
              variants={itemVariants}
              className="text-xl font-bold mb-6"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              Catalog Data
            </motion.h2>
            <motion.button
              variants={syncButtonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              onClick={async () => {
                setSyncLoading(true);
                setSyncMessage("");
                try {
                  await axios.get("http://localhost:4000/api/admin/sync-catalog");
                  await axios.get("http://localhost:4000/api/admin/sync-categories");
                  await axios.get("http://localhost:4000/api/admin/sync-productlist");
                  const skusRes = await axios.get("http://localhost:4000/api/admin/product-skus");
                  const allSkus = skusRes.data.skus;
                  if (allSkus && allSkus.length > 0) {
                    await axios.post("http://localhost:4000/api/admin/sync-productdetails", { skus: allSkus });
                  }
                  await axios.post("http://localhost:4000/api/admin/sync-all-related-products");
                  setSyncMessage("All data sync complete!");
                } catch (err) {
                  setSyncMessage("Data sync failed!");
                }
                setSyncLoading(false);
              }}
              className="bg-blue-900 text-white px-4 py-2 rounded shadow hover:bg-blue-800 transition-all duration-200 disabled:opacity-50"
              disabled={syncLoading}
            >
              {syncLoading ? (
                <div className="flex items-center space-x-2">
                  
                  <span>Syncing...</span>
                </div>
              ) : (
                "Sync Data"
              )}
            </motion.button>

            <AnimatePresence>
              {syncMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="mt-4 p-3 rounded bg-green-50 text-green-700"
                >
                  {syncMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              variants={itemVariants}
              className="mt-6"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category
              </label>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                value={selectedCategoryId ?? ""}
                onChange={e => {
                  const id = Number(e.target.value);
                  setSelectedCategoryId(id);
                  fetchProducts(id);
                }}
                className="w-full p-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">-- Select Category --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </motion.select>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              className="mt-6"
            >
              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product, index) => (
                    <motion.div
                      key={product.sku}
                      variants={itemVariants}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        y: -5,
                        transition: { 
                          type: "spring",
                          stiffness: 400,
                          damping: 10
                        }
                      }}
                      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                    >
                      <motion.h3 
                        className="font-semibold text-gray-800"
                        whileHover={{ scale: 1.02 }}
                      >
                        {product.name}
                      </motion.h3>
                      <motion.p 
                        className="text-blue-900 font-medium mt-2"
                        whileHover={{ scale: 1.05 }}
                      >
                        ₹{product.price}
                      </motion.p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                selectedCategoryId && (
                  <motion.div 
                    variants={itemVariants}
                    className="text-center py-8 text-gray-500"
                    whileHover={{ scale: 1.02 }}
                  >
                    No products found for this category.
                  </motion.div>
                )
              )}
            </motion.div>
          </motion.div>
        );
      default:
        return <MemoizedAdmin />;
    }
  }, [activeSection, syncLoading, syncMessage, categories, products, selectedCategoryId]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-screen"
    >
      <MemoizedSidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
      />

      {/* Mobile Menu Button */}
      <motion.button
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-5 left-5 z-50 bg-gray-800 text-white p-2 rounded shadow-lg"
      >
        <FiMenu className="text-xl" />
      </motion.button>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 bg-gray-100 p-5 md:ml-64 overflow-y-auto h-screen"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white rounded-lg shadow-md p-6"
          >
            {activeContent}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

