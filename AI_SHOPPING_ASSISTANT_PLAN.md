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

## Phase 3 — Step 3: Free-tier conversational AI integration

- Added an optional Google Gemini API integration using the fixed model `gemini-3.5-flash-lite`; no SDK or additional package is required (Node's built-in `fetch` is used).
- The API receives the customer's latest message, at most eight short recent conversation messages, and at most three matching catalog records. It does not receive account identity, order history, session tokens, addresses, or payment details.
- Product cards continue to come from MongoDB queries. Gemini writes the conversational text, but the server returns only the products independently found in the real catalog.
- The existing deterministic catalog assistant remains available when no API key is configured or the free-tier service fails / reaches quota. The code does not automatically switch to a paid model.
- `GEMINI_API_KEY` is read only by the backend. A safe template is provided at `server/.env.example`; the real key belongs only in the ignored `server/.env` file.
- Cost guardrail: use a Google AI Studio API key on a project with **no billing account linked** and do not upgrade the project. When the free quota is exhausted, the AI response may stop until quota resets; catalog fallback remains available. Free-tier limits can change.
- Privacy note: Google's published Gemini API free-tier terms say submitted content may be used to improve its products. The assistant sends only the conversation text and limited catalog fields; customers should not enter sensitive personal data.
- Verification: the user configured `GEMINI_API_KEY` in the backend `.env` without sharing the secret and manually tested a price-ceiling request plus a follow-up casual-outfit question. They confirmed that real catalog recommendations and budget filtering work; richer conversation quality is intentionally deferred to a later improvement pass.
- Step 3 is accepted for the current release. Free-tier quota and provider availability remain outside the app's control; catalog fallback must remain functional.
