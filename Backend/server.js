const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const donorRoutes = require("./routes/donors");
const bloodRequestRoutes = require("./routes/bloodRequests");
const contactRoutes = require("./routes/contactMessages");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/blood-donation";

// Disable Mongoose buffering so operations fail immediately when DB is down
mongoose.set("bufferCommands", false);

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3002", "http://localhost:3003"] }));
app.use(express.json());
app.use("/uploads", require("express").static(require("path").join(__dirname, "uploads")));

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
app.use("/api/donors", donorRoutes);
app.use("/api/requests", bloodRequestRoutes);
app.use("/api/contacts", contactRoutes);

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
