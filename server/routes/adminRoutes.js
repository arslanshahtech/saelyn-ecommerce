const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  getDashboardOverview, listProducts, createProduct, updateProduct, deleteProduct,
  listOrders, updateOrderStatus, listCustomers, updateCustomerStatus, getStoreSettings, updateStoreSettings,
} = require("../controllers/adminController");

const router = express.Router();
router.use(requireAuth, requireAdmin);
router.get("/overview", getDashboardOverview);
router.get("/products", listProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.get("/orders", listOrders);
router.patch("/orders/:id/status", updateOrderStatus);
router.get("/customers", listCustomers);
router.patch("/customers/:id/status", updateCustomerStatus);
router.get("/settings", getStoreSettings);
router.put("/settings", updateStoreSettings);
module.exports = router;
