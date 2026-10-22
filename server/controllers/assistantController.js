const Product = require("../models/Product");

const CATEGORY_TERMS = [
  { category: "Bags", terms: ["bag", "bags", "handbag", "handbags", "tote", "carryall"] },
  { category: "Clothing", terms: ["clothing", "clothes", "shirt", "shirts", "tee", "tees", "tshirt", "top", "tops", "trouser", "trousers", "pants", "overshirt", "linen"] },
  { category: "Essentials", terms: ["essential", "essentials"] },
];
const COLOR_TERMS = [
  { color: "black", terms: ["black", "jet black"] },
  { color: "white", terms: ["white", "off white", "ivory", "cream"] },
  { color: "brown", terms: ["brown", "tan", "chocolate"] },
  { color: "beige", terms: ["beige", "sand", "taupe"] },
  { color: "blue", terms: ["blue", "navy"] },
  { color: "green", terms: ["green", "olive"] },
  { color: "grey", terms: ["grey", "gray", "stone"] },
];
const MATERIAL_TERMS = ["linen", "cotton", "leather", "modal", "wool", "silk", "denim"];

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function hasTerm(text, terms) {
  return terms.some((term) => new RegExp(`(^|[^a-z])${escapeRegExp(term)}([^a-z]|$)`, "i").test(text));
}
function extractBudget(message) {
  const patterns = [
    /(?:under|below|less than|max(?:imum)?(?: of)?|within|up to)\s*\$?\s*(\d+(?:\.\d+)?)/i,
    /\$\s*(\d+(?:\.\d+)?)\s*(?:or less|max(?:imum)?)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}
function productText(product) {
  return normalize([
    product.name, product.category, product.description, product.material,
    ...(product.colors || []), ...(product.sizes || []), ...(product.details || []),
  ].join(" "));
}
function findRequestedCategory(message) {
  return CATEGORY_TERMS.find((item) => hasTerm(message, item.terms))?.category || null;
}
function findRequestedColor(message) {
  return COLOR_TERMS.find((item) => item.terms.some((term) => message.includes(term)))?.color || null;
}
function isMatchingColor(product, color) {
  if (!color) return true;
  const actualColors = normalize((product.colors || []).join(" "));
  const actualText = productText(product);
  const aliases = {
    black: ["black", "#171717", "#0b0b0b"],
    white: ["white", "off white", "ivory", "cream", "#ffffff", "#f4f0e8"],
    brown: ["brown", "tan", "chocolate", "#7d5d48", "#8d6b50"],
    beige: ["beige", "sand", "taupe", "#b9aa96", "#d8cdbb"],
    blue: ["blue", "navy"],
    green: ["green", "olive", "#638268"],
    grey: ["grey", "gray", "stone", "#a7a8a4", "#c8c0b5"],
  };
  return (aliases[color] || [color]).some((alias) => actualColors.includes(alias) || actualText.includes(alias));
}
function buildReply(products, criteria, message) {
  const filters = [];
  if (criteria.category) filters.push(criteria.category.toLowerCase());
  if (criteria.color) filters.push(criteria.color);
  if (criteria.maxPrice !== null) filters.push(`up to $${criteria.maxPrice}`);
  if (criteria.inStock) filters.push("currently in stock");

  if (hasTerm(normalize(message), ["hello", "hi", "hey", "salam", "assalam"])) {
    return "Hello, and welcome to SAELYN. I can help you explore bags, clothing, colors, materials, and prices. Try asking for a category or a budget.";
  }
  if (products.length) {
    const context = filters.length ? ` matching ${filters.join(", ")}` : "";
    return `I found ${products.length} ${products.length === 1 ? "option" : "options"}${context} in SAELYN's current catalog. ${products[0].name} is one place to start. Select a piece to see its available options and latest details.`;
  }
  if (criteria.maxPrice !== null || criteria.category || criteria.color || criteria.inStock || criteria.material) {
    return "I couldn't find a current in-stock catalog item matching every part of that request. Try a wider budget, another color, or remove one filter and I'll look again.";
  }
  return "I can help search SAELYN's current catalog by category, color, material, stock, and budget. For example, try “black clothing under $100” or “show bags in stock”.";
}

async function chat(req, res) {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ success: false, message: "Please enter a message." });
  if (message.length > 300) return res.status(400).json({ success: false, message: "Please keep your message under 300 characters." });

  try {
    const normalizedMessage = normalize(message);
    const category = findRequestedCategory(normalizedMessage);
    const color = findRequestedColor(normalizedMessage);
    const maxPrice = extractBudget(message);
    const inStock = hasTerm(normalizedMessage, ["in stock", "available", "ready to ship"]);
    const outOfStock = hasTerm(normalizedMessage, ["out of stock", "sold out", "unavailable"]);
    const sortLowPrice = hasTerm(normalizedMessage, ["cheapest", "cheaper", "lowest price", "budget"]);
    const material = MATERIAL_TERMS.find((term) => hasTerm(normalizedMessage, [term])) || null;
    const query = {};
    if (category) query.category = category;
    if (maxPrice !== null) query.price = { $lte: maxPrice };
    if (inStock || !outOfStock) query.stock = { $gt: 0 };
    else query.stock = 0;

    const catalog = await Product.find(query)
      .sort(sortLowPrice ? { price: 1 } : { featured: -1, createdAt: -1 })
      .limit(100)
      .lean();

    let matches = catalog.filter((product) => isMatchingColor(product, color));
    if (material) matches = matches.filter((product) => productText(product).includes(material));
    matches = matches.slice(0, 3).map((product) => ({
      id: String(product._id),
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      colors: product.colors || [],
      sizes: product.sizes || [],
      material: product.material || "",
      stock: product.stock,
      description: product.description || "",
    }));

    const reply = buildReply(matches, { category, color, maxPrice, inStock, material }, message);
    return res.status(200).json({ success: true, mode: "catalog", reply, products: matches });
  } catch (error) {
    console.error("Shopping assistant catalog error:", error.message);
    return res.status(500).json({ success: false, message: "Shopping assistant is temporarily unavailable. Please try again." });
  }
}

module.exports = { chat };
