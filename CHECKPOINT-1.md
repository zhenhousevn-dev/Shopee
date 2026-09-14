# Checkpoint 1 — Shopee OAuth redirect

Scope: prove that the Vercel app can redirect a seller to Shopee authorization and receive `code + shop_id` back.

## Current implementation

Implemented:

- `lib/shopee.ts` — environment validation, Unix timestamp, public-request HMAC-SHA256 signing.
- `app/api/shopee/auth/route.ts` — creates a fresh Shopee authorization URL and redirects to it.
- `app/api/shopee/callback/route.ts` — verifies that `code` and `shop_id` were returned without logging or exposing the code.
- `.env.example` — required environment variable names only.
- minimal Next.js/TypeScript project files required for deployment.
- signing unit test in `tests/shopee-signing.test.ts`.

Not implemented in this checkpoint:

- token exchange;
- token storage in Neon;
- token refresh;
- order/product/payment sync;
- cron jobs;
- analytics API.

## Vercel environment variables

Configure these in Vercel Project Settings → Environment Variables:

- `SHOPEE_PARTNER_ID`
- `SHOPEE_PARTNER_KEY`
- `SHOPEE_REDIRECT_URL`
- Optional: `SHOPEE_HOST` (defaults to production host)

`DATABASE_URL` is not required until Checkpoint 2.

Do not put real secrets in `.env.example`, source code, Git, screenshots, or chat.

## Shopee redirect URL

Configure the exact same callback URL in the Shopee Open Platform app, for example:

`https://YOUR-VERCEL-DOMAIN.vercel.app/api/shopee/callback`

## Deploy test

1. Push/import this project to Vercel.
2. Add the required environment variables.
3. Deploy.
4. Open:
   `https://YOUR-VERCEL-DOMAIN.vercel.app/api/shopee/auth`
5. Shopee should show the seller authorization flow.
6. Authorize the intended shop.
7. Shopee should redirect to `/api/shopee/callback`.
8. Success response should look like:

```json
{
  "ok": true,
  "checkpoint": "oauth-callback-received",
  "shop_id": "...",
  "has_code": true,
  "next": "Exchange authorization code for tokens in Checkpoint 2."
}
```

The actual authorization `code` is intentionally not returned.

## Verification already run

- HMAC signing unit test: passed.
- Credential-pattern scan on implementation files: passed.
- Callback safety check (no authorization-code response property, no logging): passed.

A full `next build` was not run in the packaging environment because package-registry access was unavailable. The real Vercel build and real Shopee authorization remain required.

## Definition of done

Checkpoint 1 passes only when the deployed callback returns `ok: true` after real Shopee authorization.

Do not mark SoT OAuth status as complete before that real deploy test passes.
