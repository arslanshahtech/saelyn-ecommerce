const Product = require("../models/Product");

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MAX_FILTER_VALUES = 20;

function normalizeFilterValues(value, label) {
  const values = Array.isArray(value) ? value : [value];
  if (values.length > MAX_FILTER_VALUES || values.some((item) => typeof item !== "string" || item.length > 80)) {
    const error = new Error(`${label} filter is invalid.`);
    error.status = 400;
    throw error;
  }
  return values.filter((item) => item.trim()).map((item) => item.trim());
}

// Search helpers: case-insensitive, singular/plural aware, and tolerant of
// small typos such as "shrt" -> "shirt". Keep this server-side so the Search
// Overlay and the full Shop page use the same behavior.
const normalizeSearchToken = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const levenshteinDistance = (left, right) => {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  // Treat one adjacent-letter swap (for example "shrit") as a single typo.
  if (left.length === right.length) {
    const mismatches = [];
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) mismatches.push(index);
    }
    if (
      mismatches.length === 2 &&
      mismatches[1] === mismatches[0] + 1 &&
      left[mismatches[0]] === right[mismatches[1]] &&
      left[mismatches[1]] === right[mismatches[0]]
    ) return 1;
  }

  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previousDiagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const previous = row[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previousDiagonal + cost);
      previousDiagonal = previous;
    }
  }
  return row[right.length];
};

const singularize = (token) => {
  if (token.length > 4 && token.endsWith("ies")) return token.slice(0, -3) + "y";
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
};

const canonicalSearchToken = (rawToken) => {
  const token = singularize(normalizeSearchToken(rawToken));
  // Common clothing terms should also find equivalent catalog terms.
  const knownTerms = ["shirt", "bag", "essential", "tee", "top"];
  return knownTerms.find((term) =>
    token === term || (token.length >= 4 && levenshteinDistance(token, term) <= 1)
  ) || token;
};

const searchAliases = {
  shirt: ["shirt", "shirts", "overshirt", "tee", "tees", "tshirt", "top", "tops"],
  bag: ["bag", "bags", "carryall", "tote"],
  essential: ["essential", "essentials"],
};

const getSearchScore = (product, search) => {
  // The Essentials quick-search chip means the actual Essentials category,
  // not any item whose description happens to mention "essentials".
  if (String(search || "").trim().toLowerCase() === "essentials") {
    return String(product.category || "").toLowerCase() === "essentials" ? 100 : 0;
  }

  const queryTokens = String(search || "")
    .trim()
    .split(/\s+/)
    .map(canonicalSearchToken)
    .filter(Boolean);
  if (!queryTokens.length) return 1;

  const fields = [
    product.name,
    product.category,
    product.description,
    product.material,
    ...(product.details || []),
  ].map((value) => String(value || "").toLowerCase());
  const searchableText = fields.join(" ");
  const productTokens = searchableText
    .split(/[^a-z0-9]+/)
    .map((token) => singularize(normalizeSearchToken(token)))
    .filter(Boolean);

  let score = 0;
  for (const token of queryTokens) {
    const aliases = searchAliases[token] || [token];
    let tokenScore = 0;

    for (const alias of aliases) {
      if (product.name.toLowerCase().includes(alias)) tokenScore = Math.max(tokenScore, 10);
      else if (productTokens.includes(singularize(alias))) tokenScore = Math.max(tokenScore, 8);
      else if (productTokens.some((word) =>
        word.length >= 4 && alias.length >= 4 && levenshteinDistance(word, alias) <= 1
      )) tokenScore = Math.max(tokenScore, 5);
      else if (fields.some((field) => field.includes(alias))) tokenScore = Math.max(tokenScore, 3);
    }

    if (!tokenScore) return 0;
    score += tokenScore;
  }

  // Exact phrase/name matches rank above broad related-term matches.
  const normalizedQuery = String(search).trim().toLowerCase();
  if (product.name.toLowerCase().includes(normalizedQuery)) score += 20;
  if (product.category.toLowerCase() === normalizedQuery) score += 15;
  return score;
};


// ==================================================
// GET ALL PRODUCTS
// GET /api/products
// ==================================================

