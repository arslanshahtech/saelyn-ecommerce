const { randomBytes } = require("node:crypto");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

class OrderInputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function requiredText(value, label, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new OrderInputError(`${label} is required and must be valid.`);
  }
  return value.trim();
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function createOrder(req, res, next) {
  const stockChanges = [];
  let orderCreated = false;

  try {
    const body = req.body || {};
    const customerInput = body.customer || {};
    const addressInput = body.shippingAddress || {};
    const itemsInput = body.items;

    const firstName = requiredText(customerInput.firstName, "First name", 80);
    const lastName = requiredText(customerInput.lastName, "Last name", 80);
    const email = requiredText(customerInput.email || req.user.email, "Email", 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OrderInputError("Please provide a valid contact email.");
    const phone = requiredText(customerInput.phone || req.user.phone, "Phone", 30);
    const address = requiredText(addressInput.address, "Shipping address", 200);
    const apartment = typeof addressInput.apartment === "string" ? addressInput.apartment.trim().slice(0, 100) : "";
    const city = requiredText(addressInput.city, "City", 100);
    const postalCode = requiredText(addressInput.postalCode, "Postal code", 30);
    const country = requiredText(addressInput.country, "Country", 100);

    const shippingMethod = body.shippingMethod || "standard";
    if (!["standard", "express"].includes(shippingMethod)) throw new OrderInputError("Select a valid shipping method.");
    const paymentMethod = body.paymentMethod || "cod";
    // Do not pretend a card payment is complete without a configured payment provider.
    if (paymentMethod !== "cod") throw new OrderInputError("Online card payment is not configured yet. Please choose Cash on Delivery.");

    if (!Array.isArray(itemsInput) || itemsInput.length === 0 || itemsInput.length > 100) {
      throw new OrderInputError("Your order must contain between 1 and 100 items.");
    }

    const requestedItems = itemsInput.map((item) => {
      const productId = String(item?.productId || item?.id || "");
      const quantity = Number(item?.quantity);
      const selectedSize = typeof item?.selectedSize === "string" ? item.selectedSize.trim() : "";
      const selectedColor = typeof item?.selectedColor === "string" ? item.selectedColor.trim() : "";
      if (!mongoose.isValidObjectId(productId)) throw new OrderInputError("An order item has an invalid product reference.");
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new OrderInputError("Each quantity must be a whole number from 1 to 20.");
      return { productId, quantity, selectedSize, selectedColor };
    });

    const productIds = [...new Set(requestedItems.map((item) => item.productId))];
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [String(product._id), product]));
    for (const item of requestedItems) {
      const product = productMap.get(item.productId);
      if (!product) throw new OrderInputError("One of the selected products is no longer available.", 404);
      if (item.selectedSize && product.sizes.length && !product.sizes.includes(item.selectedSize)) {
        throw new OrderInputError(`Selected size is unavailable for ${product.name}.`);
      }
      if (item.selectedColor && product.colors.length && !product.colors.includes(item.selectedColor)) {
        throw new OrderInputError(`Selected color is unavailable for ${product.name}.`);
      }
    }

    const totalByProduct = new Map();
    for (const item of requestedItems) {
      totalByProduct.set(item.productId, (totalByProduct.get(item.productId) || 0) + item.quantity);
    }
    for (const [productId, quantity] of totalByProduct) {
      const product = productMap.get(productId);
      if (quantity > product.stock) throw new OrderInputError(`Not enough stock for ${product.name}. Please update your cart.`, 409);
    }

    const orderItems = requestedItems.map((item) => {
      const product = productMap.get(item.productId);
      return {
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        quantity: item.quantity,
      };
    });
    const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const shippingCost = shippingMethod === "express" ? 15 : 0;
    const total = roundMoney(subtotal + shippingCost);
    const orderNumber = `SAE-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    // Atomic stock decrements prevent two simultaneous orders overselling the same stock.
    for (const [productId, quantity] of totalByProduct) {
      const updated = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { returnDocument: "after" }
      );
      if (!updated) throw new OrderInputError("Stock changed while checking out. Please refresh your cart and try again.", 409);
      stockChanges.push({ productId, quantity });
    }

    const order = await Order.create({
      user: req.user._id,
      orderNumber,
      customer: { firstName, lastName, email, phone },
      shippingAddress: { address, apartment, city, postalCode, country },
      items: orderItems,
      shippingMethod,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "confirmed",
      subtotal,
      shippingCost,
      total,
    });
    orderCreated = true;

    return res.status(201).json({
      success: true,
      message: "Your order has been placed.",
      order: {
        id: String(order._id),
        orderNumber: order.orderNumber,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        items: order.items.map((item) => ({
          id: String(item.product),
          name: item.name,
          price: item.price,
          image: item.image,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
        })),
        shippingMethod: order.shippingMethod,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        total: order.total,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    if (!orderCreated && stockChanges.length) {
      await Promise.all(stockChanges.map(({ productId, quantity }) =>
        Product.updateOne({ _id: productId }, { $inc: { stock: quantity } }).catch(() => {})
      ));
    }
    if (error instanceof OrderInputError) return res.status(error.status).json({ success: false, message: error.message });
    if (error && error.name === "ValidationError") return res.status(400).json({ success: false, message: "Order details are incomplete or invalid." });
    next(error);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();
    return res.json({ success: true, orders });
  } catch (error) { next(error); }
}

module.exports = { createOrder, getMyOrders };
