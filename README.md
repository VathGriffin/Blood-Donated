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

### Backend

```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/` with real values:
```
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/blood-donation
JWT_SECRET=your_jwt_secret_here
QR_JWT_SECRET=your_separate_qr_jwt_secret_here
PORT=3001
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=<bcrypt_hash_of_your_password>
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=https://your-app.vercel.app
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

Create a `.env.local` file in `frontend/` with real values:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_FACEBOOK_APP_ID=
```

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

---

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
