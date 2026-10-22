const mongoose = require("mongoose");
const { randomBytes, scrypt, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");

const scryptAsync = promisify(scrypt);
const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return [HASH_PREFIX, salt, Buffer.from(derivedKey).toString("hex")].join("$");
}

async function verifyPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string") return false;
  const [algorithm, salt, keyHex] = storedHash.split("$");
  if (algorithm !== HASH_PREFIX || !salt || !keyHex || !/^[a-f0-9]+$/i.test(keyHex)) return false;

  const expected = Buffer.from(keyHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;

  const actual = Buffer.from(await scryptAsync(password, salt, KEY_LENGTH));
  return timingSafeEqual(expected, actual);
}

// ADDRESS SCHEMA
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "Home" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    apartment: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "Pakistan" },
  },
  { _id: true }
);

// USER SCHEMA
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address."],
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// The password virtual is never stored; it is converted to a salted scrypt hash.
userSchema.virtual("password").set(function setPassword(password) {
  this.$locals.pendingPlaintextPassword = password;
});

userSchema.pre("validate", async function hashNewOrChangedPassword() {
  if (this.$locals.pendingPlaintextPassword === undefined) return;

  const password = this.$locals.pendingPlaintextPassword;
  this.$locals.pendingPlaintextPassword = undefined;

  if (typeof password !== "string" || password.length < 8) {
    this.invalidate("passwordHash", "Password must be at least 8 characters long.");
    return;
  }

  this.passwordHash = await hashPassword(password);
});

userSchema.methods.comparePassword = async function comparePassword(password) {
  let hash = this.passwordHash;

  // passwordHash is select:false, so fetch it privately if the caller did not select it.
  if (!hash && this._id) {
    const selectedUser = await this.constructor.findById(this._id).select("+passwordHash");
    hash = selectedUser ? selectedUser.passwordHash : undefined;
  }

  return verifyPassword(password, hash);
};

userSchema.methods.verifyPassword = function verifyPasswordMethod(password) {
  return this.comparePassword(password);
};


module.exports = mongoose.model("User", userSchema);
