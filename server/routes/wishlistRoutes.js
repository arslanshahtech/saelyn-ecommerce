const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getWishlist, replaceWishlist, syncWishlist } = require("../controllers/wishlistController");

const router = express.Router();
router.use(requireAuth);
router.get("/", getWishlist);
router.put("/", replaceWishlist);
router.post("/sync", syncWishlist);

module.exports = router;
