const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

// Ensure uploads directory exists on startup
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const donorRoutes = require("./routes/donors");
const bloodRequestRoutes = require("./routes/bloodRequests");
const contactRoutes = require("./routes/contactMessages");
const appointmentRoutes = require("./routes/appointments");
const authRoutes = require("./routes/auth");
const userAuthRoutes = require("./routes/userAuth");
const messageRoutes = require("./routes/messages");
const chatRoutes = require("./routes/chat");
const statsRoutes = require("./routes/stats");

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/blood-donation";

// Disable Mongoose buffering so operations fail immediately when DB is down
mongoose.set("bufferCommands", false);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3002", "http://localhost:3003"] }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir));

// Chat route registered before DB check — does not require MongoDB
app.use("/api/chat", chatRoutes);

// Reject API requests immediately if MongoDB is not connected
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database unavailable",
      message: "MongoDB is not connected. Please check your Atlas cluster or connection string.",
    });
  }
  next();
});

app.get("/", (req, res) => {
  res.send("🩸 Blood Donation API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/requests", bloodRequestRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/user", userAuthRoutes);
app.use("/api/messages", messageRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("⚠️  MongoDB connection failed:", err.message);
    console.error("   Fix: check your Atlas cluster at https://cloud.mongodb.com");
    console.error("   Make sure the cluster is running and your IP is whitelisted.");
  });
