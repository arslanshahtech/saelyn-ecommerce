require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Product = require("./models/Product");

async function seedProducts() {
  try {
    // Existing SAELYN catalog ko source-of-truth seed data ke taur par use karte hain.
    const { products } = await import("../src/data/homeData.js");
    await connectDB();

    let insertedOrUpdated = 0;
    for (const [index, item] of products.entries()) {
      const price = Number(String(item.price).replace(/[^0-9.]/g, ""));
      await Product.updateOne(
        { name: item.name },
        {
          $set: {
            name: item.name,
            price,
            image: item.image,
            category: item.category,
            colors: item.colors || [],
            sizes: item.sizes || [],
            description: item.description || "",
            material: item.material || "Not specified",
            details: item.details || [],
            featured: index < 4,
            // Development ke liye initial stock; admin/inventory phase mein adjust hoga.
            stock: 25,
          },
        },
        { upsert: true, runValidators: true }
      );
      insertedOrUpdated += 1;
    }

    console.log(`SAELYN seed complete: ${insertedOrUpdated} catalog products upserted.`);
  } catch (error) {
    console.error("SAELYN seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

seedProducts();
