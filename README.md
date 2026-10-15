# Development of an Intelligent Blood Donation Management Platform Integrated with an AI Chatbot for Donor and Hospital Support

A full-stack web application for intelligent blood donation management — connecting donors, patients, and hospitals across Cambodia with real-time data and AI-powered support.

An individual graduation project (DATN) by **Vith Vath**, 4th-year Data Science student at **Hanoi University of Science and Technology (HUST)**, Hanoi, Vietnam — designed and built end to end, from the database and API to the website and the AI assistant.

| | Link |
|---|---|
| Live site (Vercel) | `https://<your-project>.vercel.app` — add after deploying |
| API (Render) | `https://<your-service>.onrender.com/health` — add after deploying |
| Deployment guide | [Deployment](#deployment) below |

---

## Where to Find Things (Guide for Reviewers)

The repository has two apps: **`Backend/`** (the API) and **`frontend/`** (the website). Each backend
feature is one folder in `Backend/src/` holding its database model (`*.model.js`) and its API routes
(`*.routes.js`). Each website page is one folder in `frontend/src/app/`, named after its URL.

| Feature | API (backend) | Website (frontend) | Tests (`Backend/tests/`) |
|---|---|---|---|
| **AI chatbot** | `Backend/src/chatbot/chat.routes.js` (Gemini call), `chat.prompt.js` (instructions) | `frontend/src/components/chat/ChatBot.jsx`, page `app/(public)/assistant/`, `lib/chat-client.js` | `chat.test.js`, `chat-assistant.test.js` |
| Chatbot offline fallback (no AI) | — | `frontend/src/lib/chatbot-kb.js` (rule-based answers in EN / KM / VI) | — |
| **Chatbot evaluation** (thesis results) | `Backend/src/evaluation/` — run `node src/evaluation/runEval.js` | — | dataset `evaluation/questions.json`, guide `evaluation/README.md` |
| Login, JWT, roles (RBAC) | `Backend/src/common/session.js`, `common/middleware/require-role.js`, `assert-hospital-scope.js` | `frontend/src/store/AuthContext.jsx` (staff), `UserAuthContext.jsx` (donors) | `auth.test.js`, `rbac.test.js`, `admin-session.test.js` |
| Donor accounts | `Backend/src/users/` | `app/(auth)/login`, `app/(auth)/register`, `app/(donor)/profile` | `auth.test.js` |
| Donor registration & directory | `Backend/src/donor/` | `app/(public)/donate`, `app/(public)/donors` | `donor.test.js` |
| QR donor card & check-in | `Backend/src/donor/donor.routes.js` (`/qr-token`, `/verify-qr`) | `app/(donor)/qr-card`, `app/dashboard/hospital/scan` | `donor.test.js` |
| Blood requests | `Backend/src/requests/` | `app/(public)/requests`, `app/dashboard/admin/requests`, `app/dashboard/hospital/requests` | `requests.test.js`, `request-cancel.test.js` |
| Appointments | `Backend/src/appointments/` | `app/(public)/appointments`, `app/dashboard/*/appointments` | `appointments.test.js` |
| Blood inventory | `Backend/src/inventory/`, thresholds in `common/stock-status.js` | `app/dashboard/admin/inventory`, `app/dashboard/hospital/inventory` | `inventory.test.js` |
| Hospitals & staff | `Backend/src/hospital/`, `Backend/src/staff/` | `app/dashboard/admin/hospitals`, `app/dashboard/hospital/profile` | `hospital.test.js`, `staff.test.js` |
| Admin dashboard & analytics | `Backend/src/dashboard/stats.routes.js`, `Backend/src/analytics/` | `app/dashboard/admin/` (overview), `admin/analytics` | `stats.test.js`, `analytics.test.js` |
| Hospital map | `Backend/src/nearby/nearby.routes.js` (OpenStreetMap lookup) | `app/(public)/map/` | `nearby.test.js` |
| Messages & notifications | `Backend/src/notification/` | `app/(donor)/notification` | `message.test.js`, `notifications.test.js` |
| Contact form | `Backend/src/contact/` | `app/(public)/contact` | `contact.test.js` |
| About page creator photo | `Backend/src/about/` (`/api/about`) | `app/(public)/about/_components/CreatorProfile.jsx`, admin `app/dashboard/admin/settings` → *About Page* | `about.test.js` |
| Photo uploads | `Backend/src/common/upload.js` (JPG/PNG/WebP/GIF, 10 MB, unique filenames) | — | `staff-photo.test.js`, `hospital-image.test.js` |
| Security (CORS, rate limits, input checks) | `Backend/src/app.js`, `common/cors.js`, `common/middleware/` | — | `cors.test.js`, `robustness.test.js`, `errors.test.js` |
| Deployment | `render.yaml`, `Backend/server.js` | `frontend/vercel.json`, `frontend/next.config.js` | see [Deployment](#deployment) |

Shared building blocks: `Backend/src/common/` (backend helpers) and `frontend/src/components/ui/`
(reusable cards, badges and headers, described in its own `README.md`). To run everything locally, see
[Getting Started](#getting-started); to run the tests, `cd Backend && npm test`.

---

## Abstract

This project presents the design and development of an intelligent blood donation management platform that streamlines the process of blood collection, distribution, and emergency response. The system integrates an AI-powered chatbot, backed by Google Gemini, capable of answering donor questions and guiding people through the site in English, Khmer and Vietnamese. The platform enables donors to register, schedule appointments, and track their contribution history, while hospitals — each with their own scoped staff accounts — can submit urgent blood requests and manage their own inventory independently of other hospitals.

---

## Features

### Public Portal
- **Donor Registration** — Register with blood type, location, availability, and photo
- **AI Chatbot** — Gemini-powered assistant that answers donation and site questions; auto-detects Khmer/Vietnamese/English and falls back to a rule-based knowledge base if the AI API is unavailable. Slow Gemini calls are hedged with a backup request, and common opening questions are answered from a short-lived cache
- **Blood Requests** — Submit urgent blood requests with urgency level, units needed, and patient details; signing in from the form returns you to it with your draft kept
- **Appointment Booking** — 3-step calendar booking at partner hospitals, with QR-code check-in
- **Donor Directory** — Browse and filter verified donors by blood type
- **Blood Type Compatibility Guide** — Interactive reference chart
- **Contact Form & Messaging** — Send messages to the platform team, direct user↔admin conversations
- **Social Login** — Google and Facebook OAuth alongside email/password
- **About Page** — the project's story and its creator, with a portrait managed from the admin settings

### Admin Dashboard (`/dashboard/admin`)
- Secure JWT-based login (role: `admin`)
- Real-time stats: Total Donors, Blood Units, Requests, Appointments
- Blood inventory management with critical/low/normal status
- Full CRUD for donors, blood requests, hospitals, staff accounts, and contact messages
- Analytics charts: BarChart, PieChart (donut), AreaChart, LineChart
- CSV export of dashboard data
- Settings: own profile and photo, homepage profiles, the About page creator photo (upload / delete), live AI status

### Hospital Dashboard (`/dashboard/hospital`)
- Separate login for hospital staff accounts (role: `hospital_staff`)
- Scoped strictly to that hospital's own data — enforced server-side, not just hidden in the UI
- Manage that hospital's appointments, inventory, and incoming blood requests
- QR-code scanner for donor check-in at appointments

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Material UI 7 |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs, role-based middleware (`admin` / `hospital_staff` / `donor`) |
| Security | helmet, express-rate-limit, express-mongo-sanitize |
| Charts | Recharts |
| AI Chatbot | Google Gemini API (`@google/genai`), rule-based fallback |
| File Upload | Multer |
| QR Codes | react-qr-code (generate), html5-qrcode (scan) |
| Testing | Jest, Supertest, mongodb-memory-server |
| Font | Inter (Google Fonts) |

---

## Getting Started

### Prerequisites
- Node.js >= 20
- MongoDB (local or Atlas)

### Configuration — two env files, one per app

```
Blood-Donated/
├── Backend/.env            # API secrets and database   (git-ignored)
├── frontend/.env.local     # public browser settings    (git-ignored)
└── .gitignore
```

Create both by hand with the variables below; they are never committed. On Render and Vercel there are no files: paste the same names into each dashboard (Render gets the Backend list, Vercel gets the frontend list).

**`Backend/.env`**

| Variable | Required | What it is |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string, e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/blood-donation` (allow your host's IPs in Atlas) |
| `JWT_SECRET`, `QR_JWT_SECRET` | yes | Two different long random strings (`node scripts/generate-secrets.js` prints fresh ones) |
| `PORT` | no | Defaults to `3001` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` | first start | First admin, created on startup if missing. `node scripts/generate-secrets.js` prints the bcrypt hash |
| `GEMINI_API_KEY` | no | Google Gemini key for the AI assistant (server-side only); without it the assistant uses offline answers |
| `GEMINI_MODEL` | no | Gemini model ID; defaults to `gemini-3.5-flash-lite` |
| `GEMINI_HEDGE_MS` | no | Milliseconds before a slow Gemini call gets a backup request (default `4000`) |
| `FRONTEND_URL` | in production | Origins allowed to call the API, comma-separated; `*` matches one hostname part (covers Vercel preview URLs). localhost is always allowed |
| `NODE_ENV`, `TRUST_PROXY`, `RATE_LIMIT_MAX` | no | Production tuning; see Deployment |

**`frontend/.env.local`** (`NEXT_PUBLIC_*` values are baked in at build time — redeploy after changing them)

| Variable | Required | What it is |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | Where the backend lives, no trailing slash (`http://localhost:3001` locally) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_FACEBOOK_APP_ID` | no | Social sign-in buttons appear only when set |

### Backend

```bash
cd Backend
npm install
```

```bash
npm run dev    # auto-restarts on file changes
# or
npm start
```

Run the test suite:
```bash
npm test
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local` first (see [Configuration](#configuration--two-env-files-one-per-app)); Next.js reads it automatically.

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

---

## Deployment

BloodLife is **two apps and a database**, deployed separately:

| Part | Folder | Host | Root directory setting |
|---|---|---|---|
| Frontend (Next.js 15) | `frontend/` | Vercel | `frontend` |
| Backend API (Express 5) | `Backend/` | Render (web service) | `Backend` |
| Database | — | MongoDB Atlas | — |

The frontend calls the API from the visitor's browser at `NEXT_PUBLIC_API_URL`; the API only answers
browsers whose origin is listed in `FRONTEND_URL` (CORS). Both values must point at each other, which
is why the order below matters.

**Deployment order:** Atlas → Render (API) → Vercel (frontend) → back to Render to set `FRONTEND_URL`.

### 0. Before you start

- A GitHub repo containing this project (Render and Vercel deploy from it).
- Node.js 20 or newer locally (the backend's `engines` field requires it; Render reads that field).
- Generate the secrets once, locally:

  ```bash
  cd Backend
  npm install
  node scripts/generate-secrets.js
  ```

  It asks for the first admin's password (hidden as you type) and prints `JWT_SECRET`, `QR_JWT_SECRET`
  and `ADMIN_PASSWORD_HASH`. Keep them somewhere safe; never commit them.

### 1. MongoDB Atlas

1. Create a project and a cluster (the free M0 tier is enough to start).
2. **Database Access** → *Add New Database User* → username + strong password, role *Read and write to any database*.
3. **Network Access** → *Add IP Address* → `0.0.0.0/0`. Render's outbound IPs change (fixed IPs need a paid
   plan), so Atlas must accept any address; the database user's password is what protects it.
4. **Connect** → *Drivers* → copy the `mongodb+srv://…` string. Replace `<password>` and add a database name
   before the `?`, e.g.

   ```
   mongodb+srv://bloodlife:<password>@cluster0.abcde.mongodb.net/blood-donation?retryWrites=true&w=majority
   ```

   If the password contains `@ : / ? # [ ]` or `%`, URL-encode it (e.g. `@` → `%40`).

The API creates its collections and indexes on first start. There is nothing to import.

### 2. Backend on Render

**Option A — Blueprint (uses `render.yaml`).** Render dashboard → *New* → *Blueprint* → pick the repo.
The blueprint creates the `blood-donated-api` web service with root directory `Backend`, build
`npm install`, start `npm start`, health check `/health`, `NODE_ENV=production`, and random
`JWT_SECRET` / `QR_JWT_SECRET`. It then asks for the values marked `sync: false`.

**Option B — manual.** *New* → *Web Service* → repo → Root Directory `Backend`, Runtime *Node*,
Build Command `npm install`, Start Command `npm start`, Health Check Path `/health`. Add every variable
below yourself, including `NODE_ENV=production`.

#### Backend environment variables

| Variable | Required? | Value |
|---|---|---|
| `NODE_ENV` | **required** | `production` (set by the blueprint) |
| `MONGO_URI` | **required** | Atlas string from step 1 |
| `JWT_SECRET` | **required** | From `generate-secrets.js` (the blueprint generates one) |
| `QR_JWT_SECRET` | **required** | A *different* random string (the blueprint generates one) |
| `ADMIN_EMAIL` | required on first deploy | First admin's login email |
| `ADMIN_PASSWORD_HASH` | required on first deploy | bcrypt hash from `generate-secrets.js` — never the plain password |
| `FRONTEND_URL` | required in production | Your Vercel URL(s) — leave a placeholder for now, set it in step 4 |
| `GEMINI_API_KEY` | optional | Google Gemini key for the AI assistant. Without it the chat answers from the offline guide |
| `GEMINI_MODEL` | optional | Defaults to `gemini-3.5-flash-lite` |
| `GEMINI_HEDGE_MS` | optional | Wait before a slow Gemini call gets a backup request (default `4000`) |
| `RATE_LIMIT_MAX` | optional | Requests per IP per 15 min on `/api` (default 1500) |
| `TRUST_PROXY` | optional | Proxy hops in front of the app (default 1 in production — right for Render) |

Do **not** set `PORT`: Render provides it and the server listens on `process.env.PORT`.

With `NODE_ENV=production` the API **refuses to start** if `MONGO_URI`, `JWT_SECRET` or `QR_JWT_SECRET`
is missing, and the log names the missing variable. It logs a warning (but starts) when
`FRONTEND_URL` or `GEMINI_API_KEY` is missing.

#### Check the API

When the deploy is live, open:

```
https://<your-service>.onrender.com/health
```

Expected: `{"status":"ok","database":"connected","uptimeSeconds":…}`.
`"database":"disconnected"` means the API is up but cannot reach Atlas; see *Troubleshooting* below.
Every other `/api/*` route (except chat and nearby-hospital search) answers `503 Database unavailable`
until the database connects.

Copy the service URL (no trailing slash) for the next step.

### 3. Frontend on Vercel

1. Vercel → *Add New* → *Project* → import the repo.
2. **Root Directory: `frontend`** (Edit next to the folder name). Framework preset: *Next.js*
   (also pinned in `frontend/vercel.json`). Leave build and output settings at their defaults.
3. **Environment Variables** (enable for *Production* and *Preview*):

   | Variable | Required? | Value |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | **required** | The Render URL from step 2, e.g. `https://blood-donated-api.onrender.com` — no trailing slash |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | optional | Shows the Google sign-in button |
   | `NEXT_PUBLIC_FACEBOOK_APP_ID` | optional | Shows the Facebook sign-in button |

   `NEXT_PUBLIC_*` values are compiled into the browser bundle: **only public values** belong here. The
   Gemini key, database URL and JWT secrets live on Render only.
4. Deploy. The build log must **not** show *"NEXT_PUBLIC_API_URL is not set"* — if it does, the variable
   was missing for that build: add it and redeploy.

### 4. Connect the two (CORS)

Back on Render → the service → *Environment* → set `FRONTEND_URL` to the Vercel address(es),
comma-separated, without trailing slashes:

```
https://blood-donated.vercel.app,https://blood-donated-*-your-team.vercel.app
```

- The first entry is the production domain (add your custom domain too if you use one).
- The second, with `*`, matches Vercel's per-deployment **preview** URLs. `*` stands for exactly one
  hostname part, so look-alike domains are still refused.
- `localhost:3000/3002/3003` are always allowed for local development.

Saving restarts the service. Then open the Vercel site with the browser's developer console open.

### 5. Social sign-in (only if you set the client IDs)

- **Google:** Google Cloud Console → *APIs & Services* → *Credentials* → your OAuth client →
  *Authorized JavaScript origins* → add the Vercel production domain (and custom domain).
- **Facebook:** Meta for Developers → your app → *Facebook Login* → settings → add the Vercel domain
  to the allowed domains.

### 6. Smoke test after every deploy

1. `https://<api>/health` → `"database":"connected"`.
2. Open the site: the home page statistics and the hospital map load; the console shows no CORS errors
   and no requests to `localhost:3001`.
3. Sign in as the admin at `/admin/login` with `ADMIN_EMAIL` and the password you hashed.
4. Open the chat and ask a question. With `GEMINI_API_KEY` set you get an AI answer; without it, or if
   Gemini fails, the built-in offline guide answers instead (the chat says so).
5. Register a test donor account, then delete it from the admin dashboard.

### Things that do not persist on Render

- **Uploaded photos** (donor, staff, hospital and About page images) are written to `Backend/uploads` on the
  instance's disk. On Render that disk is **temporary**: it is wiped on every deploy and restart, and the
  free plan also restarts after sleeping. The database keeps the `/uploads/…` path, so the image then shows
  as missing. To keep uploads, either:
  - use a paid instance and add a persistent disk (uncomment the `disk:` block in `render.yaml`,
    mount path `/opt/render/project/src/Backend/uploads`), or
  - move uploads to object storage (e.g. Cloudinary or S3). That is a code change and is not done yet.
- **Everything else** — accounts, donors, requests, appointments, inventory, messages — is in MongoDB
  Atlas and survives restarts.
- **Free plan sleep:** the API sleeps after ~15 minutes without traffic; the next request takes about a
  minute while it wakes.

### Redeploying

- **Code changes:** push to the deployed branch. Vercel and Render both redeploy automatically (Render:
  *Auto-Deploy* on; otherwise *Manual Deploy* → *Deploy latest commit*).
- **Changed a Render variable:** saving it restarts the service; nothing else to do.
- **Changed a Vercel `NEXT_PUBLIC_*` variable:** it is baked in at build time — *Deployments* → latest →
  ⋯ → *Redeploy*.
- **Rotating `JWT_SECRET`:** signs everyone out. Rotating `QR_JWT_SECRET` invalidates donors' printed QR cards.
- **Rollback:** Render → *Events* → pick an earlier deploy → *Rollback*; Vercel → *Deployments* → earlier
  deployment → *Promote to Production*.

### Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Render deploy fails with *"Missing required environment variable(s): …"* | Add the named variable(s) under *Environment*. |
| `/health` says `"database":"disconnected"`; log shows *MongoDB connection failed* | Atlas Network Access lacks `0.0.0.0/0`, wrong password (or special characters not URL-encoded), or the cluster is paused. |
| `/api/...` returns `503 Database unavailable` | Same as above: the API is up but not connected to Atlas. |
| Browser console: *blocked by CORS policy* | `FRONTEND_URL` on Render doesn't list that exact origin (scheme + host, no path, no trailing slash). Preview URL? Add the `*` pattern. |
| Site calls `http://localhost:3001` / build log warns *NEXT_PUBLIC_API_URL is not set* | Set it on Vercel for that environment (Production **and** Preview) and redeploy. |
| `429 Too many requests` for every user | `TRUST_PROXY` set to `0`/removed in production, so all visitors share one IP. Leave it unset (defaults to 1). |
| Chat always shows the offline guide | `GEMINI_API_KEY` missing or invalid on Render; the API log shows the Gemini error. |
| Uploaded photos disappear | Expected on Render's temporary disk — see *Things that do not persist*. |
| Admin can't log in on a fresh database | `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` missing at first start, or the hash isn't a bcrypt hash. Fix and restart. |
| First request after a while takes ~1 minute | Free plan sleeping; upgrade the instance for always-on. |

---

## Project Structure

```
Blood Donated/
├── evaluation/              # Chatbot evaluation dataset + results (see evaluation/README.md)
├── render.yaml              # Render blueprint for the API
├── Backend/
│   ├── src/
│   │   ├── app.js          # Express app + middleware wiring (testable without a real server)
│   │   ├── config/         # Database connection + production env check
│   │   ├── common/         # Shared helpers + middleware (requireRole, CORS, uploads)
│   │   ├── users/          # Donor-facing user accounts (register/login/profile)
│   │   ├── staff/          # StaffUser accounts — admin & hospital_staff roles
│   │   ├── hospital/       # Hospital records
│   │   ├── donor/          # Donor directory
│   │   ├── requests/       # Blood requests
│   │   ├── appointments/   # Appointment booking + QR check-in
│   │   ├── inventory/      # Per-hospital blood stock
│   │   ├── analytics/      # Dashboard analytics
│   │   ├── dashboard/      # Admin stats + hospital insights
│   │   ├── contact/        # Contact form messages
│   │   ├── notification/   # Donor/staff messaging
│   │   ├── nearby/         # Nearby hospitals & blood banks
│   │   ├── homepage/       # Homepage content endpoint
│   │   ├── about/          # About page settings (creator photo)
│   │   ├── chatbot/        # Gemini chat route (POST /api/chat) and its prompt
│   │   └── evaluation/     # Chatbot evaluation harness (node src/evaluation/runEval.js)
│   ├── scripts/             # generate-secrets.js (JWT secrets + admin password hash)
│   ├── tests/               # Jest + Supertest, in-memory MongoDB
│   └── server.js            # Process entry point (connects DB, starts app.js)
└── frontend/
    └── src/
        ├── app/                       # Pages (one folder per URL)
        │   ├── (public)/              # Landing, Donors, Appointments, Requests, Map, About, Contact
        │   │   └── _components/       # Landing-page sections
        │   ├── (auth)/                # Donor login/register, Admin login, Hospital login
        │   ├── (donor)/               # Donor profile, notifications, QR card
        │   └── dashboard/
        │       ├── admin/             # Dashboard, Donors, Inventory, Requests, Appointments, Hospitals, Contacts, Analytics
        │       └── hospital/          # Scoped dashboard, Appointments, Inventory, Requests, QR Scan
        ├── components/
        │   ├── layout/                # Header, Footer, CookieConsent
        │   ├── chat/                  # AI chatbot panel + messages
        │   ├── auth/                  # Login/register art + social buttons
        │   ├── dashboard/             # Dashboard shell, sidebar, top bar
        │   ├── ui/                    # Reusable cards, badges, headers
        │   ├── inventory/             # Stock charts + low-stock alert
        │   └── hospital/              # QR scanner
        ├── hooks/                     # Dashboard session + notifications
        ├── lib/                       # API config, theme, formatting, helpers
        └── store/
            ├── AuthContext.jsx        # Staff (admin/hospital_staff) session
            └── UserAuthContext.jsx    # Donor session
```

---

## Author

**Vith Vath** — Full-stack Developer & System Designer
Individual graduation project, Hanoi University of Science and Technology (HUST)

Responsible for the whole system: requirements and system design, the Express/MongoDB API, the
Next.js website and dashboards, the Gemini-powered chatbot and its evaluation, testing, and deployment.

---

## License

Academic project — Hanoi University of Science and Technology (HUST), 2024–2025.
