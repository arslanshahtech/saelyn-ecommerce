const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const StoreSettings = require("../models/StoreSettings");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getDashboardOverview = asyncHandler(async (req, res) => {
  const settings = await StoreSettings.findOne().select("lowStockThreshold").lean();
  const threshold = Number.isInteger(settings?.lowStockThreshold) ? settings.lowStockThreshold : 5;
  const [productCount, customerCount, orderCount, pendingOrders, lowStockCount, recentOrders] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments({ role: "user" }),
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: { $in: ["pending", "confirmed", "processing"] } }),
    Product.countDocuments({ stock: { $lte: threshold } }),
    Order.find().sort({ createdAt: -1 }).limit(6).select("orderNumber customer total orderStatus paymentStatus createdAt").lean(),
  ]);
  res.json({ success: true, overview: { productCount, customerCount, orderCount, pendingOrders, lowStockCount, recentOrders } });
});

const listProducts = asyncHandler(async (req, res) => {
  const { search = "", stock = "", category = "" } = req.query;
  const settings = stock === "low" ? await StoreSettings.findOne().select("lowStockThreshold").lean() : null;
  const threshold = Number.isInteger(settings?.lowStockThreshold) ? settings.lowStockThreshold : 5;
  const query = {};
  if (search.trim()) query.$or = [
    { name: { $regex: search.trim().slice(0, 80), $options: "i" } },
    { category: { $regex: search.trim().slice(0, 80), $options: "i" } },
  ];
  if (category) query.category = category;
  if (stock === "low") query.stock = { $gt: 0, $lte: threshold };
  if (stock === "out") query.stock = 0;
  if (stock === "healthy") query.stock = { $gt: threshold };
  const products = await Product.find(query).sort({ updatedAt: -1 }).lean();
  res.json({ success: true, products });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, message: "Product created.", product });
});

const updateProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid product ID." });
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: "Product not found." });
  res.json({ success: true, message: "Product updated.", product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid product ID." });
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found." });
  res.json({ success: true, message: "Product deleted." });
});

const listOrders = asyncHandler(async (req, res) => {
  const { search = "", status = "" } = req.query;
  const query = {};
  if (status) query.orderStatus = status;
  if (search.trim()) {
    const safe = search.trim().slice(0, 80);
    query.$or = [
      { orderNumber: { $regex: safe, $options: "i" } },
      { "customer.email": { $regex: safe, $options: "i" } },
      { "customer.firstName": { $regex: safe, $options: "i" } },
      { "customer.lastName": { $regex: safe, $options: "i" } },
    ];
  }
  const orders = await Order.find(query).sort({ createdAt: -1 }).limit(300).lean();
  res.json({ success: true, orders });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const allowed = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(req.body.orderStatus)) return res.status(400).json({ success: false, message: "Choose a valid order status." });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });
  const previous = order.orderStatus;
  const nextStatus = req.body.orderStatus;
  if (previous === nextStatus) {
    return res.json({ success: true, message: "Order status is already set.", order });
  }
  if (previous === "cancelled") {
    return res.status(409).json({ success: false, message: "Cancelled orders cannot be reopened from the dashboard." });
  }
  if (nextStatus === "cancelled" && ["shipped", "delivered"].includes(previous)) {
    return res.status(409).json({ success: false, message: "Shipped or delivered orders cannot be cancelled here." });
  }

  // Compare-and-set the prior status so concurrent admin requests cannot cancel
  // the same order twice and return its inventory to stock more than once.
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, orderStatus: previous },
    { $set: { orderStatus: nextStatus } },
    { new: true, runValidators: true }
  );
  if (!updatedOrder) {
    return res.status(409).json({ success: false, message: "This order changed in another request. Refresh and try again." });
  }

  if (nextStatus === "cancelled") {
    await Promise.all(updatedOrder.items.map((item) =>
      Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
    ));
  }
  res.json({ success: true, message: "Order status updated.", order: updatedOrder });
});

const listCustomers = asyncHandler(async (req, res) => {
  const { search = "" } = req.query;
  const query = { role: "user" };
  if (search.trim()) {
    const safe = search.trim().slice(0, 80);
    query.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      { phone: { $regex: safe, $options: "i" } },
    ];
  }
  const customers = await User.find(query).select("name email phone isActive createdAt").sort({ createdAt: -1 }).limit(500).lean();
  const ids = customers.map((customer) => customer._id);
  const counts = await Order.aggregate([
    { $match: { user: { $in: ids } } },
    { $group: { _id: "$user", orderCount: { $sum: 1 }, totalSpent: { $sum: "$total" } } },
  ]);
  const byUser = new Map(counts.map((item) => [String(item._id), item]));
  res.json({ success: true, customers: customers.map((customer) => ({
    ...customer,
    orderCount: byUser.get(String(customer._id))?.orderCount || 0,
    totalSpent: byUser.get(String(customer._id))?.totalSpent || 0,
  })) });
});

const updateCustomerStatus = asyncHandler(async (req, res) => {
  if (typeof req.body.isActive !== "boolean") return res.status(400).json({ success: false, message: "Account status must be active or inactive." });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid customer ID." });
  const customer = await User.findOneAndUpdate(
    { _id: req.params.id, role: "user" },
    { isActive: req.body.isActive },
    { new: true, runValidators: true }
  ).select("name email phone isActive createdAt");
  if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
  res.json({ success: true, message: "Customer account status updated.", customer });
});

const getStoreSettings = asyncHandler(async (req, res) => {
  let settings = await StoreSettings.findOne().lean();
  if (!settings) settings = await StoreSettings.create({});
  res.json({ success: true, settings });
});

const updateStoreSettings = asyncHandler(async (req, res) => {
  const allowed = ["storeName", "supportEmail", "currency", "lowStockThreshold", "announcement", "maintenanceMode"];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
  if (update.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update.supportEmail)) {
    return res.status(400).json({ success: false, message: "Please enter a valid support email." });
  }
  const settings = await StoreSettings.findOneAndUpdate({}, update, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  res.json({ success: true, message: "Store settings saved.", settings });
});

module.exports = { getDashboardOverview, listProducts, createProduct, updateProduct, deleteProduct, listOrders, updateOrderStatus, listCustomers, updateCustomerStatus, getStoreSettings, updateStoreSettings };
