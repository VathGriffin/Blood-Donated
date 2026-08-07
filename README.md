# Development of an Intelligent Blood Donation Management Platform Integrated with an AI Chatbot for Donor and Hospital Support

A full-stack web application for intelligent blood donation management — connecting donors, patients, and hospitals across Cambodia with real-time data and AI-powered support.

Built as a Graduation Project by 4th-year Data Science students at the **Institute of Technology of Cambodia (ITC)**.

---

## Abstract

This project presents the design and development of an intelligent blood donation management platform that streamlines the process of blood collection, distribution, and emergency response. The system integrates an AI-powered chatbot capable of answering donor questions, guiding hospital staff, and facilitating real-time blood requests. The platform enables donors to register, schedule appointments, and track their contribution history, while hospitals can submit urgent blood requests and manage inventory efficiently.

---

## Features

### Public Portal
- **Donor Registration** — Register with blood type, location, availability, and photo
- **AI Chatbot** — Intelligent assistant for eligibility, blood type compatibility, and appointment guidance
- **Blood Requests** — Submit urgent blood requests with urgency level and patient details
- **Appointment Booking** — 3-step calendar booking at partner hospitals
- **Donor Directory** — Browse and filter verified donors by blood type
- **Blood Type Compatibility Guide** — Interactive reference chart
- **Contact Form** — Send messages to the platform team

### Admin Dashboard (`/dashboard/admin`)
- Secure JWT-based login
- Real-time stats: Total Donors, Blood Units, Requests, Appointments
- Blood inventory management with critical/low/normal status
- Full CRUD for donors, blood requests, and contact messages
- Analytics charts: BarChart, PieChart (donut), AreaChart, LineChart
- CSV export of dashboard data

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Material UI 7 |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| Charts | Recharts |
| AI Chatbot | Rule-based engine + OpenAI API fallback |
| File Upload | Multer |
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

Create a `.env` file in `Backend/`:
```
MONGO_URI=mongodb://localhost:27017/blood-donation
JWT_SECRET=your_jwt_secret_here
ADMIN_EMAIL=admin@bloodlife.com
ADMIN_PASSWORD_HASH=<bcrypt hash of your password>
PORT=3001
OPENAI_API_KEY=your_openai_key_here
```

```bash
node server.js
```

### Frontend

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env.local` and set your API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
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
│   ├── models/        # Mongoose schemas (Donor, BloodRequest, Appointment, ContactMessage)
│   ├── routes/        # Express API routes
│   ├── middleware/    # JWT auth middleware
│   ├── uploads/       # Uploaded donor photos
│   └── server.js      # Entry point
└── frontend/
    └── src/
        ├── app/
        │   ├── (public)/      # Landing, Donors, Appointments, Requests, About, Team
        │   ├── (auth)/        # Login, Register, Forgot Password
        │   └── dashboard/
        │       └── admin/     # Dashboard, Donors, Inventory, Requests, Appointments, Contacts
        ├── components/
        │   ├── Header.jsx     # Navigation header
        │   ├── Footer.jsx     # Site footer
        │   ├── ChatBot.jsx    # AI chatbot panel
        │   └── admin/
        │       └── Sidebar.jsx
        └── lib/
            ├── ThemeContext.jsx  # MUI dark/light theme
            ├── Providers.jsx
            ├── AuthContext.jsx
            └── config.js        # API base URL
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
