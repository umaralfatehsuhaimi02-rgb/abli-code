# Deploying Abli Code for customers

Customers must never receive your provider keys. Anything inside an installer can be extracted, encrypted or not, so the keys live only on a server you run. The desktop app is a thin client that signs in to that server.

## 1. Run the server

Any host that runs Node 20 or newer and keeps a persistent disk works (a small VPS, Railway, Fly.io, Render). Serve it over HTTPS on your own domain.

```bash
npm install
npm run build
npm start
```

Set these environment variables on the host. Do not commit them.

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Your public HTTPS address, for example `https://app.example.com` |
| `ABLI_ENCRYPTION_KEY` | Long random string. Encrypts saved API keys on disk |
| `ABLI_DATA_DIR` | Folder on the persistent disk for user data |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Sign-in and database |
| `ABLITERATEDLLM_API_KEY`, `REFUSELESS_API_KEY`, `NEARAI_API_KEY`, `UPLINKSWITCH_API_KEY` | Your master provider keys |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payments |
| `RESEND_API_KEY`, `EMAIL_FROM` | Verification emails |

## 2. Connect Stripe

Add a webhook endpoint in Stripe that points to `https://YOUR-DOMAIN/api/billing/stripe-webhook` and listens for `checkout.session.completed`. Customer payments go to your Stripe balance and Stripe pays them out to your bank account.

## 3. Connect Supabase

In Authentication, URL Configuration, add `https://YOUR-DOMAIN/**` to Redirect URLs.

## 4. Point the desktop app at your server

Edit `desktop/backend.json`:

```json
{ "backendUrl": "https://YOUR-DOMAIN" }
```

Then build the installer with `npm run dist`. With a backend URL set, the app does not run a local server and holds no keys.

## Keeping provider balances topped up

Each provider holds your prepaid balance. Turn on auto-reload in each provider's billing page if it offers it, and check balances against what customers have bought. Customer credit is a promise to serve usage, so keep your provider balance above what customers hold.
