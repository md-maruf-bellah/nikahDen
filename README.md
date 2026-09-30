# নিকাহ দ্বীন (Nikah Deen) — মুসলিম ম্যাট্রিমনি প্ল্যাটফর্ম

[![CI](https://github.com/md-maruf-bellah/nikahDen/actions/workflows/ci.yml/badge.svg)](https://github.com/md-maruf-bellah/nikahDen/actions/workflows/ci.yml)

প্র্যাকটিসিং মুসলিমদের জন্য বিয়ের বায়োডাটা, ম্যাচিং, মেম্বারশিপ ও মেসেজিং — এক প্ল্যাটফর্মে।
UI সম্পূর্ণ **বাংলায়**, ডিজাইন সিস্টেম: Next.js + Tailwind + **daisyUI** (রেড `#FD6969` থিম)।

| অংশ        | টেক-স্ট্যাক                                                                 | পোর্ট |
| ---------- | --------------------------------------------------------------------------- | ----- |
| ফ্রন্টএন্ড | Next.js (App Router), React, Tailwind CSS, daisyUI, lucide-react            | 3000  |
| ব্যাকএন্ড  | Node.js (ESM), Express 4, MongoDB + Mongoose 8, JWT, Zod, helmet, bcrypt    | 5000  |

```
src/        → Next.js ফ্রন্টএন্ড (পাবলিক পেজ, /dashboard অ্যাডমিন, /profile মেম্বার)
backend/    → REST API (/api/v1) — মডিউল-ভিত্তিক: auth, biodatas, membership, orders, ...
docs/       → ROUTES.md (ফ্রন্টএন্ড রাউটিং ম্যাপ)
assets/, public/ → স্ট্যাটিক অ্যাসেট
```

---

## CI স্ট্যাটাস

[![CI](https://github.com/md-maruf-bellah/nikahDen/actions/workflows/ci.yml/badge.svg)](https://github.com/md-maruf-bellah/nikahDen/actions/workflows/ci.yml)

`.github/workflows/ci.yml` — **প্রতিটি push-এ** (সব ব্রাঞ্চ) দুটি জব চলে, একটি চলমান রান
নতুন push-এ অটো-ক্যান্সেল হয় (`concurrency`):

| জব                            | কী চলে                                                              | স্থানীয় সমতুল্য            |
| ----------------------------- | ------------------------------------------------------------------- | --------------------------- |
| **Backend tests (Node 22)**   | `npm ci && npm test` — ১০২টি integration টেস্ট (in-memory MongoDB)  | `cd backend && npm test`    |
| **Frontend build**            | `npm ci && npm run build` — Next.js প্রোডাকশন বিল্ড                 | `npm run build`             |

> **নোট:** রানারে mongodb-memory-server-এর ডিফল্ট mongod বাইনারি ব্যর্থ হয় বলে
> CI-তে `MONGOMS_VERSION=7.0.24` পিন করা আছে (OpenSSL 3 লিংকড, ubuntu-24.04-এ চলে)।
> লোকাল টেস্টেও একই ভ্যারিয়েবল ব্যবহার করাই ভালো — নিচে [টেস্ট](#টেস্ট) সেকশন দেখুন।

---

## দ্রুত শুরু

**প্রয়োজনীয়তা:** Node.js ≥ 18.17 (CI Node 22-তে চালায়), MongoDB (লোকাল `mongod` বা Atlas M0)।

### ১. ব্যাকএন্ড (API — :5000)

```bash
cd backend
npm install
cp .env.example .env      # দরকার হলে MONGODB_URI ঠিক করুন
npm run seed              # admin + ডেমো ডেটা (idempotent)
npm run dev               # http://localhost:5000
```

সিড করা অ্যাকাউন্ট (SUPERADMIN): `admin@nikahdeen.dev` / `Admin@12345` —
পুরো তালিকা [backend/README.md](backend/README.md)-তে।

### ২. ফ্রন্টএন্ড (:3000)

```bash
npm install
npm run dev               # http://localhost:3000
```

---

## স্ক্রিপ্ট

**রুট (ফ্রন্টএন্ড):**

| স্ক্রিপ্ট        | কাজ                              |
| ---------------- | -------------------------------- |
| `npm run dev`    | dev সার্ভার (:3000)              |
| `npm run build`  | প্রোডাকশন বিল্ড (CI-তেও চলে)     |
| `npm start`      | প্রোডাকশন সার্ভার                |
| `npm run lint`   | ESLint                           |

**ব্যাকএন্ড (`cd backend`):**

| স্ক্রিপ্ট                  | কাজ                                                |
| -------------------------- | -------------------------------------------------- |
| `npm run dev`              | watch-mode API (:5000)                             |
| `npm run dev:memory`       | in-memory MongoDB দিয়ে dev (Mongo ইনস্টল ছাড়াই)   |
| `npm start`                | প্রোডাকশন স্টার্ট                                  |
| `npm run seed`             | idempotent সিড (admin + ডেমো)                      |
| `npm run seed:reset`       | ডাটাবেস ফেলে নতুন করে সিড                          |
| `npm test`                 | সম্পূর্ণ integration টেস্ট স্যুট                   |
| `npm run verify:lifecycle` | লাইভ API-তে রেজিস্ট্রেশন→পেমেন্ট→ম্যাচিং স্মোক     |
| `npm run check`            | সিনট্যাক্স চেক                                     |

---

## টেস্ট

```bash
cd backend
MONGOMS_VERSION=7.0.24 npm test
```

- `node --test` + supertest — আসল Express অ্যাপ, in-memory MongoDB
  (replica set পেলে আসল ট্রানজ্যাকশন, না পেলে স্বয়ংক্রিয় fallback)
- কভারেজ: auth + OAuth, biodata, membership/orders, social (like/message/contact),
  preferences, completion, messaging guard — **১০২ টেস্ট**
- প্রথম রানে mongod বাইনারি ডাউনলোড হয় (একবারই)

---

## মেসেজিং নিয়মাবলী (guard)

সব মেসেজ-এন্ট্রি পয়েন্টে একটাই চৌকাঠ — `assertMessagingPermission`
(`backend/src/modules/messages/messagingGuard.service.js`)। প্রিসিডেন্স ক্রমে:

1. **ম্যাচ** — দুজনে একে অপরকে পছন্দ করলে (mutual like) সীমাহীন কথা।
2. **প্যাকেজ** — প্রেরকের active plan-এ `messagingEnabled: false` হলে 403
   `NO_MESSAGING_PACKAGE`; `messagingLimit: 0` হলে 402 `MESSAGING_UPGRADE_REQUIRED`;
   ধনাত্মক সীমা হলে sender→recipient জোড়া-প্রতি গণনা, শেষ হলে 403 `MESSAGING_LIMIT_REACHED`।
3. **ব্লক** — যেকোনো দিক থেকে block থাকলে নীরব দেয়াল: উভয় পক্ষই নিরপেক্ষ 403
   `BLOCKED` দেখে, তাই কেউ অন্যের block-state অনুমান করতে পারে না।

UI-ও নিয়মগুলো আগে থেকেই দেখায় — মেসেঞ্জার সার্চে guard-প্রিভিউসহ নিষ্ক্রিয় রো,
বায়োডাটা কার্ডের Message বোতামে `?chat=` ডিপ-লিংক (লগইন না থাকলে `?next=` দিয়ে ফেরত),
আর guard-এররে বাংলা নোটিস + আপগ্রেড লিংক।

**সংশ্লিষ্ট এন্ডপয়েন্ট** (বিস্তারিত [backend/docs/API.md](backend/docs/API.md)):

| এন্ডপয়েন্ট                      | কাজ                                                         |
| ------------------------------- | ----------------------------------------------------------- |
| `GET /users/search`             | সদস্য-খোঁজা (ACTIVE only, নিজে বাদ, নাম/ছবিই শুধু ফেরে)      |
| `GET /users/search-intent`      | guard-প্রিভিউ — `canMessage`, `blocked`, `reason`            |
| `POST /blocks`                  | সদস্য ব্লক (নীরব — পক্ষ জানে না)                            |
| `DELETE /blocks/:userId`        | আনব্লক                                                      |
| `GET /blocks`                   | আমার ব্লক তালিকা                                            |

---

## নিরাপত্তা (হাইলাইট)

- **Auth:** JWT access (15m) + ঘূর্ণায়মান refresh token (DB-তে hashed — রিস্টার্ট-পার্সিস্টেন্ট) + httpOnly-cookie মোড।
  Refresh-রোটেশনে ৬০ সেকেন্ডের reuse-grace উইন্ডো: রোটেশনের সাথে-সাথে পুরনো টোকেন আবার এলে সেটি কনকারেন্ট
  ট্যাব/রিস্টার্ট-পরবর্তী স্ট্যাম্পিডের বেনাইন রেস (access token রি-ইস্যু, successor অক্ষত); গ্রেস-শেষে replay
  মানেই আসল reuse-attack — পুরো session family রিভোক। ফ্রন্টএন্ড রিফ্রেশ single-flight — এক পেজের সব 401
  একটাই /auth/refresh কলে মেটে।
- **OAuth (Google/Facebook):** Mongo-backed single-use handoff code (60s TTL) + HMAC-signed,
  replay-protected state nonce (10min TTL)
- **Abuse প্রতিরোধ:** রাউট-ভিত্তিক রেট-লিমিট — পড়া-শুধু (GET/OPTIONS) ট্রাফিক উদার আলাদা বাকেটে
  (`RATE_LIMIT_READ_MAX`, 600/15min — স্বাভাবিক ব্রাউজিংয়ে 429 নেই), লেখা/auth-নির্ভর কঠোর বাকেটে
  (`RATE_LIMIT_MAX`, 300/15min), auth 20/15min, contact 10/hr; OAuth এন্ডপয়েন্টে ডেডিকেটেড limiter
  (10/15min) + **fail2ban guard** — ব্যর্থ exchange/state-চেষ্টায় ৫ বারে IP ব্লক (429 + Retry-After);
  সফল লগইনে কাউন্টার রিসেট
- **Contact ফর্ম:** honeypot + time-trap স্প্যাম ডিফেন্স (বট সাইলেন্টলি ফেলা হয়; ড্রপ-ইভেন্ট capped collection-এ persist — `GET /admin/contact/events`) + 10/hr limiter
- সব রেট-লিমিট ও OAuth কাউন্টার অ্যাডমিন `GET /admin/stats`-এ দৃশ্যমান;
  ইভেন্ট-হিস্ট্রি Mongo capped collection-এ persist হয় — `GET /admin/oauth/events`-এ রিস্টার্টের পরেও পাওয়া যায়

---

## ডকুমেন্টেশন

| ডক                                     | বিষয়                                    |
| --------------------------------------- | ---------------------------------------- |
| [backend/README.md](backend/README.md)  | API আর্কিটেকচার, মডিউল, রোল, পেমেন্ট ফ্লো |
| [backend/docs/API.md](backend/docs/API.md) | সম্পূর্ণ এন্ডপয়েন্ট রেফারেন্স        |
| [docs/ROUTES.md](docs/ROUTES.md)        | ফ্রন্টএন্ড রাউট ↔ API ম্যাপ              |
