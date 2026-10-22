# SAELYN — MERN E-commerce

SAELYN is a React + Vite storefront backed by an Express API and MongoDB Atlas. It includes catalog search/filtering, customer authentication, cart and wishlist persistence, Cash on Delivery checkout, order history, admin tools, store settings, and a catalog-grounded shopping assistant with optional Gemini free-tier conversation.

## Requirements

- Node.js 20+ (Node.js 24 was used during local verification)
- MongoDB Atlas database or another compatible MongoDB deployment
- VS Code or another code editor

## Local setup

1. Install frontend dependencies from the project root:

   `npm install`

2. Install backend dependencies:

   `cd server`
   `npm install`

3. Copy `server/.env.example` to `server/.env` and set a real `MONGO_URI`. Keep the file private and never commit it.
4. Optional: set `GEMINI_API_KEY` in `server/.env`. The assistant still works in catalog-fallback mode without it.
5. Start the backend in one terminal:

   `cd server`
   `npm run dev`

6. Start the frontend in another terminal from the project root:

   `npm run dev`

7. Open the Vite URL, normally `http://localhost:5173`.

## Verification commands

From the project root:

- `npm run build` — production frontend build
- `npm run check:server` — server JavaScript syntax checks
- `npm run test:server` — full model, database index, product API, auth/cart/wishlist/order, and password-reset integration suites

The backend health endpoint is `GET http://localhost:5000/api/health`. It returns HTTP 200 when MongoDB is connected.

## Production deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the single-origin deployment plan, build/start commands, environment variables, smoke tests, and release checklist.

## Important commerce boundaries

- Checkout currently supports Cash on Delivery. Card payments remain disabled until a real payment provider, verified webhooks, and reconciliation are implemented.
- Gemini is optional and uses a free-tier model. Free quota is limited and can change; there is no automatic paid-model fallback.
- Replace or review remote product imagery and store policies before a public commercial launch.
- Before accepting real customers, configure production monitoring, backups, a verified support contact, legal/privacy/returns/shipping pages, and a payment/shipping workflow appropriate to the business.
