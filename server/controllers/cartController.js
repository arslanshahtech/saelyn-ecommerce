const Cart = require("../models/Cart");
const {
  ShoppingInputError,
  buildCartItems,
  toClientCartItems,
} = require("../utils/shoppingValidation");

async function getCart(req, res, next) {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    return res.json({ success: true, items: toClientCartItems(cart) });
  } catch (error) { next(error); }
}

async function replaceCart(req, res, next) {
  try {
    const items = await buildCartItems(req.body?.items);
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items } },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate("items.product");
    return res.json({ success: true, message: "Cart saved.", items: toClientCartItems(cart) });
  } catch (error) {
    if (error instanceof ShoppingInputError) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
}

async function syncCart(req, res, next) {
  try {
    if (!Array.isArray(req.body?.items) || req.body.items.length > 100) {
      throw new ShoppingInputError("Guest cart must contain an array of up to 100 items.");
    }
    const existing = await Cart.findOne({ user: req.user._id }).lean();
    const oldItems = (existing?.items || []).map((item) => ({
      productId: String(item.product),
      quantity: item.quantity,
      selectedSize: item.selectedSize || "",
      selectedColor: item.selectedColor || "",
    }));
    const guestItems = req.body.items;
    const items = await buildCartItems([...oldItems, ...guestItems]);
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items } },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate("items.product");
    return res.json({ success: true, message: "Guest cart merged with your account cart.", items: toClientCartItems(cart) });
  } catch (error) {
    if (error instanceof ShoppingInputError) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
}

module.exports = { getCart, replaceCart, syncCart };
