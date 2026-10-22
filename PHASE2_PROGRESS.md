# SAELYN — Phase 2: Database Models

Last checked: 2026-10-22

## Goal
Prepare and verify the MongoDB/Mongoose data structures required for customer identity and commerce while preserving Phase 1 storefront behavior.

## Scope and status

- [x] Product model — required product data, price/stock constraints, category and homepage merchandising collection.
- [x] User model — name, normalized/unique email, phone, role, addresses, active status and timestamps.
- [x] Password strategy — password virtual is converted to a salted Node.js scrypt hash before validation/persistence; plaintext is not stored; hashes are excluded from normal queries; password verification supports correct and incorrect passwords.
- [x] Order model — optional registered-user reference for guest checkout, unique order number, customer/shipping snapshots, item snapshots, shipping/payment/order status, subtotal, shipping cost, total and timestamps.
- [x] Order total validation — subtotal must equal the sum of item snapshot price multiplied by quantity; total must equal subtotal plus shipping cost.
- [x] Cart model — one cart per registered user, product references, selected size/color, positive whole-number quantity.
- [x] Wishlist model — one wishlist per registered user, product references and duplicate product prevention.
- [x] Schema validation tests — valid and invalid values, required fields, email format, password strategy, product reference casting, cart/wishlist constraints and order totals.
- [x] MongoDB integration tests — persisted password hashing/verification and unique email index enforcement; temporary test user is deleted in cleanup.
- [x] Existing Product API regression tests.
- [x] Frontend production build.

## Design notes
- Cart and Wishlist models serve authenticated users. Guest cart/wishlist behavior remains in browser localStorage until authentication/API integration.
- Order items retain name, price and image snapshots so past orders remain readable when catalog data changes.
- Password hashing uses Node.js scrypt with a cryptographically random salt and constant-time key comparison; no extra password-hashing dependency was added. Registration should assign `user.password = submittedPassword`, then save; it must never assign plaintext to a database field.
- Passwords must be at least 8 characters. Production authentication endpoints should add rate limiting and the appropriate account/security policy.
- User email and order number use unique indexes. MongoDB index enforcement is verified by the integration test, not merely inferred from Mongoose validation.
- ObjectId references are type/cast-validated in these schemas. When Cart/Wishlist/Order APIs are implemented, the service/controller must also verify that referenced Product/User documents actually exist and are authorized; a Mongoose `ref` alone does not guarantee existence.
- Integration test creates one uniquely named temporary user and removes it in a finally block. It does not create or change product, order, cart or wishlist data.

## Verification
Run from the server folder:

- `npm run test:models` — in-memory schema and password checks.
- `npm run test:indexes` — MongoDB persistence, password hash and duplicate-email integration checks.
- `npm run test:api` — existing Product API regression suite.
- `npm run test:phase2` — runs the three suites sequentially.

Phase 2 acceptance is complete when all three test suites pass and the root production build succeeds.

## Final verification run — 2026-10-22
- `npm run test:models`: PASS — 24 model/password/schema checks.
- `npm run test:indexes`: PASS — persisted scrypt hash and verification, hidden hash in ordinary queries, and MongoDB duplicate-email rejection.
- `npm run test:api`: PASS — all existing Product API CRUD/search/filter/sort regression checks.
- Combined `npm run test:phase2`: PASS, exit code 0.
- Root `npm run build`: PASS, 1,645 modules transformed.
- `node --check`: PASS for server entry point, all five models and both database test scripts.
- Temporary integration-test user is removed by cleanup; no product/order/cart/wishlist records are created by the database-model tests.
