const express = require("express");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Product browsing remains public.
router.get("/", getProducts);
router.get("/:id", getProductById);

// Only authenticated administrators may modify the catalog.
router.post("/", requireAuth, requireAdmin, createProduct);
router.put("/:id", requireAuth, requireAdmin, updateProduct);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

module.exports = router;
