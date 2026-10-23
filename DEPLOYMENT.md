# SAELYN — Deployment Guide

## Recommended first deployment: one web service

For the first release, serve the built React app and Express API from the **same origin**. This keeps the HttpOnly session cookie first-party and avoids cross-site cookie problems that can occur when a frontend and API are hosted on unrelated domains.

Use a Node.js web service that supports a build command and a start command. The repository is structured for this deployment mode.

### Build and start

- **Root directory:** repository root (the folder containing the root `package.json`)
- **Build command:** `npm install && npm --prefix server install && npm run build`
- **Start command:** `npm --prefix server start`
- **Health check path:** `/api/health`
- **Node version:** Node.js 20 or newer; Node.js 24 is the locally verified version.

The committed `.env.production` sets the non-secret frontend API base to `/api`. The server serves the Vite `dist` directory when `NODE_ENV=production`, while all `/api/*` routes continue to use Express.

## Required environment variables

Configure these in the hosting provider's private environment-variable settings. Do not commit them.

| Variable | Required | Value |
|---|---|---|
| `NODE_ENV` | Yes | `production` |
| `MONGO_URI` | Yes | Your MongoDB Atlas connection string |
| `CLIENT_ORIGIN` | No for same-origin requests | Optional comma-separated trusted frontend origins if a separate frontend is added later |
| `GEMINI_API_KEY` | No | Gemini API key; omit to use catalog fallback |

Do not set `VITE_GEMINI_API_KEY` or expose the Gemini key to browser code. If using a separate frontend in a future release, override `VITE_API_URL` at **build time** to the API base URL ending in `/api`, and configure `CLIENT_ORIGIN` to the exact frontend origin. Re-test session cookies carefully before using separate domains.

## MongoDB Atlas checklist

1. Confirm the deployment host can connect to the Atlas cluster.
2. Use a dedicated database user with only the permissions required by this app.
3. Add the hosting provider's outbound IP range to Atlas Network Access when the provider publishes stable outbound IPs. If it does not, choose an appropriately secured networking option; avoid opening the database broadly unless you understand the risk.
4. Keep the connection string in the hosting provider's secret environment variables.
5. Verify `/api/health` returns `database: "connected"`.

## Before public launch

- [ ] Run the automated tests and production build.
- [ ] Verify login, logout, account session persistence, cart, wishlist, COD checkout, and order history on the deployed HTTPS URL.
- [ ] Verify administrator-only routes reject customer accounts.
- [ ] Verify admin/store settings and inventory changes.
- [ ] Verify the assistant returns only real catalog products and still falls back when Gemini is unavailable.
- [ ] Confirm no API key, MongoDB URI, session token, or password appears in browser assets or Git history.
- [ ] Verify the health check and review server logs for startup errors.
- [ ] Configure database backups and a way to monitor failures.
- [ ] Review product photos, shipping/returns/privacy terms, contact information, and customer support process.
- [ ] Keep online card payments disabled until a real payment provider and verified webhook flow are implemented.

## Cost and reliability notes

Free hosting plans and free AI quotas can change, sleep, or have usage limits. Check the provider's current terms before choosing a plan. This setup does not automatically upgrade to paid hosting or a paid Gemini model. A free hosting service may sleep while idle, which can make the first request slow.

## Render Blueprint deployment

A `render.yaml` Blueprint is included for a single-origin first deployment.

1. Push the latest `master` branch to GitHub.
2. In Render, create a new Blueprint and connect `arslanshahtech/saelyn-ecommerce`.
3. Review the service configuration from `render.yaml` and create the service.
4. Set the private `MONGO_URI` value in Render to the intended MongoDB Atlas connection string. Do not paste it into GitHub files or commit it.
5. Optionally set `GEMINI_API_KEY` as a private environment variable if Gemini assistant replies are desired; catalog fallback works without it.
6. In MongoDB Atlas, permit the Render service to connect using the narrowest practical network access rule. Avoid a broad public allow-list unless you have consciously accepted that risk.
7. Wait for deployment to finish, then verify `https://<your-render-service>/api/health` returns HTTP 200 and `database: "connected"`.
8. Test registration/login/logout, product browsing, cart, wishlist, Cash on Delivery checkout, order history, admin authorization, and assistant behavior over HTTPS before sharing the URL publicly.

The Blueprint cannot supply your Render account authorization or private database/API secrets. Those must be configured in the provider dashboard.
