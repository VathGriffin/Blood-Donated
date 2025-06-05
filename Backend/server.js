const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import routes
const donorRoutes = require("./routes/donors");
const bloodRequestRoutes = require("./routes/bloodRequests");
const contactRoutes = require("./routes/contactMessages");

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/blood-donation";

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("🩸 Blood Donation API is running");
});

// Routes
app.use("/api/donors", donorRoutes);
app.use("/api/requests", bloodRequestRoutes);
app.use("/api/contacts", contactRoutes);

// Connect to MongoDB and start server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
