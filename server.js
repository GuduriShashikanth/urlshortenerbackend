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
  .catch(err => console.error("❌ DB connection error:", err));

// Schema
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
});
const Url = mongoose.model("Url", urlSchema);

// Route: shorten URL
app.post("/shorten", async (req, res) => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) return res.status(400).json({ error: "Original URL required" });

    // Return existing short URL if already stored
    const existing = await Url.findOne({ originalUrl });
    if (existing) return res.json({ shortUrl: existing.shortUrl });

    // Ensure unique short URL
    let shortUrl;
    let exists;
    do {
      shortUrl = nanoid(8);
      exists = await Url.findOne({ shortUrl });
    } while (exists);

    const newUrl = new Url({ originalUrl, shortUrl });
    await newUrl.save();

    res.json({ shortUrl });
  } catch (err) {
    console.error("Error in /shorten:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Route: redirect
app.get("/:shortUrl", async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const url = await Url.findOne({ shortUrl });
    if (!url) return res.status(404).json({ error: "URL not found" });
    res.redirect(url.originalUrl);
  } catch (err) {
    console.error("Error in redirect:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
