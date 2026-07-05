const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Donor = require("../models/Donor");

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `donor-${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter });

// Register donor - POST /api/donors/register
router.post("/register", async (req, res) => {
  try {
    const donor = new Donor(req.body);
    const savedDonor = await donor.save();
    res.status(201).json(savedDonor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create donor - POST /api/donors
router.post("/", async (req, res) => {
  try {
    const donor = new Donor(req.body);
    const savedDonor = await donor.save();
    res.status(201).json(savedDonor);
  } catch (error) {
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
    const updatedDonor = await Donor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(updatedDonor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Upload donor photo - POST /api/donors/:id/photo
router.post("/:id/photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    // Delete old photo file if it exists
    if (donor.photo) {
      const oldPath = path.join(__dirname, "../uploads", path.basename(donor.photo));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const updated = await Donor.findByIdAndUpdate(
      req.params.id,
      { photo: photoUrl },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete donor photo - DELETE /api/donors/:id/photo
router.delete("/:id/photo", async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    if (donor.photo) {
      const filePath = path.join(__dirname, "../uploads", path.basename(donor.photo));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const updated = await Donor.findByIdAndUpdate(
      req.params.id,
      { photo: null },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete donor - DELETE /api/donors/:id
router.delete("/:id", async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    if (donor.photo) {
      const filePath = path.join(__dirname, "../uploads", path.basename(donor.photo));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ message: "Donor deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
