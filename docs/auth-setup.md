# Auth (Clerk) + multi-user

The app supports public multi-user signups via [Clerk](https://clerk.com). Auth is **opt-in by
env**: with Clerk keys set, there's a login wall and all data is scoped per user; without them, the
app runs as a single local user (no login) — so `localhost` works before you wire anything up.

Provider API keys are **BYOK per user**: each signed-in user enters their own Anthropic / OpenAI /
Deepgram keys in Settings. Those keys stay in the browser and are sent per request — the server
never stores them. Auth only scopes **data**.

## One-time Clerk setup

1. Create a Clerk account → **new application**. Enable Email and (optionally) Google sign-up.
2. Copy the two keys from the dashboard:
   - **Publishable key** (`pk_test_…`) → frontend
   - **Secret key** (`sk_test_…`) → backend
3. Frontend: copy `.env.example` → `.env.local`, set `VITE_CLERK_PUBLISHABLE_KEY=pk_test_…`
4. Backend: in `server/.env`, set `CLERK_SECRET_KEY=sk_test_…`
5. Restart the Vite dev server and the API server.

That's it — the login wall appears and the backend enforces auth. Clerk's **development instance**
works on `http://localhost` with no domain/HTTPS, and offers test emails + OTP codes so you don't
need real email delivery in dev.

## Local dev without Clerk

Leave `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` unset. The app renders directly (no login)
and every request is treated as the single user `DEV_USER_ID` (default `local-dev`). This is the
default developer experience.

## Claiming your existing data

Data created before auth has `user_id = NULL`. After you sign in once, grab your Clerk user id from
the Clerk dashboard (Users → your user → it looks like `user_xxxxx`) and run:

```
npm --prefix server run backfill -- user_xxxxx
```

This assigns all pre-auth rows to that account. Safe to re-run (it only touches NULL rows). If you
developed locally as `local-dev` first and want that data, pass `local-dev` instead.

## How it works (for maintainers)

- **Frontend** (`src/main.tsx`): `ClerkProvider` + `AuthGate` mount only when the publishable key is
  set. `src/lib/api.ts#apiFetch` attaches the Clerk session JWT as a Bearer header to every `/api`
  call. Media elements (`<audio>`/`<img>` src) can't send headers, so they authenticate via Clerk's
  same-origin session **cookie** instead.
- **Backend** (`server/src/auth.ts`): `clerkMiddleware` verifies the token; `requireUser` gates each
  feature router and stamps `req.userId`. Every query in the feature modules filters by `user_id`,
  and upserts guard against overwriting another user's row by id.
- **Not scoped:** `custom_problems` is shared, LLM-authored problem content (not personal data).
- **Schema:** `user_id text` columns added additively in `server/src/db.ts`; `profile` and
  `prep_plan` become one row per user (keyed on `user_id`).
