const mongoose = require("mongoose");

// Cart mein product reference aur selected variant store hota hai.
// Product ki current price Product model se read honi chahiye;
// client se aayi hui price ko final checkout total na samjhein.
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
      validate: {
        validator: Number.isInteger,
        message: "Cart quantity must be a whole number.",
      },
    },
    selectedSize: {
      type: String,
      trim: true,
      default: "",
    },
    selectedColor: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Cart", cartSchema);
