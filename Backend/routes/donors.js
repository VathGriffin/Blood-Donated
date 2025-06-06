const express = require("express");
const router = express.Router();
const Donor = require("../models/Donor");

// Register donor - POST /api/donors/register
router.post("/register", async (req, res) => {
  try {
    console.log("Registering donor:", req.body);
    const donor = new Donor(req.body);
    const savedDonor = await donor.save();
    res.status(201).json(savedDonor);
  } catch (error) {
    console.error("Register failed:", error);
    res.status(400).json({ message: error.message });
  }
});

// Create donor - POST /api/donors
router.post("/", async (req, res) => {
  try {
    console.log("Creating donor:", req.body);
    const donor = new Donor(req.body);
    const savedDonor = await donor.save();
    res.status(201).json(savedDonor);
  } catch (error) {
    console.error("Create failed:", error);
    res.status(400).json({ message: error.message });
  }
});

// Get all donors - GET /api/donors
router.get("/", async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.json(donors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get donor by ID - GET /api/donors/:id
router.get("/:id", async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update donor - PUT /api/donors/:id
router.put("/:id", async (req, res) => {
  try {
    console.log("Updating donor:", req.body);
    const updatedDonor = await Donor.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    res.json(updatedDonor);
  } catch (err) {
    console.error("Update failed:", err);
    res.status(400).json({ message: err.message });
  }
});

// Delete donor - DELETE /api/donors/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Donor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Donor not found" });
    res.json({ message: "Donor deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
