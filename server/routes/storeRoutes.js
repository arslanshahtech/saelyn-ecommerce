const express = require("express");
const StoreSettings = require("../models/StoreSettings");

const router = express.Router();

// Public fields only: never expose private admin configuration.
router.get("/settings", async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOne().select("storeName announcement maintenanceMode currency").lean();
    res.json({ success: true, settings: settings || { storeName: "SAELYN", announcement: "", maintenanceMode: false, currency: "USD" } });
  } catch (error) { next(error); }
});

module.exports = router;
