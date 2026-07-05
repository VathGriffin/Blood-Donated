# Blood Donated 🩸

A full-stack web application for voluntary blood donation management — connecting donors, patients, and hospitals across Cambodia.

Built as a Graduation Project by 4th-year Data Science students at the **Institute of Technology of Cambodia (ITC)**.

---

## Features

### Public
- **Donor Registration** — Register with blood type, location, availability, and photo
- **Blood Requests** — Submit urgent blood requests with urgency level and patient details
- **Donor Directory** — Browse and filter verified donors by blood type
- **Contact Form** — Send messages to the platform team
- **Blood Type Compatibility Guide** — Interactive reference chart

### Admin Panel (`/admin`)
- Secure JWT-based login
- Dashboard with real-time stats, bar chart, and pie chart
- Full CRUD for donors, blood requests, and contact messages
- Blood inventory management
- CSV export of dashboard data

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Material UI 7, React Router 7 |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| Charts | Recharts |
| Animations | AOS |
| File Upload | Multer |

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
ADMIN_EMAIL=admin@blooddonated.com
ADMIN_PASSWORD_HASH=<bcrypt hash of your password>
PORT=3001
```

```bash
node server.js
```

### Frontend

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` and set your API URL:
```
REACT_APP_API_URL=http://localhost:3001
```

```bash
npm start
```

The app runs at `http://localhost:3000`.

---

## Project Structure

```
Blood Donated/
├── Backend/
│   ├── models/        # Mongoose schemas (Donor, BloodRequest, ContactMessage)
│   ├── routes/        # Express API routes
│   ├── middleware/    # JWT auth middleware
│   ├── uploads/       # Uploaded donor/request photos
│   └── server.js      # Entry point
└── frontend/
    └── src/
        ├── admin/     # Admin dashboard pages
        ├── components/ # Header, Footer, shared components
        ├── context/   # Auth context
        ├── pages/     # Public-facing pages
        └── config.js  # Central API base URL config
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

Academic project — Institute of Technology of Cambodia, 2024-2025.
