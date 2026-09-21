# Development of an Intelligent Blood Donation Management Platform Integrated with an AI Chatbot for Donor and Hospital Support

A full-stack web application for intelligent blood donation management — connecting donors, patients, and hospitals across Cambodia with real-time data and AI-powered support.

Built as a Graduation Project by 4th-year Data Science students at the **Institute of Technology of Cambodia (ITC)**.

---

## Abstract

This project presents the design and development of an intelligent blood donation management platform that streamlines the process of blood collection, distribution, and emergency response. The system integrates an AI-powered chatbot, backed by Anthropic's Claude with tool-calling into the live database, capable of answering donor questions, checking eligibility, and looking up a user's own requests/appointments in real time. The platform enables donors to register, schedule appointments, and track their contribution history, while hospitals — each with their own scoped staff accounts — can submit urgent blood requests and manage their own inventory independently of other hospitals.

---

## Features

### Public Portal
- **Donor Registration** — Register with blood type, location, availability, and photo
- **AI Chatbot** — Claude-powered assistant with tool-calling for live inventory, a user's own requests/appointments, and eligibility checks; auto-detects Khmer/Vietnamese/English and falls back to a rule-based knowledge base if the AI API is unavailable
- **Blood Requests** — Submit urgent blood requests with urgency level, units needed, and patient details
- **Appointment Booking** — 3-step calendar booking at partner hospitals, with QR-code check-in
- **Donor Directory** — Browse and filter verified donors by blood type
- **Blood Type Compatibility Guide** — Interactive reference chart
- **Contact Form & Messaging** — Send messages to the platform team, direct user↔admin conversations
- **Social Login** — Google and Facebook OAuth alongside email/password

### Admin Dashboard (`/dashboard/admin`)
- Secure JWT-based login (role: `admin`)
- Real-time stats: Total Donors, Blood Units, Requests, Appointments
- Blood inventory management with critical/low/normal status
- Full CRUD for donors, blood requests, hospitals, staff accounts, and contact messages
- Analytics charts: BarChart, PieChart (donut), AreaChart, LineChart
- CSV export of dashboard data

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
| AI Chatbot | Anthropic Claude API with tool-calling, rule-based fallback |
| File Upload | Multer |
| QR Codes | react-qr-code (generate), html5-qrcode (scan) |
| Testing | Jest, Supertest, mongodb-memory-server |
| Font | Inter (Google Fonts) |

---

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### Configuration — two env files, one per app

```
Blood-Donated/
├── Backend/.env            # API secrets and database   (git-ignored)
├── frontend/.env.local     # public browser settings    (git-ignored)
└── .gitignore
```

Create both by hand; they are never committed. On Render and Vercel there are no files: paste the same names into each dashboard (Render gets the Backend list, Vercel gets the frontend list).

**`Backend/.env`**

| Variable | Required | What it is |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string, e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/blood-donation` (allow your host's IPs in Atlas) |
| `JWT_SECRET`, `QR_JWT_SECRET` | yes | Two different long random strings (`npm run secrets` prints fresh ones) |
| `PORT` | no | Defaults to `3001` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` | yes | First admin, created on first start. Hash: `node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"` |
| `ANTHROPIC_API_KEY` | no | AI assistant; without it the assistant uses offline answers |
| `FRONTEND_URL` | in production | Origins allowed to call the API, comma-separated; `*` matches one hostname part (covers Vercel preview URLs). localhost is always allowed |
| `NODE_ENV`, `TRUST_PROXY`, `RATE_LIMIT_MAX` | no | Production tuning; see Deployment |

**`frontend/.env.local`** (`NEXT_PUBLIC_*` values are baked in at build time — redeploy after changing them)

