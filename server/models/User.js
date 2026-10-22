const mongoose = require("mongoose");


// =========================
// ADDRESS SCHEMA
// =========================

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: "Home",
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    apartment: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      default: "Pakistan",
    },
  },
  {
    _id: true,
  }
);


// =========================
// USER SCHEMA
// =========================

const userSchema = new mongoose.Schema(
  {
    // =========================
    // NAME
    // =========================

    name: {
      type: String,
      required: true,
      trim: true,
    },


    // =========================
    // EMAIL
    // =========================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },


    // =========================
    // PASSWORD
    // =========================

    passwordHash: {
      type: String,
      required: true,
    },


    // =========================
    // PHONE
    // =========================

    phone: {
      type: String,
      trim: true,
      default: "",
    },


    // =========================
    // ROLE
    // =========================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },


    // =========================
    // ADDRESSES
    // =========================

    addresses: {
      type: [addressSchema],
      default: [],
    },


    // =========================
    // ACCOUNT STATUS
    // =========================

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


const User = mongoose.model(
  "User",
  userSchema
);

module.exports = User;