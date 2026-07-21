# BUKHT Supabase Realtime image chat — manual setup

The repository currently uses the legacy server-key model. Never commit real values.

## 1. Local environment

In Supabase Dashboard open **Project Settings → API** (or the project **Connect** dialog):

- Copy **Project URL** to both `SUPABASE_URL` (server) and `NEXT_PUBLIC_SUPABASE_URL` (browser).
- Copy the legacy **anon/public** key to `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe).
- Copy the legacy **service_role** key to `SUPABASE_SERVICE_ROLE_KEY` (server-only).

In Clerk Dashboard open **API keys**:

- Copy **Publishable key** to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- Copy **Secret key** to `CLERK_SECRET_KEY` (server-only).

Add this placeholder structure to `.env.local`:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_or_live_...
CLERK_SECRET_KEY=sk_test_or_live_...
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ_or_legacy_anon_key
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ_or_legacy_service_role_key
SUPABASE_CHAT_BUCKET=chat-attachments
```

`NEXT_PUBLIC_*` values enter the browser bundle. Service-role and Clerk secret values must never use that prefix.

## 2. Clerk ↔ Supabase third-party auth

1. Clerk Dashboard → **Integrations / Connect** → **Supabase** → enable/configure the native integration. Do not create a custom JWT template unless the native integration is unavailable for the instance.
2. Supabase Dashboard → **Authentication → Sign In / Providers → Third-Party Auth** → add **Clerk**.
3. Enter the Clerk instance domain shown by Clerk (for example `your-instance.clerk.accounts.dev`) and save.
4. Sign out and sign in again. The application sync endpoint writes the real Clerk `sub` into `public.users.clerk_user_id`; do not cast this text ID to UUID.

## 3. Migration and private Realtime

1. Supabase Dashboard → **SQL Editor → New query**.
2. Run `docs/migrations/20260721_commerce_realtime_image_chat.sql` against the intended project.
3. Database → **Tables → messages**: confirm attachment columns and `client_nonce`.
4. Database → **Triggers**: confirm `messages_realtime_broadcast`.
5. Realtime → **Settings**: disable **Allow public access** so private-channel authorization is enforced.
6. Database → **Policies → realtime.messages**: confirm the participant SELECT policy exists.

## 4. Private Storage

1. Supabase Dashboard → **Storage → Buckets → chat-attachments**.
2. Confirm **Public bucket** is off.
3. Confirm maximum file size is **10 MB**.
4. Confirm allowed MIME types are `image/jpeg`, `image/png`, `image/webp`, `image/gif` only.
5. Storage → **Policies → objects**: confirm the participant read policy exists. There intentionally is no general browser INSERT policy; the API issues short-lived signed upload tokens after membership validation.

## 5. Vercel

Vercel Project → **Settings → Environment Variables**: add every variable shown above for Production and Preview as appropriate. Keep `SUPABASE_SERVICE_ROLE_KEY` and `CLERK_SECRET_KEY` server-only. Then open **Deployments**, choose the latest deployment menu, and select **Redeploy**.

## 6. Usage and plan

- Supabase Dashboard → **Reports / Usage**: monitor Realtime connections/messages, Storage size/egress and Database usage.
- Supabase Dashboard → **Organization Settings → Billing** (or project **Billing**) → **Change plan / Upgrade to Pro** when free-plan limits are insufficient.

## 7. Runtime acceptance test

Use two distinct Clerk accounts in two separate browser profiles:

1. Open the same product chat as buyer and seller.
2. Confirm DevTools Network shows a private WebSocket subscription to `conversation:<id>` and no 4-second message polling.
3. Send text both ways; verify immediate delivery and no duplicate bubble.
4. Upload JPEG/PNG/WebP/GIF; refresh and confirm signed-read rendering.
5. Reject SVG and files above 10 MB.
6. Disconnect/reconnect network; verify cursor reconciliation fills missed messages.
7. Try another account against the channel, message API and attachment endpoint; all must be denied.
8. Sign out and confirm the channel closes.
9. Recheck marketplace, product detail, cart, checkout and `/account/cart`.
