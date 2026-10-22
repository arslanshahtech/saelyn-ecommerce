# SAELYN Password Reset — Implementation Notes

## Implemented
- Added `PasswordResetToken` model. Reset tokens are generated with Node's cryptographic random bytes, stored as SHA-256 hashes, and expire after 30 minutes.
- Added `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`.
- Unknown email addresses receive the same generic success message as existing accounts.
- A new reset request invalidates earlier reset tokens for that account.
- Reset tokens are one-time-use. Password updates use the existing salted scrypt password hashing flow.
- Password reset removes all active sessions and all reset tokens for that account.
- Added a simple in-process rate limiter: 5 reset-related requests per IP per 15 minutes.
- Added Forgot Password and Reset Password frontend pages and a link from Login.
- Local development shows a reset link on the Forgot Password page when no email sender is configured. This convenience is disabled in production.
- Added a focused integration test and included it in `npm run test:phase3`.

## Local test
From `server`:
```powershell
npm run test:password-reset
```

## Email delivery configuration
Local testing works without sending email. For real delivery, configure these environment variables in `server/.env` (never commit this file):
- `RESEND_API_KEY`
- `EMAIL_FROM` — a sender address allowed by your email provider
- `CLIENT_ORIGIN` — the frontend origin, e.g. `http://localhost:5173` locally and the real HTTPS website URL in production

The email utility sends through Resend's API. For production, configure an authorized sender/domain with the provider. Keep API keys private and do not share them in chat or source control.

## Important production note
The current rate limiter is in-memory and works per server process. Before deploying multiple backend instances, replace it with a shared rate-limit store. Review CORS, HTTPS cookies, deployment origin and email sender configuration before production launch.

## Manual browser verification needed
1. Open `http://localhost:5173/login` and click **Forgot your password?**
2. Enter the email of an existing local SAELYN account.
3. Open the development reset link displayed after submitting.
4. Set a new password and confirm it.
5. Verify the old password fails and the new password works.
6. Request another reset link and verify a used/expired link is rejected.
