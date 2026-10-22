const mongoose = require("mongoose");
const Product = require("../models/Product");

class ShoppingInputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ShoppingInputError";
    this.status = status;
  }
}

function productIdFrom(item) {
  if (!item || typeof item !== "object") return "";
  const raw = item.productId || item.product || item.id;
  if (raw && typeof raw === "object") return String(raw._id || raw.id || "");
  return typeof raw === "string" ? raw : "";
}

async function buildCartItems(inputItems) {
  if (!Array.isArray(inputItems) || inputItems.length > 100) {
    throw new ShoppingInputError("Cart must contain an array of up to 100 items.");
  }

  const normalized = inputItems.map((item) => {
    const productId = productIdFrom(item);
    const quantity = Number(item?.quantity);
    const selectedSize = typeof item?.selectedSize === "string" ? item.selectedSize.trim() : "";
    const selectedColor = typeof item?.selectedColor === "string" ? item.selectedColor.trim() : "";

    if (!mongoose.isValidObjectId(productId)) {
      throw new ShoppingInputError("A cart item contains an invalid product reference.");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new ShoppingInputError("Each cart quantity must be a whole number from 1 to 20.");
    }
    if (selectedSize.length > 30 || selectedColor.length > 80) {
      throw new ShoppingInputError("A selected product option is too long.");
    }
    return { productId, quantity, selectedSize, selectedColor };
  });

  const products = await Product.find({ _id: { $in: [...new Set(normalized.map((item) => item.productId))] } });
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  for (const item of normalized) {
    const product = productMap.get(item.productId);
    if (!product) throw new ShoppingInputError("One of the selected products no longer exists.", 404);
    if (item.quantity > product.stock) {
      throw new ShoppingInputError(`Not enough stock available for ${product.name}.`, 409);
    }
    if (item.selectedSize && product.sizes.length && !product.sizes.includes(item.selectedSize)) {
      throw new ShoppingInputError(`The selected size is not available for ${product.name}.`);
    }
    if (item.selectedColor && product.colors.length && !product.colors.includes(item.selectedColor)) {
      throw new ShoppingInputError(`The selected color is not available for ${product.name}.`);
    }
  }

  // Merge duplicate product + size + color variants and recheck quantity limits.
  const merged = new Map();
  for (const item of normalized) {
    const key = [item.productId, item.selectedSize, item.selectedColor].join("|");
    const existing = merged.get(key);
    if (existing) existing.quantity += item.quantity;
    else merged.set(key, { ...item });
  }

  const result = [...merged.values()];
  for (const item of result) {
    if (item.quantity > 20) throw new ShoppingInputError("A product variant cannot exceed 20 items in the cart.");
    const product = productMap.get(item.productId);
    if (item.quantity > product.stock) throw new ShoppingInputError(`Not enough stock available for ${product.name}.`, 409);
  }

  return result.map((item) => ({
    product: new mongoose.Types.ObjectId(item.productId),
    quantity: item.quantity,
    selectedSize: item.selectedSize,
    selectedColor: item.selectedColor,
  }));
}

function toClientCartItems(cart) {
  if (!cart) return [];
  return cart.items
    .filter((item) => item.product)
    .map((item) => {
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
        selectedSize: item.selectedSize || "",
        selectedColor: item.selectedColor || "",
        quantity: item.quantity,
      };
    });
}

module.exports = { ShoppingInputError, productIdFrom, buildCartItems, toClientCartItems };
