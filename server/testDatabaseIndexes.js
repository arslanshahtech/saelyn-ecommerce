require("dotenv").config();

const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const User = require("./models/User");

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required for the database index integration test.");
  }

  const email = "phase2-index-" + Date.now() + "-" + Math.random().toString(16).slice(2) + "@example.test";

  try {
    await mongoose.connect(process.env.MONGO_URI);
    await User.init();

    const firstUser = new User({
      name: "Temporary Phase 2 Index Test",
      email,
      password: "TemporaryTestPassword123",
    });
    await firstUser.save();

    const savedUser = await User.findOne({ email }).select("+passwordHash");
    assert.ok(savedUser, "First test user should be persisted");
    assert.match(savedUser.passwordHash, /^scrypt\$[a-f0-9]+\$[a-f0-9]+$/);
    assert.equal(await savedUser.verifyPassword("TemporaryTestPassword123"), true);
    assert.equal(savedUser.toObject().password, undefined, "Plaintext password must not be persisted");

    const publicUser = await User.findOne({ email });
    assert.equal(publicUser.passwordHash, undefined, "Password hash must be excluded by default");
    assert.equal(await publicUser.comparePassword("TemporaryTestPassword123"), true);
    assert.equal(await publicUser.comparePassword("WrongPassword123"), false);
    console.log("PASS Stored password is salted/hashed; normal queries hide it while verification still works");

    let duplicateRejected = false;
    try {
      const duplicateUser = new User({
        name: "Duplicate Phase 2 Index Test",
        email: email.toUpperCase(),
        password: "AnotherTemporaryPassword123",
      });
      await duplicateUser.save();
    } catch (error) {
      duplicateRejected = error && error.code === 11000;
      if (!duplicateRejected) throw error;
    }
    assert.equal(duplicateRejected, true, "MongoDB unique email index must reject duplicate normalized email");
    console.log("PASS MongoDB unique email index rejects duplicate email");

    console.log("ALL DATABASE INDEX INTEGRATION TESTS PASSED");
  } catch (error) {
    console.error("DATABASE INDEX INTEGRATION TEST FAILED:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email }).catch(() => {});
      await mongoose.disconnect();
    }
  }
}

run();
