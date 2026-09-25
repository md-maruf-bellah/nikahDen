# নিকাহ দ্বীন (Nikah Deen) — Backend API

Production-ready REST API for the **Nikah Deen / Biye Sadi** matrimony platform.

Built from a full audit of the Next.js frontend in this repository. Pure
**JavaScript** (ESM): **Node.js + Express + MongoDB + Mongoose + JWT + Zod**.
No TypeScript anywhere.

```
Frontend pages/forms  →  Modules (auth, biodatas, membership, orders, ...)
                              ↓
                    REST API under /api/v1
                              ↓
          Controllers (thin) → Services (business logic) → Mongoose models
```

---

## Stack

| Layer      | Choice                                            |
| ---------- | ------------------------------------------------- |
| Runtime    | Node.js ≥ 18.17 (ESM)                             |
| Framework  | Express 4                                         |
| Database   | MongoDB + Mongoose 8                              |
| Auth       | JWT access (15m) + rotating refresh (7d, hashed in DB) |
| Validation | Zod (body / query / params)                       |
| Files      | Multer → local `uploads/` (swap for S3 in prod)   |
| Security   | helmet, CORS whitelist, rate limits, bcrypt, tenant/user isolation |

---

## Quick start

```bash
cd backend
npm install
cp .env.example .env        # adjust MONGODB_URI
npm run seed                # admin + demo data (idempotent)
npm run dev                 # http://localhost:5000
```

Verify: `curl http://localhost:5000/health`

### Local MongoDB setup

- **Simplest:** install MongoDB Community and run `mongod` (default port 27017).
  The API works, and `withTransaction` transparently falls back to running
  without a transaction when MongoDB is a standalone (no replica set).
- **With transactions** (recommended for the payment flow): use MongoDB Atlas
  (free M0 cluster) or start a local replica set:
  `mongod --replSet rs0` then once: `rs.initiate()`.

### Seeded accounts

| Role        | Email                 | Password     |
| ----------- | --------------------- | ------------ |
| SUPERADMIN  | `admin@nikahdeen.dev` | `Admin@12345`|
| ADMIN       | `staff@nikahdeen.dev` | `Admin@12345`|
| USER        | `demo@nikahdeen.dev`  | `Demo@12345` |
| USER (x13)  | `member1..13@nikahdeen.dev` | `Member@12345` |

`npm run seed -- --reset` drops the database first.

---

## Scripts

```bash
npm run dev      # watch mode
npm start        # production start
npm run seed     # idempotent seed
npm run seed:reset
npm test         # integration tests (spins an in-memory MongoDB; downloads a
                 # mongod binary on first run)
```

---

## Response envelope

```jsonc
// success
{ "success": true, "message": "...", "data": {...},
  "pagination": { "page": 1, "limit": 20, "total": 33, "totalPages": 2 } }

// error
{ "success": false, "message": "...", "errorCode": "BIODATA_NOT_FOUND",
  "details": [ { "field": "email", "message": "..." } ] }
```

All endpoints are namespaced under **`/api/v1`**. Auth is
`Authorization: Bearer <accessToken>` (or httpOnly cookies with `USE_COOKIES=true`).

---

## Modules ↔ Frontend pages

| Frontend page(s)                    | Backend module / endpoints                            |
| ----------------------------------- | ----------------------------------------------------- |
| Landing search, /list, /details     | `GET /api/v1/biodatas`, `/biodatas/:id`, `/:id/similar` |
| /biodata (8-step form)              | `POST/PATCH/GET/DELETE /biodatas/me*`, `POST /biodatas` |
| /register, /login, /email, /reset   | `POST /auth/register, /login, /forgot-password, /reset-password` |
| /member, /checkout, /payment, /success | `GET /membership/plans`, `POST /orders`, `POST /orders/:id/pay` |
| Profile → member dashboard           | `GET /membership/me` (subscription, connects, stats)  |
| Profile → like list                  | `GET /biodatas/likes/sent`, `/biodatas/likes/received`, like/unlike |
| Profile → notifications              | `/notifications*`                                     |
| Profile → messaging / /message      | `/conversations*`                                     |
| /contact + admin "Support" tab       | `POST /contacts`, staff `GET/PATCH /contacts`         |
| Admin dashboard → user management    | `/users` (staff), `/auth/change-password`, `/admin/stats` |

The frontend currently renders demo data with **no fetch layer**. A ready-made
client (`src/lib/api.js` in the project root) matches these routes, and
`register`/`login` are wired to the real API. See
[`docs/API.md`](docs/API.md) for the full reference.

---

## Roles & authorization

| Role        | Meaning                          |
| ----------- | -------------------------------- |
| SUPERADMIN  | Platform owner (seeded)          |
| ADMIN       | Full admin dashboard access      |
| EDITOR      | Content moderation (biodata, contacts) |
| USER        | Regular member                   |

Middleware: `authenticate` → `authorize("ADMIN", ...)` / `requirePermission("biodata:approve")`.
The backend **always** enforces ownership ("you may only edit your own
biodata") and staff permissions — never trust the client.

> The admin user-table in the frontend offers an *Owner* option; that maps to
> the seeded SUPERADMIN account.

---

## Money & connects

- Prices are **integer BDT** (৳699 / 899 / 1099 / 1299 + connect packs). No
  floats — discounts use integer math. (For sub-taka precision later, switch
  to paisa integers.)
- Members buy a **plan** (grants a subscription term + connects) or a
  **connect pack**. Every connect change is appended to an audit ledger
  (`ConnectTransaction`); the balance is the SUM of the ledger, so nothing can
  silently drift.
- Viewing another member's biodata costs 1 connect (one charge per biodata per
  member). Staff & owners always see full details.
- `POST /orders/:id/pay` runs inside a **MongoDB transaction**: order → PAID,
  invoice number, subscription activation and connect credits commit together
  or not at all. The gateway is simulated (`SIM-…` transaction id) — wire a
  real PSP there for production.

---

## Project layout

```
backend/
├── src/
│   ├── app.js / server.js
│   ├── config/          env, db (transactions), cors
│   ├── constants/       roles, permissions, enums
│   ├── middleware/      auth, authorize, validate, error, upload, rate-limit
│   ├── models/          User, Biodata, Order, Subscription, ... (16 models)
│   ├── modules/
│   │   ├── auth/        register, login, refresh, logout, me, passwords
│   │   ├── users/       self profile + admin user management
│   │   ├── biodatas/    directory CRUD, filters, likes, photos, moderation
│   │   ├── membership/  plans, connect packs, my-membership, connect ledger
│   │   ├── orders/      checkout, coupons, pay (transaction), invoices
│   │   ├── notifications/
│   │   ├── messages/    conversations between members
│   │   ├── contacts/    public contact form + staff inbox
│   │   └── admin/       dashboard stats
│   ├── routes/index.js  mounts everything at /api/v1
│   └── utils/           ApiError, ApiResponse, asyncHandler, pagination, email
├── scripts/seed.js
├── tests/               integration tests (node --test + supertest)
└── docs/API.md          full endpoint reference
```
