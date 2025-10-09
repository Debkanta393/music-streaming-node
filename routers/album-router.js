import express from "express"
import { createAlbums, getAllAlbums, getAlbumSong } from "../controllers/albums-controller.js"
import authMiddleware from "../middleware/authMiddleware.js"
import multer from "multer"
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router()


router.post("/add-album", authMiddleware, upload.fields([
  { name: "albumImage", maxCount: 1 },
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]),
    createAlbums)
router.get("/getAlbums", getAllAlbums)
router.get("/getAlbum-songs/:id", getAlbumSong)


export default router