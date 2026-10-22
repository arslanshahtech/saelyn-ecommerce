require("dotenv").config();
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const User = require("./models/User");

async function main() {
  const email = String(process.argv[2] || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Usage: npm run admin:promote -- existing-account@example.com");
    process.exitCode = 1;
    return;
  }

  await connectDB();
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error("No existing account found for that email. Register the account first, then run this command.");
      process.exitCode = 1;
      return;
    }

    if (user.role === "admin") {
      console.log("This account is already an administrator.");
      return;
    }

    user.role = "admin";
    await user.save();
    console.log("Administrator role granted to the existing account:", user.email);
    console.log("Log out and log in again so the refreshed session reflects the new role.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error("Admin promotion failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
