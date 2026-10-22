const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema({
  storeName: { type: String, trim: true, maxlength: 100, default: "SAELYN" },
  supportEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  currency: { type: String, enum: ["USD", "PKR"], default: "USD" },
  lowStockThreshold: { type: Number, min: 0, max: 10000, default: 5 },
  announcement: { type: String, trim: true, maxlength: 240, default: "" },
  maintenanceMode: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.StoreSettings || mongoose.model("StoreSettings", storeSettingsSchema);
