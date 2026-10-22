const Product = require("../models/Product");


// ==================================================
// GET ALL PRODUCTS
// GET /api/products
// ==================================================

const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      color,
      size,
      material,
      sort,
    } = req.query;


    // =========================
    // BUILD QUERY
    // =========================

    const query = {};


    // =========================
    // SEARCH
    // =========================

    if (search && search.trim()) {
      query.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          category: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }


    // =========================
    // CATEGORY
    // =========================

    if (category && category !== "All") {
      query.category = category;
    }


    // =========================
    // PRICE RANGE
    // =========================

    if (minPrice || maxPrice) {
      query.price = {};

      if (minPrice !== undefined && minPrice !== "") {
        query.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined && maxPrice !== "") {
        query.price.$lte = Number(maxPrice);
      }
    }


    // =========================
    // COLOR
    // =========================

    if (color) {
      const colors = Array.isArray(color) ? color : [color];
      query.colors = { $in: colors };
    }


    // =========================
    // SIZE
    // =========================

    if (size) {
      const sizes = Array.isArray(size) ? size : [size];
      query.sizes = { $in: sizes };
    }


    // =========================
    // MATERIAL
    // =========================

    if (material) {
      const materials = Array.isArray(material) ? material : [material];
      query.$and = [
        ...(query.$and || []),
        { $or: materials.map((value) => ({ material: { $regex: value, $options: "i" } })) },
      ];
    }


    // =========================
    // SORT
    // =========================

    let sortOption = {};

    if (sort === "price-low") {
      sortOption = { price: 1 };
    } else if (sort === "price-high") {
      sortOption = { price: -1 };
    } else if (sort === "newest") {
      sortOption = { createdAt: -1 };
    } else {
      // Featured/default
      sortOption = {
        featured: -1,
        createdAt: -1,
      };
    }


    // =========================
    // DATABASE QUERY
    // =========================

    const products = await Product.find(query)
      .sort(sortOption);


    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });

  } catch (error) {

    console.error(
      "Get products error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
    });
  }
};


// ==================================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// ==================================================

const getProductById = async (req, res) => {
  try {

    const product =
      await Product.findById(req.params.id);


    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }


    res.status(200).json({
      success: true,
      product,
    });

  } catch (error) {

    console.error(
      "Get product error:",
      error.message
    );

    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid product ID." : "Failed to fetch product.",
    });
  }
};


// ==================================================
// CREATE PRODUCT
// POST /api/products
// ==================================================

const createProduct = async (req, res) => {
  try {

    const product = await Product.create(
      req.body
    );


    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });

  } catch (error) {

    console.error(
      "Create product error:",
      error.message
    );

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// ==================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// ==================================================

const updateProduct = async (req, res) => {
  try {

    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );


    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }


    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });

  } catch (error) {

    console.error(
      "Update product error:",
      error.message
    );

    res.status(error.name === "CastError" ? 400 : 400).json({
      success: false,
      message: error.name === "CastError" ? "Invalid product ID." : error.message,
    });
  }
};


// ==================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// ==================================================

const deleteProduct = async (req, res) => {
  try {

    const product =
      await Product.findByIdAndDelete(
        req.params.id
      );


    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }


    res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });

  } catch (error) {

    console.error(
      "Delete product error:",
      error.message
    );

    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid product ID." : "Failed to delete product.",
    });
  }
};


// ==================================================
// EXPORT
// ==================================================

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};