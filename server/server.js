const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const storeRoutes = require("./routes/storeRoutes");
const assistantRoutes = require("./routes/assistantRoutes");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("This origin is not allowed by SAELYN API CORS."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({ message: "SAELYN API is running" });
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/assistant", assistantRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error && error.name === "ValidationError") {
    return res.status(400).json({ success: false, message: "Some submitted information is invalid." });
  }
  console.error("SAELYN API error:", error.message);
  return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => console.log(`SAELYN server running on port ${PORT}`));
}

if (require.main === module) startServer();

module.exports = { app, startServer };

