const mongoose = require("mongoose");
const Product = require("../models/Product");
const Wishlist = require("../models/Wishlist");

function getProductIds(items) {
  if (!Array.isArray(items) || items.length > 200) {
    const error = new Error("Wishlist must contain an array of up to 200 products.");
    error.status = 400;
    throw error;
  }
  const ids = items.map((item) => {
    const raw = typeof item === "string" ? item : item?.productId || item?.id || item?.product?._id || item?.product;
    return raw && typeof raw === "object" ? String(raw._id || raw.id || "") : String(raw || "");
  });
  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    const error = new Error("Wishlist contains an invalid product reference.");
    error.status = 400;
    throw error;
  }
  return [...new Set(ids)];
}

async function populateWishlist(userId, ids) {
  const products = ids.length ? await Product.find({ _id: { $in: ids } }) : [];
  const foundIds = new Set(products.map((product) => String(product._id)));
  if (foundIds.size !== ids.length) {
    const error = new Error("One of the wishlist products no longer exists.");
    error.status = 404;
    throw error;
  }
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $set: { items: ids.map((product) => ({ product })) } },
    { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate("items.product");

  return wishlist.items.filter((item) => item.product).map((item) => {
    const product = item.product;
    return {
      id: String(product._id),
      _id: String(product._id),
      name: product.name,
      price: `$${Number(product.price)}`,
      numericPrice: Number(product.price),
      image: product.image,
      category: product.category,
      colors: product.colors || [],
      sizes: product.sizes || [],
      description: product.description || "",
      material: product.material || "",
    };
  });
}

async function getWishlist(req, res, next) {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate("items.product");
    const items = wishlist ? wishlist.items.filter((item) => item.product).map(({ product }) => ({
      id: String(product._id),
      _id: String(product._id),
      name: product.name,
      price: `$${Number(product.price)}`,
      numericPrice: Number(product.price),
      image: product.image,
      category: product.category,
      colors: product.colors || [],
      sizes: product.sizes || [],
      description: product.description || "",
      material: product.material || "",
    })) : [];
    return res.json({ success: true, items });
  } catch (error) { next(error); }
}

async function replaceWishlist(req, res, next) {
  try {
    const ids = getProductIds(req.body?.items);
    const items = await populateWishlist(req.user._id, ids);
    return res.json({ success: true, message: "Wishlist saved.", items });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
}

async function syncWishlist(req, res, next) {
  try {
    const guestIds = getProductIds(req.body?.items);
    const existing = await Wishlist.findOne({ user: req.user._id }).lean();
    const existingIds = (existing?.items || []).map((item) => String(item.product));
    const ids = [...new Set([...existingIds, ...guestIds])];
    const items = await populateWishlist(req.user._id, ids);
    return res.json({ success: true, message: "Guest wishlist merged with your account wishlist.", items });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
}

module.exports = { getWishlist, replaceWishlist, syncWishlist };