const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      collection,
      minPrice,
      maxPrice,
      color,
      size,
      material,
      sort,
    } = req.query;


    // =========================
    // BUILD QUERY
    // =========================

    const query = {};


    // Search is scored after applying the other filters so we can support
    // related terms and small spelling mistakes without unsafe regex input.
    const normalizedSearch = typeof search === "string" ? search.trim().slice(0, 120) : "";
    if (search !== undefined && typeof search !== "string") {
      return res.status(400).json({ success: false, message: "Search query must be a string." });
    }

    const parsedMinPrice = minPrice === undefined || minPrice === "" ? undefined : Number(minPrice);
    const parsedMaxPrice = maxPrice === undefined || maxPrice === "" ? undefined : Number(maxPrice);
    if (
      (parsedMinPrice !== undefined && (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0)) ||
      (parsedMaxPrice !== undefined && (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0)) ||
      (parsedMinPrice !== undefined && parsedMaxPrice !== undefined && parsedMinPrice > parsedMaxPrice)
    ) {
      return res.status(400).json({ success: false, message: "Please provide a valid price range." });
    }


    // =========================
    // CATEGORY
    // =========================

    if (category && category !== "All") {
      query.category = category;
    }

    if (collection === "new-in" || collection === "essentials") {
      query.merchandisingCollection = collection;
    }


    // =========================
    // PRICE RANGE
    // =========================

    if (minPrice || maxPrice) {
      query.price = {};

      if (parsedMinPrice !== undefined) query.price.$gte = parsedMinPrice;
      if (parsedMaxPrice !== undefined) query.price.$lte = parsedMaxPrice;
    }


    // =========================
    // COLOR
    // =========================

    if (color) {
      const colors = normalizeFilterValues(color, "Color");
      if (colors.length) query.colors = { $in: colors };
    }


    // =========================
    // SIZE
    // =========================

    if (size) {
      const sizes = normalizeFilterValues(size, "Size");
      if (sizes.length) query.sizes = { $in: sizes };
    }


    // =========================
    // MATERIAL
    // =========================

    if (material) {
      const materials = normalizeFilterValues(material, "Material");
      if (materials.length) {
        query.$and = [
          ...(query.$and || []),
          { $or: materials.map((value) => ({ material: { $regex: escapeRegex(value), $options: "i" } })) },
        ];
      }
    }


    // =========================
    // SORT
    // =========================

    let sortOption = {};

    if (sort === "price-low") {
      sortOption = { price: 1 };
    } else if (sort === "price-high") {
      sortOption = { price: -1 };
    } else if (sort === "newest") {
      sortOption = { createdAt: -1 };
    } else {
      // Featured/default
      sortOption = {
        featured: -1,
        createdAt: -1,
      };
    }


    // =========================
    // DATABASE QUERY
    // =========================

    let products = await Product.find(query).sort(sortOption);

    if (normalizedSearch) {
      products = products
        .map((product, index) => ({
          product,
          index,
          score: getSearchScore(product, normalizedSearch),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => {
          // Keep the user's explicit price/newest sort; otherwise rank by relevance.
          if (sort === "price-low" || sort === "price-high" || sort === "newest") {
            return a.index - b.index;
          }
          return b.score - a.score || a.index - b.index;
        })
        .map((item) => item.product);
    }


    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });

  } catch (error) {

    console.error(
      "Get products error:",
      error.message
    );

    res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Failed to fetch products.",
    });
  }
};


// ==================================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// ==================================================

const getProductById = async (req, res) => {
  try {

    const product =
      await Product.findById(req.params.id);


    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }


    res.status(200).json({
      success: true,
      product,
    });

  } catch (error) {

    console.error(
      "Get product error:",
      error.message
    );

    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid product ID." : "Failed to fetch product.",
    });
  }
};


// ==================================================
// CREATE PRODUCT
// POST /api/products
// ==================================================

const createProduct = async (req, res) => {
  try {

    const product = await Product.create(
      req.body
    );


    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });

  } catch (error) {

    console.error(
      "Create product error:",
      error.message
    );

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// ==================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// ==================================================

const updateProduct = async (req, res) => {
  try {

    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          returnDocument: "after",
          runValidators: true,
        }
      );


    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }


    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });

  } catch (error) {

    console.error(
      "Update product error:",
      error.message
    );

    res.status(error.name === "CastError" ? 400 : 400).json({
      success: false,
      message: error.name === "CastError" ? "Invalid product ID." : error.message,
    });
  }
};


// ==================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// ==================================================

const deleteProduct = async (req, res) => {
  try {

    const product =
      await Product.findByIdAndDelete(
        req.params.id
      );


    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }


    res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });

  } catch (error) {

    console.error(
      "Delete product error:",
      error.message
    );

    res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid product ID." : "Failed to delete product.",
    });
  }
};


// ==================================================
// EXPORT
// ==================================================

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};