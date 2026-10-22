const express = require("express");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");


const router = express.Router();


// =========================
// PRODUCT ROUTES
// =========================

// GET all products
router.get(
  "/",
  getProducts
);


// GET single product
router.get(
  "/:id",
  getProductById
);


// CREATE product
router.post(
  "/",
  createProduct
);


// UPDATE product
router.put(
  "/:id",
  updateProduct
);


// DELETE product
router.delete(
  "/:id",
  deleteProduct
);


module.exports = router;