# SAELYN — AI Shopping Assistant Plan

## Phase 3 — Step 1: Existing Architecture Audit

### Product catalog source of truth
- MongoDB `Product` model: `server/models/Product.js`.
- Existing catalog fields: `name`, numeric `price`, `image`, `category`, `merchandisingCollection`, `colors`, `sizes`, `description`, `material`, `details`, `stock`, and `featured`.
- Public product browsing API: `GET /api/products` and `GET /api/products/:id`.
- Product search/filter/sort logic already lives in `server/controllers/productController.js`, including case-insensitive search, basic singular/plural handling, typo tolerance, category, collection, price, color, size, material, and sorting.
- Existing client API helper is `src/api/products.js`; it normalizes product IDs and prices for the storefront.

### Existing storefront integration points
- Global app routes and shared layout are in `src/App.jsx`.
- Design tokens are in `src/styles/tokens.css`; the existing SAELYN visual style uses ivory, black, stone, bronze, serif display headings, and Manrope body text.
- Existing search overlay is `src/components/SearchOverlay/SearchOverlay.jsx` and its CSS. Keep it intact; the assistant should be a separate feature, not a replacement.
- Product detail page is `src/pages/ProductPage/ProductPage.jsx`.
- Cart state and `addToCart(product, selectedSize, selectedColor, quantity)` are provided by `src/context/CartContext.jsx`.
- Cart persistence and payload validation already exist through `src/api/shopping.js`, `server/models/Cart.js`, and `server/utils/shoppingValidation.js`.

### Security and configuration findings
- Product read routes are public; product mutations require authenticated admin authorization.
- Express JSON request size is limited to 100 KB.
- Current `server/.env` variable names include `PORT` and `MONGO_URI` only. No AI provider key is configured. Values were not read into this document.
- Server dependencies currently include Express, Mongoose, CORS, and dotenv; no AI provider SDK is installed.
- Never expose a provider key through a `VITE_` frontend environment variable. Any provider call must run on the server.

## Proposed implementation boundaries
1. Add a standalone responsive assistant widget and dedicated CSS matching SAELYN's design tokens.
2. Add a server endpoint such as `POST /api/assistant/chat` with request validation, bounded message/history length, rate limiting, and safe error handling.
3. Use the existing MongoDB Product catalog as the only source of product facts. Filter and rank candidate products server-side; never invent a product, price, variant, or stock status.
4. Make product recommendations render real product cards with product detail links. Use the existing cart context for Add to Bag only when required variant selections are valid; link to the product page when a selection is needed.
5. Keep the assistant functional without a provider key through a clearly identified catalog-search/recommendation fallback. Add an optional server-only AI provider adapter once credentials are configured.
6. Do not send customer identity, address, order history, session token, or other personal data to an AI provider. The initial assistant only needs the user message and limited product catalog fields.

## Step 1 status
Architecture audit complete. No application code has been changed for the assistant yet. Next step is to implement the standalone chat UI and its API/service boundary, then test with real catalog queries and cart interactions.

## Phase 3 — Step 2 implementation notes
- Added the floating, responsive SAELYN Style Assistant widget to customer-facing pages; admin and authentication screens are excluded.
- Added `src/api/assistant.js` as the frontend API boundary.
- Added `POST /api/assistant/chat`, a 300-character message limit, input validation, and an in-memory limit of 12 requests per IP per 15 minutes.
- The endpoint queries MongoDB Product records and returns at most three catalog-backed recommendations with product ID, actual price, image, category, variants, material, stock, and description.
- Basic catalog matching supports category, color aliases (including current hex color values), material, price ceilings, cheapest-first queries, and stock availability. Product cards link to the existing product detail route so customers can choose their own size/color before adding to bag.
- No AI provider key or SDK was added. This milestone is a deterministic catalog assistant, not an LLM-powered assistant; provider integration remains a separate later step.
- Verification so far: `npm run build` succeeded (1,663 modules transformed); backend syntax checks passed; local HTTP endpoint returned expected validation responses and real MongoDB-backed product recommendations for `black clothing under $100` and `What is in stock?`.
- A `Show bags under $100` query returned no products because no matching in-stock bag exists at or below that budget in the current catalog; the endpoint correctly did not fabricate a result.
- Remaining checkpoint: user should visually verify the widget on desktop and mobile, then try prompts and confirm product links work before this phase is committed.