| Variable | Required | What it is |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | Where the backend lives, no trailing slash (`http://localhost:3001` locally) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_FACEBOOK_APP_ID` | no | Social sign-in buttons appear only when set |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | no | Optional maps key |

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

The project is **two apps**: the Next.js frontend (Vercel) and the Express API, which needs an always-on Node
host. Deploying only the frontend leaves it calling `http://localhost:3001` — the Vercel build log warns
*"NEXT_PUBLIC_API_URL is not set"* and nothing loads. Set them up in this order (the API host is
[Render](https://render.com) here; any Node host works the same way):

1. **Database** — create a MongoDB Atlas cluster. Under *Network Access*, allow `0.0.0.0/0` (host IPs change).
2. **Secrets** — run `cd Backend && node scripts/generate-secrets.js`. It asks for the admin password (hidden) and prints
   `JWT_SECRET`, `QR_JWT_SECRET` and `ADMIN_PASSWORD_HASH` to paste into the host. Never commit them.
3. **API on Render** — *New > Blueprint*, pick this repo; [`render.yaml`](render.yaml) sets up the service and asks for:

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | your Atlas connection string |
   | `ADMIN_EMAIL` | the first admin's login email |
   | `ADMIN_PASSWORD_HASH` | from step 2 (`JWT_SECRET` / `QR_JWT_SECRET` are generated by Render) |
   | `FRONTEND_URL` | your Vercel address(es), comma-separated, e.g. `https://blood-donated.vercel.app,https://blood-donated-*-your-team.vercel.app` |
   | `ANTHROPIC_API_KEY` | optional — without a real key the assistant answers from its offline answers |

   When it's live, open `https://<your-service>.onrender.com/` — it should answer `{"status":"ok"}`.
   Copy that URL for the next step.
4. **Frontend on Vercel** — *Root Directory* `frontend`. Under *Settings > Environment Variables* add
   `NEXT_PUBLIC_API_URL` = the API URL from step 3 (no trailing slash), enabled for **Production and Preview**.
   It is baked in at build time, so then **redeploy** (*Deployments > ⋯ > Redeploy*). The build log no longer shows the warning.
5. **Google sign-in** (if used) — add the Vercel domain to the OAuth client's *Authorized JavaScript origins*
   and set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` on Vercel (see the frontend variables in [Configuration](#configuration--two-env-files-one-per-app)).
6. **Check it** — open the site with the browser console open: no CORS or `localhost:3001` errors, the map and
   hospital lists load, and you can sign in at `/admin/login`.

Good to know
- **Photos:** uploads are written to `Backend/uploads`, which the free Render plan wipes whenever the service restarts or
  sleeps. Keep them with a paid plan and the disk block in `render.yaml`, or move uploads to cloud storage.
- **Free tier sleep:** the API sleeps after ~15 minutes idle (the first request then takes about a minute), and admin
  sessions end whenever it restarts — by design.
- **Previews:** Vercel *preview* URLs sit behind Vercel Authentication by default (only signed-in team members can open
  them); share the production domain, or relax protection in the project settings.

## Project Structure

```
Blood Donated/
├── Backend/
│   ├── src/
│   │   ├── app.js          # Express app + middleware wiring (testable without a real server)
│   │   ├── config/         # Database connection
│   │   ├── common/         # Shared middleware (requireRole, optionalAuth)
│   │   ├── users/          # Donor-facing user accounts (register/login/profile)
│   │   ├── staff/          # StaffUser accounts — admin & hospital_staff roles
│   │   ├── hospital/       # Hospital records
│   │   ├── donor/          # Donor directory
│   │   ├── requests/       # Blood requests
│   │   ├── appointments/   # Appointment booking + QR check-in
│   │   ├── inventory/      # Per-hospital blood stock
│   │   ├── analytics/      # Dashboard analytics
│   │   ├── dashboard/      # Admin stats endpoint
│   │   ├── notification/   # Contact form + messaging
│   │   ├── homepage/       # Homepage content endpoint
│   │   └── chatbot/        # Claude chat route + tool-calling functions
│   ├── tests/               # Jest + Supertest, in-memory MongoDB
│   └── server.js            # Process entry point (connects DB, starts app.js)
└── frontend/
    └── src/
        ├── app/
        │   ├── (public)/      # Landing, Donors, Appointments, Requests, About (incl. Team), Contact
        │   ├── (auth)/        # Donor login/register, Admin login, Hospital login
        │   └── dashboard/
        │       ├── admin/     # Dashboard, Donors, Inventory, Requests, Appointments, Hospitals, Contacts, Analytics
        │       └── hospital/  # Scoped dashboard, Appointments, Inventory, Requests, QR Scan
        ├── components/
        │   ├── Header.jsx / Footer.jsx
        │   ├── ChatBot.jsx    # AI chatbot panel
        │   ├── admin/         # Admin navbar/sidebar
        │   └── hospital/      # Hospital navbar/sidebar/QR scanner
        └── store/
            ├── AuthContext.jsx      # Staff (admin/hospital_staff) session
            └── UserAuthContext.jsx  # Donor session
```

---

## Team

| Name | Role |
|------|------|
| Vith Vath | Full Stack Developer (Lead) |
| Sopheak Sok | System Architect |
| Chanthou Hem | Backend Developer |
| Dara Khieu | UI/UX Designer |

---

## License

Academic project — Institute of Technology of Cambodia, 2024–2025.
