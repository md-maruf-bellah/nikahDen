# API Reference — Nikah Deen

Base URL: `http://localhost:5000/api/v1`

Auth: `Authorization: Bearer <accessToken>`

Common query params: `page`, `limit` (max 100), `search`, `sortBy`, `sortOrder`
(`asc`/`desc`). List endpoints return:

```json
{ "success": true, "message": "...", "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
```

---

## Auth `/auth`

| Method | Path                 | Access | Body / Notes |
| ------ | -------------------- | ------ | ------------ |
| POST   | `/auth/register`     | public | `{ firstName, lastName, email, password, phone? }` → `{ accessToken, refreshToken, user }` |
| POST   | `/auth/login`        | public | `{ email, password }` → tokens + user |
| POST   | `/auth/refresh`      | public | `{ refreshToken }` — rotates the refresh token |
| POST   | `/auth/logout`       | public | `{ refreshToken? }` revokes it |
| GET    | `/auth/me`           | auth   | current user |
| PATCH  | `/auth/change-password` | auth | `{ currentPassword, newPassword }` |
| POST   | `/auth/forgot-password` | public | `{ email }` — link emailed (logged in dev), 30-min token |
| POST   | `/auth/reset-password` | public | `{ token, newPassword }` |

Refresh tokens are stored **hashed**; rotation invalidates the previous token.

### OAuth (Google / Facebook) `/auth/oauth`

Social login is **env-gated**: a provider is enabled only when its credentials exist,
otherwise `/start` returns **503 `OAUTH_NOT_CONFIGURED`** and unknown providers return **404**.
No extra dependencies — handshake is implemented with `fetch` + HMAC-signed state.

| Method | Path | Access | Notes |
| ------ | ---- | ------ | ----- |
| GET    | `/auth/oauth/providers` | public | `{ google: bool, facebook: bool }` — frontend uses this to enable/disable the social buttons |
| GET    | `/auth/oauth/:provider/start` | public | 302 redirect to Google/Facebook consent; `provider` ∈ `google\|facebook` |
| GET    | `/auth/oauth/:provider/callback` | public | provider redirects here; exchanges code → session, then 302 to `CLIENT_URL/auth/callback?code=<handoff>` (or `?error=<Bangla message>`) |
| POST   | `/auth/oauth/exchange` | public | `{ code }` → `{ accessToken, refreshToken, user }` — one-time handoff code, 60s expiry |

All three interactive endpoints (`/start`, `/callback`, `/exchange`) share a dedicated
strict limiter — **10 requests / 15 min / IP per path** (tunable via `OAUTH_RATE_LIMIT_MAX`),
tighter than the general auth limiter.

**Fail2ban guard:** এর উপরে `oauthFailureGuard` শুধু *ব্যর্য* চেষ্টা গোনে —
state tamper/replay, ভুয়া exchange কোড, অজানা প্রোভাইডার প্রোবিং। window-এ
`OAUTH_FAILURE_LIMIT` (default 5) ব্যর্থতা হলে সেই IP সব OAuth এন্ডপয়েন্টে
`OAUTH_FAILURE_BLOCK_MS` (default 15min) সময়ের 429 পায় (Retry-After সহ);
ব্লকড প্রতিটি চেষ্টা monitor-এ `failure_blocked` হিসেবে যায়। সফল লগইন/exchange
হলে IP-এর কাউন্টার মুছে যায়। knobs: `OAUTH_FAILURE_LIMIT`, `OAUTH_FAILURE_WINDOW_MS`,
`OAUTH_FAILURE_BLOCK_MS`।

