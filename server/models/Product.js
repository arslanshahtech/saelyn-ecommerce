const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // =========================
    // PRODUCT NAME
    // =========================

    name: {
      type: String,
      required: true,
      trim: true,
    },


    // =========================
    // PRICE
    // =========================

    price: {
      type: Number,
      required: true,
      min: 0,
    },


    // =========================
    // PRODUCT IMAGE
    // =========================

    image: {
      type: String,
      required: true,
      trim: true,
    },


    // =========================
    // CATEGORY
    // =========================

    category: {
      type: String,
      required: true,
      enum: [
        "Clothing",
        "Bags",
        "Essentials",
      ],
    },

    // Homepage merchandising collection, separate from product category.
    merchandisingCollection: {
      type: String,
      enum: ["new-in", "essentials"],
      default: "new-in",
    },


    // =========================
    // COLORS
    // =========================

    colors: {
      type: [String],
      default: [],
    },


    // =========================
    // SIZES
    // =========================

    sizes: {
      type: [String],
      default: [],
    },


    // =========================
    // DESCRIPTION
    // =========================

    description: {
      type: String,
      required: true,
      trim: true,
    },


    // =========================
    // MATERIAL
    // =========================

    material: {
      type: String,
      required: true,
      trim: true,
    },


    // =========================
    // PRODUCT DETAILS
    // =========================

    details: {
      type: [String],
      default: [],
    },


    // =========================
    // STOCK
    // =========================

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },


    // =========================
    // FEATURED
    // =========================

    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


const Product = mongoose.model(
  "Product",
  productSchema
);

module.exports = Product;