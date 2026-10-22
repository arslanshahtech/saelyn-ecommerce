# SAELYN — Phase 3 Progress

## Scope
Phase 3 connects customer authentication, account navigation, persistent customer shopping data, and server-validated order creation.

## Implemented

### Authentication and account
- Register and login API routes.
- Email normalization and duplicate-email handling.
- Existing User model hashes passwords with salted Node.js scrypt; plain passwords and password hashes are not included in public user responses.
- Random server-side sessions stored in MongoDB. The browser receives an HttpOnly, SameSite=Lax cookie; MongoDB stores only a SHA-256 hash of the random session token.
- Session expiry is seven days and a TTL index cleans expired session records.
- Logout invalidates the server-side session.
- Protected /api/auth/me current-user endpoint.
- React AuthContext restores the current session on app load.
- Register, Login and My Account screens, authentication-aware account navigation, responsive mobile navigation, and logout.
- Customer accounts cannot self-assign the admin role through registration.

### Authorization
- Product browsing remains public.
- Product create/update/delete routes require a logged-in administrator.
- requireAdmin middleware rejects customer-role writes.

### Cart and wishlist
- Guest cart/wishlist remain in localStorage.
- On login, guest items merge with the logged-in user's database cart/wishlist.
- Database data is isolated by authenticated user ID.
- When switching accounts, a previous account's local cart/wishlist is not merged into the new account.
- Cart API validates product IDs, quantity limits, stock, and available size/color values; server prices are loaded from Product documents.
- Wishlist API validates product references and de-duplicates product IDs.
- Client saves authenticated cart/wishlist changes to the server.

### Checkout and orders
- Checkout requires login; the guest's local cart remains available while they sign in/register.
- Order creation requires authentication and validates shipping/contact details, product references, selected variants, quantities, stock, and shipping method.
- Order subtotal and total are calculated from current database product prices, not client-submitted prices.
- Stock is atomically decremented per product. If order creation fails, the controller attempts to restore stock decrements.
- Orders are stored with customer/shipping snapshots, item snapshots, shipping/payment/order status, subtotal, shipping cost, and total.
- /api/orders/mine returns the logged-in user's order history.
- Account page shows order history.
- Cash on Delivery is enabled. Card payment is explicitly disabled/rejected until a real payment provider is configured; the app does not claim a card payment succeeded when no provider exists.

## Main API routes
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/cart
- PUT /api/cart
- POST /api/cart/sync
- GET /api/wishlist
- PUT /api/wishlist
- POST /api/wishlist/sync
- POST /api/orders
- GET /api/orders/mine
- GET /api/products and GET /api/products/:id remain public
- Product POST, PUT, and DELETE routes require administrator authorization

## Verification performed
- npm run test:models: PASS — 24 model validation checks.
- npm run test:indexes: PASS — persisted salted password hash, verification, hash exclusion, unique email index.
- npm run test:api: PASS — public product reads/search/filter/sort and administrator-only create/update/delete; test data cleaned up.
- npm run test:auth: PASS — register/login/logout, duplicate email, cookie attributes, protected routes, customer/admin authorization, cart sync/replace, wishlist sync/replace, checkout price calculation, stock decrement, and order history; temporary user/order/product/session data cleaned up.
- Combined npm run test:phase3: PASS, exit code 0.
- Root npm run build: PASS — Vite production build completed.
- Node syntax checks passed for the new server controllers, middleware, routes, and integration tests.

## Remaining boundaries / production follow-ups
- Online card payment is not integrated. A payment provider, verified webhook flow, and payment reconciliation are needed before enabling card payment.
- Email verification, forgot/reset password, address-book editing, order cancellation/returns, and an admin dashboard are outside this implementation slice.
- Production deployment should set CLIENT_ORIGIN to the exact trusted frontend origin(s), use HTTPS, and ensure NODE_ENV=production.
- Stock decrements and rollback are implemented without a MongoDB transaction; for a multi-service/high-concurrency production checkout, prefer a replica-set transaction and an idempotent payment/order workflow.
- Manual visual QA in a real browser is still recommended after starting the frontend and backend locally.

## Phase 3 status
Core account, authentication, database cart/wishlist sync, secure catalog writes, and Cash-on-Delivery checkout/order history are implemented and automated tests pass.
