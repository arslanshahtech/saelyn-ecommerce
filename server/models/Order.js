const mongoose = require("mongoose");


// =========================
// ORDER ITEM SCHEMA
// =========================
// Order ke andar har purchased product ka snapshot
// store hoga.

const orderItemSchema = new mongoose.Schema(
  {
    // Original product ka reference
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Order ke waqt product ka naam
    // taake baad mein product change/delete hone
    // par purana order phir bhi correct rahe.
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Order ke waqt ki price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    image: {
      type: String,
      required: true,
      trim: true,
    },

    selectedSize: {
      type: String,
      default: "",
      trim: true,
    },

    selectedColor: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Order item quantity must be a whole number.",
      },
    },
  },
  {
    _id: true,
  }
);


// =========================
// CUSTOMER SCHEMA
// =========================
// Guest checkout ke liye bhi customer
// information order ke andar store hogi.

const customerSchema = new mongoose.Schema(
  {
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

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address."],
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);


// =========================
// SHIPPING ADDRESS SCHEMA
// =========================

const shippingAddressSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },

    apartment: {
      type: String,
      default: "",
      trim: true,
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
    },
  },
  {
    _id: false,
  }
);


// =========================
// ORDER SCHEMA
// =========================

const orderSchema = new mongoose.Schema(
  {
    // =========================
    // USER
    // =========================
    // Guest checkout mein null ho sakta hai.
    // Login ke baad actual user ID yahan store hogi.

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },


    // =========================
    // ORDER NUMBER
    // =========================

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },


    // =========================
    // CUSTOMER
    // =========================

    customer: {
      type: customerSchema,
      required: true,
    },


    // =========================
    // SHIPPING ADDRESS
    // =========================

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },


    // =========================
    // ORDER ITEMS
    // =========================

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item.",
      },
    },


    // =========================
    // SHIPPING METHOD
    // =========================

    shippingMethod: {
      type: String,
      enum: [
        "standard",
        "express",
      ],
      default: "standard",
    },


    // =========================
    // PAYMENT METHOD
    // =========================

    paymentMethod: {
      type: String,
      enum: [
        "cod",
        "card",
      ],
      default: "cod",
    },


    // =========================
    // PAYMENT STATUS
    // =========================

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
    },


    // =========================
    // ORDER STATUS
    // =========================

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },


    // =========================
    // SUBTOTAL
    // =========================

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },


    // =========================
    // SHIPPING COST
    // =========================

    shippingCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },


    // =========================
    // FINAL TOTAL
    // =========================

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);


// Keep stored totals consistent with the immutable item price snapshots.
orderSchema.pre("validate", function validateOrderTotals() {
  if (Array.isArray(this.items) && this.items.length > 0) {
    const calculatedSubtotal = Math.round(
      this.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
    ) / 100;
    const storedSubtotal = Math.round(Number(this.subtotal) * 100) / 100;

    if (Number.isFinite(storedSubtotal) && storedSubtotal !== calculatedSubtotal) {
      this.invalidate("subtotal", "Subtotal must equal the sum of item price multiplied by quantity.");
    }

    const calculatedTotal = Math.round((storedSubtotal + Number(this.shippingCost || 0)) * 100) / 100;
    const storedTotal = Math.round(Number(this.total) * 100) / 100;

    if (Number.isFinite(storedTotal) && storedTotal !== calculatedTotal) {
      this.invalidate("total", "Total must equal subtotal plus shipping cost.");
    }
  }
});

const Order = mongoose.model(
  "Order",
  orderSchema
);


module.exports = Order;