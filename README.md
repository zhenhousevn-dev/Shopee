# shopee-data-bridge

Minimal data bridge for:

**Shopee Open Platform → Vercel → Neon PostgreSQL → Read-only Analytics API → ChatGPT**

Current scope is **Checkpoint 1: Shopee OAuth redirect only**.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill the Shopee values locally. Never commit `.env.local`.
3. Install dependencies:

```bash
npm install
```

4. Run:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000/api/shopee/auth
```

For real Shopee authorization, `SHOPEE_REDIRECT_URL` must point to the exact callback URL configured in Shopee Open Platform. Production authorization should be tested on the deployed Vercel URL.

## Vercel environment variables

Required for Checkpoint 1:

- `SHOPEE_PARTNER_ID`
- `SHOPEE_PARTNER_KEY`
- `SHOPEE_REDIRECT_URL`

Optional:

- `SHOPEE_HOST` — defaults to `https://partner.shopeemobile.com`

`DATABASE_URL` is intentionally not required until Checkpoint 2, where token persistence starts.

## Security

Do not commit or paste secrets into source code, Git, screenshots, logs, or chat.

See `SoT.md`, `AGENT.md`, and `CHECKPOINT-1.md` before making changes.
