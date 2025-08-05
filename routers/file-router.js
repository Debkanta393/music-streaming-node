// routes/fileRoutes.js or directly in your main server file
import fs from "fs";
import path from "path";
import express from "express";
const router = express.Router();
import { fileURLToPath } from 'url';

// Emulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/audio/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("Audio not found");
  res.setHeader("Content-Type", "audio/mpeg");
  res.sendFile(filePath);
});

router.get("/image/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("Image not found");
  res.setHeader("Content-Type", "image/jpeg");
  res.sendFile(filePath);
});

export default router;