**Monitoring:** OAuth activity is counted in-process — `start`, `start_failed`,
`provider_denied`, `state_failed` (tamper/expired/**replay**), `exchange_failed`,
`exchange_success`, `login_success`, `rate_limited`, `failure_blocked`. Failures are also logged as
`[oauth] ...` console warnings with IP + error code (no PII/tokens). Staff can read the
counters from `GET /admin/stats` under the `oauth` key (`counts` + `totalFailed`).
Counters reset on process restart; plug the `oauthMonitor.js` `recordOAuthEvent` calls
into a persistent sink (e.g. Mongo capped collection) if restart-persistent history is
needed.

**Environment variables** (backend/.env):

| Key | Purpose |
| --- | ------- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | enables Google login |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | enables Facebook login |
| `OAUTH_API_ORIGIN` | optional — origin the provider is redirected to (defaults to deriving `:5000` from `CLIENT_URL`) |

Redirect URI to register with the provider: `<OAUTH_API_ORIGIN | CLIENT_URL:5000>/api/v1/auth/oauth/<provider>/callback`

Flow: browser → `/start` → provider consent → `/callback` → backend creates the session
and redirects to the frontend `/auth/callback` page with a **one-time handoff code**;
the page POSTs it to `/oauth/exchange` to receive the tokens.

The handoff code is stored in **MongoDB** (`oauthhandoffs` collection, one-time use via
atomic find-and-delete, 60s TTL index auto-expires). It survives restarts and works
across multiple backend instances — any instance can serve the exchange.

Account linking: existing local accounts with the same email are linked automatically
(role is preserved); brand-new users are created as `USER`/`ACTIVE` with no password
(`authProvider: google|facebook`). If the provider does not return an email, the login
fails with `OAUTH_EMAIL_REQUIRED`. For Google, request the `email` scope consent.

**CSRF state is single-use**: each `/start` issues an HMAC-signed state whose nonce is
recorded in MongoDB (`oauthstatenonces`, 10-min TTL) and atomically consumed at the
callback — a replayed state fails with `OAUTH_STATE_INVALID`. Both state nonces and
handoff codes are therefore restart- and multi-instance-safe.

---


---

## Users `/users`

| Method | Path            | Access                  |
| ------ | --------------- | ----------------------- |
| GET    | `/users/me`     | auth — own profile      |
| PATCH  | `/users/me`     | auth — update name/phone/avatar |
| POST   | `/users/me/avatar` | auth — multipart `avatar` (≤2MB jpg/png/webp) |
| GET    | `/users/me/dashboard` | auth — biodata existence summary |
| GET    | `/users`        | ADMIN+ — list; filters `search, role, status` |
| POST   | `/users`        | ADMIN+ — create user    |
| GET    | `/users/:id`    | ADMIN+ / EDITOR — detail |
| PATCH  | `/users/:id`    | ADMIN+ — role/status/name (SUPERADMIN-protected) |
| DELETE | `/users/:id`    | ADMIN+ — soft-delete (deactivate + archive biodata) |

---

## Biodatas `/biodatas`

Public directory — search, filters, sorting, pagination.

**GET `/biodatas`** query params:
`search` (name/profession/education/location), `gender` (`MALE|FEMALE`),
`religion` (`Islam|Hinduism|Christianity|Buddhism|Other`),
`maritalStatus` (`UNMARRIED|DIVORCED|WIDOWED|OTHER`), `division`, `district`,
`education`, `occupation`, `skinColor`, `ageMin`, `ageMax`,
`sortBy` (`createdAt|updatedAt|age|fullName|viewCount`), `page`, `limit`.
Staff may add `all=1&status=...` to moderate.

| Method | Path | Access | Notes |
| ------ | ---- | ------ | ----- |
| POST   | `/biodatas` | auth | create draft (one per user) |
| GET    | `/biodatas/me` | auth | my biodata (any status) |
| PATCH  | `/biodatas/me` | auth | partial update |
| POST   | `/biodatas/me/submit` | auth | validates core fields → `PENDING` |
| POST   | `/biodatas/me/restore` | auth | restore archived → `DRAFT` |
| DELETE | `/biodatas/me` | auth | archive |
| POST   | `/biodatas/me/photos` | auth | multipart `photo` |
| GET    | `/biodatas/likes/sent` | auth | biodata I liked |
| GET    | `/biodatas/likes/received` | auth | people who liked mine |
| GET    | `/biodatas/:id` | public | summary for guests; full view costs **1 connect** for members (once per biodata) |
| GET    | `/biodatas/:id/similar` | public | same gender/religion/division |
| POST   | `/biodatas/:id/like` | auth | + notification; mutual match when reciprocal |
| DELETE | `/biodatas/:id/like` | auth | unlike |
| DELETE | `/biodatas/:id/photos/:index` | owner/staff | remove photo |
| PATCH  | `/biodatas/:id/profile-photo` | owner/staff | `{ url }` |
| PATCH  | `/biodatas/:id/status` | ADMIN/EDITOR | `{ status: APPROVED\|REJECTED\|HIDDEN, rejectionReason? }` |
| DELETE | `/biodatas/:id` | ADMIN | archive any |

Errors: `BIODATA_NOT_FOUND` (404, hidden for non-approved), `CONNECTS_INSUFFICIENT`
(403 → member has 0 connects), `BIODATA_INCOMPLETE` (422 + `missing` list).

---

## Membership `/membership`

| Method | Path | Access | Notes |
| ------ | ---- | ------ | ----- |
| GET    | `/membership/plans` | public | the 4 plans (monthly ৳699 … semi-annual ৳1299) |
| POST   | `/membership/plans` | ADMIN | create plan |
| PATCH/DELETE | `/membership/plans/:id` | ADMIN | update / delete |
| GET    | `/membership/packs` | public | extra-connect packs |
| POST/PATCH/DELETE | `/membership/packs(/:id)` | ADMIN | manage packs |
| GET    | `/membership/me` | auth | subscription, connect balance, stats (visits/likes) |

---

## Orders & payments `/orders`

| Method | Path | Access | Notes |
| ------ | ---- | ------ | ----- |
| GET    | `/orders` | ADMIN | all orders/invoices; `status, kind, search` |
| GET    | `/orders/me` | auth | my orders (invoices included when `PAID`) |
| POST   | `/orders` | auth | `{ kind: "PLAN", planId }` or `{ kind: "PACK", packId }`, optional `couponCode`, `billing{...}` |
| POST   | `/orders/validate-coupon` | auth | `{ code }` |
| GET    | `/orders/:id` | owner/ADMIN | order detail |
| POST   | `/orders/:id/pay` | owner | `{ paymentMethod, transactionRef? }` — **transactional** grant |
| POST   | `/orders/:id/cancel` | owner | only while `PENDING` |

Pricing response example:

```json
{
  "success": true,
  "data": {
    "id": "...", "orderNo": "ORD-2026-000042", "kind": "PLAN",
    "item": { "title": "Monthly", "unitPrice": 699, "connectCount": 10, "durationDays": 30 },
    "subtotal": 699, "discount": 0, "couponCode": null, "total": 699,
    "status": "PENDING"
  }
}
```

---

## Notifications `/notifications` (auth)

`GET /` (returns `unreadCount`), `PATCH /read-all`, `DELETE /`,
`PATCH /:id/read`, `DELETE /:id`.

---

## Messages `/conversations` (auth)

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET    | `/conversations` | list w/ partner + last message + unread handling |
| POST   | `/conversations` | `{ recipientId, text? }` |
| GET    | `/conversations/:id/messages` | marks incoming as read |
| POST   | `/conversations/:id/messages` | `{ text }` + recipient notification |
| PATCH  | `/conversations/:id/read` | mark read |
| DELETE | `/conversations/:id` | delete for me |

---

## Contacts `/contacts`

| Method | Path | Access | Notes |
| ------ | ---- | ------ | ----- |
| GET | `/contacts/new-count` | staff (ADMIN/SUPERADMIN/EDITOR) | `{ count }` — NEW স্ট্যাটাসের মেসেজ; 10s মাইক্রো-ক্যাশড, admin dashboard-এর লাইভ ব্যাজ এটা 30s-এ পোল করে |

`POST /contacts` (public, rate-limited) `{ firstName, lastName?, phone?, email, message }`.
স্প্যাম প্রতিরোধ: optional `website` (honeypot — লুকানো ফিল্ড, পূরণ হলেই বট) + `formElapsedMs` (ফর্ম মাউন্ট থেকে সাবমিট; 0 < ms < 2500 হলে বট) — ধরা পড়লে সাইলেন্ট ড্রপ: 201 + `{ id: null, spam: true }`, রেকর্ড সেভ হয় না; সার্ভার লগে `[contact] spam dropped`।

---

## Admin `/admin` + misc

- `GET /admin/stats` — ADMIN: users, biodatas, revenue (week/month), subscriptions, support counts.
- `GET /site/stats` — public landing counters.
- `GET /health` — liveness probe.

---

## File uploads

Multipart, field `photo` (biodata) or `avatar` (profile), ≤2MB, jpg/png/webp.
Files are stored under `backend/uploads/` and served at `/uploads/...`.
Production: point `UPLOAD_DIR` at an object store mount or replace the multer
storage with S3/Cloudinary.
