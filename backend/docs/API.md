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
| POST   | `/auth/forgot-password` | public | `{ email }` — link emailed (logged in dev) |
| POST   | `/auth/reset-password` | public | `{ token, newPassword }` |

Refresh tokens are stored **hashed**; rotation invalidates the previous token.

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

`POST /contacts` (public, rate-limited) `{ firstName, lastName?, phone?, email, message }`.
Staff: `GET /`, `GET /:id`, `PATCH /:id` (`status: NEW|REPLIED|CLOSED`, `reply?`), `DELETE /:id`.

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
