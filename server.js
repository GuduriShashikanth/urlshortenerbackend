import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { nanoid } from "nanoid";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ DB connection error:", err));

// Schema
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
});
const Url = mongoose.model("Url", urlSchema);

// Shorten URL
app.post("/shorten", async (req, res) => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) return res.status(400).json({ error: "Original URL required" });

    // Check if already exists
    const existing = await Url.findOne({ originalUrl });
    if (existing) return res.json({ shortUrl: existing.shortUrl });

    const shortUrl = nanoid(8);
    const newUrl = new Url({ originalUrl, shortUrl });
    await newUrl.save();

    res.json({ shortUrl });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Redirect route
app.get("/:shortUrl", async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const url = await Url.findOne({ shortUrl });
    if (!url) return res.status(404).send("URL not found");

    // Redirect to original URL
    res.redirect(url.originalUrl.startsWith("http") ? url.originalUrl : `https://${url.originalUrl}`);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
