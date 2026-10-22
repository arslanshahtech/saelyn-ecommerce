const mongoose = require("mongoose");

// Wishlist product references rakhti hai; product ki details hamesha
// Product model se populate ki ja sakti hain.
const wishlistItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { _id: true }
);

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [wishlistItemSchema],
      default: [],
      validate: {
        validator(items) {
          const ids = items.map((item) => String(item.product));
          return ids.length === new Set(ids).size;
        },
        message: "A product can only appear once in a wishlist.",
      },
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Wishlist", wishlistSchema);
